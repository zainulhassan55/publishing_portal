import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { brand } from '../data/siteContent'
import ActionLink from '../components/shared/ActionLink'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('author')
  const [remember, setRemember] = useState(true)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-paper">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="relative overflow-hidden bg-ink-950 px-8 py-10 text-white sm:px-12 lg:px-14 lg:py-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)',
              backgroundSize: '44px 44px',
            }}
          />

          <div className="relative flex h-full flex-col">
            <Link to="/" className="inline-flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white font-display text-sm font-semibold text-ink-950">
                {brand.shortName}
              </span>
              <span>
                <span className="block font-display text-xl font-semibold">{brand.name}</span>
                <span className="mt-0.5 block text-xs tracking-[0.1em] text-slate-300 uppercase">
                  {brand.tagline}
                </span>
              </span>
            </Link>

            <div className="mt-16 max-w-lg lg:mt-24">
              <p className="meta text-accent-300">Author & Editor Access</p>
              <h1 className="mt-4 font-display text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
                Sign in to manage submissions, reviews, and editorial work.
              </h1>
              <p className="mt-5 text-base leading-8 text-slate-300">
                Sign in as an author, reviewer, or editor. Authentication will connect to the
                Manuscript Management System (MMS) when that platform is hosted and linked.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3 lg:mt-auto lg:pt-16">
              {[
                { title: 'Authors', text: 'Track manuscripts and revise submissions' },
                { title: 'Reviewers', text: 'Access assigned reviews securely' },
                { title: 'Editors', text: 'Manage decisions and issue workflows' },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/15 bg-white/5 p-4">
                  <p className="font-display text-lg font-semibold text-white">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex items-center justify-center px-6 py-12 sm:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <p className="meta text-accent-700">Welcome back</p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink-950">
                Login to your account
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Use your publishing credentials to continue. Readers do not need an account to
                browse journals and articles.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="surface p-6 sm:p-8">
              <div className="space-y-5">
                <div>
                  <label htmlFor="email" className="meta text-slate-500">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="field mt-2"
                    placeholder="author@university.edu"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="meta text-slate-500">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="field mt-2"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label htmlFor="role" className="meta text-slate-500">
                    Role
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                    className="field mt-2"
                  >
                    <option value="author">Author</option>
                    <option value="reviewer">Reviewer</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <label className="flex items-center gap-3 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                    className="h-4 w-4 rounded border-line"
                  />
                  Keep me signed in on this device
                </label>

                {submitted ? (
                  <div className="rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm leading-6 text-ink-900">
                    Login UI is ready. Authentication will connect to the Manuscript Management
                    System (MMS) when that platform is hosted and linked.
                  </div>
                ) : null}

                <button type="submit" className="btn btn-primary w-full justify-center">
                  Sign in
                </button>
              </div>
            </form>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
              <Link to="/" className="font-semibold text-ink-950 hover:text-accent-700">
                ← Back to portal
              </Link>
              <ActionLink to="/guidelines" variant="secondary" size="sm">
                Author guidelines
              </ActionLink>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default LoginPage
