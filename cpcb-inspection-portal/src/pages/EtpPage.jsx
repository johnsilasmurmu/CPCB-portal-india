import React from 'react'
import PageShell, { useSection } from '../components/PageShell'
import {
  Card,
  TextField,
  TextArea,
  SelectField,
  AddRowButton,
  DeleteRowButton,
  TableWrap,
  InlineInput,
  InlineSelect,
  ValueField,
  EmptyState,
  Pill,
  YesNo,
} from '../components/ui'
import { fmt, num, retentionHours, round } from '../lib/calc'
import { uid } from '../lib/defaults'

const ADEQUACY = ['Adequate', 'Inadequate', 'Partially adequate', 'Not in use']

export default function EtpPage() {
  const [etp, set] = useSection('etp')
  const units = etp.units || []
  const flowKld = num(etp.utilisedCapacity) || 0
  const flowM3Hr = flowKld / 24
  const utilisation = num(etp.installedCapacity) > 0 ? round((flowKld / num(etp.installedCapacity)) * 100, 1) : ''

  const updateUnit = (id, field, value) => set('units', units.map((unit) => (unit.id === id ? { ...unit, [field]: value } : unit)))
  const addUnit = () => set('units', [...units, { id: uid(), name: '', dimension: '', capacity: '', adequacy: '' }])
  const removeUnit = (id) => set('units', units.filter((unit) => unit.id !== id))

  const totalCapacity = units.reduce((sum, unit) => sum + (num(unit.capacity) || 0), 0)

  return (
    <PageShell sectionKey="etp">
      <Card title="ETP overview">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="ETP status"
            required
            value={etp.status}
            onChange={(v) => set('status', v)}
            options={['Operational', 'Operational but inadequate', 'Under repair / upgrading', 'Non-operational', 'Not provided']}
            placeholder="Select status"
          />
          <TextField label="Treatment technology" required value={etp.technology} onChange={(v) => set('technology', v)} placeholder="Primary + biological (extended aeration) + tertiary" />
          <TextField label="Installed capacity" required unit="KLD" inputMode="decimal" value={etp.installedCapacity} onChange={(v) => set('installedCapacity', v)} placeholder="1200" />
          <TextField label="Capacity utilised" unit="KLD" inputMode="decimal" value={etp.utilisedCapacity} onChange={(v) => set('utilisedCapacity', v)} placeholder="1050" />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <ValueField label="Utilisation" value={utilisation === '' ? '' : `${fmt(utilisation, 1)} %`} />
          <ValueField label="Design flow" value={flowKld ? fmt(flowKld, 1) : ''} unit="KLD" />
          <ValueField label="Equivalent hourly flow" value={flowM3Hr ? fmt(flowM3Hr, 2) : ''} unit="m³/h" hint="Used for retention time" />
        </div>
        {utilisation !== '' && utilisation > 100 && (
          <p className="mt-3"><Pill tone="non-comply">Hydraulic load exceeds installed capacity — bypass / short-circuiting risk</Pill></p>
        )}
      </Card>

      <Card
        title="ETP units"
        description="Unit-wise dimensions, volume and auto-calculated retention time at the observed flow"
        actions={<AddRowButton label="Add unit" onClick={addUnit} />}
      >
        {units.length === 0 ? (
          <EmptyState title="No ETP units recorded" description="Add screens, equalisation, aeration, clarifier, filters and sludge handling units." />
        ) : (
          <TableWrap>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Unit</th>
                  <th className="w-40">Dimension</th>
                  <th className="w-28">Volume (m³)</th>
                  <th className="w-28">Retention (h)</th>
                  <th className="w-36">Adequacy</th>
                  <th className="w-16" />
                </tr>
              </thead>
              <tbody>
                {units.map((unit) => {
                  const retention = retentionHours(unit.capacity, flowM3Hr)
                  return (
                    <tr key={unit.id}>
                      <td><InlineInput ariaLabel="ETP unit name" value={unit.name} onChange={(v) => updateUnit(unit.id, 'name', v)} placeholder="Aeration tank" /></td>
                      <td><InlineInput ariaLabel="ETP unit dimension" value={unit.dimension} onChange={(v) => updateUnit(unit.id, 'dimension', v)} placeholder="18 × 10 × 4 m" /></td>
                      <td><InlineInput ariaLabel="ETP unit volume" inputMode="decimal" value={unit.capacity} onChange={(v) => updateUnit(unit.id, 'capacity', v)} placeholder="720" /></td>
                      <td className="font-semibold text-gov-green-700">{retention === '' ? '—' : fmt(retention, 2)}</td>
                      <td><InlineSelect ariaLabel="ETP unit adequacy" value={unit.adequacy} onChange={(v) => updateUnit(unit.id, 'adequacy', v)} options={ADEQUACY} placeholder="Select" /></td>
                      <td><DeleteRowButton onClick={() => removeUnit(unit.id)} /></td>
                    </tr>
                  )
                })}
                <tr className="bg-slate-50 font-semibold">
                  <td>Total volume of units listed</td>
                  <td />
                  <td>{totalCapacity ? fmt(totalCapacity, 1) : '—'}</td>
                  <td colSpan={3}>
                    {flowM3Hr ? `${fmt(totalCapacity / flowM3Hr, 2)} h overall` : 'Enter flow to compute'}
                  </td>
                </tr>
              </tbody>
            </table>
          </TableWrap>
        )}
        {flowM3Hr === 0 && (
          <p className="mt-3 text-[12px] text-amber-700">Enter the utilised capacity above to auto-calculate retention time for each unit.</p>
        )}
      </Card>

      <Card title="Aeration, sludge & operation">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Aerators" value={etp.aerators} onChange={(v) => set('aerators', v)} placeholder="4 nos. surface aerators, 15 HP each" />
          <TextField label="Blowers" value={etp.blower} onChange={(v) => set('blower', v)} placeholder="2 nos. (1 working + 1 standby), 25 HP" />
          <YesNo label="Sludge drying beds provided" value={etp.sludgeBeds} onChange={(v) => set('sludgeBeds', v)} />
          <TextField label="Energy consumption" value={etp.energy} onChange={(v) => set('energy', v)} placeholder="38,000 kWh / month" />
        </div>
        <div className="mt-4 grid gap-4">
          <TextArea label="Sludge management" rows={2} value={etp.sludgeManagement} onChange={(v) => set('sludgeManagement', v)} placeholder="Dewatering, drying, storage and disposal route (TSDF / co-processing / CHWTSDF)" />
          <TextArea label="Chemicals used in ETP" rows={2} value={etp.chemicals} onChange={(v) => set('chemicals', v)} placeholder="Alum, polyelectrolyte, lime, decolourising agent with dosing rates" />
        </div>
      </Card>

      <Card title="Laboratory & manpower">
        <div className="grid gap-4 sm:grid-cols-2">
          <YesNo label="In-house laboratory available" value={etp.labAvailable} onChange={(v) => set('labAvailable', v)} />
          <TextField label="Parameters analysed in-house" value={etp.labFacility} onChange={(v) => set('labFacility', v)} placeholder="pH, BOD, COD, TSS, TDS" />
          <TextField label="Manpower" value={etp.staff} onChange={(v) => set('staff', v)} placeholder="1 chemist and 3 operators per shift" />
          <TextField label="Last analysis date" type="date" value={etp.lastAnalysis} onChange={(v) => set('lastAnalysis', v)} />
        </div>
        <div className="mt-4">
          <TextArea label="ETP observations" rows={3} value={etp.remarks} onChange={(v) => set('remarks', v)} placeholder="Condition of units, short-circuiting, overflowing tanks, un-authorised bypass, housekeeping" />
        </div>
      </Card>
    </PageShell>
  )
}
