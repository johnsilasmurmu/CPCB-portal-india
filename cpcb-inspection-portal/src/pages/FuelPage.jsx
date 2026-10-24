import React from 'react'
import PageShell, { useSection } from '../components/PageShell'
import { Card, TextField, TextArea, AddRowButton, DeleteRowButton, TableWrap, InlineInput, InlineSelect, EmptyState } from '../components/ui'
import { uid } from '../lib/defaults'
import { fmt, num } from '../lib/calc'

const FUELS = [
  { value: 'Coal (Indian)', label: 'Coal (Indian)' },
  { value: 'Coal (imported)', label: 'Coal (imported)' },
  { value: 'Pet coke', label: 'Pet coke' },
  { value: 'Furnace oil', label: 'Furnace oil' },
  { value: 'LDO', label: 'LDO' },
  { value: 'HSD / Diesel', label: 'HSD / Diesel' },
  { value: 'Natural gas', label: 'Natural gas' },
  { value: 'Biomass / briquettes', label: 'Biomass / briquettes' },
  { value: 'LPG', label: 'LPG' },
  { value: 'Other', label: 'Other' },
]

const UNITS = {
  'Coal (Indian)': 'TPM',
  'Coal (imported)': 'TPM',
  'Pet coke': 'TPM',
  'Furnace oil': 'kL/month',
  LDO: 'kL/month',
  'HSD / Diesel': 'kL/month',
  'Natural gas': 'SCMD',
  'Biomass / briquettes': 'TPM',
  LPG: 'kg/month',
  Other: '—',
}

export default function FuelPage() {
  const [fuel, set] = useSection('fuel')
  const items = fuel.items || []

  const updateItem = (id, field, value) => set('items', items.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  const addItem = () => set('items', [...items, { id: uid(), type: '', consumption: '', unit: '', dayConsumption: '', purpose: '' }])
  const removeItem = (id) => set('items', items.filter((item) => item.id !== id))

  return (
    <PageShell sectionKey="fuel">
      <Card
        title="Fuel consumption"
        description="Consumption for the last three months and on the day of the visit"
        actions={<AddRowButton label="Add fuel" onClick={addItem} />}
      >
        {items.length === 0 ? (
          <EmptyState title="No fuel recorded" description="Add each fuel used in the boiler, thermic fluid heater, DG sets and other equipment." />
        ) : (
          <TableWrap>
            <table className="tbl">
              <thead>
                <tr>
                  <th className="min-w-[170px]">Fuel type</th>
                  <th className="w-32">Consumption</th>
                  <th className="w-28">Unit</th>
                  <th className="w-36">On day of visit</th>
                  <th className="min-w-[150px]">Used in</th>
                  <th className="w-16" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <InlineSelect
                        ariaLabel="Fuel type"
                        value={item.type}
                        onChange={(v) => {
                          updateItem(item.id, 'type', v)
                          if (!item.unit && UNITS[v]) updateItem(item.id, 'unit', UNITS[v])
                        }}
                        options={FUELS}
                        placeholder="Select fuel"
                      />
                    </td>
                    <td><InlineInput ariaLabel="Fuel consumption" inputMode="decimal" value={item.consumption} onChange={(v) => updateItem(item.id, 'consumption', v)} /></td>
                    <td><InlineInput ariaLabel="Fuel unit" value={item.unit} onChange={(v) => updateItem(item.id, 'unit', v)} placeholder="TPM" /></td>
                    <td><InlineInput ariaLabel="Fuel consumption on visit day" inputMode="decimal" value={item.dayConsumption} onChange={(v) => updateItem(item.id, 'dayConsumption', v)} /></td>
                    <td><InlineInput ariaLabel="Fuel used in" value={item.purpose} onChange={(v) => updateItem(item.id, 'purpose', v)} placeholder="Boiler, DG set" /></td>
                    <td><DeleteRowButton onClick={() => removeItem(item.id)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}

        {items.length > 0 && (
          <p className="mt-3 text-[12px] text-slate-600">
            Day-of-visit total: <strong>{fmt(items.reduce((sum, item) => sum + (num(item.dayConsumption) || 0), 0), 2)}</strong> (mixed units — verify against daily log)
          </p>
        )}
      </Card>

      <Card title="Fuel storage & daily consumption record">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Consumption on day of visit (narrative)" value={fuel.dayConsumption} onChange={(v) => set('dayConsumption', v)} placeholder="e.g. 42 T coal, 1,200 L diesel" />
          <TextField label="Daily consumption log maintained by" value={fuel.logMaintainedBy} onChange={(v) => set('logMaintainedBy', v)} placeholder="Shift in-charge / boiler operator" />
        </div>
        <div className="mt-4">
          <TextArea label="Remarks" rows={3} value={fuel.remarks} onChange={(v) => set('remarks', v)} placeholder="Fuel storage area, Sulphur content, use of un-authorised fuel, ash handling" />
        </div>
      </Card>
    </PageShell>
  )
}
