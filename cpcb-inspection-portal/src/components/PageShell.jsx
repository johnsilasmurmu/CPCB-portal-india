import React, { useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../state/AppState'
import { FLOW, REVIEW_STEP, SECTIONS, sectionProgress, overallProgress } from '../lib/sections'
import { formatDateTime } from '../lib/calc'

/** Section-scoped state binding: [values, set(field, value), patch(object)] */
export function useSection(key) {
  const { current, updateSection } = useApp()
  const values = current?.data?.[key] ?? {}
  const set = useCallback((field, value) => updateSection(key, { [field]: value }), [key, updateSection])
  const patch = useCallback((delta) => updateSection(key, delta), [key, updateSection])
  return [values, set, patch]
}

export default function PageShell({ sectionKey, children, aside }) {
  const { current, startInspection, saveNow, lastSavedAt, online, showToast } = useApp()
  const navigate = useNavigate()
  const [attempted, setAttempted] = React.useState(false)

  const isReview = sectionKey === 'review'
  const section = isReview ? REVIEW_STEP : SECTIONS.find((s) => s.key === sectionKey)
  const index = isReview ? FLOW.length - 1 : FLOW.indexOf(sectionKey)
  const prevKey = index > 0 ? FLOW[index - 1] : null
  const nextKey = index >= 0 && index < FLOW.length - 1 ? FLOW[index + 1] : null

  const routeFor = (key) => (key === 'review' ? '/review' : SECTIONS.find((s) => s.key === key)?.path || '/')
  const labelFor = (key) => (key === 'review' ? 'Review & Export' : SECTIONS.find((s) => s.key === key)?.nav || '')

  if (!current) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold">No inspection selected</h1>
        <p className="mt-2 text-sm text-slate-600">Start a new inspection or resume a saved draft to begin data entry.</p>
        <button
          type="button"
          className="btn-primary mt-5"
          onClick={() => {
            startInspection()
            navigate('/a-general')
          }}
        >
          Start new inspection
        </button>
      </div>
    )
  }

  const overall = overallProgress(current.data)
  const progress = isReview ? { done: overall.done, total: overall.total, missing: [], percent: overall.percent } : sectionProgress(sectionKey, current.data)
  const incomplete = progress.missing.length > 0

  const goNext = () => {
    if (incomplete && !attempted) {
      setAttempted(true)
      showToast(`${progress.missing.length} required field${progress.missing.length > 1 ? 's' : ''} pending in this section`, 'warn')
      return
    }
    saveNow()
    if (nextKey) navigate(routeFor(nextKey))
  }

  return (
    <div className="pb-28 lg:pb-10">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gov-blue-700">
                {current.data.general.unitCode || 'New draft'} · {current.data.general.unitName || 'Unit not named'}
              </p>
              <h1 className="mt-1 text-xl font-bold sm:text-2xl">{section?.title}</h1>
              <p className="mt-1 text-[13px] text-slate-500">{section?.subtitle}</p>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className={`h-2 w-2 rounded-full ${online ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {lastSavedAt ? `Saved ${formatDateTime(lastSavedAt)}` : 'Autosave on'}
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
              <span>
                {isReview ? 'All sections' : 'Section'} {progress.done}/{progress.total} required fields
              </span>
              <span>Overall {overall.percent}% ({overall.done}/{overall.total})</span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-gov-green-600 transition-all" style={{ width: `${progress.percent}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
        {attempted && incomplete && (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-[13px] text-amber-900">
            <p className="font-semibold">Required fields still pending</p>
            <ul className="mt-1 list-disc pl-5">
              {progress.missing.map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
            <p className="mt-1 text-amber-800">You can continue — the draft autosaves and these will be flagged again at review.</p>
          </div>
        )}
        <div className="space-y-4">
          {children}
          {aside}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-3 py-2.5 backdrop-blur no-print lg:static lg:mx-auto lg:mt-6 lg:max-w-5xl lg:rounded-xl lg:border lg:px-4">
        <div className="mx-auto flex max-w-5xl items-center gap-2">
          {prevKey ? (
            <Link to={routeFor(prevKey)} className="btn btn-outline btn-sm flex-1 lg:flex-none">
              ← <span className="hidden sm:inline">{labelFor(prevKey)}</span><span className="sm:hidden">Previous</span>
            </Link>
          ) : (
            <Link to="/" className="btn btn-outline btn-sm flex-1 lg:flex-none">
              ← Home
            </Link>
          )}
          <button type="button" onClick={saveNow} className="btn btn-secondary btn-sm">
            Save
          </button>
          {nextKey ? (
            <button type="button" onClick={goNext} className="btn-primary btn-sm flex-1 lg:flex-none">
              {incomplete && attempted ? 'Next anyway' : 'Save & Next'}
            </button>
          ) : (
            <Link to="/" className="btn-primary btn-sm flex-1 lg:flex-none">
              Finish &amp; go home
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
