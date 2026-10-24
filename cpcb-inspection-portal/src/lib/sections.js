/**
 * Section manifest for the CPCB Textile Industry Inspection Format
 * (Water Quality Management-II, 2025-26).
 *
 * `required` drives both per-page validation and the completion meter.
 * Each entry: { key: dotted path, label: human label, test?: (value, data) => boolean }
 */

export const SECTIONS = [
  {
    key: 'general',
    letter: 'A',
    nav: 'A. General',
    title: 'General Information',
    subtitle: 'Unit identification, location and operational status',
    path: '/a-general',
    required: [
      { key: 'inspectionDate', label: 'Date of inspection' },
      { key: 'unitCode', label: 'Unit code' },
      { key: 'unitName', label: 'Unit name' },
      { key: 'unitAddress', label: 'Unit address' },
      { key: 'latitude', label: 'Latitude' },
      { key: 'longitude', label: 'Longitude' },
      { key: 'contactName', label: 'Contact person name' },
      { key: 'contactPhone', label: 'Contact phone' },
      { key: 'yearCommissioning', label: 'Year of commissioning' },
      { key: 'spcbOffice', label: 'SPCB regional office' },
      { key: 'operationalStatus', label: 'Operational status' },
    ],
  },
  {
    key: 'consent',
    letter: 'B',
    nav: 'B. Consent',
    title: 'Consents & Authorisations',
    subtitle: 'Air, water, hazardous waste and CGWA clearance status',
    path: '/b-consent',
    required: [
      { key: 'air.status', label: 'Air consent validity' },
      { key: 'water.status', label: 'Water consent validity' },
    ],
  },
  {
    key: 'production',
    letter: 'C',
    nav: 'C. Production',
    title: 'Production, Process & Infrastructure',
    subtitle: 'Operating pattern, products, machines and chemicals',
    path: '/c-production',
    required: [
      { key: 'operatingDays', label: 'Operating days (last 3 months)' },
      { key: 'hoursPerDay', label: 'Operating hours per day' },
      { key: 'industryNature', label: 'Industry type (nature of fibre)' },
      { key: 'processType', label: 'Process type' },
      { key: 'installedCapacity', label: 'Installed capacity (kg/day)' },
      { key: 'products', label: 'Products manufactured' },
    ],
  },
  {
    key: 'water',
    letter: 'D',
    nav: 'D. Water',
    title: 'Water Consumption',
    subtitle: 'Freshwater sources, flow meters and CGWA abstraction',
    path: '/d-water',
    required: [
      { key: 'sources', label: 'At least one freshwater source', test: (v) => Array.isArray(v) && v.some((s) => s.name) },
      { key: 'cgwa.borewells', label: 'CGWA borewell count' },
      { key: 'cgwa.permitted', label: 'CGWA permitted withdrawal' },
      { key: 'consumption.production', label: 'Freshwater used in production (KLD)' },
    ],
  },
  {
    key: 'effluent',
    letter: 'E',
    nav: 'E. Effluent',
    title: 'Effluent Generation & Characteristics',
    subtitle: 'Generation, discharge route, analysis and compliance',
    path: '/e-effluent',
    required: [
      { key: 'generated', label: 'Effluent generated (KLD)' },
      { key: 'modeOfDischarge', label: 'Mode of discharge' },
      { key: 'receivingBody', label: 'Receiving body / drain' },
      { key: 'characteristics.ph.outlet', label: 'Outlet pH' },
      { key: 'characteristics.bod.outlet', label: 'Outlet BOD' },
      { key: 'characteristics.cod.outlet', label: 'Outlet COD' },
      { key: 'bypass.observed', label: 'Bypass check result' },
    ],
  },
  {
    key: 'etp',
    letter: 'ETP',
    nav: 'ETP',
    title: 'Effluent Treatment Plant',
    subtitle: 'Technology, unit-wise adequacy, sludge and laboratory',
    path: '/etp',
    required: [
      { key: 'status', label: 'ETP status' },
      { key: 'installedCapacity', label: 'Installed capacity (KLD)' },
      { key: 'technology', label: 'Treatment technology' },
      { key: 'units', label: 'At least one ETP unit', test: (v) => Array.isArray(v) && v.some((u) => u.name) },
    ],
  },
  {
    key: 'sewage',
    letter: 'F',
    nav: 'F. Sewage',
    title: 'Sewage Generation & Treatment',
    subtitle: 'STP capacity, discharge and treated sewage quality',
    path: '/f-sewage',
    required: [
      { key: 'generated', label: 'Sewage generated (KLD)' },
      { key: 'stpStatus', label: 'STP status' },
      { key: 'modeOfDischarge', label: 'Mode of sewage discharge' },
    ],
  },
  {
    key: 'hazardous',
    letter: 'G',
    nav: 'G. Hazardous Waste',
    title: 'Hazardous Waste Management',
    subtitle: 'Authorised vs generated quantities, disposal and records',
    path: '/g-hazardous',
    required: [
      { key: 'items', label: 'At least one hazardous waste entry', test: (v) => Array.isArray(v) && v.some((i) => i.name) },
      { key: 'form4Maintained', label: 'Form-4 register maintained' },
      { key: 'form10Maintained', label: 'Form-10 annual return filed' },
    ],
  },
  {
    key: 'fuel',
    letter: 'H',
    nav: 'H. Fuel',
    title: 'Fuel Consumption',
    subtitle: 'Fuel types, monthly consumption and day-of-visit usage',
    path: '/h-fuel',
    required: [
      { key: 'items', label: 'At least one fuel entry', test: (v) => Array.isArray(v) && v.some((i) => i.type) },
    ],
  },
  {
    key: 'air',
    letter: 'I',
    nav: 'I. Air',
    title: 'Air Pollution & Emissions',
    subtitle: 'Stacks, APCD, emission reports and DG sets',
    path: '/i-air',
    required: [
      { key: 'sources', label: 'Air pollution sources' },
      { key: 'chimneys', label: 'At least one chimney', test: (v) => Array.isArray(v) && v.some((c) => c.stack) },
      { key: 'emissionWithinNorms', label: 'Emission quality within norms' },
    ],
  },
  {
    key: 'ocems',
    letter: 'J',
    nav: 'J. OCEMS & Observations',
    title: 'OCEMS, Observations & Recommendations',
    subtitle: 'Real-time monitoring, findings and signing team',
    path: '/j-ocems',
    required: [
      { key: 'ocemsInstalled', label: 'OCEMS installation status' },
      { key: 'overallCompliance', label: 'Overall compliance status' },
      { key: 'observations', label: 'Observations / key issues' },
      { key: 'team', label: 'Inspection team member', test: (v) => Array.isArray(v) && v.some((m) => m.name) },
    ],
  },
  {
    key: 'photographs',
    letter: 'P',
    nav: 'Photographs',
    title: 'Photographs',
    subtitle: '13 geo-tagged, time-stamped figures',
    path: '/photographs',
    required: [
      {
        key: 'photos',
        label: 'Entrance gate photo (Fig. 1)',
        test: (v) => Boolean(v && v.fig1 && v.fig1.dataUrl),
      },
    ],
  },
  {
    key: 'documents',
    letter: 'D',
    nav: 'Documents',
    title: 'Documents Checklist',
    subtitle: 'Consents, logbooks and supporting records verified on site',
    path: '/documents',
    required: [
      { key: 'consentAir', label: 'Air consent verified' },
      { key: 'consentWater', label: 'Water consent verified' },
      { key: 'logETP', label: 'ETP logbook verified' },
    ],
  },
]

export const FLOW = [
  ...SECTIONS.map((s) => s.key),
  'review',
]

export const REVIEW_STEP = {
  key: 'review',
  nav: 'Review & Export',
  title: 'Review & Export',
  path: '/review',
}

const getPath = (obj, path) =>
  path.split('.').reduce((acc, part) => (acc == null ? undefined : acc[part]), obj)

const isEmpty = (value) =>
  value === undefined ||
  value === null ||
  value === '' ||
  (Array.isArray(value) && value.length === 0)

export function sectionProgress(sectionKey, data) {
  const section = SECTIONS.find((s) => s.key === sectionKey)
  if (!section) return { total: 0, done: 0, missing: [], percent: 100 }
  const missing = []
  let done = 0
  for (const field of section.required) {
    const value = getPath(data, field.key)
    const ok = field.test ? field.test(value, data) : !isEmpty(value)
    if (ok) done += 1
    else missing.push(field.label)
  }
  return {
    total: section.required.length,
    done,
    missing,
    percent: section.required.length ? Math.round((done / section.required.length) * 100) : 100,
  }
}

export function overallProgress(data) {
  let total = 0
  let done = 0
  for (const section of SECTIONS) {
    const p = sectionProgress(section.key, data)
    total += p.total
    done += p.done
  }
  return { total, done, percent: total ? Math.round((done / total) * 100) : 0 }
}

export function missingReport(data) {
  return SECTIONS.map((section) => ({
    key: section.key,
    nav: section.nav,
    path: section.path,
    ...sectionProgress(section.key, data),
  }))
}

export { getPath }
