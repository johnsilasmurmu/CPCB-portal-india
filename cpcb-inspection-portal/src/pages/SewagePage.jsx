import React from 'react'
import PageShell, { useSection } from '../components/PageShell'
import {
  Card,
  TextField,
  TextArea,
  SelectField,
  YesNo,
  TableWrap,
  InlineInput,
  CompliancePill,
  Pill,
  ValueField,
} from '../components/ui'
import { SEWAGE_PARAMS, evaluateNormText, fmt, num } from '../lib/calc'

const MODES = ['Public sewer', 'Soak pit / septic tank', 'STP followed by reuse on land', 'Inland surface water', 'CETP', 'Other']

export default function SewagePage() {
  const [sewage, set] = useSection('sewage')
  const character = sewage.characteristics || {}
  const norms = sewage.norms || {}

  const setCharacter = (key, value) => set('characteristics', { ...character, [key]: value })
  const verdicts = SEWAGE_PARAMS.map((param) => evaluateNormText(character[param.key], norms[param.key] ?? param.norm)).filter(Boolean)
  const fails = verdicts.filter((v) => v === 'non-comply').length
  const utilisation =
    num(sewage.capacity) > 0 && num(sewage.generated) >= 0 ? (num(sewage.generated) / num(sewage.capacity)) * 100 : ''

  return (
    <PageShell sectionKey="sewage">
      <Card title="Sewage generation & treatment">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Sewage generated" required unit="KLD" inputMode="decimal" value={sewage.generated} onChange={(v) => set('generated', v)} placeholder="95" />
          <TextField label="Sewage generation basis" value={sewage.basis} onChange={(v) => set('basis', v)} placeholder="Number of employees × 45 lpcd" />
          <SelectField label="STP status" required value={sewage.stpStatus} onChange={(v) => set('stpStatus', v)} options={['Operational', 'Operational but inadequate', 'Under repair', 'Non-operational', 'Not provided']} placeholder="Select status" />
          <TextField label="STP installed capacity" unit="KLD" inputMode="decimal" value={sewage.capacity} onChange={(v) => set('capacity', v)} placeholder="100" />
          <TextField label="Capacity utilised" unit="KLD" inputMode="decimal" value={sewage.utilised} onChange={(v) => set('utilised', v)} placeholder="80" />
          <ValueField label="STP utilisation" value={utilisation === '' || !Number.isFinite(utilisation) ? '' : `${fmt(utilisation, 1)} %`} />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <YesNo label="Sewage flow meter installed" value={sewage.flowmeter} onChange={(v) => set('flowmeter', v)} />
          {sewage.flowmeter === 'Yes' && (
            <TextField label="Totalizer reading" unit="m³" inputMode="decimal" value={sewage.flowmeterReading} onChange={(v) => set('flowmeterReading', v)} />
          )}
          <SelectField label="Mode of sewage discharge" required value={sewage.modeOfDischarge} onChange={(v) => set('modeOfDischarge', v)} options={MODES} placeholder="Select mode" />
          <TextField label="STP technology" value={sewage.technology} onChange={(v) => set('technology', v)} placeholder="MBBR / SBR / extended aeration" />
        </div>
      </Card>

      <Card title="Treated sewage characteristics" description="Results compared with the general standards for discharge">
        <TableWrap>
          <table className="tbl">
            <thead>
              <tr>
                <th className="w-[36%]">Parameter</th>
                <th className="w-[20%]">Inlet</th>
                <th className="w-[20%]">Outlet</th>
                <th className="w-[14%]">Norm</th>
                <th className="w-[10%]">Status</th>
              </tr>
            </thead>
            <tbody>
              {SEWAGE_PARAMS.map((param) => {
                const row = character[param.key] || {}
                const norm = norms[param.key] ?? param.norm
                return (
                  <tr key={param.key}>
                    <td>
                      <p className="font-medium text-slate-800">{param.label}</p>
                      <p className="text-[11px] text-slate-500">{param.unit}</p>
                    </td>
                    <td>
                      <InlineInput ariaLabel={`${param.label} inlet`} inputMode="decimal" value={row.inlet} onChange={(v) => setCharacter(param.key, { ...row, inlet: v })} />
                    </td>
                    <td>
                      <InlineInput ariaLabel={`${param.label} outlet`} inputMode="decimal" value={row.outlet} onChange={(v) => setCharacter(param.key, { ...row, outlet: v })} />
                    </td>
                    <td>
                      <input
                        aria-label={`${param.label} norm`}
                        className="inp inp-sm w-full min-w-[70px]"
                        value={norm ?? ''}
                        onChange={(e) => set('norms', { ...norms, [param.key]: e.target.value })}
                      />
                    </td>
                    <td><CompliancePill status={evaluateNormText(row.outlet, norm)} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </TableWrap>
        <div className="mt-3">
          <Pill tone={fails > 0 ? 'non-comply' : verdicts.length ? 'comply' : 'neutral'}>
            {fails > 0 ? `${fails} parameter${fails > 1 ? 's' : ''} above norm` : verdicts.length ? 'Treated sewage within norms' : 'Awaiting analysis'}
          </Pill>
        </div>
      </Card>

      <Card title="Observations">
        <TextArea label="Sewage / STP remarks" rows={3} value={sewage.remarks} onChange={(v) => set('remarks', v)} placeholder="STP not operated, sludge not disposed, reuse arrangement, mixing with effluent stream" />
      </Card>
    </PageShell>
  )
}
