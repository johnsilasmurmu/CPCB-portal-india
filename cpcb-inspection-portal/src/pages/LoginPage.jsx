import React, { useState } from 'react'
import { useApp } from '../state/AppState'
import { Logo, Field, TextField } from '../components/ui'

export default function LoginPage() {
  const { officer, login, register, showToast } = useApp()
  const [mode, setMode] = useState(officer ? 'signin' : 'register')
  const [form, setForm] = useState({
    name: '',
    designation: '',
    email: officer?.email || '',
    password: '',
    confirm: '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'register') {
        if (form.password !== form.confirm) throw new Error('Passwords do not match')
        await register(form)
        showToast('Officer account created on this device')
      } else {
        await login(form.email, form.password)
        showToast('Signed in')
      }
    } catch (err) {
      setError(err.message || 'Could not sign in')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen bg-slate-50 lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative overflow-hidden bg-gov-green-700 px-6 py-8 text-white sm:px-10 lg:px-12 lg:py-14">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
        <div className="absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-gov-blue-700/40" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-white p-1.5">
              <Logo className="h-10 w-10" />
            </span>
            <div>
              <p className="text-lg font-bold leading-tight">Central Pollution Control Board</p>
              <p className="text-[12px] text-gov-green-100">Industry Inspection Portal – Textile</p>
            </div>
          </div>

          <h1 className="mt-10 max-w-md text-2xl font-bold leading-snug sm:text-3xl">
            Textile Industry Inspection Format
            <span className="mt-1 block text-base font-medium text-gov-green-100">2025-26 · Water Quality Management-II</span>
          </h1>
          <p className="mt-4 max-w-md text-[13px] leading-relaxed text-gov-green-50">
            A field-ready digital format for CPCB and SPCB officers — consents, water balance, effluent and ETP
            performance, hazardous waste, emissions, OCEMS and geo-tagged evidence in one place.
          </p>

          <ul className="mt-8 grid gap-3 text-[13px] text-gov-green-50 sm:grid-cols-2">
            {[
              'Works offline on site visits',
              'Auto-saves every entry',
              'Auto-calculated GSM, KLD, BOD load',
              'Compliance colour coding',
              'Encrypted OCEMS credentials',
              'PDF & Word export',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-0.5 text-gov-green-200">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode('signin')
                  setError('')
                }}
                className={`flex-1 rounded-md px-3 py-2 text-[13px] font-semibold ${
                  mode === 'signin' ? 'bg-white text-gov-green-800 shadow-sm' : 'text-slate-600'
                }`}
              >
                Officer sign in
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register')
                  setError('')
                }}
                className={`flex-1 rounded-md px-3 py-2 text-[13px] font-semibold ${
                  mode === 'register' ? 'bg-white text-gov-green-800 shadow-sm' : 'text-slate-600'
                }`}
              >
                Create account
              </button>
            </div>

            <h2 className="text-lg font-bold text-slate-900">
              {mode === 'signin' ? 'Sign in to continue' : 'Register inspection officer'}
            </h2>
            <p className="mt-1 text-[12px] text-slate-500">
              {mode === 'signin'
                ? 'Use the credentials registered on this device.'
                : 'This account is stored on this device only. The password also encrypts sensitive credentials.'}
            </p>

            <form onSubmit={submit} className="mt-5 space-y-4">
              {mode === 'register' && (
                <>
                  <TextField label="Officer name" required value={form.name} onChange={(v) => set('name', v)} placeholder="Dr. A. K. Verma" autoComplete="name" />
                  <TextField
                    label="Designation"
                    value={form.designation}
                    onChange={(v) => set('designation', v)}
                    placeholder="Scientist 'D', CPCB"
                  />
                </>
              )}
              <TextField
                label="Official email"
                type="email"
                required
                value={form.email}
                onChange={(v) => set('email', v)}
                placeholder="officer@cpcb.nic.in"
                autoComplete="username"
                inputMode="email"
              />
              <Field label="Password" required hint={mode === 'register' ? 'Minimum 8 characters. Used for sign-in and vault encryption.' : undefined}>
                <input
                  className="inp"
                  type="password"
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  required
                />
              </Field>
              {mode === 'register' && (
                <Field label="Confirm password" required>
                  <input
                    className="inp"
                    type="password"
                    value={form.confirm}
                    onChange={(e) => set('confirm', e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </Field>
              )}

              {error && <p className="rounded-md bg-red-50 px-3 py-2 text-[12px] font-medium text-red-700">{error}</p>}

              <button type="submit" className="btn-primary w-full" disabled={busy}>
                {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account & continue'}
              </button>
            </form>

            {officer && mode === 'register' && (
              <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
                An account ({officer.email}) already exists on this device. Creating another replaces it.
              </p>
            )}
          </div>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-500">
            Data stays on this device unless a sync endpoint is configured. Never share inspection data outside
            official CPCB / SPCB channels.
          </p>
        </div>
      </div>
    </div>
  )
}
