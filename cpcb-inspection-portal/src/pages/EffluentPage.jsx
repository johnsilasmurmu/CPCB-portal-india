import React from 'react'
import PageShell, { useSection } from '../components/PageShell'
import {
  Card,
  TextField,
  TextArea,
  RadioGroup,
  YesNo,
  FileField,
  TableWrap,
  InlineInput,
  ValueField,
  Pill,
  CompliancePill,
  SelectField,
} from '../components/ui'
import { EFFLUENT_PARAMS, IS10500, bodLoad, evaluateNormText, fmt, num, round } from '../lib/calc'

const DISCHARGE_MODES = ['Public sewer', 'Inland surface water', 'Land for irrigation', 'Marine coastal', 'Common effluent treatment plant (CETP)', 'Zero liquid discharge', 'Other']
const ZLD_OPTIONS = ['Yes — ZLD achieved', 'Partial — high TDS stream only', 'No']

export default function EffluentPage() {
  const [effluent, set, patch] = useSection('effluent')
  const character = effluent.characteristics || {}
  const norms = effluent.norms || {}
  const groundwater = effluent.groundwater || { values: {} }
  const bypass = effluent.bypass || {}
  const drain = effluent.drain || { upstream: {}, downstream: {} }

  const generated = num(effluent.generated)
  const recycled = num(effluent.recycled) || 0
  const discharge = Number.isFinite(generated) ? round(generated - recycled, 2) : ''

  const yamuna = effluent.yamunaApplicable === 'Yes'
  const params = EFFLUENT_PARAMS.filter((param) => !param.yamuna || yamuna)

  const setCharacter = (key, field, value) => {
    const row = character[key] || {}
    patch({ characteristics: { ...character, [key]: { ...row, [field]: value } } })
  }

  const setNorm = (key, value) => patch({ norms: { ...norms, [key]: value } })

  const setGround = (key, value) => patch({ groundwater: { ...groundwater, values: { ...(groundwater.values || {}), [key]: value } } })

  const verdicts = params
    .map((param) => evaluateNormText(character[param.key]?.outlet, norms[param.key] ?? param.norm))
    .filter(Boolean)
  const complyCount = verdicts.filter((v) => v === 'comply').length
  const failCount = verdicts.filter((v) => v === 'non-comply').length

  const gwVerdict = (param, value) => {
    const n = num(value)
    if (!Number.isFinite(n) || value === '') return null
    if (Number.isFinite(param.min) && Number.isFinite(param.max)) {
      return n >= param.min && n <= param.max ? 'comply' : 'non-comply'
    }
    const acc = num(param.acceptable)
    const perm = String(param.permissible).toLowerCase().includes('no') ? acc : num(param.permissible)
    if (Number.isFinite(acc) && n <= acc) return 'comply'
    if (Number.isFinite(perm) && n <= perm) return 'warn'
    return 'non-comply'
  }

  const bod = bodLoad(discharge === '' ? effluent.generated : discharge, character.bod?.outlet)
  const perTonne = bod !== '' && num(effluent.productionTonnes) > 0 ? round(bod / num(effluent.productionTonnes), 3) : ''

  return (
    <PageShell sectionKey="effluent">
      <Card title="Generation & discharge" description="Effluent generated, treated and finally discharged">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextArea className="sm:col-span-2" label="Effluent sources" rows={2} value={effluent.sources} onChange={(v) => set('sources', v)} placeholder="Dyeing, printing, washing, boiler blow-down, cooling tower bleed …" />
          <TextField label="Quantity generated (as reported)" unit="KLD" inputMode="decimal" value={effluent.quantity} onChange={(v) => set('quantity', v)} placeholder="1050" />
          <SelectField
            label="ETP status"
            value={effluent.etpStatus}
            onChange={(v) => set('etpStatus', v)}
            options={['Operational', 'Operational but inadequate', 'Under repair', 'Non-operational', 'Not provided']}
            placeholder="Select status"
          />
          <TextField label="Effluent generated" unit="KLD" inputMode="decimal" value={effluent.generated} onChange={(v) => set('generated', v)} placeholder="1050" />
          <TextField label="Effluent recycled / reused" unit="KLD" inputMode="decimal" value={effluent.recycled} onChange={(v) => set('recycled', v)} placeholder="210" />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <ValueField label="Finally discharged (auto)" value={discharge === '' ? '' : fmt(discharge, 2)} unit="KLD" />
          <ValueField label="Recycling ratio" value={Number.isFinite(generated) && generated > 0 ? `${fmt((recycled / generated) * 100, 1)} %` : ''} />
          <ValueField label="Discharge per tonne" value={Number.isFinite(generated) && num(effluent.productionTonnes) > 0 ? fmt((discharge || generated) / num(effluent.productionTonnes), 2) : ''} unit="KL/MT" />
        </div>
        <div className="mt-4">
          <TextField label="Production for unit load (from Section C)" unit="tonnes/day" inputMode="decimal" value={effluent.productionTonnes} onChange={(v) => set('productionTonnes', v)} placeholder="17.2" />
        </div>
      </Card>

      <Card title="Flow meters & outlets">
        <div className="grid gap-4 sm:grid-cols-2">
          <YesNo label="Effluent flow meter installed" value={effluent.flowmeterInstalled} onChange={(v) => set('flowmeterInstalled', v)} />
          {effluent.flowmeterInstalled === 'Yes' && (
            <>
              <TextField label="Meter type" value={effluent.flowmeterType} onChange={(v) => set('flowmeterType', v)} placeholder="Electromagnetic" />
              <TextField label="Last calibration" type="date" value={effluent.flowmeterCalibration} onChange={(v) => set('flowmeterCalibration', v)} />
              <TextField label="Instantaneous reading" unit="m³/h" inputMode="decimal" value={effluent.flowmeterInstant} onChange={(v) => set('flowmeterInstant', v)} />
              <TextField label="Totalizer reading" unit="m³" inputMode="decimal" value={effluent.flowmeterTotalizer} onChange={(v) => set('flowmeterTotalizer', v)} />
              <YesNo label="Meter connected to OCEMS / server" value={effluent.flowmeterOcems} onChange={(v) => set('flowmeterOcems', v)} />
            </>
          )}
          <TextField label="Consented outlets" unit="nos." inputMode="numeric" value={effluent.outlets?.consented} onChange={(v) => set('outlets', { ...(effluent.outlets || {}), consented: v })} />
          <TextField label="Outlets observed on site" unit="nos." inputMode="numeric" value={effluent.outlets?.observed} onChange={(v) => set('outlets', { ...(effluent.outlets || {}), observed: v })} />
        </div>

        {num(effluent.outlets?.observed) > num(effluent.outlets?.consented) && (
          <div className="mt-3 rounded-lg border border-red-300 bg-red-50 p-3 text-[13px] text-red-800">
            <p className="font-semibold">Un-consented outlet observed</p>
            <p className="mt-1">
              {num(effluent.outlets?.observed)} outlets were observed against {num(effluent.outlets?.consented) || 0} consented. Record the outlet
              details, collect a sample and inform the SPCB / CPCB regional office.
            </p>
          </div>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <SelectField label="Mode of discharge" required value={effluent.modeOfDischarge} onChange={(v) => set('modeOfDischarge', v)} options={DISCHARGE_MODES} placeholder="Select mode" />
          <TextField label="Receiving body / drain" required value={effluent.receivingBody} onChange={(v) => set('receivingBody', v)} placeholder="Municipal drain leading to river Yamuna" />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <RadioGroup label="Does the discharge route reach river Ganga / Yamuna?" value={effluent.gangaRoute} onChange={(v) => set('gangaRoute', v)} options={['Yes', 'No', 'Not known']} columns="grid-cols-3" />
          <RadioGroup label="ZLD status" value={effluent.zld} onChange={(v) => set('zld', v)} options={ZLD_OPTIONS} columns="grid-cols-1" />
        </div>
      </Card>

      <Card title="Bypass / un-treated discharge check" description="Physically verify that no untreated effluent can bypass the ETP">
        <YesNo label="Was any bypass / un-treated discharge observed?" required value={bypass.observed} onChange={(v) => set('bypass', { ...bypass, observed: v })} />
        {bypass.observed === 'Yes' && (
          <div className="mt-3 rounded-lg border-2 border-red-400 bg-red-50 p-3">
            <p className="text-sm font-bold text-red-800">⚠ Bypass detected — mandatory action</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[13px] text-red-800">
              <li>Photograph the bypass line / discharge point with GPS and time stamp.</li>
              <li>Collect a grab sample from the bypass and get it analysed for the consented parameters.</li>
              <li>Inform the SPCB regional office and CPCB immediately, and record the intimation reference.</li>
            </ul>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <FileField label="Bypass photograph" required accept="image/*" fileName={bypass.photo} onChange={(file) => set('bypass', { ...bypass, photo: file ? file.name : '' })} hint="Attach the field photograph (also add it under Photographs)" />
              <YesNo label="Sample collected" value={bypass.sample} onChange={(v) => set('bypass', { ...bypass, sample: v })} />
              <YesNo label="SPCB / CPCB informed" value={bypass.informed} onChange={(v) => set('bypass', { ...bypass, informed: v })} />
              <TextField label="Intimation reference" value={bypass.remarks} onChange={(v) => set('bypass', { ...bypass, remarks: v })} placeholder="e-mail / letter reference with date" />
            </div>
          </div>
        )}
        {bypass.observed === 'No' && (
          <div className="mt-3">
            <TextField label="Bypass check remarks" value={bypass.remarks} onChange={(v) => set('bypass', { ...bypass, remarks: v })} placeholder="Bypass line sealed / not provided; valves tagged" />
          </div>
        )}
      </Card>

      <Card
        title="Effluent characteristics"
        description="Analysis results for ETP inlet and final outlet. Norms may be overridden as per the consent."
      >
        <div className="mb-4">
          <RadioGroup
            label="Discharge reaches river Ganga / Yamuna basin?"
            value={effluent.yamunaApplicable}
            onChange={(v) => set('yamunaApplicable', v)}
            options={['Yes', 'No']}
            columns="grid-cols-2"
            hint="Yamuna-specific parameters (Cr, sulphide, phenols, SAR, NH₃-N) appear when Yes is selected."
          />
        </div>

        <TableWrap>
          <table className="tbl">
            <thead>
              <tr>
                <th className="w-[34%]">Parameter</th>
                <th className="w-[18%]">ETP inlet</th>
                <th className="w-[18%]">ETP outlet</th>
                <th className="w-[16%]">Norm</th>
                <th className="w-[14%]">Status</th>
              </tr>
            </thead>
            <tbody>
              {params.map((param) => {
                const row = character[param.key] || {}
                const norm = norms[param.key] ?? param.norm
                return (
                  <tr key={param.key}>
                    <td>
                      <p className="font-medium text-slate-800">{param.label}</p>
                      <p className="text-[11px] text-slate-500">{param.unit || '—'}</p>
                    </td>
                    <td>
                      <InlineInput ariaLabel={`${param.label} inlet`} inputMode="decimal" value={row.inlet} onChange={(v) => setCharacter(param.key, 'inlet', v)} placeholder="—" />
                    </td>
                    <td>
                      <InlineInput ariaLabel={`${param.label} outlet`} inputMode="decimal" value={row.outlet} onChange={(v) => setCharacter(param.key, 'outlet', v)} placeholder="—" />
                    </td>
                    <td>
                      <input aria-label={`${param.label} norm`} className="inp inp-sm w-full min-w-[70px]" value={norm ?? ''} onChange={(e) => setNorm(param.key, e.target.value)} />
                    </td>
                    <td>
                      <CompliancePill status={evaluateNormText(row.outlet, norm)} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </TableWrap>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Pill tone={failCount > 0 ? 'non-comply' : complyCount > 0 ? 'comply' : 'neutral'}>
            {failCount > 0 ? `Non-compliant — ${failCount} parameter${failCount > 1 ? 's' : ''} above norm` : complyCount > 0 ? `Compliant — ${complyCount} parameters within norm` : 'Awaiting outlet results'}
          </Pill>
          <span className="text-[12px] text-slate-500">Compliance is evaluated automatically against the norm column.</span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <ValueField label="BOD load (outlet)" value={bod === '' ? '' : fmt(bod, 2)} unit="kg/day" hint={`Discharge ${fmt(discharge === '' ? effluent.generated : discharge, 1)} KLD × BOD ${character.bod?.outlet || '—'} mg/L ÷ 1000`} />
          <ValueField label="BOD load per tonne" value={perTonne === '' ? '' : fmt(perTonne, 3)} unit="kg/tonne" />
          <ValueField label="COD / BOD ratio" value={num(character.bod?.outlet) > 0 ? fmt(num(character.cod?.outlet) / num(character.bod?.outlet), 1) : ''} hint="Indicates biodegradability of the effluent" />
        </div>
      </Card>

      <Card title="Groundwater quality report" description="Compared with IS 10500:2012 drinking water specification">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Analysing laboratory" value={groundwater.lab} onChange={(v) => patch({ groundwater: { ...groundwater, lab: v } })} placeholder="NABL-accredited laboratory name" />
          <TextField label="Sample collected on" type="date" value={groundwater.sampledOn} onChange={(v) => patch({ groundwater: { ...groundwater, sampledOn: v } })} />
        </div>
        <TableWrap className="mt-4">
          <table className="tbl">
            <thead>
              <tr>
                <th>Parameter</th>
                <th className="w-28">Result</th>
                <th className="w-24">Unit</th>
                <th className="w-32">Acceptable limit</th>
                <th className="w-32">Permissible limit</th>
                <th className="w-28">Status</th>
              </tr>
            </thead>
            <tbody>
              {IS10500.map((param) => {
                const value = groundwater.values?.[param.key]
                const verdict = gwVerdict(param, value)
                return (
                  <tr key={param.key}>
                    <td className="font-medium text-slate-800">{param.label}</td>
                    <td>
                      <InlineInput ariaLabel={`${param.label} groundwater`} inputMode="decimal" value={value} onChange={(v) => setGround(param.key, v)} placeholder="—" />
                    </td>
                    <td className="text-slate-500">{param.unit || '—'}</td>
                    <td className="text-slate-600">{param.acceptable}</td>
                    <td className="text-slate-600">{param.permissible}</td>
                    <td>
                      {verdict === 'comply' && <CompliancePill status="comply" />}
                      {verdict === 'warn' && <Pill tone="warn">Within permissible</Pill>}
                      {verdict === 'non-comply' && <CompliancePill status="non-comply" />}
                      {!verdict && <span className="text-xs text-slate-400">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </TableWrap>
        <div className="mt-4">
          <TextArea label="Groundwater remarks" rows={2} value={effluent.groundwaterRemarks} onChange={(v) => set('groundwaterRemarks', v)} placeholder="Any contamination observed near the ETP / ash / sludge storage area" />
        </div>
      </Card>

      <Card title="Recipient drain — upstream & downstream" description="Sample the drain above and below the discharge point">
        <TableWrap>
          <table className="tbl">
            <thead>
              <tr>
                <th>Parameter</th>
                <th className="w-32">Upstream</th>
                <th className="w-32">Downstream</th>
                <th className="w-28">Difference</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['ph', 'pH'],
                ['bod', 'BOD (mg/L)'],
                ['cod', 'COD (mg/L)'],
                ['tss', 'TSS (mg/L)'],
              ].map(([key, label]) => {
                const up = num(drain.upstream?.[key])
                const down = num(drain.downstream?.[key])
                return (
                  <tr key={key}>
                    <td>{label}</td>
                    <td>
                      <InlineInput
                        ariaLabel={`${label} upstream`}
                        inputMode="decimal"
                        value={drain.upstream?.[key]}
                        onChange={(v) => set('drain', { ...drain, upstream: { ...(drain.upstream || {}), [key]: v } })}
                      />
                    </td>
                    <td>
                      <InlineInput
                        ariaLabel={`${label} downstream`}
                        inputMode="decimal"
                        value={drain.downstream?.[key]}
                        onChange={(v) => set('drain', { ...drain, downstream: { ...(drain.downstream || {}), [key]: v } })}
                      />
                    </td>
                    <td className="font-medium text-slate-700">{Number.isFinite(up) && Number.isFinite(down) ? fmt(down - up, 2) : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </TableWrap>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <TextField label="Upstream sampling point" value={effluent.drainUpstreamPoint} onChange={(v) => set('drainUpstreamPoint', v)} placeholder="100 m upstream of outlet" />
          <TextField label="Downstream sampling point" value={effluent.drainDownstreamPoint} onChange={(v) => set('drainDownstreamPoint', v)} placeholder="200 m downstream of outlet" />
        </div>
        <div className="mt-4">
          <TextArea label="Observations on the recipient drain" rows={2} value={effluent.drainRemarks} onChange={(v) => set('drainRemarks', v)} placeholder="Colour, odour, floating matter, impact on nearby users" />
        </div>
      </Card>
    </PageShell>
  )
}
