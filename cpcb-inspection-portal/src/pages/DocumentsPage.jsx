import React from 'react'
import PageShell, { useSection } from '../components/PageShell'
import { Card, Pill, Field } from '../components/ui'
import { useApp } from '../state/AppState'

const GROUPS = [
  {
    key: 'consents',
    title: 'Consents & clearances',
    items: [
      ['consentAir', 'Consent to Operate — Air Act'],
      ['consentWater', 'Consent to Operate — Water Act'],
      ['hwAuthorisation', 'Hazardous waste authorisation'],
      ['cgwaNoc', 'CGWA NOC for groundwater abstraction'],
      ['consentConditions', 'Consent conditions compliance report'],
    ],
  },
  {
    key: 'logbooks',
    title: 'Logbooks (9 records)',
    items: [
      ['logETP', 'ETP operation logbook'],
      ['logFlowmeter', 'Flow meter reading register'],
      ['logWater', 'Freshwater consumption register'],
      ['logFuel', 'Fuel consumption register'],
      ['logHazardous', 'Hazardous waste register (Form-3 / manifests)'],
      ['logOcems', 'OCEMS calibration & maintenance log'],
      ['logDg', 'DG set operation log'],
      ['logSludge', 'Sludge generation & disposal log'],
      ['logStp', 'STP operation logbook'],
    ],
  },
  {
    key: 'others',
    title: 'Other documents (9 records)',
    items: [
      ['form4', 'Form-4 annual return'],
      ['form10', 'Form-10 records / manifests'],
      ['ocemsCharter', 'OCEMS charter'],
      ['selfAssessment', 'Self-assessment report'],
      ['stackReport', 'Third-party stack monitoring report'],
      ['groundwaterReport', 'Groundwater analysis report'],
      ['processFlow', 'Process flow sheet & water balance'],
      ['layout', 'Plant layout showing outlets & ETP'],
      ['authorisationLetter', 'Board resolution / authorised signatory letter'],
    ],
  },
]

const STATUS_OPTIONS = [
  { value: 'Yes', label: 'Available' },
  { value: 'No', label: 'Not available' },
  { value: 'NA', label: 'N/A' },
]

export default function DocumentsPage() {
  const [documents, set] = useSection('documents')
  const { showToast } = useApp()

  const setItem = (key, field, value) => {
    const entry = documents[key] || {}
    set(key, { ...entry, [field]: value })
  }

  const all = GROUPS.flatMap((group) => group.items)
  const verified = all.filter(([key]) => documents[key]?.status === 'Yes').length
  const missing = all.filter(([key]) => !documents[key]?.status)

  return (
    <PageShell sectionKey="documents">
      <Card
        title="Documents verified on site"
        description="Mark availability for each record and attach a scan or photograph where possible."
        actions={<Pill tone={verified === all.length ? 'comply' : 'warn'}>{verified} of {all.length} verified</Pill>}
      >
        <div className="space-y-6">
          {GROUPS.map((group) => (
            <div key={group.key}>
              <h3 className="mb-2 text-[13px] font-bold text-slate-800">{group.title}</h3>
              <div className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200">
                {group.items.map(([key, label]) => {
                  const entry = documents[key] || {}
                  return (
                    <div key={key} className="grid gap-2 p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                      <div>
                        <p className="text-[13px] font-medium text-slate-800">{label}</p>
                        {entry.file && <p className="text-[11px] text-slate-500">Attached: {entry.file}</p>}
                        {entry.remarks && <p className="text-[11px] text-slate-500">{entry.remarks}</p>}
                      </div>
                      <div className="flex gap-1">
                        {STATUS_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setItem(key, 'status', entry.status === option.value ? '' : option.value)}
                            className={`rounded-md border px-2.5 py-1.5 text-[11px] font-semibold ${
                              entry.status === option.value
                                ? option.value === 'Yes'
                                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                                  : option.value === 'No'
                                    ? 'border-red-600 bg-red-50 text-red-700'
                                    : 'border-slate-500 bg-slate-100 text-slate-700'
                                : 'border-slate-200 bg-white text-slate-500'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <label className="cursor-pointer rounded-md border border-dashed border-slate-300 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50">
                          {entry.file ? 'Replace' : 'Attach'}
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,image/*,.doc,.docx,.xls,.xlsx"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                setItem(key, 'file', file.name)
                                showToast(`${file.name} attached`)
                              }
                              e.target.value = ''
                            }}
                          />
                        </label>
                        <input
                          aria-label={`${label} remarks`}
                          className="inp inp-sm w-28"
                          value={entry.remarks || ''}
                          onChange={(e) => setItem(key, 'remarks', e.target.value)}
                          placeholder="Remarks"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {missing.length > 0 && (
          <p className="mt-4 text-[12px] text-amber-700">{missing.length} record(s) still to be marked.</p>
        )}
      </Card>

      <Card title="Additional document notes">
        <Field label="Notes on records not produced / discrepancies">
          <textarea
            className="inp"
            rows={3}
            value={documents.notes || ''}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Records denied, registers incomplete, unsigned entries, mismatch with meter readings"
          />
        </Field>
      </Card>
    </PageShell>
  )
}
