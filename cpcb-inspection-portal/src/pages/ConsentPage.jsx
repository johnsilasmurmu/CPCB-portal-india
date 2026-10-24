import React from 'react'
import PageShell, { useSection } from '../components/PageShell'
import { Card, TextField, InlineSelect, YesNo, Pill, TableWrap } from '../components/ui'

const ROWS = [
  { key: 'air', label: 'Air consent (Consent to Operate – Air Act)', short: 'Air consent' },
  { key: 'water', label: 'Water consent (Consent to Operate – Water Act)', short: 'Water consent' },
  { key: 'hazardous', label: 'Hazardous waste authorisation', short: 'HW authorisation' },
  { key: 'cgwa', label: 'CGWA NOC (groundwater abstraction)', short: 'CGWA NOC' },
]

const STATUS_OPTIONS = [
  { value: 'valid', label: 'Valid' },
  { value: 'expired', label: 'Expired' },
  { value: 'renewal', label: 'Applied for renewal' },
  { value: 'first', label: 'First time applied' },
  { value: 'never', label: 'Never applied' },
]

const statusTone = (status) => {
  if (status === 'valid') return 'comply'
  if (status === 'expired' || status === 'never') return 'non-comply'
  if (status === 'renewal' || status === 'first') return 'warn'
  return 'neutral'
}

const statusLabel = (status) => STATUS_OPTIONS.find((s) => s.value === status)?.label || '—'

export default function ConsentPage() {
  const [consent, set] = useSection('consent')

  const updateRow = (key, field, value) => {
    const row = consent[key] || { applicable: '', status: '', validUpto: '', enclosed: '' }
    set(key, { ...row, [field]: value })
  }

  const issues = ROWS.filter((row) => {
    const value = consent[row.key] || {}
    return value.applicable === 'Yes' && ['expired', 'never', 'renewal', 'first'].includes(value.status)
  })

  return (
    <PageShell sectionKey="consent">
      <Card
        title="Consent / authorisation status"
        description="Verify each clearance, its validity and whether a copy was enclosed with the inspection."
      >
        <TableWrap>
          <table className="tbl hidden md:table">
            <thead>
              <tr>
                <th className="w-[26%]">Clearance</th>
                <th className="w-[13%]">Applicable</th>
                <th className="w-[20%]">Validity status</th>
                <th className="w-[16%]">Valid up to</th>
                <th className="w-[12%]">Copy enclosed</th>
                <th className="w-[13%]">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => {
                const value = consent[row.key] || {}
                return (
                  <tr key={row.key}>
                    <td>
                      <p className="font-semibold text-slate-800">{row.short}</p>
                      <p className="text-[11px] text-slate-500">{row.label}</p>
                    </td>
                    <td>
                      <InlineSelect
                        ariaLabel={`${row.short} applicable`}
                        value={value.applicable}
                        onChange={(v) => updateRow(row.key, 'applicable', v)}
                        options={['Yes', 'No', 'Not applicable']}
                        placeholder="Select"
                      />
                    </td>
                    <td>
                      <InlineSelect
                        ariaLabel={`${row.short} validity`}
                        value={value.status}
                        onChange={(v) => updateRow(row.key, 'status', v)}
                        options={STATUS_OPTIONS}
                        placeholder="Select"
                      />
                      {value.status && (
                        <span className="mt-1 inline-block">
                          <Pill tone={statusTone(value.status)}>{statusLabel(value.status)}</Pill>
                        </span>
                      )}
                    </td>
                    <td>
                      <input
                        type="date"
                        aria-label={`${row.short} valid up to`}
                        className="inp inp-sm"
                        value={value.validUpto || ''}
                        onChange={(e) => updateRow(row.key, 'validUpto', e.target.value)}
                      />
                    </td>
                    <td>
                      <InlineSelect
                        ariaLabel={`${row.short} copy enclosed`}
                        value={value.enclosed}
                        onChange={(v) => updateRow(row.key, 'enclosed', v)}
                        options={['Yes', 'No']}
                        placeholder="Select"
                      />
                    </td>
                    <td>
                      <input
                        aria-label={`${row.short} remarks`}
                        className="inp inp-sm"
                        value={value.remarks || ''}
                        onChange={(e) => updateRow(row.key, 'remarks', e.target.value)}
                        placeholder="Reference"
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div className="space-y-3 md:hidden">
            {ROWS.map((row) => {
              const value = consent[row.key] || {}
              return (
                <div key={row.key} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] font-semibold text-slate-800">{row.short}</p>
                    {value.status && <Pill tone={statusTone(value.status)}>{statusLabel(value.status)}</Pill>}
                  </div>
                  <p className="mb-3 text-[11px] text-slate-500">{row.label}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <YesNo label="Applicable" value={value.applicable} onChange={(v) => updateRow(row.key, 'applicable', v)} />
                    <YesNo label="Copy enclosed" value={value.enclosed} onChange={(v) => updateRow(row.key, 'enclosed', v)} />
                    <div className="col-span-2">
                      <label className="lbl">Validity status</label>
                      <select
                        className="inp inp-sm"
                        value={value.status || ''}
                        onChange={(e) => updateRow(row.key, 'status', e.target.value)}
                      >
                        <option value="">Select…</option>
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <TextField label="Valid up to" type="date" value={value.validUpto} onChange={(v) => updateRow(row.key, 'validUpto', v)} />
                    <TextField label="Remarks" value={value.remarks} onChange={(v) => updateRow(row.key, 'remarks', v)} placeholder="Reference" />
                  </div>
                </div>
              )
            })}
          </div>
        </TableWrap>

        <div className="mt-4 rounded-lg bg-slate-50 p-3 text-[12px] text-slate-600">
          <p className="font-semibold text-slate-700">Validity reference</p>
          <p className="mt-1">
            {issues.length === 0
              ? 'All applicable consents are currently valid and enclosed.'
              : `${issues.length} clearance${issues.length > 1 ? 's' : ''} need attention: ${issues.map((i) => i.short).join(', ')}.`}
          </p>
        </div>
      </Card>

      <Card title="Consent conditions & observations" description="Key conditions that affect water use, effluent and waste handling">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Consented water consumption"
            unit="KLD"
            inputMode="decimal"
            value={consent.consentedWater || ''}
            onChange={(v) => set('consentedWater', v)}
            hint="As per the water consent"
          />
          <TextField
            label="Consented effluent discharge"
            unit="KLD"
            inputMode="decimal"
            value={consent.consentedEffluent || ''}
            onChange={(v) => set('consentedEffluent', v)}
          />
          <TextField label="Last consent inspection date" type="date" value={consent.lastInspected || ''} onChange={(v) => set('lastInspected', v)} />
          <TextField label="Consent issuing authority" value={consent.authority || ''} onChange={(v) => set('authority', v)} placeholder="e.g. HSPCB, Panipat" />
        </div>
        <div className="mt-4 grid gap-4">
          <TextField
            label="Any condition violated? Give details"
            value={consent.violations || ''}
            onChange={(v) => set('violations', v)}
            placeholder="e.g. discharge beyond consented quantity, un-consented outlet"
          />
        </div>
      </Card>

      <p className="px-1 text-[11px] text-slate-500">
        Record consent validity exactly as printed on the consent, and cross-check it against the date of inspection.
      </p>
    </PageShell>
  )
}
