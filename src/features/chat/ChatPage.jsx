import { useEffect, useState } from 'react'
import { convexMutation, convexQueryOneTime } from '../../services/convexClient'

export default function ChatPage({ landlordId = 1, roomId, senderType = 'landlord', senderRenterId }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  async function load() {
    try {
      const list = await convexQueryOneTime(import.meta.env.VITE_CONVEX_FUNC_CHAT_LIST || 'chat:listMessages', { landlordId, roomId })
      setMessages(list)
    } catch (e) {
      setError(e?.message || 'Failed to load messages')
    }
  }

  useEffect(() => { load() }, [landlordId, roomId])

  const send = async () => {
    try {
      await convexMutation(import.meta.env.VITE_CONVEX_FUNC_CHAT_POST || 'chat:postMessage', {
        landlordId, roomId, senderType, senderRenterId, content: text,
      })
      setText('')
      await load()
    } catch (e) {
      setError(e?.message || 'Failed to send')
    }
  }

  return (
    <div>
      <h3>{roomId ? 'Room Chat' : 'General Chat'}</h3>
      {error && <div style={{ color:'red' }}>{error}</div>}
      <div style={{ border:'1px solid #ccc', height: 200, overflow:'auto', padding: 8 }}>
        {messages.map(m => (
          <div key={m._id}><strong>{m.senderType}</strong>: {m.content}</div>
        ))}
      </div>
      <div style={{ marginTop: 8 }}>
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Type message" />
        <button onClick={send}>Send</button>
      </div>
    </div>
  )
}
