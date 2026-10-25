'use client'

import { useState } from 'react'
import {
  Checkbox,
  ErrorSummary,
  Failure,
  FileField,
  Fieldset,
  grid,
  Honeypot,
  PersonInput,
  Received,
  Repeater,
  Select,
  SubmitButton,
  TextArea,
  TextInput,
  useFiles,
  useSubmit,
  type Person,
  type Values,
} from './FormKit'
import type { TargetOption } from './EditorialApplicationForm'

const BLANK: Person = { name: '', email: '', affiliation: '', country: '', orcid: '', expertise: '', bio: '' }

/** Special issue proposal, following the publisher's Special Issue Guidelines. */
export function SpecialIssueForm({ journals, journal }: { journals: TargetOption[]; journal?: string }) {
  const [values, setValues] = useState<Values>({ journal: journal ?? '' })
  const [editors, setEditors] = useState<Person[]>([{ ...BLANK }])
  const set = (name: string, value: unknown) => setValues((v) => ({ ...v, [name]: value }))
  const files = useFiles()
  const { errors, summary, busy, failure, reference, submit } = useSubmit('/api/forms/special-issue')
  const field = { values, errors, set }

  if (reference) {
    return (
      <Received reference={reference}>
        Proposals are subject to editorial approval. We will contact you once the journal’s editors have assessed it.
      </Received>
    )
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        void submit({ ...values, guestEditors: editors, files: files.payload })
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'relative' }}
    >
      <Honeypot values={values} set={set} />
      <ErrorSummary summary={summary} />
      <Fieldset legend="The special issue">
        <Select name="journal" label="Target journal" required options={journals} {...field} />
        <TextInput name="title" label="Proposed title" required {...field} />
        <TextArea name="aims" label="Aims and scope" required rows={6} {...field} />
        <TextArea name="topics" label="Topics of interest" required rows={5} hint="One per line." {...field} />
        <TextArea name="rationale" label="Why this topic, and why now" rows={4} hint="Optional" {...field} />
      </Fieldset>
      <Fieldset legend="Guest editors" intro="Guest editors must disclose conflicts of interest and may not handle their own submissions; those are assigned to an independent editor.">
        <Repeater
          name="guestEditors"
          legend={(i) => `Guest editor ${i + 1}`}
          items={editors}
          setItems={setEditors}
          errors={errors}
          max={6}
          blank={BLANK}
          addLabel="Add a guest editor"
          render={(item, setItem, prefix) => (
            <>
              <div style={grid}>
                <PersonInput item={item} set={setItem} prefix={prefix} field="name" label="Name" required errors={errors} />
                <PersonInput item={item} set={setItem} prefix={prefix} field="email" label="Email" type="email" required errors={errors} />
                <PersonInput item={item} set={setItem} prefix={prefix} field="affiliation" label="Affiliation" required errors={errors} />
                <PersonInput item={item} set={setItem} prefix={prefix} field="country" label="Country" errors={errors} />
                <PersonInput item={item} set={setItem} prefix={prefix} field="orcid" label="ORCID iD" errors={errors} />
              </div>
              <PersonInput item={item} set={setItem} prefix={prefix} field="expertise" label="Areas of expertise" required errors={errors} />
              <PersonInput item={item} set={setItem} prefix={prefix} field="bio" label="Brief biography" required textarea errors={errors} />
            </>
          )}
        />
        <FileField name="cvs" label="Guest editor CVs" purpose="cv" max={6} hint="Optional. PDF or Word, up to 10 MB each." error={errors['files.cvs']} onChange={files.onChange('cvs')} />
      </Fieldset>
      <Fieldset legend="Plan">
        <TextArea name="timeline" label="Proposed timeline" required rows={4} hint="For example: call opens, submission deadline, reviews complete, publication." {...field} />
        <div style={grid}>
          <TextInput name="expected" label="Anticipated number of submissions" required {...field} />
        </div>
        <TextArea name="promotion" label="Promotion plan" required rows={4} hint="How you will reach potential authors: networks, conferences, mailing lists." {...field} />
        <TextArea name="conflicts" label="Conflicts of interest" rows={3} hint="Any relationship that could affect, or appear to affect, impartial handling. Write “None” if there are none." {...field} />
        <FileField name="proposal" label="Proposal document" purpose="proposal" hint="Optional: a fuller proposal, if you have one. PDF or Word, up to 20 MB." error={errors['files.proposal']} onChange={files.onChange('proposal')} />
      </Fieldset>
      <Fieldset legend="Your details">
        <div style={grid}>
          <TextInput name="submitterName" label="Your name" required {...field} />
          <TextInput name="submitterEmail" label="Your email address" type="email" required {...field} />
        </div>
      </Fieldset>
      <Checkbox name="guidelines" label="I have read the Special Issue Guidelines. I understand that submissions follow the journal’s standard peer review, that inclusion does not guarantee acceptance, and that the Editor-in-Chief retains final editorial oversight." {...field} />
      <Failure message={failure} />
      <SubmitButton busy={busy} uploading={files.uploading} label="Send proposal" />
    </form>
  )
}
