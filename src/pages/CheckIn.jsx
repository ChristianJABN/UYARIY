import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth.jsx'
import Page from '../components/Page.jsx'

const QS = [
  { g: 'v', t: 'Alguien me insulta, se burla o me pone apodos que me duelen.' },
  { g: 'v', t: 'Me dejan solo o me excluyen a propósito.' },
  { g: 'v', t: 'Me han empujado, golpeado o amenazado.' },
  { g: 't', t: 'He visto cómo molestan a un compañero.' },
  { g: 't', t: 'He visto burlas o mensajes hirientes en redes sobre alguien.' },
  { g: 'a', t: 'Me he burlado de alguien o lo he molestado.' },
  { g: 'a', t: 'He dejado fuera a un compañero a propósito.' }
]
const OPTS = ['Nunca', 'A veces', 'Seguido']

const RESULTS = {
  victima: { cls: 'warn', title: 'Gracias por contarlo', text: 'Lo que te pasa importa y no es tu culpa. No tienes que cargarlo solo.', cta: ['Pedir ayuda', '/ayuda'] },
  testigo: { cls: 'soft', title: 'Ver esto también pesa', text: 'Puedes ayudar avisando, sin exponerte. Lo que cuentes es privado.', cta: ['Avisar lo que vi', '/ayuda'] },
  agresor: { cls: 'soft', title: 'Gracias por ser sincero', text: 'Cambiar es posible y hablar con alguien ayuda mucho. Aquí nadie te va a juzgar.', cta: ['Hablar con alguien', '/chat'] },
  sin_senal: { cls: 'good', title: 'Todo bien por ahora', text: 'Gracias por contarnos cómo estás. Vuelve cuando quieras.', cta: ['Volver al inicio', '/'] }
}

export default function CheckIn() {
  const { session } = useAuth()
  const nav = useNavigate()
  const [ans, setAns] = useState({})
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const done = Object.keys(ans).length

  async function finish() {
    setBusy(true)
    const sum = (g) => QS.reduce((s, q, i) => s + (q.g === g ? ans[i] : 0), 0)
    const scores = { victima: sum('v'), testigo: sum('t'), agresor: sum('a') }
    const top = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]
    const res = top[1] >= 2 ? top[0] : 'sin_senal'
    await supabase.from('checkins').insert({ student_id: session.user.id, answers: ans, result: res })
    setResult(res); setBusy(false)
  }

  if (result) {
    const r = RESULTS[result]
    return (
      <Page title="Tu check-in">
        <div className={`box ${r.cls}`}>
          <h2>{r.title}</h2><p>{r.text}</p>
        </div>
        <button className="btn" onClick={() => nav(r.cta[1])}>{r.cta[0]}</button>
        <p className="lead" style={{ marginTop: 16 }}>Esto te orienta, pero no es un diagnóstico.</p>
      </Page>
    )
  }
  return (
    <Page title="¿Cómo estás?">
      <div className="progress"><i style={{ width: `${(done / QS.length) * 100}%` }} /></div>
      {QS.map((q, i) => (
        <div className="q" key={i}>
          <p>{q.t}</p>
          <div className="chips">
            {OPTS.map((o, v) => (
              <button key={o} className={`chip ${ans[i] === v ? 'on' : ''}`} onClick={() => setAns({ ...ans, [i]: v })}>{o}</button>
            ))}
          </div>
        </div>
      ))}
      <button className="btn dark" disabled={done < QS.length || busy} onClick={finish}>
        {busy ? 'Guardando…' : 'Ver mi resultado'}
      </button>
    </Page>
  )
}
