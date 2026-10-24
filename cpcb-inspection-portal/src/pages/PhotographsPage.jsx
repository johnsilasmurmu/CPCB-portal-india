import React, { useEffect, useRef, useState } from 'react'
import PageShell, { useSection } from '../components/PageShell'
import { Card, Field, Pill, TextField } from '../components/ui'
import { useApp } from '../state/AppState'
import { compressImage } from '../lib/crypto'
import { formatDateTime } from '../lib/calc'

const FIGURES = [
  { id: 'fig1', label: 'Entrance gate' },
  { id: 'fig2', label: 'Unit name board' },
  { id: 'fig3', label: 'Production / process area' },
  { id: 'fig4', label: 'Water intake / borewell with flow meter' },
  { id: 'fig5', label: 'ETP inlet' },
  { id: 'fig6', label: 'ETP units (aeration / clarifier)' },
  { id: 'fig7', label: 'ETP outlet' },
  { id: 'fig8', label: 'Final discharge point / drain' },
  { id: 'fig9', label: 'OCEMS panel & web camera' },
  { id: 'fig10', label: 'Hazardous waste storage area' },
  { id: 'fig11', label: 'Boiler / stack with APCD' },
  { id: 'fig12', label: 'Laboratory / logbooks' },
  { id: 'fig13', label: 'Inspection team at site' },
]

const readPosition = () =>
  new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    )
  })

export default function PhotographsPage() {
  const [photographs, set] = useSection('photographs')
  const { current, savePhotoForCurrent, loadPhotoForCurrent, removePhotoForCurrent, showToast } = useApp()
  const [images, setImages] = useState({})
  const [busy, setBusy] = useState('')
  const inputs = useRef({})

  const meta = photographs.photos || {}

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const entries = await Promise.all(
        FIGURES.map(async (figure) => [figure.id, await loadPhotoForCurrent(figure.id)]),
      )
      if (!cancelled) {
        setImages(Object.fromEntries(entries.filter(([, value]) => value)))
      }
    }
    if (current) load()
    return () => {
      cancelled = true
    }
  }, [current, loadPhotoForCurrent])

  const handleCapture = async (figId, file) => {
    if (!file) return
    setBusy(figId)
    try {
      const { dataUrl } = await compressImage(file)
      const stored = await savePhotoForCurrent(figId, dataUrl)
      if (!stored) showToast('Could not store photo on this device', 'error')
      setImages((prev) => ({ ...prev, [figId]: dataUrl }))
      const position = await readPosition()
      const fallback = current?.data?.general
      const gps =
        position ||
        (fallback?.latitude && fallback?.longitude ? { lat: fallback.latitude, lng: fallback.longitude, source: 'unit coordinates' } : null)
      const existing = meta[figId] || {}
      const nextMeta = {
        ...meta,
        [figId]: {
          ...existing,
          capturedAt: new Date().toISOString(),
          gps,
          file: file.name,
        },
      }
      set('photos', nextMeta)
      showToast(`${FIGURES.find((f) => f.id === figId)?.label} captured`)
    } catch (err) {
      showToast(err.message || 'Could not process the photo', 'error')
    } finally {
      setBusy('')
    }
  }

  const handleRemove = async (figId) => {
    await removePhotoForCurrent(figId)
    const next = { ...images }
    delete next[figId]
    setImages(next)
    const nextMeta = { ...meta }
    delete nextMeta[figId]
    set('photos', nextMeta)
    showToast('Photograph removed')
  }

  const capturedCount = Object.keys(images).length

  return (
    <PageShell sectionKey="photographs">
      <Card
        title="Field photographs"
        description="Capture all 13 figures. Each photo is compressed, time-stamped and tagged with GPS coordinates."
        actions={<Pill tone={capturedCount === 13 ? 'comply' : 'warn'}>{capturedCount} of 13 captured</Pill>}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {FIGURES.map((figure, index) => {
            const photoMeta = meta[figure.id] || {}
            const image = images[figure.id]
            return (
              <div key={figure.id} className="overflow-hidden rounded-lg border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-[12px] font-semibold text-slate-800">
                    Fig.{index + 1} · {figure.label}
                  </p>
                  {image ? <Pill tone="comply">Captured</Pill> : <Pill tone="neutral">Pending</Pill>}
                </div>

                {image ? (
                  <img src={image} alt={`Fig.${index + 1} – ${figure.label}`} className="h-44 w-full object-cover" />
                ) : (
                  <div className="flex h-44 w-full items-center justify-center bg-slate-100 text-[12px] text-slate-400">
                    No photograph
                  </div>
                )}

                <div className="space-y-2 p-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn btn-outline btn-sm flex-1"
                      onClick={() => inputs.current[figure.id]?.click()}
                      disabled={busy === figure.id}
                    >
                      {busy === figure.id ? 'Processing…' : image ? 'Replace' : '📷 Capture'}
                    </button>
                    {image && (
                      <button type="button" className="btn-danger btn-sm" onClick={() => handleRemove(figure.id)}>
                        Delete
                      </button>
                    )}
                  </div>
                  <input
                    ref={(el) => {
                      inputs.current[figure.id] = el
                    }}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      handleCapture(figure.id, e.target.files?.[0])
                      e.target.value = ''
                    }}
                  />
                  <TextField
                    label="Caption"
                    value={photoMeta.caption || ''}
                    onChange={(v) => set('photos', { ...meta, [figure.id]: { ...photoMeta, caption: v } })}
                    placeholder="What the photograph shows"
                  />
                  <p className="text-[10px] leading-relaxed text-slate-500">
                    {photoMeta.capturedAt ? `Captured ${formatDateTime(photoMeta.capturedAt)}` : 'Timestamp added on capture'}
                    {photoMeta.gps
                      ? ` · GPS ${photoMeta.gps.lat}, ${photoMeta.gps.lng}${photoMeta.gps.source ? ` (${photoMeta.gps.source})` : ''}`
                      : ' · GPS unavailable'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-600">
          Photographs are stored in this device's offline database (IndexedDB) so they remain available without a network.
          Remove a photo if device storage is full.
        </p>
      </Card>

      <Card title="Photograph remarks">
        <Field label="General remarks on the photographic evidence">
          <textarea
            className="inp"
            rows={2}
            value={photographs.remarks || ''}
            onChange={(e) => set('remarks', e.target.value)}
            placeholder="Any figure that could not be captured and why"
          />
        </Field>
      </Card>
    </PageShell>
  )
}
