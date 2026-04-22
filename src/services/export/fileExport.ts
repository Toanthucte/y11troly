import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function makeExportStamp(iso: string | undefined): string {
  if (!iso) return Date.now().toString()
  return new Date(iso).toISOString().replace(/[-:]/g, '').slice(0, 13)
}

export async function exportElementToPng(
  element: HTMLElement,
  filename: string,
  dpi = 300,
): Promise<void> {
  const scale = Math.max(1, dpi / 96)
  const canvas = await html2canvas(element, {
    scale,
    backgroundColor: '#ffffff',
    useCORS: true,
  })

  await new Promise<void>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Không tạo được ảnh PNG'))
          return
        }
        downloadBlob(filename, blob)
        resolve()
      },
      'image/png',
      1,
    )
  })
}

export async function exportElementToPdf(
  element: HTMLElement,
  filename: string,
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
  })

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const margin = 10
  const pageWidth = 210 - margin * 2
  const pageHeight = 297 - margin * 2
  const pxPerMm = canvas.width / pageWidth
  const pageHeightPx = Math.floor(pageHeight * pxPerMm)

  let rendered = 0
  let firstPage = true
  while (rendered < canvas.height) {
    const chunkHeight = Math.min(pageHeightPx, canvas.height - rendered)
    const pageCanvas = document.createElement('canvas')
    pageCanvas.width = canvas.width
    pageCanvas.height = chunkHeight

    const ctx = pageCanvas.getContext('2d')
    if (!ctx) throw new Error('Không tạo được canvas context')

    ctx.drawImage(
      canvas,
      0,
      rendered,
      canvas.width,
      chunkHeight,
      0,
      0,
      canvas.width,
      chunkHeight,
    )

    const pageImage = pageCanvas.toDataURL('image/png')
    const imageHeightMm = chunkHeight / pxPerMm

    if (!firstPage) pdf.addPage()
    pdf.addImage(pageImage, 'PNG', margin, margin, pageWidth, imageHeightMm)

    firstPage = false
    rendered += chunkHeight
  }

  pdf.save(filename)
}
