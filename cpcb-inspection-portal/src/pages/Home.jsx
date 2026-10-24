import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../state/AppState'
import { overallProgress } from '../lib/sections'
import { formatDate, formatDateTime } from '../lib/calc'
import { Pill, EmptyState, TextField } from '../components/ui'

function StatCard({ label, value, tone }) {
  return (
    <div className="card card-pad">
      <p className={`text-2xl font-bold ${tone}`}>{value}</p>
      <p className="mt-0.5 text-[12px] font-medium text-slate-500">{label}</p>
    </div>
  )
}

export default function Home() {
  const { drafts, officer, startInspection, openInspection, deleteInspection, current, showToast, online, pending } = useApp()
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return drafts
    return drafts.filter((item) => {
      const g = item.data?.general || {}
      return [g.unitCode, g.unitName, g.unitAddress, g.state, g.contactName]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q))
    })
  }, [drafts, query])

  const stats = useMemo(() => {
    const month = new Date().getMonth()
    const year = new Date().getFullYear()
    return {
      thisMonth: drafts.filter((d) => {
        const date = new Date(d.data?.general?.inspectionDate || d.updatedAt)
        return date.getMonth() === month && date.getFullYear() === year
      }).length,
      drafts: drafts.filter((d) => d.status !== 'completed').length,
      completed: drafts.filter((d) => d.status === 'completed').length,
    }
  }, [drafts])

  const handleNew = () => {
    startInspection()
    navigate('/a-general')
  }

  const handleResume = () => {
    const draft = drafts.find((d) => d.status !== 'completed') || drafts[0]
    if (!draft) {
      showToast('No draft found on this device – start a new inspection', 'warn')
      handleNew()
      return
    }
    openInspection(draft.id)
    navigate('/a-general')
    showToast(`Resumed ${draft.data.general.unitCode || 'draft'}`)
  }

  const handleDelete = (draft) => {
    if (window.confirm(`Delete inspection ${draft.data.general.unitCode || 'draft'} from this device? This cannot be undone.`)) {
      deleteInspection(draft.id)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-gov-green-700 via-gov-green-700 to-gov-blue-700 px-5 py-6 text-white sm:px-8 sm:py-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gov-green-100">
            Government of India · Ministry of Environment, Forest &amp; Climate Change
          </p>
          <h1 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">Textile Industry Inspection Format</h1>
          <p className="mt-1 text-sm font-medium text-gov-green-50">2025-26 · Water Quality Management-II</p>
          <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-gov-green-50/95">
            Fill the official inspection format digitally during the site visit. Entries autosave on this device,
            work without a network, and export to the report format for submission.
          </p>
        </div>

        <div className="grid gap-3 px-5 py-5 sm:grid-cols-2 sm:px-8">
          <button type="button" onClick={handleNew} className="btn-primary w-full text-[15px]">
            <span aria-hidden="true">＋</span> Start New Inspection
          </button>
          <button type="button" onClick={handleResume} className="btn-secondary w-full text-[15px]">
            <span aria-hidden="true">↻</span> Resume Draft
          </button>
          {current && (
            <Link to="/review" className="sm:col-span-2 text-center text-[12px] font-semibold text-gov-blue-700 hover:underline">
              Current draft: {current.data.general.unitCode || 'untitled'} · open review &amp; export
            </Link>
          )}
        </div>
      </section>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Inspections this month" value={stats.thisMonth} tone="text-gov-green-700" />
        <StatCard label="Drafts in progress" value={stats.drafts} tone="text-gov-blue-700" />
        <StatCard label="Reports completed" value={stats.completed} tone="text-slate-700" />
      </div>

      <section className="mt-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent inspections</h2>
            <p className="text-[12px] text-slate-500">
              {officer ? `Signed in as ${officer.name}` : 'Officer'} · stored on this device
              {online ? '' : ' · offline'}
              {pending > 0 ? ` · ${pending} queued` : ''}
            </p>
          </div>
          <div className="w-full sm:w-72">
            <TextField
              label=""
              value={query}
              onChange={setQuery}
              placeholder="Search by unit code, name or city"
              aria-label="Search inspections"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title={query ? 'No inspection matches that search' : 'No inspections yet'}
              description={
                query
                  ? 'Try a unit code such as TXT-2025-014, or part of the unit name.'
                  : 'Start a new inspection to create your first draft. Everything saves automatically.'
              }
              action={
                <button type="button" onClick={handleNew} className="btn-primary btn-sm">
                  Start new inspection
                </button>
              }
            />
          </div>
        ) : (
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((draft) => {
              const progress = overallProgress(draft.data)
              const g = draft.data.general || {}
              const compliance = draft.data.ocems?.overallCompliance
              return (
                <article key={draft.id} className="card card-pad flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-gov-blue-700">
                        {g.unitCode || 'Unit code pending'}
                      </p>
                      <h3 className="mt-0.5 truncate text-[15px] font-bold text-slate-900">{g.unitName || 'Untitled unit'}</h3>
                      <p className="mt-0.5 truncate text-[12px] text-slate-500">{g.unitAddress || 'Address not entered'}</p>
                    </div>
                    <Pill tone={draft.status === 'completed' ? 'comply' : 'warn'}>
                      {draft.status === 'completed' ? 'Completed' : 'Draft'}
                    </Pill>
                  </div>

                  <dl className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
                    <div>
                      <dt className="text-slate-500">Inspection date</dt>
                      <dd className="font-medium text-slate-800">{formatDate(g.inspectionDate)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Last saved</dt>
                      <dd className="font-medium text-slate-800">{formatDateTime(draft.updatedAt)}</dd>
                    </div>
                  </dl>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Format completion</span>
                      <span className="font-semibold text-slate-700">{progress.percent}%</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-gov-green-600" style={{ width: `${progress.percent}%` }} />
                    </div>
                  </div>

                  {compliance && (
                    <p className="mt-2">
                      <Pill tone={compliance === 'Compliant' ? 'comply' : compliance === 'Non-compliant' ? 'non-comply' : 'warn'}>
                        {compliance}
                      </Pill>
                    </p>
                  )}

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        openInspection(draft.id)
                        navigate(draft.status === 'completed' ? '/review' : '/a-general')
                      }}
                      className="btn-primary btn-sm flex-1"
                    >
                      {draft.status === 'completed' ? 'View report' : 'Continue'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(draft)}
                      className="btn-danger btn-sm"
                      aria-label={`Delete ${g.unitCode || 'draft'}`}
                    >
                      Delete
                    </button>
                  </div>
                  {draft.isSample && <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">Sample record · replace with your own data</p>}
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          { title: 'Work offline', body: 'Photos and entries are stored on the device. The app keeps working without a network and queues changes for sync.' },
          { title: 'Automatic calculations', body: 'GSM, KLD, KL/MT, BOD load, retention time and compliance flags are computed as you type.' },
          { title: 'Export the report', body: 'Review completeness, then export the official format as PDF or Word for submission.' },
        ].map((card) => (
          <div key={card.title} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-[13px] font-bold text-slate-900">{card.title}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-slate-600">{card.body}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
