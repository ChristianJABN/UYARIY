import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth.jsx'
import Page from '../components/Page.jsx'

export default function Urgent() {
  const { session } = useAuth()
  const uid = session.user.id
  const nav = useNavigate()
  const [ok, setOk] = useState(false)
  const [msgs, setMsgs] = useState([])
  const [text, setText] = useState('')
  const [sent, setSent] = useState(false)
  const end = useRef()

  const load = () => supabase.from('messages').select('*').eq('student_id', uid).order('created_at')
    .then(({ data }) => setMsgs(data ?? []))
  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t) }, [])
  useEffect(() => end.current?.scrollIntoView({ behavior: 'smooth' }), [msgs.length, ok])

  async function send() {
    const body = text.trim(); if (!body) return
    await supabase.from('messages').insert({ student_id: uid, sender_id: uid, body })
    setText(''); setSent(true); load()
  }

  if (!ok) {
    return (
      <Page title="Algo urgente">
        <div className="box warn">
          <strong>Este espacio es solo para cuando te sientes en riesgo o muy mal.</strong>
          <p>Si estás en peligro ahora, avisa a un adulto de confianza o llama a la Línea 100.</p>
        </div>
        <p><strong>¿Buscabas otra cosa?</strong></p>
        <div className="goto">
          <button className="chip" onClick={() => nav('/ayuda')}>✋ Quiero contar algo que veo o vivo, incluso si pasa ahora → Reportar caso</button>
          <button className="chip" onClick={() => nav('/checkin')}>💛 Quiero saber cómo me siento → Realizar diagnóstico</button>
          <button className="chip" onClick={() => nav('/seguimiento')}>📋 Quiero ver mi reporte o mi cita → Seguimiento</button>
        </div>
        <button className="btn red" onClick={() => setOk(true)}>Es urgente, quiero escribir</button>
      </Page>
    )
  }
  return (
    <Page title="Algo urgente">
      <div className="box warn"><p>Tu mensaje llega de inmediato al psicólogo con prioridad alta. Sé breve: solo texto.</p></div>
      <div className="chat">
        {msgs.map((m) => <div key={m.id} className={`bubble ${m.sender_id === uid ? 'me' : 'them'}`}>{m.body}</div>)}
        <div ref={end} />
      </div>
      {sent && <p className="note">Mensaje enviado. El psicólogo te responderá aquí.</p>}
      <textarea maxLength={280} value={text} onChange={(e) => setText(e.target.value)} placeholder="Cuéntame brevemente qué pasa…" />
      <p className="note">{text.length}/280</p>
      <button className="btn red" disabled={!text.trim()} onClick={send}>Enviar mensaje urgente</button>
    </Page>
  )
}
