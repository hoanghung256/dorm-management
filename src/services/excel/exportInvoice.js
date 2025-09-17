// src/services/excel/exportInvoice.js
// Minimal ExcelJS helper for exporting a single invoice
import ExcelJS from 'exceljs'

export async function exportInvoice({ invoice, items, landlord, renter }) {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Invoice')

  ws.addRow([`Invoice: ${invoice?.period || ''}`])
  ws.addRow([`Room: ${invoice?.roomCode || ''}`])
  ws.addRow([])
  ws.addRow(['Item', 'Qty', 'Unit Price', 'Amount'])

  let total = 0
  items?.forEach(it => {
    const amount = (it.quantity || 0) * (it.unitPrice || 0)
    total += amount
    ws.addRow([it.name, it.quantity, it.unitPrice, amount])
  })

  ws.addRow([])
  ws.addRow(['Total', '', '', total])

  const buffer = await wb.xlsx.writeBuffer()
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}
