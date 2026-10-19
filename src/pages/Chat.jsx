import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth.jsx'
import Page from '../components/Page.jsx'

export default function Chat() {
  const { session } = useAuth()
  const uid = session.user.id
  const [msgs, setMsgs] = useState([])
  const [text, setText] = useState('')
  const end = useRef()

  const load = () => supabase.from('messages').select('*').eq('student_id', uid)
    .order('created_at').then(({ data }) => setMsgs(data ?? []))

  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t) }, [])
  useEffect(() => end.current?.scrollIntoView({ behavior: 'smooth' }), [msgs.length])

  async function send() {
    const body = text.trim(); if (!body) return
    setText('')
    await supabase.from('messages').insert({ student_id: uid, sender_id: uid, body })
    load()
  }

  return (
    <Page title="Hablar con alguien">
      <div className="chat">
        {msgs.length === 0 && <p className="lead">Escribe lo que quieras. Solo lo leerá tu psicólogo o tutor.</p>}
        {msgs.map((m) => <div key={m.id} className={`bubble ${m.sender_id === uid ? 'me' : 'them'}`}>{m.body}</div>)}
        <div ref={end} />
      </div>
      <div className="send">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribe aquí…"
          onKeyDown={(e) => e.key === 'Enter' && send()} />
        <button className="btn" onClick={send}>Enviar</button>
      </div>
    </Page>
  )
}
