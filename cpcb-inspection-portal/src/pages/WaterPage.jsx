import React from 'react'
import PageShell, { useSection } from '../components/PageShell'
import {
  Card,
  TextField,
  TextArea,
  AddRowButton,
  DeleteRowButton,
  TableWrap,
  InlineInput,
  InlineSelect,
  ValueField,
  EmptyState,
  YesNo,
  Pill,
} from '../components/ui'
import { useApp } from '../state/AppState'
import { bodLoad, fmt, klPerMt, kldFromSources, num, round, waterBalance } from '../lib/calc'
import { uid } from '../lib/defaults'

const SOURCE_TYPES = ['River / canal', 'Borewell', 'Municipal supply', 'Tanker', 'Open well', 'Other']
const METER_TYPES = ['Electromagnetic', 'Ultrasonic', 'Turbine', 'Mechanical', 'Other']

export default function WaterPage() {
  const [water, set] = useSection('water')
  const { current } = useApp()
  const sources = water.sources || []
  const cgwa = water.cgwa || {}
  const consumption = water.consumption || {}

  const sourcedKld = kldFromSources(sources)
  const totalKld =
    (num(consumption.production) || 0) + (num(consumption.domestic) || 0) + (num(consumption.others) || 0)
  const tonnes =
    num(water.productionTonnesPerDay) ||
    (num(current?.data?.production?.installedCapacity) || 0) / 1000
  const klPerTonne = klPerMt(totalKld, tonnes)

  const effluent = current?.data?.effluent || {}
  const sewage = current?.data?.sewage || {}
  const balance = waterBalance({
    freshwater: totalKld,
    recycled: consumption.recycled,
    effluent: effluent.generated,
    sewage: sewage.generated,
  })

  const updateSource = (id, field, value) =>
    set('sources', sources.map((source) => (source.id === id ? { ...source, [field]: value } : source)))

  const addSource = () =>
    set('sources', [
      ...sources,
      { id: uid(), name: 'Borewell', quantity: '', flowmeter: '', meterType: '', calibration: '', instant: '', totalizer: '', logbook: '' },
    ])

  const removeSource = (id) => set('sources', sources.filter((source) => source.id !== id))

  return (
    <PageShell sectionKey="water">
      <Card
        title="Freshwater sources"
        description="Each intake with its flow meter, calibration and logbook status"
        actions={<AddRowButton label="Add source" onClick={addSource} />}
      >
        {sources.length === 0 ? (
          <EmptyState title="No freshwater source recorded" description="Add borewells, municipal connections, tankers or surface water intakes." />
        ) : (
          <div className="space-y-3">
            {sources.map((source, index) => (
              <div key={source.id} className="rounded-lg border border-slate-200 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">Source {index + 1}</p>
                  <DeleteRowButton onClick={() => removeSource(source.id)} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <InlineSelect ariaLabel="Source type" value={source.name} onChange={(v) => updateSource(source.id, 'name', v)} options={SOURCE_TYPES} placeholder="Source type" />
                  <div>
                    <label className="lbl">Quantity (KLD)</label>
                    <InlineInput ariaLabel="Source quantity" inputMode="decimal" value={source.quantity} onChange={(v) => updateSource(source.id, 'quantity', v)} placeholder="1200" />
                  </div>
                  <div className="sm:col-span-2">
                    <YesNo label="Flow meter installed" value={source.flowmeter} onChange={(v) => updateSource(source.id, 'flowmeter', v)} />
                  </div>
                  {source.flowmeter === 'Yes' && (
                    <>
                      <InlineSelect ariaLabel="Meter type" value={source.meterType} onChange={(v) => updateSource(source.id, 'meterType', v)} options={METER_TYPES} placeholder="Meter type" />
                      <div>
                        <label className="lbl">Last calibration</label>
                        <input type="date" className="inp inp-sm" value={source.calibration || ''} onChange={(e) => updateSource(source.id, 'calibration', e.target.value)} aria-label="Last calibration" />
                      </div>
                      <div>
                        <label className="lbl">Instantaneous (m³/h)</label>
                        <InlineInput ariaLabel="Instantaneous reading" inputMode="decimal" value={source.instant} onChange={(v) => updateSource(source.id, 'instant', v)} />
                      </div>
                      <div>
                        <label className="lbl">Totalizer (m³)</label>
                        <InlineInput ariaLabel="Totalizer reading" inputMode="decimal" value={source.totalizer} onChange={(v) => updateSource(source.id, 'totalizer', v)} />
                      </div>
                      <div className="sm:col-span-2">
                        <YesNo label="Logbook maintained" value={source.logbook} onChange={(v) => updateSource(source.id, 'logbook', v)} />
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <ValueField label="Total from sources" value={fmt(sourcedKld, 2)} unit="KLD" />
          <ValueField label="Total as per consumption table" value={fmt(totalKld, 2)} unit="KLD" hint="Production + domestic + others" />
          <ValueField label="Difference" value={fmt((num(totalKld) || 0) - (num(sourcedKld) || 0), 2)} unit="KLD" />
        </div>
        {Math.abs((num(totalKld) || 0) - (num(sourcedKld) || 0)) > 5 && sourcedKld !== 0 && (
          <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
            Source quantities and the consumption table differ by more than 5 KLD — reconcile with the flow meter readings.
          </p>
        )}
        <div className="mt-4">
          <TextArea label="Flow meter / logbook remarks" rows={2} value={water.meterRemarks} onChange={(v) => set('meterRemarks', v)} placeholder="Meters not calibrated, bypass observed, logbook entries missing …" />
        </div>
      </Card>

      <Card title="CGWA / groundwater abstraction">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Number of borewells" required unit="nos." inputMode="numeric" value={cgwa.borewells} onChange={(v) => set('cgwa', { ...cgwa, borewells: v })} placeholder="3" />
          <TextField label="Permitted withdrawal" required unit="KLD" inputMode="decimal" value={cgwa.permitted} onChange={(v) => set('cgwa', { ...cgwa, permitted: v })} placeholder="1200" />
          <TextField label="NOC number" value={cgwa.nocNumber} onChange={(v) => set('cgwa', { ...cgwa, nocNumber: v })} placeholder="CGWA/NOC/HR/2019/1187" />
          <TextField label="NOC valid up to" type="date" value={cgwa.nocValidUpto} onChange={(v) => set('cgwa', { ...cgwa, nocValidUpto: v })} />
        </div>
        {num(cgwa.permitted) > 0 && totalKld > 0 && (
          <p className="mt-3 text-[12px]">
            {totalKld > num(cgwa.permitted) ? (
              <Pill tone="non-comply">
                Freshwater use ({fmt(totalKld, 0)} KLD) exceeds CGWA permitted withdrawal ({fmt(cgwa.permitted, 0)} KLD)
              </Pill>
            ) : (
              <Pill tone="comply">Freshwater use within CGWA permitted withdrawal</Pill>
            )}
          </p>
        )}
      </Card>

      <Card title="Freshwater consumption" description="Auto-calculated KLD and KL per tonne of production">
        <TableWrap>
          <table className="tbl">
            <thead>
              <tr>
                <th>Use</th>
                <th className="w-36">Quantity (KLD)</th>
                <th className="w-36">Share</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['production', 'Production / process'],
                ['domestic', 'Domestic (canteen, toilets, drinking)'],
                ['others', 'Others (gardening, washing, cooling make-up)'],
                ['recycled', 'Recycled / reuse within the unit'],
              ].map(([key, label]) => {
                const value = num(consumption[key]) || 0
                const share = totalKld > 0 && key !== 'recycled' ? round((value / totalKld) * 100, 1) : ''
                return (
                  <tr key={key}>
                    <td>{label}</td>
                    <td>
                      <InlineInput ariaLabel={label} inputMode="decimal" value={consumption[key]} onChange={(v) => set('consumption', { ...consumption, [key]: v })} placeholder="0" />
                    </td>
                    <td className="text-slate-600">{key === 'recycled' ? '—' : share === '' ? '—' : `${fmt(share, 1)} %`}</td>
                  </tr>
                )
              })}
              <tr className="bg-slate-50 font-semibold">
                <td>Total freshwater (production + domestic + others)</td>
                <td className="text-gov-green-700">{fmt(totalKld, 2)} KLD</td>
                <td>100 %</td>
              </tr>
            </tbody>
          </table>
        </TableWrap>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <TextField
            label="Production"
            unit="tonnes/day"
            inputMode="decimal"
            value={water.productionTonnesPerDay}
            onChange={(v) => set('productionTonnesPerDay', v)}
            hint={tonnes ? `Defaults to ${fmt(tonnes, 2)} t/d from Section C` : 'Enter production for KL/MT'}
          />
          <ValueField label="Specific freshwater consumption" value={klPerTonne === '' ? '' : fmt(klPerTonne, 3)} unit="KL/MT" />
          <ValueField label="Recycled water share" value={totalKld > 0 ? `${fmt(((num(consumption.recycled) || 0) / (totalKld + (num(consumption.recycled) || 0))) * 100, 1)} %` : ''} unit="of total use" />
        </div>
      </Card>

      <Card title="Water balance check" description="Freshwater + recycled should broadly match effluent + sewage generated">
        <div className="grid gap-3 sm:grid-cols-3">
          <ValueField label="Freshwater + recycled" value={fmt((num(totalKld) || 0) + (num(consumption.recycled) || 0), 2)} unit="KLD" />
          <ValueField label="Effluent + sewage" value={fmt((num(effluent.generated) || 0) + (num(sewage.generated) || 0), 2)} unit="KLD" />
          <ValueField label="Unaccounted" value={fmt(balance.difference, 2)} unit="KLD" />
        </div>
        <p className="mt-3">
          {balance.within ? (
            <Pill tone="comply">Water balance within ±10 %</Pill>
          ) : (
            <Pill tone="warn">Water balance differs by more than 10 % — verify metering and un-accounted consumption</Pill>
          )}
        </p>
        <p className="mt-2 text-[11px] text-slate-500">
          Effluent and sewage figures are taken from Sections E and F. BOD load at the effluent outlet: {fmt(bodLoad(effluent.discharge || effluent.generated, effluent.characteristics?.bod?.outlet), 1)} kg/day.
        </p>
      </Card>
    </PageShell>
  )
}
