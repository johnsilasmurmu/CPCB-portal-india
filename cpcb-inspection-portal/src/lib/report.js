import {
  SEWAGE_PARAMS,
  EFFLUENT_PARAMS,
  IS10500,
  bodLoad,
  evaluateNormText,
  fmt,
  formatDate,
  formatDateTime,
  num,
  round,
} from './calc'
import { SECTIONS, sectionProgress } from './sections'

const val = (value) => {
  if (value === '' || value === null || value === undefined) return '—'
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—'
  return String(value)
}

const statusText = (status) => {
  if (status === 'comply') return 'Comply'
  if (status === 'non-comply') return 'Non-comply'
  if (status === 'warn') return 'Within permissible limit'
  return '—'
}

const CONSENT_LABELS = {
  air: 'Air consent (Air Act)',
  water: 'Water consent (Water Act)',
  hazardous: 'Hazardous waste authorisation',
  cgwa: 'CGWA NOC',
}

const CONSENT_STATUS = {
  valid: 'Valid',
  expired: 'Expired',
  renewal: 'Applied for renewal',
  first: 'First time applied',
  never: 'Never applied',
}

const DOC_GROUPS = [
  {
    title: 'Consents & clearances',
    items: [
      ['consentAir', 'Consent to Operate — Air Act'],
      ['consentWater', 'Consent to Operate — Water Act'],
      ['hwAuthorisation', 'Hazardous waste authorisation'],
      ['cgwaNoc', 'CGWA NOC'],
      ['consentConditions', 'Consent conditions compliance report'],
    ],
  },
  {
    title: 'Logbooks',
    items: [
      ['logETP', 'ETP operation logbook'],
      ['logFlowmeter', 'Flow meter reading register'],
      ['logWater', 'Freshwater consumption register'],
      ['logFuel', 'Fuel consumption register'],
      ['logHazardous', 'Hazardous waste register'],
      ['logOcems', 'OCEMS calibration & maintenance log'],
      ['logDg', 'DG set operation log'],
      ['logSludge', 'Sludge generation & disposal log'],
      ['logStp', 'STP operation logbook'],
    ],
  },
  {
    title: 'Other documents',
    items: [
      ['form4', 'Form-4 annual return'],
      ['form10', 'Form-10 records / manifests'],
      ['ocemsCharter', 'OCEMS charter'],
      ['selfAssessment', 'Self-assessment report'],
      ['stackReport', 'Third-party stack monitoring report'],
      ['groundwaterReport', 'Groundwater analysis report'],
      ['processFlow', 'Process flow sheet & water balance'],
      ['layout', 'Plant layout showing outlets & ETP'],
      ['authorisationLetter', 'Board resolution / authorised signatory letter'],
    ],
  },
]

const PHOTO_LABELS = [
  ['fig1', 'Entrance gate'],
  ['fig2', 'Unit name board'],
  ['fig3', 'Production / process area'],
  ['fig4', 'Water intake / borewell with flow meter'],
  ['fig5', 'ETP inlet'],
  ['fig6', 'ETP units'],
  ['fig7', 'ETP outlet'],
  ['fig8', 'Final discharge point / drain'],
  ['fig9', 'OCEMS panel & web camera'],
  ['fig10', 'Hazardous waste storage area'],
  ['fig11', 'Boiler / stack with APCD'],
  ['fig12', 'Laboratory / logbooks'],
  ['fig13', 'Inspection team at site'],
]

export function buildReport(inspection, photos = {}) {
  const d = inspection.data
  const g = d.general || {}
  const sections = []

  sections.push({
    heading: 'A. General Information',
    rows: [
      ['Date of inspection', formatDate(g.inspectionDate)],
      ['Unit code', val(g.unitCode)],
      ['Unit name', val(g.unitName)],
      ['Address', val(g.unitAddress)],
      ['State / UT', val(g.state)],
      ['Coordinates', g.latitude && g.longitude ? `${g.latitude}, ${g.longitude}${g.accuracy ? ` (±${g.accuracy} m)` : ''}` : '—'],
      ['Contact person', `${val(g.contactName)}${g.contactDesignation ? `, ${g.contactDesignation}` : ''}`],
      ['Phone', val(g.contactPhone)],
      ['Email', val(g.contactEmail)],
      ['Year of commissioning', val(g.yearCommissioning)],
      ['SPCB regional office', val(g.spcbOffice)],
      ['Technical institute', val(g.technicalInstitute)],
      ['Operational status', `${val(g.operationalStatus)}${g.operationalStatusOther ? ` — ${g.operationalStatusOther}` : ''}`],
      ['Status document', val(g.statusDocument)],
      ['Remarks', val(g.statusRemarks)],
    ],
  })

  const consent = d.consent || {}
  sections.push({
    heading: 'B. Consent & Authorisations',
    tables: [
      {
        head: ['Clearance', 'Applicable', 'Validity', 'Valid up to', 'Copy enclosed'],
        widths: [30, 13, 22, 17, 18],
        rows: Object.keys(CONSENT_LABELS).map((key) => {
          const row = consent[key] || {}
          return [
            CONSENT_LABELS[key],
            val(row.applicable),
            row.status ? CONSENT_STATUS[row.status] || row.status : '—',
            formatDate(row.validUpto),
            val(row.enclosed),
          ]
        }),
      },
    ],
    rows: [
      ['Consented water consumption', consent.consentedWater ? `${consent.consentedWater} KLD` : '—'],
      ['Consented effluent discharge', consent.consentedEffluent ? `${consent.consentedEffluent} KLD` : '—'],
      ['Consent issuing authority', val(consent.authority)],
      ['Last consent inspection', formatDate(consent.lastInspected)],
      ['Conditions violated', val(consent.violations)],
    ],
  })

  const prod = d.production || {}
  const capacity = prod.capacity || {}
  sections.push({
    heading: 'C. Production, Process & Infrastructure',
    rows: [
      ['Operating days (last 3 months)', val(prod.operatingDays)],
      ['Operating hours per day', val(prod.hoursPerDay)],
      ['Industry type (fibre)', val(prod.industryNature)],
      ['Processes', val(prod.processTypes)],
      ['Operation mode', val(prod.operationMode)],
      ['Products', val(prod.products)],
      ['Raw materials', val(prod.rawMaterials)],
      ['Installed capacity', prod.installedCapacity ? `${prod.installedCapacity} kg/day` : '—'],
      ['Process details', val(prod.processDetails)],
      ['GSM (calculated)', prod.gsm?.result ? `${fmt(prod.gsm.result, 1)} g/m²` : '—'],
      ["Residents' feedback", val(prod.residentsFeedback)],
    ],
    tables: [
      {
        title: 'Production capacity',
        head: ['Basis', 'Quantity (kg/day)'],
        widths: [65, 35],
        rows: [
          ['As per consent', val(capacity.consent)],
          ['Average — last 3 months', val(capacity.last3Months)],
          ['Average — last 10 days', val(capacity.avg10Days)],
        ],
      },
      {
        title: 'Machines',
        head: ['Machine', 'Number', 'Capacity', 'MLR'],
        widths: [46, 16, 22, 16],
        rows: (prod.machines || []).map((m) => [val(m.name), val(m.count), val(m.capacity), val(m.mlr)]),
      },
      {
        title: 'Chemicals',
        head: ['Chemical', 'Consumption', 'Purpose'],
        widths: [45, 27, 28],
        rows: (prod.chemicals || []).map((c) => [val(c.name), val(c.consumption), val(c.purpose)]),
      },
      {
        title: 'Dyes',
        head: ['Dye', 'Class', 'Consumption'],
        widths: [44, 28, 28],
        rows: (prod.dyes || []).map((c) => [val(c.name), val(c.dyeClass), val(c.consumption)]),
      },
    ],
  })

  const water = d.water || {}
  const consumption = water.consumption || {}
  const totalWater = (num(consumption.production) || 0) + (num(consumption.domestic) || 0) + (num(consumption.others) || 0)
  sections.push({
    heading: 'D. Water Consumption',
    tables: [
      {
        head: ['Source', 'Quantity (KLD)', 'Flow meter', 'Type', 'Last calibration', 'Logbook'],
        widths: [26, 16, 14, 18, 14, 12],
        rows: (water.sources || []).map((s) => [
          val(s.name),
          val(s.quantity),
          val(s.flowmeter),
          val(s.meterType),
          formatDate(s.calibration),
          val(s.logbook),
        ]),
      },
      {
        title: 'Freshwater consumption',
        head: ['Use', 'KLD'],
        widths: [70, 30],
        rows: [
          ['Production', val(consumption.production)],
          ['Domestic', val(consumption.domestic)],
          ['Others', val(consumption.others)],
          ['Recycled / reuse', val(consumption.recycled)],
          ['Total freshwater', fmt(totalWater, 2)],
        ],
      },
    ],
    rows: [
      ['CGWA borewells', val(water.cgwa?.borewells)],
      ['CGWA permitted withdrawal', water.cgwa?.permitted ? `${water.cgwa.permitted} KLD` : '—'],
      ['NOC number', val(water.cgwa?.nocNumber)],
      ['NOC validity', formatDate(water.cgwa?.nocValidUpto)],
      ['Production basis', water.productionTonnesPerDay ? `${water.productionTonnesPerDay} tonnes/day` : '—'],
      ['Specific consumption', totalWater && num(water.productionTonnesPerDay) ? `${fmt(totalWater / num(water.productionTonnesPerDay), 3)} KL/MT` : '—'],
      ['Flow meter remarks', val(water.meterRemarks)],
    ],
  })

  const eff = d.effluent || {}
  const ch = eff.characteristics || {}
  const norms = eff.norms || {}
  const yamuna = eff.yamunaApplicable === 'Yes'
  const effParams = EFFLUENT_PARAMS.filter((param) => !param.yamuna || yamuna)
  const effFails = effParams.filter((param) => evaluateNormText(ch[param.key]?.outlet, norms[param.key] ?? param.norm) === 'non-comply')
  const discharge = Number.isFinite(num(eff.generated)) ? round((num(eff.generated) || 0) - (num(eff.recycled) || 0), 2) : ''
  sections.push({
    heading: 'E. Effluent',
    rows: [
      ['Sources', val(eff.sources)],
      ['Quantity reported', eff.quantity ? `${eff.quantity} KLD` : '—'],
      ['ETP status', val(eff.etpStatus)],
      ['Effluent generated', eff.generated ? `${eff.generated} KLD` : '—'],
      ['Effluent recycled', eff.recycled ? `${eff.recycled} KLD` : '—'],
      ['Finally discharged', discharge === '' ? '—' : `${discharge} KLD`],
      ['Mode of discharge', val(eff.modeOfDischarge)],
      ['Consented / observed outlets', `${val(eff.outlets?.consented)} / ${val(eff.outlets?.observed)}`],
      ['Receiving body', val(eff.receivingBody)],
      ['Route to river Ganga / Yamuna', val(eff.gangaRoute)],
      ['ZLD status', val(eff.zld)],
      ['Bypass observed', val(eff.bypass?.observed)],
      ['Bypass — sample collected', val(eff.bypass?.sample)],
      ['Bypass — SPCB/CPCB informed', val(eff.bypass?.informed)],
      ['Bypass remarks', val(eff.bypass?.remarks)],
      ['BOD load (outlet)', bodLoad(discharge === '' ? eff.generated : discharge, ch.bod?.outlet) === '' ? '—' : `${fmt(bodLoad(discharge === '' ? eff.generated : discharge, ch.bod?.outlet), 2)} kg/day`],
      ['Compliance (effluent)', effFails.length ? `Non-comply — ${effFails.map((p) => p.label).join(', ')}` : 'Comply with norms'],
    ],
    tables: [
      {
        title: 'Effluent characteristics',
        head: ['Parameter', 'Inlet', 'Outlet', 'Norm', 'Status'],
        widths: [40, 15, 15, 15, 15],
        rows: effParams.map((param) => [
          `${param.label}${param.unit ? ` (${param.unit})` : ''}`,
          val(ch[param.key]?.inlet),
          val(ch[param.key]?.outlet),
          val(norms[param.key] ?? param.norm),
          statusText(evaluateNormText(ch[param.key]?.outlet, norms[param.key] ?? param.norm)),
        ]),
      },
      {
        title: 'Groundwater quality (IS 10500:2012)',
        head: ['Parameter', 'Result', 'Unit', 'Acceptable', 'Permissible'],
        widths: [34, 16, 16, 17, 17],
        rows: IS10500.map((param) => [
          param.label,
          val(eff.groundwater?.values?.[param.key]),
          param.unit || '—',
          param.acceptable,
          param.permissible,
        ]),
      },
      {
        title: 'Recipient drain',
        head: ['Parameter', 'Upstream', 'Downstream'],
        widths: [40, 30, 30],
        rows: [
          ['pH', val(eff.drain?.upstream?.ph), val(eff.drain?.downstream?.ph)],
          ['BOD (mg/L)', val(eff.drain?.upstream?.bod), val(eff.drain?.downstream?.bod)],
          ['COD (mg/L)', val(eff.drain?.upstream?.cod), val(eff.drain?.downstream?.cod)],
          ['TSS (mg/L)', val(eff.drain?.upstream?.tss), val(eff.drain?.downstream?.tss)],
        ],
      },
    ],
  })

  const etp = d.etp || {}
  sections.push({
    heading: 'ETP — Effluent Treatment Plant',
    rows: [
      ['Status', val(etp.status)],
      ['Installed capacity', etp.installedCapacity ? `${etp.installedCapacity} KLD` : '—'],
      ['Capacity utilised', etp.utilisedCapacity ? `${etp.utilisedCapacity} KLD` : '—'],
      ['Technology', val(etp.technology)],
      ['Aerators', val(etp.aerators)],
      ['Blowers', val(etp.blower)],
      ['Sludge management', val(etp.sludgeManagement)],
      ['Chemicals', val(etp.chemicals)],
      ['Laboratory', val(etp.labFacility)],
      ['Manpower', val(etp.staff)],
      ['Energy consumption', val(etp.energy)],
      ['Observations', val(etp.remarks)],
    ],
    tables: [
      {
        title: 'ETP units',
        head: ['Unit', 'Dimension', 'Volume (m³)', 'Retention (h)', 'Adequacy'],
        widths: [30, 26, 15, 14, 15],
        rows: (etp.units || []).map((u) => [val(u.name), val(u.dimension), val(u.capacity), val(u.retention), val(u.adequacy)]),
      },
    ],
  })

  const sewage = d.sewage || {}
  const sewageRows = SEWAGE_PARAMS.map((param) => [
    `${param.label}${param.unit ? ` (${param.unit})` : ''}`,
    val(sewage.characteristics?.[param.key]?.inlet),
    val(sewage.characteristics?.[param.key]?.outlet),
    val(sewage.norms?.[param.key] ?? param.norm),
    statusText(evaluateNormText(sewage.characteristics?.[param.key]?.outlet, sewage.norms?.[param.key] ?? param.norm)),
  ])
  sections.push({
    heading: 'F. Sewage',
    rows: [
      ['Sewage generated', sewage.generated ? `${sewage.generated} KLD` : '—'],
      ['STP status', val(sewage.stpStatus)],
      ['STP capacity', sewage.capacity ? `${sewage.capacity} KLD` : '—'],
      ['Capacity utilised', sewage.utilised ? `${sewage.utilised} KLD` : '—'],
      ['Flow meter', val(sewage.flowmeter)],
      ['Mode of discharge', val(sewage.modeOfDischarge)],
      ['Technology', val(sewage.technology)],
      ['Observations', val(sewage.remarks)],
    ],
    tables: [
      {
        title: 'Treated sewage characteristics',
        head: ['Parameter', 'Inlet', 'Outlet', 'Norm', 'Status'],
        widths: [40, 15, 15, 15, 15],
        rows: sewageRows,
      },
    ],
  })

  const hw = d.hazardous || {}
  sections.push({
    heading: 'G. Hazardous Waste',
    tables: [
      {
        head: ['Waste', 'Category', 'Authorised', 'Generated', 'Source', 'Disposal'],
        widths: [26, 13, 13, 13, 17, 18],
        rows: (hw.items || []).map((i) => [val(i.name), val(i.category), val(i.authorised), val(i.generated), val(i.source), val(i.disposal)]),
      },
    ],
    rows: [
      ['Form-4 maintained', val(hw.form4Maintained)],
      ['Form-10 maintained', val(hw.form10Maintained)],
      ['Form-4 remarks', val(hw.form4Remarks)],
      ['Form-10 remarks', val(hw.form10Remarks)],
      ['Storage', val(hw.storage)],
      ['Observations', val(hw.remarks)],
    ],
  })

  const fuel = d.fuel || {}
  sections.push({
    heading: 'H. Fuel',
    rows: [
      ['Consumption on day of visit', val(fuel.dayConsumption)],
      ['Daily record maintained by', val(fuel.logMaintainedBy)],
      ['Remarks', val(fuel.remarks)],
    ],
    tables: [
      {
        head: ['Fuel', 'Consumption', 'Unit', 'On visit day', 'Used in'],
        widths: [26, 18, 14, 18, 24],
        rows: (fuel.items || []).map((i) => [val(i.type), val(i.consumption), val(i.unit), val(i.dayConsumption), val(i.purpose)]),
      },
    ],
  })

  const air = d.air || {}
  sections.push({
    heading: 'I. Air',
    rows: [
      ['Sources', val(air.sources)],
      ['APCD', val(air.apcd)],
      ['Emission within norms', val(air.emissionWithinNorms)],
      ['Monitoring laboratory', val(air.lab)],
      ['Report date', formatDate(air.reportDate)],
      ['Report file', val(air.reportFile)],
      ['Observations', val(air.observations)],
    ],
    tables: [
      {
        title: 'Chimneys',
        head: ['Stack', 'Height (m)', 'Diameter (m)', 'APCD', 'Last monitored', 'Result'],
        widths: [26, 13, 14, 19, 14, 14],
        rows: (air.chimneys || []).map((c) => [val(c.stack), val(c.height), val(c.diameter), val(c.apcd), formatDate(c.lastMonitored), val(c.result)]),
      },
      {
        title: 'DG sets',
        head: ['Capacity', 'Stack height (m)', 'Enclosure', 'Last monitored', 'Result'],
        widths: [22, 18, 22, 18, 20],
        rows: (air.dgSets || []).map((s) => [val(s.capacity), val(s.stackHeight), val(s.apcd), formatDate(s.lastMonitored), val(s.result)]),
      },
    ],
  })

  const ocems = d.ocems || {}
  sections.push({
    heading: 'J. OCEMS, Observations & Recommendations',
    rows: [
      ['OCEMS installed', val(ocems.ocemsInstalled)],
      ['Web camera', val(ocems.webCamera)],
      ['Flow meter', val(ocems.flowMeter)],
      ['Server connection', val(ocems.serverConnection)],
      ['OCEMS calibration', formatDate(ocems.calibration?.ocems)],
      ['Flow meter calibration', formatDate(ocems.calibration?.flowmeter)],
      ['Charter submitted', val(ocems.charterSubmitted)],
      ['Self-assessment submitted', val(ocems.selfAssessment)],
      ['Tampering / experimental attempts', val(ocems.experiments)],
      ['Observations', val(ocems.observations)],
      ['Key issues', val(ocems.keyIssues)],
      ['Recommendations', val(ocems.recommendations)],
      ['Overall compliance', val(ocems.overallCompliance)],
      ['Report submission date', formatDate(ocems.reportDate)],
    ],
    tables: [
      {
        title: 'Live OCEMS readings',
        head: ['Parameter', 'Unit', 'Reading', 'Observed at'],
        widths: [34, 16, 20, 30],
        rows: (ocems.liveReadings || []).map((r) => [val(r.parameter), val(r.unit), val(r.value), r.observedAt ? formatDateTime(r.observedAt) : '—']),
      },
      {
        title: 'Inspection team & signatures',
        head: ['Name', 'Designation', 'Email', 'Signature'],
        widths: [24, 30, 26, 20],
        rows: (ocems.team || []).map((m) => [
          val(m.name),
          val(m.designation),
          val(m.email),
          m.signedAt ? `Signed ${formatDateTime(m.signedAt)} (SIG-${m.id.slice(0, 8).toUpperCase()})` : 'Not signed',
        ]),
      },
    ],
  })

  const photoRows = PHOTO_LABELS.map(([id, label], index) => {
    const photo = d.photographs?.photos?.[id] || {}
    return {
      id,
      figure: `Fig.${index + 1}`,
      label,
      caption: photo.caption || '—',
      capturedAt: photo.capturedAt ? formatDateTime(photo.capturedAt) : '—',
      gps: photo.gps ? `${photo.gps.lat}, ${photo.gps.lng}` : '—',
      dataUrl: photos[id] || null,
    }
  })
  sections.push({
    heading: 'Photographs',
    photoRows,
    rows: photoRows.map((row) => [`${row.figure} — ${row.label}`, `${row.caption} · ${row.capturedAt} · GPS ${row.gps}`]),
  })

  const documents = d.documents || {}
  sections.push({
    heading: 'Documents Checklist',
    tables: DOC_GROUPS.map((group) => ({
      title: group.title,
      head: ['Document', 'Status', 'File', 'Remarks'],
      widths: [44, 14, 22, 20],
      rows: group.items.map(([key, label]) => [
        label,
        val(documents[key]?.status),
        val(documents[key]?.file),
        val(documents[key]?.remarks),
      ]),
    })),
    rows: [['Notes', val(documents.notes)]],
  })

  const missing = SECTIONS.map((section) => ({
    key: section.key,
    nav: section.nav,
    ...sectionProgress(section.key, d),
  })).filter((item) => item.missing.length)

  return {
    title: 'Textile Industry Inspection Format 2025-26',
    subtitle: 'Water Quality Management-II · Central Pollution Control Board',
    meta: [
      ['Unit code', val(g.unitCode)],
      ['Unit name', val(g.unitName)],
      ['Date of inspection', formatDate(g.inspectionDate)],
      ['Overall compliance', val(ocems.overallCompliance)],
      ['Prepared by', inspection.createdBy || '—'],
      ['Last updated', formatDateTime(inspection.updatedAt)],
    ],
    sections,
    missing,
  }
}
