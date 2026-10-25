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
  SubmitButton,
  TextArea,
  TextInput,
  useFiles,
  useSubmit,
  type Person,
  type Values,
} from './FormKit'

const BLANK: Person = { name: '', email: '', affiliation: '', country: '', orcid: '' }

/** Chapter submission to one volume with an open call for chapters. */
export function ChapterSubmissionForm({ series, volume, volumeTitle }: { series: string; volume: string; volumeTitle: string }) {
  const [values, setValues] = useState<Values>({ series, volume, corresponding: '0' })
  const [authors, setAuthors] = useState<Person[]>([{ ...BLANK }])
  const set = (name: string, value: unknown) => setValues((v) => ({ ...v, [name]: value }))
  const files = useFiles()
  const { errors, summary, busy, failure, reference, submit } = useSubmit('/api/forms/book-chapter')
  const field = { values, errors, set }

  if (reference) {
    return (
      <Received reference={reference}>
        Your chapter for “{volumeTitle}” will be assessed by the volume editors and, if suitable, sent for independent peer review.
      </Received>
    )
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        void submit({ ...values, corresponding: Number(values.corresponding), authors, files: files.payload })
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'relative' }}
    >
      <Honeypot values={values} set={set} />
      <ErrorSummary summary={summary} />
      <Fieldset legend="The chapter">
        <TextInput name="title" label="Chapter title" required {...field} />
        <TextArea name="abstract" label="Abstract" required rows={6} {...field} />
        <TextInput name="keywords" label="Keywords" required hint="Separated by commas." {...field} />
      </Fieldset>
      <Fieldset legend="Authors" intro="Author details go here and on the title page only; the manuscript itself must be anonymised.">
        <Repeater
          name="authors"
          legend={(i) => `Author ${i + 1}`}
          items={authors}
          setItems={setAuthors}
          errors={errors}
          max={15}
          blank={BLANK}
          addLabel="Add an author"
          render={(item, setItem, prefix) => {
            const index = prefix.split('.')[1]
            return (
              <>
                <div style={grid}>
                  <PersonInput item={item} set={setItem} prefix={prefix} field="name" label="Name" required errors={errors} />
                  <PersonInput item={item} set={setItem} prefix={prefix} field="email" label="Email" type="email" required errors={errors} />
                  <PersonInput item={item} set={setItem} prefix={prefix} field="affiliation" label="Affiliation" required errors={errors} />
                  <PersonInput item={item} set={setItem} prefix={prefix} field="country" label="Country" errors={errors} />
                  <PersonInput item={item} set={setItem} prefix={prefix} field="orcid" label="ORCID iD" errors={errors} />
                </div>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
                  <input type="radio" name="corresponding" checked={values.corresponding === index} onChange={() => set('corresponding', index)} style={{ accentColor: 'var(--accent,#1D5DA8)' }} />
                  Corresponding author
                </label>
              </>
            )
          }}
        />
      </Fieldset>
      <Fieldset legend="Declarations" intro="Write “None” or “Not applicable” where that is the answer.">
        <TextArea name="funding" label="Funding" required rows={2} {...field} />
        <TextArea name="conflicts" label="Conflicts of interest" required rows={2} {...field} />
        <TextArea name="aiUse" label="Use of generative AI" required rows={2} hint="Any substantive use, with the tool and purpose. See the Generative AI Policy." {...field} />
        <TextArea name="permissions" label="Third-party material and permissions" rows={2} {...field} />
        <TextArea name="ethics" label="Ethics approval and consent" rows={2} {...field} />
        <TextArea name="dataAvailability" label="Data and code availability" rows={2} {...field} />
      </Fieldset>
      <Fieldset legend="Files">
        <FileField name="manuscript" label="Anonymised manuscript" purpose="manuscript" required error={errors['files.manuscript']} onChange={files.onChange('manuscript')} />
        <FileField name="titlePage" label="Title page with author details" purpose="title_page" required error={errors['files.titlePage']} onChange={files.onChange('titlePage')} />
        <FileField name="supporting" label="Supporting files" purpose="supporting" max={3} hint="Optional. PDF or Word, up to 20 MB each." error={errors['files.supporting']} onChange={files.onChange('supporting')} />
      </Fieldset>
      <Checkbox name="original" label="This chapter is original, has not been published before, and is not under consideration elsewhere. All authors have approved the submission." {...field} />
      <Failure message={failure} />
      <SubmitButton busy={busy} uploading={files.uploading} label="Submit chapter" />
    </form>
  )
}
