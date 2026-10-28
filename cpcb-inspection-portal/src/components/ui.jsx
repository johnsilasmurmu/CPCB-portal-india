import React from 'react'

export function Logo({ className = 'h-11 w-11' }) {
  return (
    <img src="/cpcb_logo.jpg" className={className} alt="CPCB emblem" />
  )
}

export function Field({ label, required, hint, error, children, className = '' }) {
  const isNativeControl =
    React.isValidElement(children) && ['input', 'select', 'textarea'].includes(children.type)
  const labelled =
    label && isNativeControl && !children.props['aria-label']
      ? React.cloneElement(children, { 'aria-label': label })
      : children
  return (
    <div className={className}>
      {label && (
        <label className="lbl">
          {label}
          {required && <span className="ml-1 text-red-600" aria-hidden="true">*</span>}
        </label>
      )}
      {labelled}
      {hint && !error && <p className="hint">{hint}</p>}
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  )
}

export function TextField({
  label,
  value = '',
  onChange,
  type = 'text',
  placeholder,
  required,
  hint,
  error,
  unit,
  className = '',
  ...rest
}) {
  return (
    <Field label={label} required={required} hint={hint} error={error} className={className}>
      <div className="relative">
        <input
          aria-label={label}
          className={`inp ${unit ? 'pr-16' : ''}`}
          type={type}
          value={value ?? ''}
          placeholder={placeholder}
          onChange={(e) => onChange?.(e.target.value)}
          {...rest}
        />
        {unit && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-slate-500">
            {unit}
          </span>
        )}
      </div>
    </Field>
  )
}

export function TextArea({ label, value = '', onChange, placeholder, rows = 3, hint, required, error, className = '' }) {
  return (
    <Field label={label} required={required} hint={hint} error={error} className={className}>
      <textarea
        aria-label={label}
        className="inp resize-y"
        rows={rows}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </Field>
  )
}

export function SelectField({ label, value = '', onChange, options = [], placeholder = 'Select…', required, hint, error, className = '' }) {
  return (
    <Field label={label} required={required} hint={hint} error={error} className={className}>
      <select aria-label={label} className="inp" value={value ?? ''} onChange={(e) => onChange?.(e.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((opt) => {
          const option = typeof opt === 'string' ? { value: opt, label: opt } : opt
          return (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          )
        })}
      </select>
    </Field>
  )
}

export function RadioGroup({ label, value = '', onChange, options = [], required, hint, columns = 'grid-cols-2 sm:grid-cols-3' }) {
  return (
    <Field label={label} required={required} hint={hint}>
      <div className={`grid gap-2 ${columns}`} role="radiogroup" aria-label={label}>
        {options.map((opt) => {
          const option = typeof opt === 'string' ? { value: opt, label: opt } : opt
          const active = value === option.value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange?.(option.value)}
              className={`flex min-h-[44px] items-center gap-2 rounded-lg border px-3 py-2 text-left text-[13px] font-medium transition-colors ${
                active
                  ? 'border-gov-green-600 bg-gov-green-50 text-gov-green-800 ring-1 ring-gov-green-600'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                  active ? 'border-gov-green-600' : 'border-slate-400'
                }`}
              >
                {active && <span className="h-2 w-2 rounded-full bg-gov-green-600" />}
              </span>
              {option.label}
            </button>
          )
        })}
      </div>
    </Field>
  )
}

export const YES_NO = [
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' },
]

export function YesNo({ label, value, onChange, required, hint }) {
  return (
    <RadioGroup
      label={label}
      value={value}
      onChange={onChange}
      options={YES_NO}
      required={required}
      hint={hint}
      columns="grid-cols-2"
    />
  )
}

export function CheckGroup({ label, value = [], onChange, options = [], hint }) {
  const toggle = (option) => {
    const set = new Set(value)
    if (set.has(option)) set.delete(option)
    else set.add(option)
    onChange?.(Array.from(set))
  }
  return (
    <Field label={label} hint={hint}>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((opt) => {
          const option = typeof opt === 'string' ? { value: opt, label: opt } : opt
          const checked = value.includes(option.value)
          return (
            <label
              key={option.value}
              className={`flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-[13px] ${
                checked ? 'border-gov-blue-600 bg-gov-blue-50 text-gov-blue-900' : 'border-slate-300 bg-white text-slate-700'
              }`}
            >
              <input
                type="checkbox"
                className="h-4 w-4 accent-gov-blue-600"
                checked={checked}
                onChange={() => toggle(option.value)}
              />
              {option.label}
            </label>
          )
        })}
      </div>
    </Field>
  )
}

export function FileField({ label, fileName, onChange, accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx', hint, required }) {
  return (
    <Field label={label} required={required} hint={hint}>
      <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5 text-[13px] text-slate-600 hover:border-gov-green-600 hover:bg-gov-green-50">
        <span className="rounded bg-white px-2 py-1 text-xs font-semibold text-gov-green-700 shadow-sm">Choose file</span>
        <span className="truncate">{fileName || 'No file selected'}</span>
        <input type="file" aria-label={label} accept={accept} className="hidden" onChange={(e) => onChange?.(e.target.files?.[0] || null)} />
      </label>
    </Field>
  )
}

export function ValueField({ label, value, unit, hint }) {
  return (
    <Field label={label} hint={hint}>
      <div className="flex min-h-[44px] items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <span className="text-[15px] font-semibold text-slate-800">{value === '' || value === undefined || value === null ? '—' : value}</span>
        {unit && <span className="text-xs font-medium text-slate-500">{unit}</span>}
      </div>
    </Field>
  )
}

const pillStyles = {
  comply: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  'non-comply': 'bg-red-100 text-red-800 border border-red-200',
  warn: 'bg-amber-100 text-amber-800 border border-amber-200',
  neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
  info: 'bg-gov-blue-50 text-gov-blue-700 border border-gov-blue-200',
}

export function Pill({ tone = 'neutral', children }) {
  return <span className={`chip ${pillStyles[tone] || pillStyles.neutral}`}>{children}</span>
}

export function CompliancePill({ status }) {
  if (!status) return <span className="text-xs text-slate-400">—</span>
  if (status === 'comply') return <Pill tone="comply">Comply</Pill>
  if (status === 'non-comply') return <Pill tone="non-comply">Non-comply</Pill>
  return <Pill tone="warn">{status}</Pill>
}

export function Card({ title, description, children, className = '', actions }) {
  return (
    <section className={`card card-pad ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="section-heading">{title}</h2>}
            {description && <p className="mt-1 text-[13px] text-slate-500">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}

export function TableWrap({ children, className = '' }) {
  return (
    <div className={`-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0 ${className}`}>
      <div className="min-w-[640px] sm:min-w-full">{children}</div>
    </div>
  )
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {description && <p className="mt-1 text-[13px] text-slate-500">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

export function AddRowButton({ onClick, label = 'Add row' }) {
  return (
    <button type="button" onClick={onClick} className="btn btn-outline btn-sm w-full sm:w-auto">
      <span aria-hidden="true">＋</span> {label}
    </button>
  )
}

export function DeleteRowButton({ onClick, label = 'Delete row' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
      aria-label={label}
    >
      Delete
    </button>
  )
}

export function InlineInput({ value, onChange, type = 'text', placeholder, ariaLabel, className = '' }) {
  return (
    <input
      aria-label={ariaLabel}
      className={`inp inp-sm w-full min-w-[90px] ${className}`}
      type={type}
      value={value ?? ''}
      placeholder={placeholder}
      onChange={(e) => onChange?.(e.target.value)}
    />
  )
}

export function InlineSelect({ value, onChange, options = [], placeholder = 'Select', ariaLabel }) {
  return (
    <select aria-label={ariaLabel} className="inp inp-sm w-full min-w-[110px]" value={value ?? ''} onChange={(e) => onChange?.(e.target.value)}>
      <option value="">{placeholder}</option>
      {options.map((opt) => {
        const option = typeof opt === 'string' ? { value: opt, label: opt } : opt
        return (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        )
      })}
    </select>
  )
}
