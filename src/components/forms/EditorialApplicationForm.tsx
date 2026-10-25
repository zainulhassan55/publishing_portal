'use client'

import { useState } from 'react'
import { APPLICATION_ROLES, DEGREES } from '@/lib/forms/options'
import {
  Checkbox,
  ErrorSummary,
  Failure,
  FileField,
  Fieldset,
  grid,
  Honeypot,
  Received,
  Select,
  SubmitButton,
  TextArea,
  TextInput,
  useFiles,
  useSubmit,
  type Values,
} from './FormKit'

export type TargetOption = { value: string; label: string }

/** Become a reviewer, or join an editorial board. Used on /reviewers and /editors. */
export function EditorialApplicationForm({ targets, role }: { targets: TargetOption[]; role: 'reviewer' | 'board' }) {
  const [values, setValues] = useState<Values>({ role, target: targets.length === 1 ? targets[0].value : '' })
  const set = (name: string, value: unknown) => setValues((v) => ({ ...v, [name]: value }))
  const files = useFiles()
  const { errors, summary, busy, failure, reference, submit } = useSubmit('/api/forms/editorial-application')
  const field = { values, errors, set }

  if (reference) {
    return (
      <Received reference={reference}>
        The editors of the title you chose will review your application and contact you by email.
      </Received>
    )
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        void submit({ ...values, files: files.payload })
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'relative' }}
    >
      <Honeypot values={values} set={set} />
      <ErrorSummary summary={summary} />
      <Fieldset legend="Role and publication">
        <div style={grid}>
          <Select name="role" label="I would like to apply as" required options={APPLICATION_ROLES.map((r) => ({ ...r }))} {...field} />
          <Select name="target" label="Journal or book series" required options={targets} {...field} />
        </div>
      </Fieldset>
      <Fieldset legend="About you">
        <div style={grid}>
          <TextInput name="name" label="Full name" required {...field} />
          <TextInput name="email" label="Email address" type="email" required {...field} />
          <TextInput name="affiliation" label="Affiliation" required {...field} />
          <TextInput name="country" label="Country" required {...field} />
          <TextInput name="orcid" label="ORCID iD" required hint="For example 0000-0002-1825-0097" {...field} />
          <Select name="degree" label="Highest degree" required options={DEGREES.map((d) => ({ value: d, label: d }))} {...field} />
        </div>
        <TextInput name="profileUrl" label="Institutional or Google Scholar profile" hint="Optional link" type="url" {...field} />
      </Fieldset>
      <Fieldset legend="Expertise">
        <TextArea name="expertise" label="Areas of expertise" required rows={3} hint="The topics you are qualified to assess, within the publication’s scope." {...field} />
        <TextArea name="profile" label="Brief academic profile" required hint="Your research, publications and any editorial or reviewing experience." {...field} />
        <TextArea name="boards" label="Current editorial board memberships or reviewing roles" rows={3} hint="Optional" {...field} />
        <TextArea name="motivation" label="Why you would like to contribute" rows={3} hint="Optional" {...field} />
        <FileField name="cv" label="CV" purpose="cv" required error={errors['files.cv']} onChange={files.onChange('cv')} />
      </Fieldset>
      <Checkbox name="consent" label="I agree that NextGenIQ Press may store these details and share them with the relevant editors to assess my application, as described in the Privacy Policy." {...field} />
      <Failure message={failure} />
      <SubmitButton busy={busy} uploading={files.uploading} label="Send application" />
    </form>
  )
}
