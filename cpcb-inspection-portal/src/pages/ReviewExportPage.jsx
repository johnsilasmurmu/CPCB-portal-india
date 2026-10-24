import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageShell from '../components/PageShell'
import { Card, Pill, TableWrap, CompliancePill } from '../components/ui'
import { useApp } from '../state/AppState'
import { missingReport, overallProgress } from '../lib/sections'
import { EFFLUENT_PARAMS, evaluateNormText, fmt, num, round } from '../lib/calc'
import { buildReport } from '../lib/report'
import { exportReportDocx, exportReportPdf } from '../lib/export'

const PHOTO_IDS = ['fig1', 'fig2', 'fig3', 'fig4', 'fig5', 'fig6', 'fig7', 'fig8', 'fig9', 'fig10', 'fig11', 'fig12', 'fig13']

export default function ReviewExportPage() {
  const { current, setInspectionMeta, saveNow, showToast, loadPhotoForCurrent } = useApp()
  const navigate = useNavigate()
  const [busy, setBusy] = useState('')
  const [includePhotos, setIncludePhotos] = useState(true)

  const progress = useMemo(() => (current ? overallProgress(current.data) : { percent: 0, done: 0, total: 0 }), [current])
  const missing = useMemo(() => (current ? missingReport(current.data) : []), [current])

  if (!current) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold">No inspection selected</h1>
        <Link to="/" className="btn-primary mt-4">Go to home</Link>
      </div>
    )
  }

  const effluent = current.data.effluent || {}
  const yamuna = effluent.yamunaApplicable === 'Yes'
  const params = EFFLUENT_PARAMS.filter((param) => !param.yamuna || yamuna)
  const fails = params.filter(
    (param) => evaluateNormText(effluent.characteristics?.[param.key]?.outlet, effluent.norms?.[param.key] ?? param.norm) === 'non-comply',
  )
  const compliance = current.data.ocems?.overallCompliance || 'Not assessed'
  const photosCaptured = Object.keys(current.data.photographs?.photos || {}).length

  const gatherPhotos = async () => {
    const entries = await Promise.all(PHOTO_IDS.map(async (id) => [id, await loadPhotoForCurrent(id)]))
    return Object.fromEntries(entries.filter(([, value]) => value))
  }

  const handleExport = async (format) => {
    setBusy(format)
    try {
      saveNow()
      const photos = includePhotos ? await gatherPhotos() : {}
      const report = buildReport(current, photos)
      if (format === 'pdf') {
        const result = exportReportPdf(report, { includePhotos })
        showToast(`PDF exported (${result.pageCount} pages)`)
      } else {
        await exportReportDocx(report, { includePhotos })
        showToast('Word document exported')
      }
    } catch (err) {
      showToast(err.message || 'Export failed', 'error')
    } finally {
      setBusy('')
    }
  }

  const toggleComplete = () => {
    const completed = current.status === 'completed'
    setInspectionMeta({
      status: completed ? 'draft' : 'completed',
      submittedOn: completed ? null : new Date().toISOString(),
    })
    saveNow()
    showToast(completed ? 'Inspection reopened as draft' : 'Inspection marked complete')
  }

  return (
    <PageShell sectionKey="review">
      <div className="space-y-4">
        <Card title="Report readiness" description="Review completeness before generating the official report">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-2xl font-bold text-gov-green-700">{progress.percent}%</p>
              <p className="text-[12px] text-slate-500">Required fields complete ({progress.done}/{progress.total})</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-2xl font-bold text-gov-blue-700">{photosCaptured}/13</p>
              <p className="text-[12px] text-slate-500">Photographs captured</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-sm font-semibold">
                <Pill tone={compliance === 'Compliant' ? 'comply' : compliance === 'Non-compliant' ? 'non-comply' : 'warn'}>{compliance}</Pill>
              </p>
              <p className="mt-2 text-[12px] text-slate-500">Overall compliance status</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-50 p-3 text-[12px] text-slate-600">
              <p className="font-semibold text-slate-800">Water & effluent snapshot</p>
              <ul className="mt-1 space-y-0.5">
                <li>Freshwater use: {fmt(num(current.data.water?.consumption?.production) + num(current.data.water?.consumption?.domestic) + num(current.data.water?.consumption?.others), 1)} KLD</li>
                <li>Effluent generated: {fmt(effluent.generated, 1) || '—'} KLD · recycled {fmt(effluent.recycled, 1) || '0'} KLD</li>
                <li>Outlets consented / observed: {effluent.outlets?.consented || '—'} / {effluent.outlets?.observed || '—'}</li>
                <li>Bypass observed: {effluent.bypass?.observed || '—'}</li>
              </ul>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 text-[12px] text-slate-600">
              <p className="font-semibold text-slate-800">Effluent compliance</p>
              {fails.length ? (
                <ul className="mt-1 space-y-0.5 text-red-700">
                  {fails.map((param) => (
                    <li key={param.key}>
                      {param.label}: {effluent.characteristics?.[param.key]?.outlet} (norm {effluent.norms?.[param.key] ?? param.norm})
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-emerald-700">All analysed outlet parameters are within the applicable norms.</p>
              )}
            </div>
          </div>
        </Card>

        <Card title="Section completion" description="Tap a section to complete pending fields">
          <div className="divide-y divide-slate-100">
            {missing.map((item) => (
              <div key={item.key} className="flex flex-wrap items-center gap-2 py-2.5">
                <div className="min-w-0 flex-1">
                  <Link to={item.path} className="text-[13px] font-semibold text-gov-blue-700 hover:underline">
                    {item.nav}
                  </Link>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full rounded-full ${item.percent === 100 ? 'bg-emerald-500' : item.percent >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-slate-500">{item.done}/{item.total}</span>
                  </div>
                  {item.missing.length > 0 && <p className="mt-1 text-[11px] text-amber-700">Pending: {item.missing.join(', ')}</p>}
                </div>
                {item.percent === 100 ? <Pill tone="comply">Complete</Pill> : <Pill tone="warn">{item.percent}%</Pill>}
              </div>
            ))}
          </div>
          {progress.percent === 100 && <p className="mt-3 text-[12px] font-medium text-emerald-700">All required fields are complete.</p>}
        </Card>

        <Card title="Export report" description="PDF and Word documents follow the official inspection format">
          <label className="flex items-center gap-2 text-[13px] text-slate-700">
            <input type="checkbox" className="h-4 w-4 accent-gov-green-600" checked={includePhotos} onChange={(e) => setIncludePhotos(e.target.checked)} />
            Embed the 13 field photographs (increases file size)
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <button type="button" className="btn-primary" disabled={busy !== ''} onClick={() => handleExport('pdf')}>
              {busy === 'pdf' ? 'Generating PDF…' : 'Export PDF'}
            </button>
            <button type="button" className="btn-secondary" disabled={busy !== ''} onClick={() => handleExport('docx')}>
              {busy === 'docx' ? 'Generating Word file…' : 'Export DOCX'}
            </button>
          </div>
          <p className="mt-3 text-[11px] text-slate-500">
            The export includes all sections, auto-calculated values, compliance results and a list of any fields that were
            still pending when the report was generated.
          </p>
        </Card>

        <Card title="Submission status">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[13px] font-semibold text-slate-800">
                Current status: <Pill tone={current.status === 'completed' ? 'comply' : 'warn'}>{current.status === 'completed' ? 'Completed' : 'Draft'}</Pill>
              </p>
              <p className="mt-1 text-[12px] text-slate-500">
                {current.submittedOn ? `Marked complete on ${new Date(current.submittedOn).toLocaleString('en-IN')}` : 'The inspection is still a working draft.'}
              </p>
            </div>
            <button type="button" className={`btn ${current.status === 'completed' ? 'btn-outline' : 'btn-primary'}`} onClick={toggleComplete}>
              {current.status === 'completed' ? 'Reopen as draft' : 'Mark inspection complete'}
            </button>
          </div>
        </Card>

        <Card title="Inspection summary" description="Values carried into the report">
          <TableWrap>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Outlet</th>
                  <th>Norm</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {params.slice(0, 10).map((param) => {
                  const norm = effluent.norms?.[param.key] ?? param.norm
                  return (
                    <tr key={param.key}>
                      <td>{param.label}</td>
                      <td>{effluent.characteristics?.[param.key]?.outlet || '—'}</td>
                      <td>{norm}</td>
                      <td>
                        <CompliancePill status={evaluateNormText(effluent.characteristics?.[param.key]?.outlet, norm)} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </TableWrap>
          <p className="mt-3 text-[11px] text-slate-500">
            BOD load: {(() => {
              const flow = num(effluent.generated) - (num(effluent.recycled) || 0)
              const bod = num(effluent.characteristics?.bod?.outlet)
              return Number.isFinite(flow) && Number.isFinite(bod) ? `${fmt(round((flow * bod) / 1000, 2), 2)} kg/day` : '—'
            })()}
          </p>
        </Card>

        <div className="flex justify-between print:hidden">
          <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <Link to="/" className="btn btn-outline">
            Home
          </Link>
        </div>
      </div>
    </PageShell>
  )
}
