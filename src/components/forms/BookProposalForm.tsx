'use client'

import { useState } from 'react'
import { VOLUME_FORMATS, VOLUME_TIMELINES } from '@/lib/forms/options'
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

const BLANK: Person = { name: '', email: '', affiliation: '', country: '', orcid: '', bio: '' }

/**
 * Volume proposal for one book series. The fields are the publisher's
 * "Propose a Volume" list; LNMRI adds the multidisciplinary focus, and the
 * proceedings section appears only for conference proceedings.
 */
export function BookProposalForm({ series, code }: { series: string; code: string }) {
  const [values, setValues] = useState<Values>({ series, format: '' })
  const [editors, setEditors] = useState<Person[]>([{ ...BLANK }])
  const [proceedings, setProceedings] = useState<Person>({})
  const set = (name: string, value: unknown) => setValues((v) => ({ ...v, [name]: value }))
  const files = useFiles()
  const { errors, summary, busy, failure, reference, submit } = useSubmit('/api/forms/book-proposal')
  const field = { values, errors, set }
  const isProceedings = values.format === 'proceedings'
  const isLnmr = series === 'lnmr'

  if (reference) {
    return (
      <Received reference={reference}>
        The {code} Series Editors will assess your proposal and be in touch. Proposal approval does not guarantee acceptance of the completed manuscript.
      </Received>
    )
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        void submit({ ...values, editors, proceedings: isProceedings ? proceedings : undefined, files: files.payload })
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'relative' }}
    >
      <Honeypot values={values} set={set} />
      <ErrorSummary summary={summary} />
      <Fieldset legend="The volume">
        <div style={grid}>
          <Select name="format" label="Publication format" required options={VOLUME_FORMATS.map((f) => ({ ...f }))} {...field} />
          <Select name="timeline" label="Manuscript submission timeline" required options={VOLUME_TIMELINES.map((t) => ({ value: t, label: t }))} {...field} />
        </div>
        <TextInput name="title" label="Proposed title" required {...field} />
        <TextInput name="altTitles" label="Alternative titles" hint="Optional, up to two." {...field} />
        <TextArea name="aims" label="Aims" required rows={5} {...field} />
        <TextArea name="readership" label="Intended readership" required rows={3} {...field} />
        <TextArea name="contribution" label={isLnmr ? 'Scholarly contribution' : 'Original contribution'} required rows={5} hint="What the volume adds that existing books do not." {...field} />
        {isLnmr ? <TextArea name="multidisciplinary" label="Multidisciplinary focus" required rows={4} hint="How multiple disciplinary perspectives address a shared research problem." {...field} /> : null}
        <TextArea name="toc" label="Preliminary table of contents" required rows={8} hint="Chapter titles, with authors where known." {...field} />
        <div style={grid}>
          <TextInput name="length" label="Estimated manuscript length" required hint="For example: 12 chapters, about 300 pages." {...field} />
        </div>
      </Fieldset>
      <Fieldset legend={values.format === 'monograph' ? 'Authors' : 'Authors or volume editors'}>
        <Repeater
          name="editors"
          legend={(i) => `Person ${i + 1}`}
          items={editors}
          setItems={setEditors}
          errors={errors}
          max={8}
          blank={BLANK}
          addLabel="Add another author or editor"
          render={(item, setItem, prefix) => (
            <>
              <div style={grid}>
                <PersonInput item={item} set={setItem} prefix={prefix} field="name" label="Name" required errors={errors} />
                <PersonInput item={item} set={setItem} prefix={prefix} field="email" label="Email" type="email" required errors={errors} />
                <PersonInput item={item} set={setItem} prefix={prefix} field="affiliation" label="Affiliation" required errors={errors} />
                <PersonInput item={item} set={setItem} prefix={prefix} field="country" label="Country" errors={errors} />
                <PersonInput item={item} set={setItem} prefix={prefix} field="orcid" label="ORCID iD" errors={errors} />
              </div>
              <PersonInput item={item} set={setItem} prefix={prefix} field="bio" label="Biography" required textarea errors={errors} />
            </>
          )}
        />
        <TextArea name="contributors" label="Proposed contributors" rows={4} hint={values.format === 'monograph' ? 'Optional' : 'Who you expect to contribute chapters or papers, or how you will invite them.'} {...field} />
      </Fieldset>
      {isProceedings ? (
        <Fieldset legend="Conference details">
          <div style={grid}>
            <PersonInput item={proceedings} set={(f, v) => setProceedings((p) => ({ ...p, [f]: v }))} prefix="proceedings" field="event" label="Event name" required errors={errors} />
            <PersonInput item={proceedings} set={(f, v) => setProceedings((p) => ({ ...p, [f]: v }))} prefix="proceedings" field="dates" label="Event dates" required errors={errors} />
            <PersonInput item={proceedings} set={(f, v) => setProceedings((p) => ({ ...p, [f]: v }))} prefix="proceedings" field="location" label="Location" required errors={errors} />
            <PersonInput item={proceedings} set={(f, v) => setProceedings((p) => ({ ...p, [f]: v }))} prefix="proceedings" field="url" label="Event website" type="url" errors={errors} />
            <PersonInput item={proceedings} set={(f, v) => setProceedings((p) => ({ ...p, [f]: v }))} prefix="proceedings" field="expectedPapers" label="Expected number of papers" errors={errors} />
          </div>
          <PersonInput item={proceedings} set={(f, v) => setProceedings((p) => ({ ...p, [f]: v }))} prefix="proceedings" field="committee" label="Programme committee" required textarea hint="Names and affiliations." errors={errors} />
          <PersonInput item={proceedings} set={(f, v) => setProceedings((p) => ({ ...p, [f]: v }))} prefix="proceedings" field="review" label="Peer-review arrangements" required textarea hint="Review model, number of reviewers per paper, and how conflicts of interest are handled." errors={errors} />
        </Fieldset>
      ) : null}
      <Fieldset legend="Files">
        <FileField name="cvs" label="Author or editor CVs" purpose="cv" required max={8} error={errors['files.cvs']} onChange={files.onChange('cvs')} />
        <FileField name="sample" label="Sample chapter" purpose="sample_chapter" max={2} hint="Optional. PDF or Word, up to 50 MB each." error={errors['files.sample']} onChange={files.onChange('sample')} />
        <FileField name="proposal" label="Full proposal document" purpose="proposal" hint="Optional. PDF or Word, up to 20 MB." error={errors['files.proposal']} onChange={files.onChange('proposal')} />
      </Fieldset>
      <Fieldset legend="Your details">
        <div style={grid}>
          <TextInput name="submitterName" label="Your name" required {...field} />
          <TextInput name="submitterEmail" label="Your email address" type="email" required {...field} />
        </div>
      </Fieldset>
      <Checkbox name="ack" label="I understand that proposal approval does not guarantee acceptance of the completed manuscript." {...field} />
      <Failure message={failure} />
      <SubmitButton busy={busy} uploading={files.uploading} label="Send proposal" />
    </form>
  )
}
