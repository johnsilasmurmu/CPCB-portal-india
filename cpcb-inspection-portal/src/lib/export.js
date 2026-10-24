import { jsPDF } from 'jspdf'
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  ImageRun,
  PageBreak,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'

/* ---------- shared helpers ---------- */

const PDF_SAFE = [
  [/₃/g, '3'],
  [/²/g, '2'],
  [/₄/g, '4'],
  [/≤/g, '<='],
  [/≥/g, '>='],
  [/[–—]/g, '-'],
  [/[‘’]/g, "'"],
  [/[“”]/g, '"'],
  [/·/g, '-'],
  [/±/g, '+/-'],
  [/→/g, '->'],
  [/\u00a0/g, ' '],
]

const sanitize = (text) =>
  PDF_SAFE.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), String(text ?? ''))

const dataUrlToBytes = (dataUrl) => {
  const base64 = dataUrl.split(',')[1]
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

const slug = (text) =>
  String(text || 'inspection')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)

export const reportFileName = (report, extension) => {
  const unit = report.meta.find(([label]) => label === 'Unit code')?.[1] || 'inspection'
  const date = new Date().toISOString().slice(0, 10)
  return `CPCB-textile-${slug(unit)}-${date}.${extension}`
}

/* ---------- PDF ---------- */

export function exportReportPdf(report, { includePhotos = true } = {}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 14
  const contentW = pageW - margin * 2
  let y = margin
  let page = 1

  const header = () => {
    doc.setFillColor(15, 138, 95)
    doc.rect(0, 0, pageW, 9, 'F')
    doc.setFillColor(29, 78, 216)
    doc.rect(0, 9, pageW, 1.6, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.text('CENTRAL POLLUTION CONTROL BOARD', margin, 6)
    doc.setFont('helvetica', 'normal')
    doc.text('Textile Industry Inspection Format 2025-26', pageW - margin, 6, { align: 'right' })
    doc.setTextColor(20, 20, 20)
    y = margin + 6
  }

  const newPage = () => {
    doc.addPage()
    page += 1
    header()
  }

  const ensure = (height) => {
    if (y + height > pageH - 16) newPage()
  }

  const write = (text, { size = 10, bold = false, color = [30, 30, 30], gap = 1.5, x = margin, maxWidth = contentW } = {}) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(size)
    doc.setTextColor(...color)
    const lines = doc.splitTextToSize(sanitize(text), maxWidth)
    const lineHeight = size * 0.42 + 0.6
    for (const line of lines) {
      ensure(lineHeight + 1)
      doc.text(line, x, y + lineHeight)
      y += lineHeight
    }
    y += gap
  }

  const heading = (text) => {
    ensure(14)
    y += 2
    doc.setFillColor(236, 253, 245)
    doc.rect(margin - 2, y - 4.5, contentW + 4, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(11, 110, 76)
    doc.text(sanitize(text), margin, y + 1)
    y += 8
    doc.setTextColor(30, 30, 30)
  }

  const keyValueTable = (rows) => {
    if (!rows?.length) return
    const labelW = contentW * 0.36
    const valueW = contentW - labelW
    doc.setFontSize(8.6)
    for (const [label, value] of rows) {
      const labelLines = doc.splitTextToSize(sanitize(label), labelW - 4)
      const valueLines = doc.splitTextToSize(sanitize(value), valueW - 4)
      const rowH = Math.max(labelLines.length, valueLines.length) * 3.6 + 2.6
      ensure(rowH + 1)
      doc.setDrawColor(226, 232, 240)
      doc.setFillColor(248, 250, 252)
      doc.rect(margin, y, labelW, rowH, 'F')
      doc.rect(margin, y, contentW, rowH, 'S')
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(51, 65, 85)
      doc.text(labelLines, margin + 2, y + 4.2)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(30, 30, 30)
      doc.text(valueLines, margin + labelW + 2, y + 4.2)
      y += rowH
    }
    y += 2.5
  }

  const dataTable = (table) => {
    if (!table?.rows?.length) return
    if (table.title) write(table.title, { size: 9.5, bold: true, gap: 1 })
    const weights = table.widths || table.head.map(() => 1)
    const total = weights.reduce((sum, w) => sum + w, 0)
    const widths = weights.map((w) => (w / total) * contentW)
    const drawHeader = () => {
      ensure(9)
      let x = margin
      doc.setFillColor(241, 245, 249)
      doc.setDrawColor(203, 213, 225)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.8)
      doc.setTextColor(51, 65, 85)
      const height = 7
      table.head.forEach((cell, index) => {
        doc.rect(x, y, widths[index], height, 'FD')
        doc.text(doc.splitTextToSize(sanitize(cell), widths[index] - 3), x + 1.5, y + 3.4)
        x += widths[index]
      })
      y += height
    }
    drawHeader()
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.8)
    for (const row of table.rows) {
      const cellLines = row.map((cell, index) => doc.splitTextToSize(sanitize(cell), widths[index] - 3))
      const rowH = Math.max(...cellLines.map((lines) => lines.length)) * 3.4 + 2.4
      if (y + rowH > pageH - 16) {
        newPage()
        drawHeader()
      }
      let x = margin
      doc.setDrawColor(226, 232, 240)
      doc.setTextColor(30, 30, 30)
      cellLines.forEach((lines, index) => {
        doc.rect(x, y, widths[index], rowH, 'S')
        doc.text(lines, x + 1.5, y + 3.2)
        x += widths[index]
      })
      y += rowH
    }
    y += 3
  }

  /* cover */
  header()
  doc.setFillColor(15, 138, 95)
  doc.rect(0, 10.6, pageW, 26, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('Textile Industry Inspection Format 2025-26', margin, 23)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.text('Water Quality Management-II  |  Central Pollution Control Board', margin, 30)
  doc.setTextColor(30, 30, 30)
  y = 44

  keyValueTable(report.meta)

  for (const section of report.sections) {
    heading(section.heading)
    if (section.rows?.length) keyValueTable(section.rows)
    for (const table of section.tables || []) dataTable(table)
    if (section.photoRows?.length) {
      if (includePhotos) {
        const withImage = section.photoRows.filter((row) => row.dataUrl)
        if (withImage.length) {
          const imgW = (contentW - 6) / 2
          const imgH = imgW * 0.7
          let column = 0
          for (const row of withImage) {
            ensure(imgH + 14)
            const x = margin + column * (imgW + 6)
            write(`${row.figure} — ${row.label}`, { size: 8.2, bold: true, gap: 0.5, x, maxWidth: imgW })
            try {
              doc.addImage(row.dataUrl, 'JPEG', x, y, imgW, imgH, undefined, 'FAST')
            } catch {
              /* unsupported image data – skip the thumbnail */
            }
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(7)
            doc.setTextColor(100, 100, 100)
            doc.text(doc.splitTextToSize(sanitize(`${row.caption} | ${row.capturedAt} | GPS ${row.gps}`), imgW), x, y + imgH + 3)
            y += imgH + 12
            column += 1
            if (column === 2) {
              column = 0
              y += 2
            }
          }
          if (column === 1) y += 4
        }
      } else {
        keyValueTable(section.photoRows.map((row) => [`${row.figure} — ${row.label}`, `${row.caption} | ${row.capturedAt} | GPS ${row.gps}`]))
      }
    }
  }

  if (report.missing?.length) {
    heading('Pending fields at the time of export')
    keyValueTable(report.missing.map((item) => [item.nav || item.key, item.missing.join(', ')]))
  }

  /* footers */
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i)
    doc.setDrawColor(226, 232, 240)
    doc.line(margin, pageH - 12, pageW - margin, pageH - 12)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(120, 120, 120)
    doc.text('Generated from the CPCB Industry Inspection Portal – Textile (offline draft)', margin, pageH - 8)
    doc.text(`Page ${i} of ${pages}`, pageW - margin, pageH - 8, { align: 'right' })
  }

  doc.save(reportFileName(report, 'pdf'))
  return { pageCount: pages }
}

/* ---------- DOCX ---------- */

const BORDER = { style: BorderStyle.SINGLE, size: 4, color: 'D5DCE4' }
const TABLE_BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER, insideHorizontal: BORDER, insideVertical: BORDER }

const docxHeading = (text, level = HeadingLevel.HEADING_2) =>
  new Paragraph({
    heading: level,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, color: '0B6E4C', bold: true })],
  })

const docxKeyValueTable = (rows) =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TABLE_BORDERS,
    rows: rows.map(
      ([label, value]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 34, type: WidthType.PERCENTAGE },
              shading: { fill: 'F8FAFC' },
              children: [new Paragraph({ children: [new TextRun({ text: String(label), bold: true, size: 18 })] })],
            }),
            new TableCell({
              width: { size: 66, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: String(value), size: 18 })] })],
            }),
          ],
        }),
    ),
  })

const docxDataTable = (table) =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TABLE_BORDERS,
    rows: [
      new TableRow({
        tableHeader: true,
        children: table.head.map(
          (cell) =>
            new TableCell({
              shading: { fill: 'ECFDF5' },
              children: [new Paragraph({ children: [new TextRun({ text: String(cell), bold: true, size: 17 })] })],
            }),
        ),
      }),
      ...table.rows.map(
        (row) =>
          new TableRow({
            children: row.map(
              (cell) =>
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: String(cell), size: 17 })] })],
                }),
            ),
          }),
      ),
    ],
  })

export async function exportReportDocx(report, { includePhotos = true } = {}) {
  const children = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'CENTRAL POLLUTION CONTROL BOARD', bold: true, size: 26, color: '0F8A5F' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [new TextRun({ text: 'Textile Industry Inspection Format 2025-26', bold: true, size: 30 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [new TextRun({ text: 'Water Quality Management-II', italics: true, size: 21 })],
    }),
    docxKeyValueTable(report.meta),
  ]

  for (const section of report.sections) {
    children.push(new Paragraph({ children: [new PageBreak()] }))
    children.push(docxHeading(section.heading, HeadingLevel.HEADING_1))
    if (section.rows?.length) children.push(docxKeyValueTable(section.rows))
    for (const table of section.tables || []) {
      if (table.title) {
        children.push(
          new Paragraph({
            spacing: { before: 180, after: 60 },
            children: [new TextRun({ text: table.title, bold: true, size: 20 })],
          }),
        )
      }
      children.push(docxDataTable(table))
      children.push(new Paragraph({ text: '' }))
    }
    if (section.photoRows?.length) {
      const rows = includePhotos ? section.photoRows.filter((row) => row.dataUrl) : []
      if (rows.length) {
        for (const row of rows) {
          children.push(
            new Paragraph({
              spacing: { before: 120 },
              children: [new TextRun({ text: `${row.figure} — ${row.label}`, bold: true, size: 19 })],
            }),
          )
          try {
            children.push(
              new Paragraph({
                children: [
                  new ImageRun({
                    type: 'jpg',
                    data: dataUrlToBytes(row.dataUrl),
                    transformation: { width: 330, height: 230 },
                  }),
                ],
              }),
            )
          } catch {
            /* skip unreadable image */
          }
          children.push(
            new Paragraph({
              spacing: { after: 120 },
              children: [new TextRun({ text: `${row.caption} | ${row.capturedAt} | GPS ${row.gps}`, size: 16, italics: true, color: '64748B' })],
            }),
          )
        }
      } else {
        children.push(docxKeyValueTable(section.photoRows.map((row) => [`${row.figure} — ${row.label}`, `${row.caption} | ${row.capturedAt} | GPS ${row.gps}`])))
      }
    }
  }

  if (report.missing?.length) {
    children.push(new Paragraph({ children: [new PageBreak()] }))
    children.push(docxHeading('Pending fields at the time of export', HeadingLevel.HEADING_1))
    children.push(docxKeyValueTable(report.missing.map((item) => [item.nav || item.key, item.missing.join(', ')])))
  }

  children.push(
    new Paragraph({
      spacing: { before: 300 },
      children: [new TextRun({ text: 'Generated from the CPCB Industry Inspection Portal – Textile (offline draft).', size: 16, italics: true, color: '64748B' })],
    }),
  )

  const docFile = new Document({
    creator: 'CPCB Industry Inspection Portal',
    title: report.title,
    description: report.subtitle,
    sections: [{ properties: {}, children }],
  })

  const blob = await Packer.toBlob(docFile)
  const url = URL.createObjectURL(blob)
  const link = window.document.createElement('a')
  link.href = url
  link.download = reportFileName(report, 'docx')
  window.document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
  return { size: blob.size }
}
