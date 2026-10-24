import React, { useEffect, useState } from 'react'
import PageShell, { useSection } from '../components/PageShell'
import {
  Card,
  TextField,
  TextArea,
  SelectField,
  RadioGroup,
  YesNo,
  AddRowButton,
  DeleteRowButton,
  TableWrap,
  InlineInput,
  EmptyState,
  Pill,
  Field,
} from '../components/ui'
import { useApp } from '../state/AppState'
import { uid } from '../lib/defaults'
import { formatDateTime } from '../lib/calc'

export default function OcemsPage() {
  const [ocems, set] = useSection('ocems')
  const { current, sealVault, openVault, unlockVault, vaultUnlocked, officer, showToast } = useApp()
  const [password, setPassword] = useState('')
  const [credentials, setCredentials] = useState({ portal: '', username: '', password: '' })
  const [vaultBusy, setVaultBusy] = useState(false)
  const [vaultError, setVaultError] = useState('')

  const liveReadings = ocems.liveReadings || []
  const team = ocems.team || []
  const calibration = ocems.calibration || {}

  const updateReading = (id, field, value) => set('liveReadings', liveReadings.map((row) => (row.id === id ? { ...row, [field]: value } : row)))
  const addReading = () => set('liveReadings', [...liveReadings, { id: uid(), parameter: '', unit: '', value: '', observedAt: '' }])
  const removeReading = (id) => set('liveReadings', liveReadings.filter((row) => row.id !== id))

  const updateMember = (id, field, value) => set('team', team.map((member) => (member.id === id ? { ...member, [field]: value } : member)))
  const addMember = () => set('team', [...team, { id: uid(), name: '', designation: '', email: '', signedAt: '' }])
  const removeMember = (id) => set('team', team.filter((member) => member.id !== id))

  useEffect(() => {
    if (!vaultUnlocked || !current) return
    let cancelled = false
    openVault(current.id).then((saved) => {
      if (!cancelled && saved) setCredentials({ portal: saved.portal || '', username: saved.username || '', password: saved.password || '' })
    })
    return () => {
      cancelled = true
    }
  }, [vaultUnlocked, current, openVault])

  const handleUnlock = async () => {
    setVaultError('')
    setVaultBusy(true)
    try {
      await unlockVault(password)
      setPassword('')
      showToast('Vault unlocked for this session')
    } catch (err) {
      setVaultError(err.message)
    } finally {
      setVaultBusy(false)
    }
  }

  const handleSaveCredentials = async () => {
    if (!current) return
    setVaultBusy(true)
    try {
      const at = await sealVault(current.id, credentials)
      set('vault', { at, portal: credentials.portal })
      showToast('OCEMS credentials encrypted on this device')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setVaultBusy(false)
    }
  }

  return (
    <PageShell sectionKey="ocems">
      <Card title="OCEMS & surveillance infrastructure">
        <div className="grid gap-4 sm:grid-cols-2">
          <RadioGroup label="OCEMS installed (effluent & emission)" required value={ocems.ocemsInstalled} onChange={(v) => set('ocemsInstalled', v)} options={['Yes', 'No', 'Partially']} columns="grid-cols-3" />
          <RadioGroup label="Web camera installed at outlet / ETP" value={ocems.webCamera} onChange={(v) => set('webCamera', v)} options={['Yes', 'No']} columns="grid-cols-2" />
          <RadioGroup label="Electromagnetic flow meter installed" value={ocems.flowMeter} onChange={(v) => set('flowMeter', v)} options={['Yes', 'No']} columns="grid-cols-2" />
          <RadioGroup label="Connected to CPCB / SPCB server" value={ocems.serverConnection} onChange={(v) => set('serverConnection', v)} options={['Yes', 'No', 'Intermittent']} columns="grid-cols-3" />
        </div>
        {ocems.ocemsInstalled === 'No' && (
          <p className="mt-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-[12px] text-red-800">
            OCEMS is not installed although the unit falls under the CPCB direction for real-time monitoring — record the direction
            reference and issue a notice.
          </p>
        )}
      </Card>

      <Card title="Calibration & connectivity">
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField label="OCEMS last calibration" type="date" value={calibration.ocems} onChange={(v) => set('calibration', { ...calibration, ocems: v })} />
          <TextField label="Flow meter last calibration" type="date" value={calibration.flowmeter} onChange={(v) => set('calibration', { ...calibration, flowmeter: v })} />
          <TextField label="Web camera last checked" type="date" value={calibration.camera} onChange={(v) => set('calibration', { ...calibration, camera: v })} />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <SelectField label="Calibration agency" value={ocems.calibrationAgency} onChange={(v) => set('calibrationAgency', v)} options={['CPCB-approved lab', 'Manufacturer', 'In-house', 'Not calibrated', 'Other']} placeholder="Select agency" />
          <TextField label="Server / data availability" value={ocems.serverRemarks} onChange={(v) => set('serverRemarks', v)} placeholder="e.g. data not available for 12 days in Nov 2025" />
        </div>
      </Card>

      <Card
        title="Live OCEMS readings observed"
        description="Note readings exactly as displayed on the OCEMS / server dashboard during the visit"
        actions={<AddRowButton label="Add reading" onClick={addReading} />}
      >
        {liveReadings.length === 0 ? (
          <EmptyState title="No OCEMS readings recorded" description="Add pH, COD, BOD, TSS, flow and emission parameters observed on the dashboard." />
        ) : (
          <TableWrap>
            <table className="tbl">
              <thead>
                <tr>
                  <th className="min-w-[150px]">Parameter</th>
                  <th className="w-24">Unit</th>
                  <th className="w-28">Reading</th>
                  <th className="w-40">Observed at</th>
                  <th className="w-16" />
                </tr>
              </thead>
              <tbody>
                {liveReadings.map((row) => (
                  <tr key={row.id}>
                    <td><InlineInput ariaLabel="OCEMS parameter" value={row.parameter} onChange={(v) => updateReading(row.id, 'parameter', v)} placeholder="pH / COD / Flow" /></td>
                    <td><InlineInput ariaLabel="OCEMS unit" value={row.unit} onChange={(v) => updateReading(row.id, 'unit', v)} placeholder="mg/L" /></td>
                    <td><InlineInput ariaLabel="OCEMS reading" inputMode="decimal" value={row.value} onChange={(v) => updateReading(row.id, 'value', v)} /></td>
                    <td><input type="datetime-local" aria-label="Reading time" className="inp inp-sm" value={row.observedAt || ''} onChange={(e) => updateReading(row.id, 'observedAt', e.target.value)} /></td>
                    <td><DeleteRowButton onClick={() => removeReading(row.id)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Card>

      <Card title="Charter, self-assessment & tampering checks">
        <div className="grid gap-4 sm:grid-cols-2">
          <YesNo label="OCEMS charter submitted to CPCB / SPCB" value={ocems.charterSubmitted} onChange={(v) => set('charterSubmitted', v)} />
          <YesNo label="Self-assessment report submitted" value={ocems.selfAssessment} onChange={(v) => set('selfAssessment', v)} />
        </div>
        <div className="mt-4">
          <TextArea
            label="Tampering / experimental attempts observed"
            rows={2}
            value={ocems.experiments}
            onChange={(v) => set('experiments', v)}
            placeholder="e.g. sensor bypassed, data logger disconnected, readings frozen, camera obstructed, diluted sample line"
          />
        </div>
      </Card>

      <Card title="Encrypted OCEMS portal credentials" description="Stored encrypted with AES-GCM using your sign-in password. Never shown in reports.">
        {!vaultUnlocked ? (
          <div className="grid gap-3 sm:max-w-sm">
            <Field label="Re-enter your password to unlock the vault" required error={vaultError}>
              <input className="inp" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </Field>
            <button type="button" onClick={handleUnlock} disabled={vaultBusy || !password} className="btn-secondary btn-sm">
              {vaultBusy ? 'Unlocking…' : 'Unlock vault'}
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField label="Portal / server" value={credentials.portal} onChange={(v) => setCredentials((p) => ({ ...p, portal: v }))} placeholder="OCEMS portal URL / name" />
              <TextField label="User ID" value={credentials.username} onChange={(v) => setCredentials((p) => ({ ...p, username: v }))} autoComplete="off" />
              <Field label="Password">
                <input className="inp" type="password" value={credentials.password} onChange={(e) => setCredentials((p) => ({ ...p, password: e.target.value }))} autoComplete="new-password" />
              </Field>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button type="button" onClick={handleSaveCredentials} disabled={vaultBusy} className="btn-primary btn-sm">
                {vaultBusy ? 'Encrypting…' : 'Encrypt & save credentials'}
              </button>
              {ocems.vault?.at && <span className="text-[11px] text-slate-500">Encrypted copy saved {formatDateTime(ocems.vault.at)}</span>}
            </div>
          </>
        )}
      </Card>

      <Card title="Observations, key issues & recommendations">
        <div className="grid gap-4">
          <TextArea label="Observations" required rows={3} value={ocems.observations} onChange={(v) => set('observations', v)} placeholder="Unit-wise observations recorded during the inspection" />
          <TextArea label="Key issues" rows={2} value={ocems.keyIssues} onChange={(v) => set('keyIssues', v)} placeholder="Non-compliance, un-consented outlets, insufficient ETP capacity, monitoring gaps" />
          <TextArea label="Recommendations / directions" rows={3} value={ocems.recommendations} onChange={(v) => set('recommendations', v)} placeholder="Actions required, timelines and follow-up" />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Overall compliance status"
            required
            value={ocems.overallCompliance}
            onChange={(v) => set('overallCompliance', v)}
            options={['Compliant', 'Partially compliant', 'Non-compliant', 'Closure recommended']}
            placeholder="Select status"
          />
          <TextField label="Report submission date" type="date" value={ocems.reportDate} onChange={(v) => set('reportDate', v)} />
        </div>
        {ocems.overallCompliance && (
          <p className="mt-3">
            <Pill tone={ocems.overallCompliance === 'Compliant' ? 'comply' : ocems.overallCompliance === 'Non-compliant' ? 'non-comply' : 'warn'}>
              {ocems.overallCompliance}
            </Pill>
          </p>
        )}
      </Card>

      <Card
        title="Inspection team"
        description="Add each officer; signing records the officer name with a timestamp on this device"
        actions={<AddRowButton label="Add member" onClick={addMember} />}
      >
        {team.length === 0 ? (
          <EmptyState title="No team member added" description="At least one inspecting officer must sign the report." />
        ) : (
          <div className="space-y-3">
            {team.map((member) => (
              <div key={member.id} className="rounded-lg border border-slate-200 p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField label="Name" value={member.name} onChange={(v) => updateMember(member.id, 'name', v)} placeholder="Dr. A. K. Verma" />
                  <TextField label="Designation & organisation" value={member.designation} onChange={(v) => updateMember(member.id, 'designation', v)} placeholder="Scientist 'D', CPCB" />
                  <TextField label="Email" type="email" value={member.email} onChange={(v) => updateMember(member.id, 'email', v)} placeholder="officer@cpcb.nic.in" />
                  <div>
                    <p className="lbl">Digital signature</p>
                    {member.signedAt ? (
                      <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-900">
                        <p className="font-semibold">Signed · {member.name || officer?.name}</p>
                        <p className="mt-0.5">{formatDateTime(member.signedAt)}</p>
                        <p className="mt-0.5 break-all font-mono text-[10px] text-emerald-700">SIG-{member.id.slice(0, 8).toUpperCase()}</p>
                        <button type="button" className="mt-1 text-[11px] font-semibold text-red-600 underline" onClick={() => updateMember(member.id, 'signedAt', '')}>
                          Remove signature
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm w-full"
                        onClick={() =>
                          set(
                            'team',
                            team.map((row) =>
                              row.id === member.id
                                ? { ...row, signedAt: new Date().toISOString(), signatureName: member.name || officer?.name || '' }
                                : row,
                            ),
                          )
                        }
                      >
                        ✍ Sign as {member.name || officer?.name || 'officer'}
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-2 text-right">
                  <DeleteRowButton onClick={() => removeMember(member.id)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </PageShell>
  )
}
