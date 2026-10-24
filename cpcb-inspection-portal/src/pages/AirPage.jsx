import React from 'react'
import PageShell, { useSection } from '../components/PageShell'
import {
  Card,
  TextField,
  TextArea,
  RadioGroup,
  FileField,
  AddRowButton,
  DeleteRowButton,
  TableWrap,
  InlineInput,
  InlineSelect,
  EmptyState,
  Pill,
} from '../components/ui'
import { uid } from '../lib/defaults'

const RESULTS = ['Within norms', 'Exceeds norms', 'Not monitored', 'Awaiting report']

export default function AirPage() {
  const [air, set] = useSection('air')
  const chimneys = air.chimneys || []
  const dgSets = air.dgSets || []

  const update = (listName, id, field, value) =>
    set(listName, (air[listName] || []).map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  const add = (listName, template) => set(listName, [...(air[listName] || []), { id: uid(), ...template }])
  const remove = (listName, id) => set(listName, (air[listName] || []).filter((item) => item.id !== id))

  return (
    <PageShell sectionKey="air">
      <Card title="Air pollution sources">
        <TextArea
          label="Sources of air pollution"
          required
          rows={2}
          value={air.sources}
          onChange={(v) => set('sources', v)}
          placeholder="Boiler, thermic fluid heater, DG sets, dyeing / stenters, printing, coal handling, ash pond"
        />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <TextArea label="Air pollution control devices (APCD)" rows={2} value={air.apcd} onChange={(v) => set('apcd', v)} placeholder="Multi-cyclone, bag filter, wet scrubber, electrostatic precipitator" />
          <TextArea label="Fuel / process emissions remarks" rows={2} value={air.emissionRemarks} onChange={(v) => set('emissionRemarks', v)} placeholder="Visible emissions, opacity, fugitive dust, odour" />
        </div>
      </Card>

      <Card
        title="Chimneys / stacks"
        description="Stack height, APCD and last monitoring result"
        actions={<AddRowButton label="Add chimney" onClick={() => add('chimneys', { stack: '', height: '', diameter: '', apcd: '', lastMonitored: '', result: '' })} />}
      >
        {chimneys.length === 0 ? (
          <EmptyState title="No chimney recorded" description="Add each stack serving the boiler, thermic fluid heater, stenter or DG set." />
        ) : (
          <TableWrap>
            <table className="tbl">
              <thead>
                <tr>
                  <th className="min-w-[150px]">Stack / attached unit</th>
                  <th className="w-24">Height (m)</th>
                  <th className="w-24">Diameter (m)</th>
                  <th className="min-w-[130px]">APCD</th>
                  <th className="w-36">Last monitored</th>
                  <th className="w-36">Result</th>
                  <th className="w-16" />
                </tr>
              </thead>
              <tbody>
                {chimneys.map((chimney) => (
                  <tr key={chimney.id}>
                    <td><InlineInput ariaLabel="Stack name" value={chimney.stack} onChange={(v) => update('chimneys', chimney.id, 'stack', v)} placeholder="Boiler stack" /></td>
                    <td><InlineInput ariaLabel="Stack height" inputMode="decimal" value={chimney.height} onChange={(v) => update('chimneys', chimney.id, 'height', v)} /></td>
                    <td><InlineInput ariaLabel="Stack diameter" inputMode="decimal" value={chimney.diameter} onChange={(v) => update('chimneys', chimney.id, 'diameter', v)} /></td>
                    <td><InlineInput ariaLabel="Stack APCD" value={chimney.apcd} onChange={(v) => update('chimneys', chimney.id, 'apcd', v)} placeholder="Bag filter" /></td>
                    <td><input type="date" aria-label="Last monitored" className="inp inp-sm" value={chimney.lastMonitored || ''} onChange={(e) => update('chimneys', chimney.id, 'lastMonitored', e.target.value)} /></td>
                    <td>
                      <InlineSelect ariaLabel="Stack monitoring result" value={chimney.result} onChange={(v) => update('chimneys', chimney.id, 'result', v)} options={RESULTS} placeholder="Select" />
                      {chimney.result === 'Exceeds norms' && <p className="mt-1"><Pill tone="non-comply">Non-comply</Pill></p>}
                    </td>
                    <td><DeleteRowButton onClick={() => remove('chimneys', chimney.id)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Card>

      <Card title="Emission quality" description="Attach the third-party stack monitoring report">
        <div className="grid gap-4 sm:grid-cols-2">
          <RadioGroup
            label="Emission quality within prescribed norms?"
            required
            value={air.emissionWithinNorms}
            onChange={(v) => set('emissionWithinNorms', v)}
            options={['Yes', 'No', 'Not monitored']}
            columns="grid-cols-3"
          />
          <TextField label="Monitoring laboratory" value={air.lab} onChange={(v) => set('lab', v)} placeholder="NABL-accredited laboratory" />
          <TextField label="Report date" type="date" value={air.reportDate} onChange={(v) => set('reportDate', v)} />
          <FileField label="Third-party stack monitoring report" fileName={air.reportFile} onChange={(file) => set('reportFile', file ? file.name : '')} />
        </div>
        {air.emissionWithinNorms === 'No' && (
          <p className="mt-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-[12px] text-red-800">
            Emissions exceed the prescribed norms — note the parameters, attach the report and inform the SPCB / CPCB regional office.
          </p>
        )}
        <div className="mt-4">
          <TextArea label="Emission observations" rows={2} value={air.observations} onChange={(v) => set('observations', v)} placeholder="Stack height adequacy, visible emission, APCD operation and maintenance" />
        </div>
      </Card>

      <Card
        title="DG sets"
        actions={<AddRowButton label="Add DG set" onClick={() => add('dgSets', { capacity: '', stackHeight: '', apcd: '', lastMonitored: '', result: '' })} />}
      >
        {dgSets.length === 0 ? (
          <EmptyState title="No DG set recorded" description="Record standby generating sets and their acoustic enclosure / stack details." />
        ) : (
          <TableWrap>
            <table className="tbl">
              <thead>
                <tr>
                  <th className="w-32">Capacity</th>
                  <th className="w-32">Stack height (m)</th>
                  <th className="min-w-[130px]">Acoustic enclosure</th>
                  <th className="w-36">Last monitored</th>
                  <th className="w-36">Result</th>
                  <th className="w-16" />
                </tr>
              </thead>
              <tbody>
                {dgSets.map((set) => (
                  <tr key={set.id}>
                    <td><InlineInput ariaLabel="DG capacity" value={set.capacity} onChange={(v) => update('dgSets', set.id, 'capacity', v)} placeholder="500 kVA" /></td>
                    <td><InlineInput ariaLabel="DG stack height" inputMode="decimal" value={set.stackHeight} onChange={(v) => update('dgSets', set.id, 'stackHeight', v)} /></td>
                    <td><InlineInput ariaLabel="DG acoustic enclosure" value={set.apcd} onChange={(v) => update('dgSets', set.id, 'apcd', v)} placeholder="Provided" /></td>
                    <td><input type="date" aria-label="DG last monitored" className="inp inp-sm" value={set.lastMonitored || ''} onChange={(e) => update('dgSets', set.id, 'lastMonitored', e.target.value)} /></td>
                    <td><InlineSelect ariaLabel="DG monitoring result" value={set.result} onChange={(v) => update('dgSets', set.id, 'result', v)} options={RESULTS} placeholder="Select" /></td>
                    <td><DeleteRowButton onClick={() => remove('dgSets', set.id)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Card>
    </PageShell>
  )
}
