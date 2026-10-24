/** Numeric helpers, auto-calculations and compliance logic for textile inspections. */

export const num = (value) => {
  if (value === '' || value === null || value === undefined) return NaN
  const n = Number(value)
  return Number.isFinite(n) ? n : NaN
}

export const isNum = (value) => Number.isFinite(num(value))

export const round = (value, decimals = 2) => {
  const n = num(value)
  if (!Number.isFinite(n)) return ''
  const factor = 10 ** decimals
  return Math.round((n + Number.EPSILON) * factor) / factor
}

export const fmt = (value, decimals = 2) => {
  const n = num(value)
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

/** GSM = (Piece weight g × 39.37 × 1000) / (Piece length in × Piece width in) */
export function gsm({ weight, length, width }) {
  const w = num(weight)
  const l = num(length)
  const fw = num(width)
  if (![w, l, fw].every(Number.isFinite) || l <= 0 || fw <= 0) return ''
  return round((w * 39.37 * 1000) / (l * fw), 1)
}

/** m³/day is numerically equal to KLD */
export const m3ToKld = (value) => (isNum(value) ? round(num(value), 2) : '')

export function kldFromSources(sources = []) {
  const total = sources.reduce((sum, s) => sum + (num(s.quantity) || 0), 0)
  return round(total, 2)
}

/** KL per tonne of production = KLD ÷ production (tonnes/day) */
export function klPerMt(kld, tonnesPerDay) {
  const k = num(kld)
  const t = num(tonnesPerDay)
  if (!Number.isFinite(k) || !Number.isFinite(t) || t <= 0) return ''
  return round(k / t, 3)
}

/** BOD load in kg/day = flow (KLD) × BOD (mg/L) ÷ 1000 */
export function bodLoad(flowKld, bodMgL) {
  const f = num(flowKld)
  const b = num(bodMgL)
  if (!Number.isFinite(f) || !Number.isFinite(b)) return ''
  return round((f * b) / 1000, 2)
}

/** Hydraulic retention time in hours = volume (m³) ÷ flow (m³/hr) */
export function retentionHours(capacityM3, flowM3Hr) {
  const c = num(capacityM3)
  const f = num(flowM3Hr)
  if (!Number.isFinite(c) || !Number.isFinite(f) || f <= 0) return ''
  return round(c / f, 2)
}

export const WATER_BALANCE_TOLERANCE = 10

export function waterBalance({ freshwater, recycled, effluent, sewage }) {
  const fw = num(freshwater) || 0
  const re = num(recycled) || 0
  const eff = num(effluent) || 0
  const sew = num(sewage) || 0
  const consumed = eff + sew
  const difference = round(fw + re - consumed, 2)
  const within = fw + re > 0 ? Math.abs(difference) / (fw + re) * 100 <= WATER_BALANCE_TOLERANCE : true
  return { difference, within }
}

/**
 * Effluent parameters with default general standards for textile dyeing &
 * printing units discharging to inland surface water. Officers can override
 * the norm for each parameter in the table.
 */
export const EFFLUENT_PARAMS = [
  { key: 'ph', label: 'pH', unit: '', min: 5.5, max: 9, norm: '5.5 – 9.0' },
  { key: 'tss', label: 'TSS', unit: 'mg/L', max: 100, norm: '100' },
  { key: 'colour', label: 'Colour', unit: 'Pt-Co', max: 150, norm: '150' },
  { key: 'bod', label: 'BOD (3 d @ 27 °C)', unit: 'mg/L', max: 30, norm: '30' },
  { key: 'oilGrease', label: 'Oil & grease', unit: 'mg/L', max: 10, norm: '10' },
  { key: 'cod', label: 'COD', unit: 'mg/L', max: 250, norm: '250' },
  { key: 'totalCr', label: 'Total chromium', unit: 'mg/L', max: 2, norm: '2.0', yamuna: true },
  { key: 'sulphide', label: 'Sulphide', unit: 'mg/L', max: 0.2, norm: '0.2', yamuna: true },
  { key: 'phenolic', label: 'Phenolic compounds', unit: 'mg/L', max: 0.05, norm: '0.05', yamuna: true },
  { key: 'tds', label: 'TDS', unit: 'mg/L', max: 2100, norm: '2100' },
  { key: 'sar', label: 'SAR', unit: '—', max: 26, norm: '26', yamuna: true },
  { key: 'nh3n', label: 'NH₃-N', unit: 'mg/L', max: 50, norm: '50', yamuna: true },
  { key: 'mlss', label: 'MLSS (aeration tank)', unit: 'mg/L', min: 2000, max: 5000, norm: '2000 – 5000' },
  { key: 'mlvss', label: 'MLVSS (aeration tank)', unit: 'mg/L', min: 1500, max: 4000, norm: '1500 – 4000' },
]

export const SEWAGE_PARAMS = [
  { key: 'ph', label: 'pH', unit: '', min: 5.5, max: 9, norm: '5.5 – 9.0' },
  { key: 'tss', label: 'TSS', unit: 'mg/L', max: 50, norm: '50' },
  { key: 'bod', label: 'BOD', unit: 'mg/L', max: 20, norm: '20' },
  { key: 'cod', label: 'COD', unit: 'mg/L', max: 100, norm: '100' },
  { key: 'fecalColiform', label: 'Faecal coliform', unit: 'MPN/100 mL', max: 1000, norm: '1000' },
]

/** IS 10500:2012 drinking water specification (groundwater comparison). */
export const IS10500 = [
  { key: 'ph', label: 'pH', unit: '', acceptable: '6.5 – 8.5', permissible: 'No relaxation', min: 6.5, max: 8.5 },
  { key: 'tds', label: 'Total dissolved solids', unit: 'mg/L', max: 500, acceptable: '500', permissible: '2000' },
  { key: 'hardness', label: 'Total hardness (CaCO₃)', unit: 'mg/L', max: 200, acceptable: '200', permissible: '600' },
  { key: 'chloride', label: 'Chloride', unit: 'mg/L', max: 250, acceptable: '250', permissible: '1000' },
  { key: 'sulphate', label: 'Sulphate', unit: 'mg/L', max: 200, acceptable: '200', permissible: '400' },
  { key: 'fluoride', label: 'Fluoride', unit: 'mg/L', max: 1, acceptable: '1.0', permissible: '1.5' },
  { key: 'nitrate', label: 'Nitrate (as NO₃)', unit: 'mg/L', max: 45, acceptable: '45', permissible: 'No relaxation' },
  { key: 'iron', label: 'Iron', unit: 'mg/L', max: 0.3, acceptable: '0.3', permissible: 'No relaxation' },
  { key: 'totalCr', label: 'Total chromium', unit: 'mg/L', max: 0.05, acceptable: '0.05', permissible: 'No relaxation' },
]

/** Returns 'comply' | 'non-comply' | null for a measured value against a parameter definition. */
export function evaluate(param, value) {
  const n = num(value)
  if (!Number.isFinite(n) || value === '') return null
  if (Number.isFinite(param.min) && n < param.min) return 'non-comply'
  if (Number.isFinite(param.max) && n > param.max) return 'non-comply'
  return 'comply'
}

export function evaluateNormText(value, normText) {
  const n = num(value)
  if (!Number.isFinite(n) || !normText) return null
  const cleaned = String(normText).replace(/–/g, '-').replace(/\s/g, '')
  const range = cleaned.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/)
  if (range) return n >= Number(range[1]) && n <= Number(range[2]) ? 'comply' : 'non-comply'
  const single = cleaned.match(/^≤?(\d+(?:\.\d+)?)$/)
  if (single) return n <= Number(single[1]) ? 'comply' : 'non-comply'
  return null
}

export function complianceTally(params, values, norms) {
  let comply = 0
  let fail = 0
  for (const param of params) {
    const norm = norms?.[param.key] ?? param.norm
    const verdict = evaluateNormText(values?.[param.key]?.outlet, norm)
    if (verdict === 'comply') comply += 1
    if (verdict === 'non-comply') fail += 1
  }
  return { comply, fail, total: comply + fail, status: fail > 0 ? 'Non-comply' : comply > 0 ? 'Comply' : 'Not assessed' }
}

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export const today = () => new Date().toISOString().slice(0, 10)

export function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
