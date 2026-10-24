import React, { useState } from 'react'
import PageShell, { useSection } from '../components/PageShell'
import {
  Card,
  TextField,
  TextArea,
  RadioGroup,
  CheckGroup,
  AddRowButton,
  DeleteRowButton,
  TableWrap,
  InlineInput,
  ValueField,
  EmptyState,
} from '../components/ui'
import { gsm, num, round, fmt } from '../lib/calc'
import { uid } from '../lib/defaults'

const NATURE_OPTIONS = ['Natural fibre', 'Synthetic fibre', 'Blend (natural + synthetic)']
const PROCESS_OPTIONS = ['Pre-treatment', 'Dyeing', 'Printing', 'Finishing', 'Garment washing']
const MODE_OPTIONS = ['Batch', 'Continuous', 'Semi-continuous']

export default function ProductionPage() {
  const [production, set] = useSection('production')
  const [gsmInput, setGsmInput] = useState({ weight: '', length: '', width: '' })
  const [gsmSaved, setGsmSaved] = useState(null)

  const capacity = production.capacity || {}
  const machines = production.machines || []
  const chemicals = production.chemicals || []
  const dyes = production.dyes || []

  const updateList = (listName, id, field, value) => {
    const list = (production[listName] || []).map((item) => (item.id === id ? { ...item, [field]: value } : item))
    set(listName, list)
  }
  const addItem = (listName, template) => set(listName, [...(production[listName] || []), { id: uid(), ...template }])
  const removeItem = (listName, id) => set(listName, (production[listName] || []).filter((item) => item.id !== id))

  const computedGsm = gsm(gsmInput)
  const utilisation =
    num(capacity.consent) > 0 && num(capacity.avg10Days) >= 0
      ? round((num(capacity.avg10Days) / num(capacity.consent)) * 100, 1)
      : ''

  return (
    <PageShell sectionKey="production">
      <Card title="Operating pattern" description="Production pattern over the last three months">
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField label="Operating days (last 3 months)" required unit="days" inputMode="numeric" value={production.operatingDays} onChange={(v) => set('operatingDays', v)} placeholder="78" />
          <TextField label="Operating hours per day" required unit="h/day" inputMode="decimal" value={production.hoursPerDay} onChange={(v) => set('hoursPerDay', v)} placeholder="22" />
          <TextField label="Installed capacity" required unit="kg/day" inputMode="decimal" value={production.installedCapacity} onChange={(v) => set('installedCapacity', v)} placeholder="18000" />
        </div>
      </Card>

      <Card title="Industry & process type">
        <div className="space-y-4">
          <RadioGroup label="Nature of fibre" required value={production.industryNature} onChange={(v) => set('industryNature', v)} options={NATURE_OPTIONS} columns="grid-cols-1 sm:grid-cols-3" />
          <CheckGroup label="Processes carried out" value={production.processTypes} onChange={(v) => set('processTypes', v)} options={PROCESS_OPTIONS} />
          <RadioGroup label="Operation mode" required value={production.operationMode} onChange={(v) => set('operationMode', v)} options={MODE_OPTIONS} columns="grid-cols-3" />
        </div>
      </Card>

      <Card title="Products, raw materials & capacity" description="Quantities in kg/day unless stated otherwise">
        <TextArea label="Products manufactured" required rows={2} value={production.products} onChange={(v) => set('products', v)} placeholder="Dyed / printed fabric, yarn, garments …" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <TextArea label="Raw materials used" rows={2} value={production.rawMaterials} onChange={(v) => set('rawMaterials', v)} placeholder="Grey fabric, yarn, sizing agents …" />
          <TextArea label="Process details" rows={2} value={production.processDetails} onChange={(v) => set('processDetails', v)} placeholder="Sequence of wet processes, batch size, water use per stage" />
        </div>

        <TableWrap className="mt-4">
          <table className="tbl">
            <thead>
              <tr>
                <th>Capacity basis</th>
                <th className="w-40">Quantity (kg/day)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>As per consent</td>
                <td>
                  <InlineInput ariaLabel="Consent capacity" inputMode="decimal" value={capacity.consent} onChange={(v) => set('capacity', { ...capacity, consent: v })} placeholder="18000" />
                </td>
              </tr>
              <tr>
                <td>Actual production — last 3 months (average)</td>
                <td>
                  <InlineInput ariaLabel="Average production last 3 months" inputMode="decimal" value={capacity.last3Months} onChange={(v) => set('capacity', { ...capacity, last3Months: v })} placeholder="16500" />
                </td>
              </tr>
              <tr>
                <td>Average production — last 10 days</td>
                <td>
                  <InlineInput ariaLabel="Average production last 10 days" inputMode="decimal" value={capacity.avg10Days} onChange={(v) => set('capacity', { ...capacity, avg10Days: v })} placeholder="17200" />
                </td>
              </tr>
              <tr>
                <td className="font-semibold">Capacity utilisation (last 10 days vs consent)</td>
                <td className="font-semibold text-gov-green-700">{utilisation !== '' ? `${fmt(utilisation, 1)} %` : '—'}</td>
              </tr>
            </tbody>
          </table>
        </TableWrap>
      </Card>

      <Card title="GSM calculator" description="GSM = (piece weight × 39.37 × 1000) ÷ (piece length × piece width), dimensions in inches">
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField label="Piece weight" unit="g" inputMode="decimal" value={gsmInput.weight} onChange={(v) => setGsmInput((p) => ({ ...p, weight: v }))} placeholder="5.2" />
          <TextField label="Piece length" unit="in" inputMode="decimal" value={gsmInput.length} onChange={(v) => setGsmInput((p) => ({ ...p, length: v }))} placeholder="10" />
          <TextField label="Piece width" unit="in" inputMode="decimal" value={gsmInput.width} onChange={(v) => setGsmInput((p) => ({ ...p, width: v }))} placeholder="4" />
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className="min-w-[180px] flex-1">
            <ValueField label="Calculated GSM" value={computedGsm === '' ? '' : `${fmt(computedGsm, 1)} g/m²`} />
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={computedGsm === ''}
            onClick={() => {
              setGsmSaved({ ...gsmInput, gsm: computedGsm })
              set('gsm', { ...gsmInput, result: computedGsm })
            }}
          >
            Save to inspection
          </button>
        </div>
        {gsmSaved && (
          <p className="mt-2 text-[12px] text-gov-green-800">
            Saved GSM sample: {fmt(gsmSaved.gsm, 1)} g/m² from {gsmSaved.weight} g / {gsmSaved.length} in × {gsmSaved.width} in
          </p>
        )}
      </Card>

      <Card
        title="Machines & infrastructure"
        description="Installation details relevant to water use and production capacity"
        actions={<AddRowButton label="Add machine" onClick={() => addItem('machines', { name: '', count: '', capacity: '', mlr: '' })} />}
      >
        {machines.length === 0 ? (
          <EmptyState title="No machines recorded" description="Add dyeing machines, printing machines, washing ranges and their liquor ratio (MLR)." />
        ) : (
          <TableWrap>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Machine / equipment</th>
                  <th className="w-24">Number</th>
                  <th className="w-36">Capacity</th>
                  <th className="w-32">MLR</th>
                  <th className="w-16" />
                </tr>
              </thead>
              <tbody>
                {machines.map((machine) => (
                  <tr key={machine.id}>
                    <td><InlineInput ariaLabel="Machine name" value={machine.name} onChange={(v) => updateList('machines', machine.id, 'name', v)} placeholder="Soft flow dyeing machine" /></td>
                    <td><InlineInput ariaLabel="Machine count" inputMode="numeric" value={machine.count} onChange={(v) => updateList('machines', machine.id, 'count', v)} placeholder="4" /></td>
                    <td><InlineInput ariaLabel="Machine capacity" value={machine.capacity} onChange={(v) => updateList('machines', machine.id, 'capacity', v)} placeholder="500 kg" /></td>
                    <td><InlineInput ariaLabel="Machine MLR" value={machine.mlr} onChange={(v) => updateList('machines', machine.id, 'mlr', v)} placeholder="1:8" /></td>
                    <td><DeleteRowButton onClick={() => removeItem('machines', machine.id)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Card>

      <Card
        title="Chemicals used"
        description="List significant chemicals, consumption and purpose"
        actions={<AddRowButton label="Add chemical" onClick={() => addItem('chemicals', { name: '', consumption: '', purpose: '' })} />}
      >
        {chemicals.length === 0 ? (
          <EmptyState title="No chemicals listed" description="Include dyes auxiliaries, alkalis, salts, finishing chemicals and their monthly consumption." />
        ) : (
          <TableWrap>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Chemical</th>
                  <th className="w-36">Consumption</th>
                  <th className="w-48">Purpose</th>
                  <th className="w-16" />
                </tr>
              </thead>
              <tbody>
                {chemicals.map((chemical) => (
                  <tr key={chemical.id}>
                    <td><InlineInput ariaLabel="Chemical name" value={chemical.name} onChange={(v) => updateList('chemicals', chemical.id, 'name', v)} placeholder="Caustic soda" /></td>
                    <td><InlineInput ariaLabel="Chemical consumption" value={chemical.consumption} onChange={(v) => updateList('chemicals', chemical.id, 'consumption', v)} placeholder="2.5 T/month" /></td>
                    <td><InlineInput ariaLabel="Chemical purpose" value={chemical.purpose} onChange={(v) => updateList('chemicals', chemical.id, 'purpose', v)} placeholder="Scouring" /></td>
                    <td><DeleteRowButton onClick={() => removeItem('chemicals', chemical.id)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Card>

      <Card
        title="Dyes used"
        description="Dye classes and quantities"
        actions={<AddRowButton label="Add dye" onClick={() => addItem('dyes', { name: '', dyeClass: '', consumption: '' })} />}
      >
        {dyes.length === 0 ? (
          <EmptyState title="No dyes listed" description="Add reactive, disperse, vat, azo or other dye classes with consumption." />
        ) : (
          <TableWrap>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Dye / brand</th>
                  <th className="w-40">Dye class</th>
                  <th className="w-36">Consumption</th>
                  <th className="w-16" />
                </tr>
              </thead>
              <tbody>
                {dyes.map((dye) => (
                  <tr key={dye.id}>
                    <td><InlineInput ariaLabel="Dye name" value={dye.name} onChange={(v) => updateList('dyes', dye.id, 'name', v)} placeholder="Reactive Red M8B" /></td>
                    <td><InlineInput ariaLabel="Dye class" value={dye.dyeClass} onChange={(v) => updateList('dyes', dye.id, 'dyeClass', v)} placeholder="Reactive" /></td>
                    <td><InlineInput ariaLabel="Dye consumption" value={dye.consumption} onChange={(v) => updateList('dyes', dye.id, 'consumption', v)} placeholder="120 kg/month" /></td>
                    <td><DeleteRowButton onClick={() => removeItem('dyes', dye.id)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Card>

      <Card title="Residents' feedback" description="Concerns raised by nearby residents / panchayat during the visit">
        <TextArea label="Feedback recorded" rows={3} value={production.residentsFeedback} onChange={(v) => set('residentsFeedback', v)} placeholder="Odour, colour of drain water, noise, groundwater depletion …" />
        <div className="mt-4">
          <TextField label="Source of feedback" value={production.residentsFeedbackSource} onChange={(v) => set('residentsFeedbackSource', v)} placeholder="Village panchayat / residents met on site" />
        </div>
      </Card>
    </PageShell>
  )
}
