import React, { useState } from 'react'
import { initFirebase, uploadEvidence } from '../../services/storage'
import { convexMutation } from '../../services/convexClient'

export default function PaymentSubmitPage({ firebaseConfig, invoiceId, renterId }) {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const onFileChange = (e) => setFiles(Array.from(e.target.files || []))

  const onSubmit = async () => {
    try {
      setUploading(true)
      initFirebase(firebaseConfig)
      const uploaded = []
      for (const f of files) {
        const url = await uploadEvidence(f)
        uploaded.push({ url })
      }
      await convexMutation(import.meta.env.VITE_CONVEX_FUNC_PAYMENTS_SUBMIT || 'payments:submitEvidence', {
        invoiceId, renterId, files: uploaded,
      })
      setDone(true)
    } catch (e) {
      setError(e?.message || 'Failed to submit evidence')
    } finally {
      setUploading(false)
    }
  }

  if (done) return <div>Thanks! Evidence submitted.</div>

  return (
    <div>
      <h3>Submit Payment Evidence</h3>
      {error && <div style={{ color:'red' }}>{error}</div>}
      <input type="file" multiple onChange={onFileChange} />
      <button onClick={onSubmit} disabled={uploading || files.length === 0}>
        {uploading ? 'Uploading…' : 'Submit'}
      </button>
    </div>
  )
}
