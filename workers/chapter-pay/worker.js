/*******************************************************************
 * NEXTGENIQ PRESS — BOOK-CHAPTER PAYMENT WORKER  (v1, November 2026)
 *
 * Adapted from the TAIIS 2026 conference payment engine (same NewebPay AES/SHA
 * scheme, same PayPal server-side verification, same KV order ledger, same
 * "status only moves forward" rule). The portal (Next.js on the VPS) never
 * touches card data or gateway keys: its /api/checkout calls POST /order here
 * server-to-server, then sends the reader to /pay/<orderNo>.
 *
 *   portal /checkout ──POST /order (Bearer PORTAL_SECRET)──▶ Worker ─▶ KV order:<no>
 *   reader ──▶ /pay/<no>?t= ──▶ PayPal buttons  or  NewebPay MPG form
 *   PayPal  ──▶ /paypal/confirm  (verified against PayPal's API)
 *   NewebPay ─▶ /notify (server) + /return (browser), both signature-checked
 *   Worker ──▶ portal /checkout/complete?o=&t=   (reads GET /status)
 *   portal /admin/orders ──GET /admin/orders.json (Bearer ADMIN_API_TOKEN)
 *   Worker /admin  — standalone dashboard (ADMIN_USER / ADMIN_PASSWORD)
 *
 * SECRETS (wrangler secret put …):
 *   PORTAL_SECRET          shared with the portal (PAY_PORTAL_SECRET there)
 *   ADMIN_API_TOKEN        portal dashboard reads orders with it (PAY_ADMIN_TOKEN there)
 *   RECEIPT_SECRET         signs order links; set once, never change
 *   ADMIN_USER, ADMIN_PASSWORD   sign-in for the standalone /admin page
 *   PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET   [PAYPAL_SANDBOX=1 for the sandbox]
 *   NEWEBPAY_MERCHANT_ID, NEWEBPAY_HASH_KEY, NEWEBPAY_HASH_IV   (optional; hidden until set)
 *
 * ITEMS: a chapter (series/volume/3) or a whole e-book (series/volume/book). Buyers
 * are signed-in portal members; the portal passes their account with the order.
 *
 * CURRENCIES: each chapter has two FIXED list prices set by the portal
 * (src/lib/cart/pricing.ts). PayPal charges the US$ total, NewebPay the NT$
 * total; there is no exchange-rate conversion.
 *   HOSTINGER_MAIL_TOKEN   (optional) confirmation emails via Hostinger Mail API
 * VARS: PORTAL_BASE.  BINDING: KV namespace ORDERS.  CRON: every 15 min.
 * Check: GET /ping
 *******************************************************************/

/* ======================= CONFIG ======================= */
const SHOP_NAME = 'NextGenIQ Press';
const ORDER_PREFIX = 'NC';                    // order numbers NC…; must differ from TAIIS (TA) / SysCom
/* Chapter prices come from the portal (src/lib/cart/pricing.ts), which alone may call
   POST /order (Bearer PORTAL_SECRET); the browser never sends a price. Sanity bounds: */
const MIN_PRICE_USD = 1, MAX_PRICE_USD = 500, MIN_PRICE_TWD = 30, MAX_PRICE_TWD = 20000;
const MAX_ITEMS = 50;
const ORG_EMAIL = 'contact@nextgeniqpress.com';  // CHANGE to the shop mailbox
const EMAIL_FROM_NAME = 'NextGenIQ Press';
const NOTIFY_ORG_TO = 'contact@nextgeniqpress.com';                     // '' = no "new order" email to the publisher
const NEWEBPAY_TEST = false;                  // true → ccore.newebpay.com (test keys!)
const MPG_VERSION = '2.0';
const ITEM_ID_RE = /^[a-z0-9-]{2,40}\/[a-z0-9-]{1,120}\/(\d{1,3}|book)$/;   // series/volume/<chapter> or series/volume/book (whole e-book)
const itemLabel = (id) => (id.split('/').pop() === 'book' ? 'Full e-book' : 'Chapter ' + id.split('/').pop());

/* ======================= small helpers ======================= */
const te = new TextEncoder(), td = new TextDecoder();
const toHex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
const fromHex = (h) => { const a = new Uint8Array(h.length / 2); for (let i = 0; i < a.length; i++) a[i] = parseInt(h.substr(i * 2, 2), 16); return a; };
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const usd = (n) => 'US$' + Number(n).toFixed(2);
const nt = (n) => 'NT$' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const tpe = (iso) => { const t = Date.parse(iso || ''); return isFinite(t) ? new Date(t + 8 * 3600e3).toISOString().replace('T', ' ').substring(0, 19) : String(iso || ''); };
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const html = (status, body) => new Response(body, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
const str = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001F\u007F]/g, ' ').trim().substring(0, n);

async function hmacHex(secret, msg) {
  const k = await crypto.subtle.importKey('raw', te.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return toHex(await crypto.subtle.sign('HMAC', k, te.encode(msg)));
}
async function safeEq(a, b) { return (await hmacHex('eq', String(a))) === (await hmacHex('eq', String(b))); }
async function bearerOk(request, secret) {
  const h = request.headers.get('Authorization') || '';
  return !!secret && h.startsWith('Bearer ') && safeEq(h.slice(7), secret);
}
async function orderToken(env, orderNo) {
  if (!env.RECEIPT_SECRET) throw new Error('RECEIPT_SECRET not set');
  return (await hmacHex(env.RECEIPT_SECRET, 'order|' + orderNo)).substring(0, 32);
}
function workerBase(request) { return new URL(request.url).origin; }
function completeUrl(env, orderNo, tok, state) {
  const p = new URLSearchParams({ o: orderNo, t: tok }); if (state) p.set('s', state);
  return (env.PORTAL_BASE || '').replace(/\/+$/, '') + '/checkout/complete?' + p.toString();
}

/* ======================= KV order store ======================= */
async function getOrder(env, no) { try { return JSON.parse((await env.ORDERS.get('order:' + no)) || 'null'); } catch (e) { return null; } }
async function putOrder(env, o) { o.updatedAt = new Date().toISOString(); await env.ORDERS.put('order:' + o.orderNo, JSON.stringify(o)); return o; }
const RANK = { created: 0, failed: 1, 'pending-payment': 1, 'amount-mismatch': 2, paid: 3 };
const canMove = (from, to) => from !== 'paid' && (RANK[to] ?? 0) >= (RANK[from] ?? 0);
/* serialise work on one order inside this isolate (cross-isolate races are
   handled by the no-downgrade rule and the idempotent "already paid" checks) */
const LOCKS = new Map();
async function withLock(key, fn) {
  while (LOCKS.has(key)) { try { await LOCKS.get(key); } catch (e) {} }
  let done; const p = new Promise((r) => { done = r; }); LOCKS.set(key, p);
  try { return await fn(); } finally { LOCKS.delete(key); done(); }
}

/* ======================= POST /order (from the portal) ======================= */
async function handleOrder(env, request) {
  if (!(await bearerOk(request, env.PORTAL_SECRET))) return json(403, { ok: false, error: 'Forbidden' });
  let b; try { b = await request.json(); } catch (e) { return json(400, { ok: false, error: 'Bad JSON' }); }
  const items = Array.isArray(b.items) ? b.items : [];
  if (!items.length) return json(400, { ok: false, error: 'Your cart is empty.' });
  if (items.length > MAX_ITEMS) return json(400, { ok: false, error: 'At most ' + MAX_ITEMS + ' chapters per order.' });
  const seen = new Set(), clean = [];
  for (const it of items) {
    const id = str(it && it.id, 170);
    if (!ITEM_ID_RE.test(id)) return json(400, { ok: false, error: 'Unknown item in cart: ' + id });
    if (seen.has(id)) continue; seen.add(id);
    const priceUsd = Math.round(Number(it.priceUsd) * 100) / 100;
    const priceTwd = Math.round(Number(it.priceTwd));
    if (!(priceUsd >= MIN_PRICE_USD && priceUsd <= MAX_PRICE_USD) || !(priceTwd >= MIN_PRICE_TWD && priceTwd <= MAX_PRICE_TWD)) return json(400, { ok: false, error: 'No price for chapter ' + id });
    clean.push({ id, title: str(it.title, 400), volumeTitle: str(it.volumeTitle, 300), seriesCode: str(it.seriesCode, 20), priceUsd, priceTwd });
  }
  const u = b.buyer || {};
  const buyer = { email: str(u.email, 120), firstName: str(u.firstName, 60), lastName: str(u.lastName, 60), company: str(u.company, 120),
    phone: str(u.phone, 40), street: str(u.street, 160), unit: str(u.unit, 60), city: str(u.city, 80), region: str(u.region, 80),
    postcode: str(u.postcode, 20), country: str(u.country, 80) };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer.email)) return json(400, { ok: false, error: 'Valid email is required.' });
  for (const k of ['firstName', 'lastName', 'street', 'city', 'country', 'postcode']) if (!buyer[k]) return json(400, { ok: false, error: 'Missing ' + k + '.' });
  const totalUsd = Math.round(clean.reduce((s, i) => s + i.priceUsd, 0) * 100) / 100;
  const totalTwd = clean.reduce((s, i) => s + i.priceTwd, 0);
  const orderNo = (ORDER_PREFIX + Date.now() + Math.floor(Math.random() * 900 + 100)).substring(0, 20);
  const o = { orderNo, status: 'created', items: clean, buyer, totalUsd, totalTwd,
    method: b.method === 'paypal' ? 'paypal' : 'card', account: b.account && typeof b.account === 'object' ? { id: Number(b.account.id) || null, userName: str(b.account.userName, 60), email: str(b.account.email, 120) } : null,
    ip: request.headers.get('X-Forwarded-For') || '', createdAt: new Date().toISOString() };
  await putOrder(env, o);
  const tok = await orderToken(env, orderNo);
  return json(200, { ok: true, orderNo, totalUsd, totalTwd, payUrl: workerBase(request) + '/pay/' + orderNo + '?t=' + tok });
}

/* ======================= NewebPay (MPG) ======================= */
function npReady(env) { return !!(env.NEWEBPAY_MERCHANT_ID && String(env.NEWEBPAY_HASH_KEY || '').trim().length === 32 && String(env.NEWEBPAY_HASH_IV || '').trim().length === 16); }
const NP_GATEWAY = NEWEBPAY_TEST ? 'https://ccore.newebpay.com/MPG/mpg_gateway' : 'https://core.newebpay.com/MPG/mpg_gateway';
async function aesKey(key) { return crypto.subtle.importKey('raw', te.encode(key), { name: 'AES-CBC' }, false, ['encrypt', 'decrypt']); }
async function aesEncrypt(env, plain) {
  const k = await aesKey(env.NEWEBPAY_HASH_KEY.trim());
  return toHex(await crypto.subtle.encrypt({ name: 'AES-CBC', iv: te.encode(env.NEWEBPAY_HASH_IV.trim()) }, k, te.encode(plain)));
}
async function aesDecrypt(env, hex) {
  /* NewebPay pads to 32 bytes; WebCrypto accepts only 16-byte PKCS7 — append a
     dummy block that decrypts to valid padding, then strip NewebPay's own (see TAIIS engine). */
  const k = await aesKey(env.NEWEBPAY_HASH_KEY.trim()), iv = te.encode(env.NEWEBPAY_HASH_IV.trim());
  const data = fromHex(hex); if (data.length < 16 || data.length % 16) throw new Error('bad ciphertext');
  const pad = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-CBC', iv: data.slice(data.length - 16) }, k, new Uint8Array(0)));
  const full = new Uint8Array(data.length + pad.length); full.set(data); full.set(pad, data.length);
  const out = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, k, full));
  let end = out.length; const p = out[end - 1];
  if (p >= 1 && p <= 32 && out.slice(end - p).every((x) => x === p)) end -= p;
  return td.decode(out.slice(0, end));
}
async function tradeSha(env, info) {
  return toHex(await crypto.subtle.digest('SHA-256', te.encode('HashKey=' + env.NEWEBPAY_HASH_KEY.trim() + '&' + info + '&HashIV=' + env.NEWEBPAY_HASH_IV.trim()))).toUpperCase();
}
/* Every hand-off to NewebPay uses a FRESH MerchantOrderNo (NewebPay refuses a
   re-post of the same number, MPG03008); attempts map back to the order. */
async function newebpayFields(env, o, base) {
  const attempt = (o.orderNo + String(Date.now()).slice(-6)).substring(0, 30);
  const amt = Math.round(Number(o.totalTwd));                       // fixed NT$ list prices, no conversion
  o.np = { attempt, amountTwd: amt, at: new Date().toISOString() };
  o.npAttempts = (o.npAttempts || []).concat([attempt]).slice(-10);
  await putOrder(env, o);
  await env.ORDERS.put('npattempt:' + attempt, o.orderNo, { expirationTtl: 60 * 60 * 24 * 30 });
  const tok = await orderToken(env, o.orderNo);
  const trade = {
    MerchantID: env.NEWEBPAY_MERCHANT_ID.trim(), RespondType: 'JSON', TimeStamp: Math.floor(Date.now() / 1000), Version: MPG_VERSION,
    MerchantOrderNo: attempt, Amt: amt, ItemDesc: (SHOP_NAME + ' book chapters (' + o.items.length + ')').substring(0, 50),
    Email: o.buyer.email, EmailModify: 0, LoginType: 0,
    NotifyURL: base + '/notify', ReturnURL: base + '/return', ClientBackURL: completeUrl(env, o.orderNo, tok),
    CREDIT: 1, APPLEPAY: 1, ANDROIDPAY: 1, UNIONPAY: 1
  };
  const info = await aesEncrypt(env, Object.keys(trade).map((k) => k + '=' + encodeURIComponent(trade[k])).join('&'));
  return { MerchantID: trade.MerchantID, TradeInfo: info, TradeSha: await tradeSha(env, info), Version: MPG_VERSION };
}
async function parseNewebpay(env, request) {
  const p = new URLSearchParams(await request.text());
  const info = p.get('TradeInfo'), sha = p.get('TradeSha');
  if (!info || !sha || (await tradeSha(env, info)) !== sha.toUpperCase()) throw new Error('TradeSha mismatch');
  const plain = (await aesDecrypt(env, info)).replace(/[\x00-\x1F]+$/g, '');
  try { return JSON.parse(plain); } catch (e) { return Object.fromEntries(new URLSearchParams(plain)); }
}
async function confirmNewebpay(env, d, via) {
  const res = d.Result || {};
  const attempt = String(res.MerchantOrderNo || '');
  const orderNo = (await env.ORDERS.get('npattempt:' + attempt)) || '';
  if (!orderNo) { await env.ORDERS.put('unmatched:' + attempt, JSON.stringify(d)); return null; }
  return withLock(orderNo, async () => {
    const o = await getOrder(env, orderNo); if (!o) return null;
    if (res.MerchantID && res.MerchantID !== env.NEWEBPAY_MERCHANT_ID.trim()) return o;
    if (d.Status === 'SUCCESS' && res.PayTime) {
      if (o.status === 'paid') return o;                                              // duplicate notify / return
      if (!o.np || o.np.attempt !== attempt || Number(res.Amt) !== Number(o.np.amountTwd)) {
        o.status = 'amount-mismatch'; o.anomaly = 'NewebPay ' + attempt + ' paid ' + res.Amt; await putOrder(env, o); return o;
      }
      Object.assign(o, { status: 'paid', gateway: 'newebpay', tradeNo: res.TradeNo || '', paymentType: res.PaymentType || '',
        payTime: res.PayTime, paidTwd: Number(res.Amt), paidVia: via });
      await putOrder(env, o); await afterPaid(env, o); return o;
    }
    if (d.Status === 'SUCCESS' && canMove(o.status, 'pending-payment')) { o.status = 'pending-payment'; await putOrder(env, o); }
    else if (d.Status !== 'SUCCESS' && canMove(o.status, 'failed')) { o.status = 'failed'; o.failMsg = str(d.Message || d.Status, 200); await putOrder(env, o); }
    return o;
  });
}

/* ======================= PayPal ======================= */
const ppApi = (env) => (env.PAYPAL_SANDBOX === '1' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com');
const ppReady = (env) => !!(env.PAYPAL_CLIENT_ID && env.PAYPAL_CLIENT_SECRET);
async function ppToken(env) {
  const r = await fetch(ppApi(env) + '/v1/oauth2/token', { method: 'POST',
    headers: { Authorization: 'Basic ' + btoa(env.PAYPAL_CLIENT_ID.trim() + ':' + env.PAYPAL_CLIENT_SECRET.trim()), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials' });
  const d = await r.json().catch(() => ({})); if (!r.ok || !d.access_token) throw new Error('PayPal auth ' + r.status); return d.access_token;
}
/* nothing from the browser is trusted: the order is fetched from PayPal with our
   credentials and must be COMPLETED, carry our orderNo, and match the amount */
async function handlePaypalConfirm(env, request) {
  let b; try { b = await request.json(); } catch (e) { return json(400, { ok: false, error: 'Bad JSON' }); }
  const orderNo = str(b.orderNo, 30), ppid = str(b.paypalOrderId, 40), tok = str(b.t, 64);
  if (!(await safeEq(tok, await orderToken(env, orderNo)))) return json(403, { ok: false, error: 'Invalid link' });
  return withLock(orderNo, async () => {
    const o = await getOrder(env, orderNo); if (!o) return json(404, { ok: false, error: 'Order not found' });
    const done = completeUrl(env, orderNo, tok, 'success');
    if (o.status === 'paid') return json(200, { ok: true, redirect: done });
    let pp;
    try {
      const at = await ppToken(env);
      let r = await fetch(ppApi(env) + '/v2/checkout/orders/' + encodeURIComponent(ppid), { headers: { Authorization: 'Bearer ' + at } });
      pp = await r.json();
      if (pp.status === 'APPROVED') { r = await fetch(ppApi(env) + '/v2/checkout/orders/' + encodeURIComponent(ppid) + '/capture', { method: 'POST', headers: { Authorization: 'Bearer ' + at, 'Content-Type': 'application/json' } }); pp = await r.json(); }
    } catch (e) { return json(502, { ok: false, error: 'Could not verify the PayPal payment.' }); }
    const pu = (pp.purchase_units || [])[0] || {}, cap = ((pu.payments || {}).captures || [])[0] || {}, amt = cap.amount || {};
    if (pp.status !== 'COMPLETED' || cap.status !== 'COMPLETED') return json(400, { ok: false, error: 'PayPal reports the payment as not completed.' });
    if (pu.invoice_id !== orderNo || amt.currency_code !== 'USD' || Number(amt.value).toFixed(2) !== Number(o.totalUsd).toFixed(2)) {
      o.status = 'amount-mismatch'; o.anomaly = 'PayPal ' + ppid + ' ' + amt.value + ' ' + amt.currency_code + ' invoice ' + pu.invoice_id; await putOrder(env, o);
      return json(400, { ok: false, error: 'Payment does not match this order.' });
    }
    Object.assign(o, { status: 'paid', gateway: 'paypal', tradeNo: cap.id || ppid, paypalOrderId: ppid, payTime: cap.create_time || new Date().toISOString(),
      paidUsd: Number(amt.value), payerEmail: (pp.payer || {}).email_address || '' });
    await putOrder(env, o); await afterPaid(env, o);
    return json(200, { ok: true, redirect: done });
  });
}

/* ======================= after payment: index + emails ======================= */
const paidText = (o) => (o.gateway === 'newebpay' ? nt(o.paidTwd || o.totalTwd) : usd(o.paidUsd || o.totalUsd));
async function afterPaid(env, o) {
  try { await env.ORDERS.put('paid:' + (o.payTime || o.updatedAt) + ':' + o.orderNo, o.orderNo); } catch (e) {}
  await sendConfirmation(env, o);
}
async function sendMail(env, to, subject, body) {
  if (!env.HOSTINGER_MAIL_TOKEN) return { skipped: true };
  const H = { Authorization: 'Bearer ' + env.HOSTINGER_MAIL_TOKEN.trim(), 'Content-Type': 'application/json' };
  let rid = await env.ORDERS.get('hmail:rid');
  if (!rid) {
    const me = await (await fetch('https://api.mail.hostinger.com/api/v1/me', { headers: H })).json().catch(() => ({}));
    const boxes = (me.data && me.data.mailboxes) || me.mailboxes || [];
    const box = boxes.find((x) => (x.address || '').toLowerCase() === ORG_EMAIL.toLowerCase()) || boxes[0];
    if (!box) return { error: 'no mailbox on token' };
    rid = box.resourceId; await env.ORDERS.put('hmail:rid', rid);
  }
  const r = await fetch('https://api.mail.hostinger.com/api/v1/mailboxes/' + encodeURIComponent(rid) + '/send', { method: 'POST', headers: H,
    body: JSON.stringify({ to: [].concat(to), displayName: EMAIL_FROM_NAME, subject, html: body }) });
  return r.ok ? { sent: true } : { error: 'send ' + r.status };
}
/* one marker key per mail, written before sending, so a duplicate callback or
   the cron never sends a confirmation twice */
async function sendConfirmation(env, o) {
  const key = 'mailsent:' + o.orderNo;
  if (await env.ORDERS.get(key)) return;
  await env.ORDERS.put(key, JSON.stringify({ at: new Date().toISOString(), result: 'pending' }));
  const rows = o.items.map((i) => '<tr><td style="padding:4px 10px 4px 0">' + esc(i.seriesCode) + ' · ' + esc(itemLabel(i.id)) + ': ' + esc(i.title) + '</td><td style="text-align:right">' + (o.gateway === 'newebpay' ? nt(i.priceTwd) : usd(i.priceUsd)) + '</td></tr>').join('');
  const body = '<div style="font-family:Segoe UI,Helvetica,Arial,sans-serif;max-width:560px;color:#1b2435">'
    + '<h2 style="color:#0A685C">Thank you for your order</h2><p>Dear ' + esc(o.buyer.firstName + ' ' + o.buyer.lastName) + ',</p>'
    + '<p>Your payment for order <b>' + esc(o.orderNo) + '</b> has been received.</p><table style="border-collapse:collapse;font-size:14px">' + rows
    + '<tr><td style="padding-top:8px"><b>Total</b></td><td style="text-align:right;padding-top:8px"><b>' + paidText(o) + '</b></td></tr></table>'
    + '<p style="font-size:13px;color:#555">Your chapter downloads will be sent to this address. Questions: ' + esc(ORG_EMAIL) + '</p></div>';
  let r; try { r = await sendMail(env, o.buyer.email, SHOP_NAME + ' order ' + o.orderNo, body); } catch (e) { r = { error: e.message }; }
  if (r.skipped || r.error) { await env.ORDERS.delete(key); o.emailError = r.error || 'no mail provider'; await putOrder(env, o); return; }
  await env.ORDERS.put(key, JSON.stringify({ at: new Date().toISOString(), result: 'sent' }));
  o.emailSent = new Date().toISOString(); o.emailError = null; await putOrder(env, o);
  if (NOTIFY_ORG_TO) { try { await sendMail(env, NOTIFY_ORG_TO, '[' + SHOP_NAME + '] Paid ' + paidText(o) + ' — ' + o.orderNo, body); } catch (e) {} }
}

/* ======================= /pay/<no> — the payment page ======================= */
/* POST /pay/<no>/newebpay?t= — builds fresh NewebPay fields (new MerchantOrderNo
   and TimeStamp) and auto-posts them to the gateway. Every press of the button,
   back-navigation or retry after a failure gets a fresh, valid hand-off. */
async function handleNewebpayGo(env, request, orderNo) {
  const tok = new URL(request.url).searchParams.get('t') || '';
  if (!(await safeEq(tok, await orderToken(env, orderNo)))) return html(403, '<p>Invalid payment link.</p>');
  if (!npReady(env)) return html(503, '<p>Card payment is not available.</p>');
  return withLock(orderNo, async () => {
    const o = await getOrder(env, orderNo);
    if (!o) return html(404, '<p>Order not found.</p>');
    if (o.status === 'paid') return Response.redirect(completeUrl(env, orderNo, tok, 'success'), 303);
    const f = await newebpayFields(env, o, workerBase(request));
    const inputs = Object.entries(f).map(([k, v]) => '<input type="hidden" name="' + k + '" value="' + esc(v) + '">').join('');
    return html(200, '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Redirecting to NewebPay…</title></head>'
      + '<body style="font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#101B27;text-align:center;padding:60px 16px">'
      + '<p style="font-size:16px">Redirecting to the secure NewebPay payment page…</p><p style="font-size:13px;color:#505C68">Order ' + esc(orderNo) + ' · ' + nt(o.np.amountTwd) + '</p>'
      + '<form id="np" method="post" action="' + NP_GATEWAY + '">' + inputs + '<noscript><button type="submit">Continue to NewebPay</button></noscript></form>'
      + '<script>document.getElementById("np").submit()</script></body></html>');
  });
}
async function handlePay(env, request, orderNo) {
  const tok = new URL(request.url).searchParams.get('t') || '';
  if (!(await safeEq(tok, await orderToken(env, orderNo)))) return html(403, '<p>Invalid payment link.</p>');
  const o = await getOrder(env, orderNo);
  if (!o) return html(404, '<p>Order not found.</p>');
  if (o.status === 'paid') return Response.redirect(completeUrl(env, orderNo, tok, 'success'), 303);
  const base = workerBase(request);
  let np = '';
  if (npReady(env)) {
    /* The NewebPay fields (with their TimeStamp) are built when the button is
       pressed, in handleNewebpayGo, not when this page loads: NewebPay refuses a
       stale TimeStamp (「頁面已逾時失效」), and readers leave this page open. */
    np = '<form method="post" action="' + base + '/pay/' + encodeURIComponent(orderNo) + '/newebpay?t=' + encodeURIComponent(tok) + '">'
      + '<button class="b">Pay by card via NewebPay — ' + nt(o.totalTwd) + '</button></form><p class="s">Charged in New Taiwan dollars.</p>';
  }
  const pp = env.PAYPAL_CLIENT_ID ? (np ? '<p class="s" style="margin-top:18px">Or pay ' + usd(o.totalUsd) + ' in US dollars with PayPal:</p>' : '<p class="s">Charged ' + usd(o.totalUsd) + ' in US dollars.</p>') + '<div id="pp"></div><script src="https://www.paypal.com/sdk/js?client-id=' + encodeURIComponent(env.PAYPAL_CLIENT_ID.trim()) + '&currency=USD&intent=capture&enable-funding=card"></script>'
    + '<script>paypal.Buttons({createOrder:function(d,a){return a.order.create({purchase_units:[{invoice_id:' + JSON.stringify(orderNo) + ',description:' + JSON.stringify(SHOP_NAME + ' chapters') + ',amount:{currency_code:"USD",value:' + JSON.stringify(Number(o.totalUsd).toFixed(2)) + '}}]})},'
    + 'onApprove:function(d,a){return a.order.capture().then(function(){return fetch("/paypal/confirm",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({orderNo:' + JSON.stringify(orderNo) + ',paypalOrderId:d.orderID,t:' + JSON.stringify(tok) + '})})}).then(function(r){return r.json()}).then(function(r){if(r.redirect)location.href=r.redirect;else document.getElementById("m").textContent=r.error||"Could not confirm."})},'
    + 'onError:function(){document.getElementById("m").textContent="PayPal error — please try again."}}).render("#pp")</script>' : '';
  const items = o.items.map((i) => '<li>' + esc(i.title) + ' <span class="s">(' + esc(i.seriesCode) + ')</span> — ' + usd(i.priceUsd) + ' · ' + nt(i.priceTwd) + '</li>').join('');
  return html(200, '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Payment — ' + esc(SHOP_NAME) + '</title>'
    + '<style>body{font-family:Segoe UI,Helvetica,Arial,sans-serif;background:#f4f6f8;color:#101B27;margin:0}.c{max-width:560px;margin:40px auto;background:#fff;border:1px solid #DCE1E6;border-radius:6px;padding:28px}'
    + 'h1{font-size:22px;margin:0 0 6px}.s{color:#505C68;font-size:13px}.b{width:100%;padding:13px;border:0;border-radius:4px;background:#0C8375;color:#fff;font-size:16px;font-weight:600;cursor:pointer;margin:14px 0 4px}ul{padding-left:18px}</style></head>'
    + '<body><div class="c"><h1>' + esc(SHOP_NAME) + ' — payment</h1><p class="s">Order ' + esc(orderNo) + '</p><ul>' + items + '</ul><p><b>Total ' + usd(o.totalUsd) + ' · ' + nt(o.totalTwd) + '</b></p>'
    + np + pp + (np || pp ? '' : '<p>Online payment is not configured yet.</p>') + '<p id="m" style="color:#A52A2A"></p>'
    + '<p class="s"><a href="' + esc((env.PORTAL_BASE || '') + '/cart') + '">← Back to cart</a> · Questions: ' + esc(ORG_EMAIL) + '</p></div></body></html>');
}

/* ======================= status + admin ======================= */
async function handleStatus(env, request, orderNo) {
  const tok = new URL(request.url).searchParams.get('t') || '';
  if (!(await safeEq(tok, await orderToken(env, orderNo)))) return json(403, { ok: false, error: 'Invalid link' });
  const o = await getOrder(env, orderNo); if (!o) return json(404, { ok: false, error: 'Order not found' });
  const state = o.status === 'paid' ? 'success' : o.status === 'pending-payment' ? 'pending' : o.status === 'created' ? 'open' : 'fail';
  return json(200, { ok: true, state, orderNo, totalUsd: o.totalUsd, totalTwd: o.totalTwd, paidAt: o.payTime || '', gateway: o.gateway || '', itemIds: o.items.map((i) => i.id),
    email: o.buyer.email.replace(/^(.{2}).*(@.*)$/, '$1***$2'), emailSent: !!o.emailSent });
}
async function listOrders(env) {
  const out = []; let cursor;
  do {
    const l = await env.ORDERS.list({ prefix: 'order:', cursor, limit: 1000 });
    for (const k of l.keys) { const o = await getOrder(env, k.name.substring(6)); if (o) out.push(o); }
    cursor = l.list_complete ? null : l.cursor;
  } while (cursor);
  return out.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}
const summary = (o) => ({ orderNo: o.orderNo, status: o.status, createdAt: o.createdAt, payTime: o.payTime || null, gateway: o.gateway || null,
  totalUsd: o.totalUsd, totalTwd: o.totalTwd ?? null, paidUsd: o.paidUsd ?? null, paidTwd: o.paidTwd ?? null, tradeNo: o.tradeNo || null, email: o.buyer.email,
  name: o.buyer.firstName + ' ' + o.buyer.lastName, account: o.account ? o.account.userName : null, country: o.buyer.country, company: o.buyer.company || null,
  items: o.items.map((i) => ({ id: i.id, title: i.title, seriesCode: i.seriesCode })), emailSent: o.emailSent || null, anomaly: o.anomaly || null });

/* standalone dashboard sign-in: signed HttpOnly cookie, 8 h (same scheme as the TAIIS engine) */
const COOKIE = 'ngiqpay_admin';
async function sessionOk(env, request) {
  const m = (request.headers.get('Cookie') || '').match(new RegExp('(?:^|;\\s*)' + COOKIE + '=(\\d+)\\.([0-9a-f]+)'));
  return !!(m && env.ADMIN_PASSWORD && Date.now() < Number(m[1]) && (await safeEq(m[2], await hmacHex('s|' + env.ADMIN_PASSWORD, m[1]))));
}
async function handleLogin(env, request) {
  const form = '<form method="post" style="max-width:320px;margin:60px auto;font-family:sans-serif"><h3>' + esc(SHOP_NAME) + ' payments</h3><input name="u" placeholder="User" style="width:100%;padding:8px;margin:4px 0"><input name="p" type="password" placeholder="Password" style="width:100%;padding:8px;margin:4px 0"><button style="padding:8px 16px">Sign in</button></form>';
  if (request.method !== 'POST') return html(200, form);
  const f = new URLSearchParams(await request.text());
  if (!env.ADMIN_USER || !(await safeEq(f.get('u') || '', env.ADMIN_USER)) || !(await safeEq(f.get('p') || '', env.ADMIN_PASSWORD))) return html(401, form + '<p style="text-align:center;color:#a00">Incorrect.</p>');
  const exp = String(Date.now() + 8 * 3600e3);
  return new Response(null, { status: 303, headers: { Location: '/admin', 'Set-Cookie': COOKIE + '=' + exp + '.' + (await hmacHex('s|' + env.ADMIN_PASSWORD, exp)) + '; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800' } });
}
async function handleAdmin(env, request, csv) {
  if (!(await sessionOk(env, request))) return Response.redirect(workerBase(request) + '/admin/login', 303);
  const orders = await listOrders(env);
  if (csv) {
    const cell = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const cols = ['orderNo', 'status', 'createdAt', 'payTime', 'gateway', 'totalUsd', 'totalTwd', 'paidUsd', 'paidTwd', 'tradeNo', 'name', 'account', 'email', 'country', 'company'];
    const lines = [cols.concat(['items']).join(',')].concat(orders.map((o) => { const s = summary(o); return cols.map((c) => cell(s[c])).concat([cell(s.items.map((i) => i.id).join(' | '))]).join(','); }));
    return new Response('﻿' + lines.join('\n'), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="chapter-orders.csv"' } });
  }
  const paid = orders.filter((o) => o.status === 'paid');
  const rows = orders.map((o) => '<tr><td>' + esc(o.orderNo) + '<br><small>' + esc(tpe(o.createdAt)) + '</small></td><td>' + esc(o.buyer.firstName + ' ' + o.buyer.lastName) + '<br><small>' + esc(o.buyer.email) + (o.account ? ' · account ' + esc(o.account.userName) : '') + '</small></td>'
    + '<td>' + o.items.map((i) => esc(i.seriesCode + ' · ' + itemLabel(i.id))).join('<br>') + '</td><td>' + (o.status === 'paid' ? '<b>' + paidText(o) + '</b>' : usd(o.totalUsd) + '<br><small>' + nt(o.totalTwd || 0) + '</small>') + '</td>'
    + '<td>' + esc(o.status) + (o.payTime ? '<br><small>' + esc(tpe(o.payTime)) + ' · ' + esc(o.gateway) + '</small>' : '') + (o.anomaly ? '<br><small style="color:#a00">' + esc(o.anomaly) + '</small>' : '') + '</td>'
    + '<td>' + (o.emailSent ? '✉ sent' : o.status === 'paid' ? '<span style="color:#a60">✉ ' + esc(o.emailError || 'pending') + '</span>' : '') + '</td></tr>').join('');
  return html(200, '<!doctype html><html><head><meta charset="utf-8"><title>Chapter orders</title><style>body{font-family:Segoe UI,Helvetica,Arial,sans-serif;margin:20px}table{border-collapse:collapse;width:100%;font-size:13px}td,th{border-bottom:1px solid #e3e8f0;padding:7px;text-align:left;vertical-align:top}small{color:#778}</style></head><body>'
    + '<h2>' + esc(SHOP_NAME) + ' — chapter orders</h2><p>' + orders.length + ' orders · ' + paid.length + ' paid · ' + usd(paid.reduce((s, o) => s + Number(o.paidUsd || 0), 0)) + ' + ' + nt(paid.reduce((s, o) => s + Number(o.paidTwd || 0), 0)) + ' received · <a href="/admin.csv">CSV</a></p>'
    + '<table><tr><th>Order</th><th>Buyer</th><th>Items</th><th>Amount</th><th>Status</th><th>Email</th></tr>' + (rows || '<tr><td colspan="6">No orders yet</td></tr>') + '</table></body></html>');
}

/* cron: retry confirmation emails for paid orders */
async function reconcile(env) {
  let n = 0;
  for (const o of await listOrders(env)) if (o.status === 'paid' && !o.emailSent && env.HOSTINGER_MAIL_TOKEN) { n++; await withLock(o.orderNo, () => sendConfirmation(env, o)); }
  return { retried: n };
}

/* ======================= router ======================= */
export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname.replace(/\/+$/, '') || '/';
    try {
      if (path === '/ping') return json(200, { ok: true, kv: !!env.ORDERS, portalSecret: !!env.PORTAL_SECRET, receiptSecret: !!env.RECEIPT_SECRET, paypal: ppReady(env), paypalSandbox: env.PAYPAL_SANDBOX === '1', newebpay: npReady(env), email: !!env.HOSTINGER_MAIL_TOKEN, portal: env.PORTAL_BASE || '' });
      if (!env.ORDERS) return json(503, { ok: false, error: 'KV not bound' });
      if (path === '/order' && request.method === 'POST') return handleOrder(env, request);
      let m;
      if ((m = path.match(/^\/pay\/([\w-]{1,30})\/newebpay$/)) && request.method === 'POST') return handleNewebpayGo(env, request, m[1]);
      if ((m = path.match(/^\/pay\/([\w-]{1,30})$/))) return handlePay(env, request, m[1]);
      if ((m = path.match(/^\/status\/([\w-]{1,30})$/))) return handleStatus(env, request, m[1]);
      if (path === '/paypal/confirm' && request.method === 'POST') return handlePaypalConfirm(env, request);
      if (path === '/notify' && request.method === 'POST') {
        if (!npReady(env)) return new Response('ERR', { status: 503 });
        try { await confirmNewebpay(env, await parseNewebpay(env, request), 'notify'); return new Response('OK'); } catch (e) { return new Response('ERR', { status: 400 }); }
      }
      if (path === '/return' && request.method === 'POST') {
        let o = null; try { o = await confirmNewebpay(env, await parseNewebpay(env, request), 'return'); } catch (e) {}
        if (!o) return Response.redirect((env.PORTAL_BASE || '') + '/cart', 303);
        const state = o.status === 'paid' ? 'success' : o.status === 'pending-payment' ? 'pending' : 'fail';
        return Response.redirect(completeUrl(env, o.orderNo, await orderToken(env, o.orderNo), state), 303);
      }
      if (path === '/admin/orders.json') {
        if (!(await bearerOk(request, env.ADMIN_API_TOKEN))) return json(403, { ok: false, error: 'Forbidden' });
        return json(200, { ok: true, orders: (await listOrders(env)).map(summary) });
      }
      if (path === '/admin/login') return handleLogin(env, request);
      if (path === '/admin') return handleAdmin(env, request, false);
      if (path === '/admin.csv') return handleAdmin(env, request, true);
      return json(404, { ok: false, error: 'Not found' });
    } catch (e) {
      console.log('error', path, e.message);
      return json(500, { ok: false, error: 'Server error' });
    }
  },
  async scheduled(_event, env) { console.log('reconcile', JSON.stringify(await reconcile(env))); }
};
