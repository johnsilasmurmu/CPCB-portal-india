import React, { useState } from 'react'
import PageShell, { useSection } from '../components/PageShell'
import { Card, TextField, TextArea, SelectField, RadioGroup, FileField, Field } from '../components/ui'
import { useApp } from '../state/AppState'

const STATUS_OPTIONS = [
  { value: 'Operational', label: 'Operational' },
  { value: 'Non-operational', label: 'Non-operational' },
  { value: 'Self-shutdown', label: 'Self-shutdown' },
  { value: 'Closure notice', label: 'Closure notice' },
  { value: 'Other', label: 'Other' },
]

const INDIAN_STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
  'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan',
  'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Other',
]

export default function GeneralPage() {
  const [general, set] = useSection('general')
  const { showToast } = useApp()
  const [locating, setLocating] = useState(false)

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      showToast('Location is not available on this device', 'error')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        set('latitude', position.coords.latitude.toFixed(6))
        set('longitude', position.coords.longitude.toFixed(6))
        set('accuracy', String(Math.round(position.coords.accuracy)))
        setLocating(false)
        showToast('Location captured (±' + Math.round(position.coords.accuracy) + ' m)')
      },
      (error) => {
        setLocating(false)
        showToast(error.code === 1 ? 'Location permission denied – enter coordinates manually' : 'Could not get location – enter coordinates manually', 'error')
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    )
  }

  const showStatusDocs = ['Non-operational', 'Self-shutdown', 'Closure notice', 'Other'].includes(general.operationalStatus)

  return (
    <PageShell sectionKey="general">
      <Card title="Unit identification" description="As per the consent / authorisation of the unit">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Date of inspection" type="date" required value={general.inspectionDate} onChange={(v) => set('inspectionDate', v)} />
          <TextField label="Unit code" required value={general.unitCode} onChange={(v) => set('unitCode', v)} placeholder="e.g. TXT-2025-014" />
          <TextField className="sm:col-span-2" label="Unit name" required value={general.unitName} onChange={(v) => set('unitName', v)} placeholder="M/s …" />
          <TextArea className="sm:col-span-2" label="Unit address" required rows={2} value={general.unitAddress} onChange={(v) => set('unitAddress', v)} placeholder="Plot / street, industrial area, district, PIN" />
          <SelectField label="State / UT" value={general.state} onChange={(v) => set('state', v)} options={INDIAN_STATES} placeholder="Select state" />
          <TextField label="Year of commissioning" type="number" required value={general.yearCommissioning} onChange={(v) => set('yearCommissioning', v)} placeholder="2011" inputMode="numeric" />
        </div>
      </Card>

      <Card title="Geo-location" description="Decimal degrees — capture at the unit gate">
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField label="Latitude" required inputMode="decimal" value={general.latitude} onChange={(v) => set('latitude', v)} placeholder="29.387500" />
          <TextField label="Longitude" required inputMode="decimal" value={general.longitude} onChange={(v) => set('longitude', v)} placeholder="76.963500" />
          <Field label="GPS accuracy" hint="Metres, as reported by the device">
            <input className="inp" value={general.accuracy || ''} readOnly placeholder="—" />
          </Field>
        </div>
        <button type="button" onClick={useMyLocation} disabled={locating} className="btn btn-outline btn-sm mt-3 w-full sm:w-auto">
          {locating ? 'Getting location…' : '📍 Use my location'}
        </button>
      </Card>

      <Card title="Contact person at the unit">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Name" required value={general.contactName} onChange={(v) => set('contactName', v)} placeholder="Mr. / Ms. …" />
          <TextField label="Designation" value={general.contactDesignation} onChange={(v) => set('contactDesignation', v)} placeholder="Plant manager" />
          <TextField label="Phone" required type="tel" inputMode="tel" value={general.contactPhone} onChange={(v) => set('contactPhone', v)} placeholder="10-digit mobile" />
          <TextField label="Email" type="email" inputMode="email" value={general.contactEmail} onChange={(v) => set('contactEmail', v)} placeholder="name@company.com" />
        </div>
      </Card>

      <Card title="Administrative details">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="SPCB regional office" required value={general.spcbOffice} onChange={(v) => set('spcbOffice', v)} placeholder="e.g. HSPCB Regional Office, Panipat" />
          <TextField label="Technical institute associated" value={general.technicalInstitute} onChange={(v) => set('technicalInstitute', v)} placeholder="e.g. Thapar Institute of Engineering & Technology" hint="Institute associated with the unit's monitoring / analysis" />
        </div>
      </Card>

      <Card title="Operational status">
        <RadioGroup
          label="Status observed during inspection"
          required
          value={general.operationalStatus}
          onChange={(v) => set('operationalStatus', v)}
          options={STATUS_OPTIONS}
          columns="grid-cols-2 sm:grid-cols-3"
        />
        {general.operationalStatus === 'Other' && (
          <div className="mt-4">
            <TextField label="Specify status" value={general.operationalStatusOther} onChange={(v) => set('operationalStatusOther', v)} placeholder="Describe the observed status" />
          </div>
        )}
        {showStatusDocs && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FileField
              label="Supporting document"
              required
              fileName={general.statusDocument}
              onChange={(file) => set('statusDocument', file ? file.name : '')}
              hint="Closure notice, shutdown intimation or order (PDF / image)"
            />
            <TextField label="Remarks" value={general.statusRemarks} onChange={(v) => set('statusRemarks', v)} placeholder="Date & reference of the notice / order" />
          </div>
        )}
        {general.operationalStatus === 'Operational' && (
          <div className="mt-4">
            <TextField label="Remarks" value={general.statusRemarks} onChange={(v) => set('statusRemarks', v)} placeholder="Shifts, capacity utilisation or other observations" />
          </div>
        )}
      </Card>
    </PageShell>
  )
}
