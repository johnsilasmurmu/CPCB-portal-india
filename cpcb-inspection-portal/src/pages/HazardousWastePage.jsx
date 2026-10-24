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
  EmptyState,
  YesNo,
  FileField,
} from '../components/ui'
import { uid } from '../lib/defaults'
import { fmt, num } from '../lib/calc'

const CATEGORIES = ['Schedule I', 'Schedule II', 'Schedule III', 'Schedule IV', 'Other / E-waste', 'Used oil', 'Bio-medical (if applicable)']
const DISPOSAL = ['TSDF / CHWTSDF', 'Co-processing in cement kiln', 'Recycling / recovery', 'Captive incineration', 'Sale to authorised recycler', 'Stored on site', 'Other']

export default function HazardousWastePage() {
  const [hw, set] = useSection('hazardous')
  const items = hw.items || []

  const updateItem = (id, field, value) => set('items', items.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  const addItem = () =>
    set('items', [
      ...items,
      { id: uid(), name: '', category: '', authorised: '', generated: '', source: '', disposal: '', agreement: '' },
    ])
  const removeItem = (id) => set('items', items.filter((item) => item.id !== id))

  return (
    <PageShell sectionKey="hazardous">
      <Card
        title="Hazardous waste inventory"
        description="Quantities in tonnes per annum (TPA) unless stated otherwise"
        actions={<AddRowButton label="Add waste" onClick={addItem} />}
      >
        {items.length === 0 ? (
          <EmptyState
            title="No hazardous waste recorded"
            description="Add ETP sludge, dye / chemical containers, spent oil, used batteries and other scheduled wastes."
          />
        ) : (
          <TableWrap>
            <table className="tbl">
              <thead>
                <tr>
                  <th className="min-w-[160px]">Waste</th>
                  <th className="w-32">Category</th>
                  <th className="w-28">Authorised (TPA)</th>
                  <th className="w-28">Generated (TPA)</th>
                  <th className="min-w-[140px]">Source</th>
                  <th className="w-40">Disposal route</th>
                  <th className="w-36">Agreement</th>
                  <th className="w-16" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const excess = num(item.generated) > num(item.authorised) && num(item.authorised) > 0
                  return (
                    <tr key={item.id} className={excess ? 'bg-red-50/60' : ''}>
                      <td><InlineInput ariaLabel="Waste name" value={item.name} onChange={(v) => updateItem(item.id, 'name', v)} placeholder="ETP sludge" /></td>
                      <td><InlineSelect ariaLabel="Waste category" value={item.category} onChange={(v) => updateItem(item.id, 'category', v)} options={CATEGORIES} placeholder="Select" /></td>
                      <td><InlineInput ariaLabel="Authorised quantity" inputMode="decimal" value={item.authorised} onChange={(v) => updateItem(item.id, 'authorised', v)} placeholder="120" /></td>
                      <td>
                        <InlineInput ariaLabel="Generated quantity" inputMode="decimal" value={item.generated} onChange={(v) => updateItem(item.id, 'generated', v)} placeholder="95" />
                        {excess && <p className="mt-1 text-[10px] font-semibold text-red-600">Exceeds authorised</p>}
                      </td>
                      <td><InlineInput ariaLabel="Waste source" value={item.source} onChange={(v) => updateItem(item.id, 'source', v)} placeholder="ETP / dyeing" /></td>
                      <td><InlineSelect ariaLabel="Disposal route" value={item.disposal} onChange={(v) => updateItem(item.id, 'disposal', v)} options={DISPOSAL} placeholder="Select" /></td>
                      <td>
                        <label className="inline-flex cursor-pointer flex-col text-[11px] text-slate-600">
                          <span className="rounded border border-dashed border-slate-300 px-2 py-1 text-center hover:bg-slate-50">
                            {item.agreement ? 'Change file' : 'Upload'}
                          </span>
                          <input
                            type="file"
                            accept=".pdf,image/*"
                            className="hidden"
                            onChange={(e) => updateItem(item.id, 'agreement', e.target.files?.[0]?.name || '')}
                          />
                          {item.agreement && <span className="mt-1 max-w-[120px] truncate">{item.agreement}</span>}
                        </label>
                      </td>
                      <td><DeleteRowButton onClick={() => removeItem(item.id)} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </TableWrap>
        )}

        {items.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-4 text-[12px] text-slate-600">
            <span>Total authorised: <strong>{fmt(items.reduce((sum, item) => sum + (num(item.authorised) || 0), 0), 2)} TPA</strong></span>
            <span>Total generated: <strong>{fmt(items.reduce((sum, item) => sum + (num(item.generated) || 0), 0), 2)} TPA</strong></span>
          </div>
        )}
      </Card>

      <Card title="Statutory records" description="Verify registers maintained under the Hazardous & Other Wastes (Management) Rules, 2016">
        <div className="grid gap-4 sm:grid-cols-2">
          <YesNo label="Form-4 (annual return) maintained and filed" required value={hw.form4Maintained} onChange={(v) => set('form4Maintained', v)} />
          <YesNo label="Form-10 (records / manifest) maintained" required value={hw.form10Maintained} onChange={(v) => set('form10Maintained', v)} />
          <FileField label="Form-4 copy" fileName={hw.form4File} onChange={(file) => set('form4File', file ? file.name : '')} />
          <FileField label="Form-10 copy" fileName={hw.form10File} onChange={(file) => set('form10File', file ? file.name : '')} />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <TextField label="Form-4 remarks" value={hw.form4Remarks} onChange={(v) => set('form4Remarks', v)} placeholder="Filed on / discrepancies" />
          <TextField label="Form-10 remarks" value={hw.form10Remarks} onChange={(v) => set('form10Remarks', v)} placeholder="Manifest entries verified" />
        </div>
      </Card>

      <Card title="Storage & handling">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Storage area" value={hw.storage} onChange={(v) => set('storage', v)} placeholder="Covered shed with impervious flooring and leachate collection" />
          <TextField label="Storage quantity on site" unit="tonnes" inputMode="decimal" value={hw.storageQuantity} onChange={(v) => set('storageQuantity', v)} />
        </div>
        <div className="mt-4">
          <TextArea label="Observations" rows={3} value={hw.remarks} onChange={(v) => set('remarks', v)} placeholder="Labelling, spillage, mixing of wastes, storage beyond 90 days, manifest discrepancies" />
        </div>
      </Card>
    </PageShell>
  )
}
