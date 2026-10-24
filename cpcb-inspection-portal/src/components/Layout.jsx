import React from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useApp } from '../state/AppState'
import { SECTIONS, overallProgress, sectionProgress } from '../lib/sections'
import { Logo } from './ui'

function navClass({ isActive }) {
  return `nav-link ${isActive ? 'nav-link-active' : ''}`
}

export default function Layout({ children }) {
  const { current, officer, logout, online, pending, syncing, runSync, toast, quotaWarning, lastSavedAt } = useApp()
  const location = useLocation()
  const overall = current ? overallProgress(current.data) : null

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <a href="#main" className="sr-only focus:not-sr-only">
        Skip to content
      </a>

      <header className="no-print sticky top-0 z-40 bg-white shadow-sm">
        <div className="h-1 w-full bg-gradient-to-r from-gov-green-600 via-gov-green-600 to-gov-blue-700" />
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <Logo className="h-10 w-10 shrink-0 sm:h-12 sm:w-12" />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold leading-tight text-slate-900 sm:text-lg">
                Central Pollution Control Board
              </p>
              <p className="truncate text-[11px] font-medium text-gov-green-700 sm:text-[13px]">
                Industry Inspection Portal – Textile
              </p>
            </div>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            {current && (
              <span className="hidden rounded-full border border-gov-green-200 bg-gov-green-50 px-2.5 py-1 text-[11px] font-semibold text-gov-green-800 sm:inline-flex">
                {overall.percent}% complete
              </span>
            )}
            {officer && (
              <div className="flex items-center gap-2">
                <div className="hidden text-right sm:block">
                  <p className="text-[12px] font-semibold leading-tight text-slate-800">{officer.name}</p>
                  <p className="text-[10px] text-slate-500">{officer.designation}</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gov-blue-700 text-[12px] font-bold text-white">
                  {officer.name
                    .split(' ')
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join('')}
                </div>
                <button type="button" onClick={logout} className="rounded-md px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100">
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>

        <nav aria-label="Inspection format sections" className="border-t border-slate-200">
          <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 py-2 sm:px-5">
            <NavLink to="/" end className={navClass}>
              Home
            </NavLink>
            {SECTIONS.map((section) => {
              const complete = current ? sectionProgress(section.key, current.data).percent === 100 : false
              return (
                <NavLink key={section.key} to={section.path} className={navClass}>
                  {section.nav}
                  {complete && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-label="section complete" />}
                </NavLink>
              )
            })}
            <NavLink to="/review" className={navClass}>
              Review &amp; Export
            </NavLink>
          </div>
        </nav>
      </header>

      {(!online || pending > 0) && (
        <div className="no-print border-b border-amber-300 bg-amber-50">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-2 text-[12px] text-amber-900 sm:px-6">
            <span className="font-semibold">{online ? 'Pending sync' : 'Offline mode'}</span>
            <span>
              {online
                ? `${pending} change${pending === 1 ? '' : 's'} queued for sync.`
                : 'All entries are saved on this device and will sync when you are back online.'}
            </span>
            {online && pending > 0 && (
              <button type="button" onClick={() => runSync()} disabled={syncing} className="btn btn-outline btn-sm ml-auto">
                {syncing ? 'Syncing…' : 'Sync now'}
              </button>
            )}
          </div>
        </div>
      )}

      {quotaWarning && (
        <div className="no-print border-b border-red-300 bg-red-50 px-4 py-2 text-center text-[12px] font-medium text-red-800">
          Device storage is full. Remove some photographs or export and close old drafts.
        </div>
      )}

      <main id="main" className="flex-1">
        {children}
      </main>

      <footer className="no-print border-t border-slate-200 bg-white px-4 py-5 text-center text-[11px] text-slate-500">
        <p className="font-medium text-slate-600">
          Textile Industry Inspection Format 2025-26 · Water Quality Management-II
        </p>
        <p className="mt-1">
          Drafts are stored on this device{lastSavedAt ? ' · autosave enabled' : ''} · {location.pathname === '/' ? 'Home' : 'Inspection in progress'}
        </p>
        <p className="mt-1 text-slate-400">For official use by CPCB / SPCB inspection officers only.</p>
      </footer>

      {toast && (
        <div
          role="status"
          className={`no-print fixed bottom-20 left-1/2 z-50 w-[92%] max-w-sm -translate-x-1/2 rounded-lg px-4 py-2.5 text-center text-[13px] font-medium shadow-lg lg:bottom-6 ${
            toast.tone === 'error'
              ? 'bg-red-600 text-white'
              : toast.tone === 'warn'
                ? 'bg-amber-500 text-white'
                : toast.tone === 'offline'
                  ? 'bg-slate-800 text-white'
                  : 'bg-gov-green-700 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}
