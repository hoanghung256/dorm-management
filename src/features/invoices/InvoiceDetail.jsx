import React from 'react'
import { exportInvoice } from '../../services/excel/exportInvoice'

export default function InvoiceDetail({ invoice, items = [], landlord, renter }) {
  const onExport = async () => {
    const blob = await exportInvoice({ invoice, items, landlord, renter })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoice-${invoice?.period || ''}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!invoice) return <div>No invoice selected</div>
  return (
    <div>
      <h3>Invoice {invoice.period}</h3>
      <div>Status: {invoice.status}</div>
      <div>Total: {invoice.totalAmount}</div>
      <button onClick={onExport}>Export to Excel</button>
    </div>
  )
}
