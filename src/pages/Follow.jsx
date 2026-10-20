import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth.jsx'
import { RESULTS } from '../lib/results.js'
import { iso, fmtDate, fmtSlot } from '../lib/dates.js'
import Page from '../components/Page.jsx'

const STATUS = { pendiente: 'Recibido. Aún no lo ha revisado un adulto.', revisado: 'Un adulto de tu colegio ya lo revisó.', cerrado: 'Caso cerrado.' }
const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00']

export default function Follow() {
  const { session } = useAuth()
  const uid = session.user.id
  const nav = useNavigate()
  const [reports, setReports] = useState([])
  const [fu, setFu] = useState({})
  const [check, setCheck] = useState(null)
  const [appt, setAppt] = useState(null)
  const [date, setDate] = useState('')
  const [taken, setTaken] = useState([])
  const [msg, setMsg] = useState('')

  async function load() {
    const [r, f, c, a] = await Promise.all([
      supabase.from('reports').select('id, case_number, what, status, happened_at').eq('reporter_id', uid).order('created_at', { ascending: false }),
      supabase.from('followups').select('*').order('created_at'),
      supabase.from('checkins').select('result, created_at').eq('student_id', uid).order('created_at', { ascending: false }).limit(1),
      supabase.from('appointments').select('*').eq('student_id', uid).eq('status', 'agendada').gt('slot', new Date().toISOString()).order('slot').limit(1)
    ])
    setReports(r.data ?? []); setCheck(c.data?.[0] ?? null); setAppt(a.data?.[0] ?? null)
    const g = {}; (f.data ?? []).forEach((x) => (g[x.report_id] = x.feeling)); setFu(g)
  }
  useEffect(() => { load() }, [])
  useEffect(() => { supabase.rpc('taken_slots').then(({ data }) => setTaken((data ?? []).map((s) => new Date(s).getTime()))) }, [appt])

  async function answer(id, feeling) {
    await supabase.from('followups').insert({ report_id: id, feeling }); load()
  }
  async function book(h) {
    const { error } = await supabase.from('appointments').insert({ student_id: uid, slot: new Date(`${date}T${h}:00`).toISOString() })
    setMsg(error ? 'Ese horario ya fue tomado. Elige otro.' : ''); setDate(''); load()
  }
  async function cancel() {
    await supabase.from('appointments').update({ status: 'cancelada' }).eq('id', appt.id); load()
  }

  const day = date && new Date(`${date}T00:00`).getDay()
  const weekend = date && (day === 0 || day === 6)
  const tomorrow = new Date(Date.now() + 864e5)
  const res = check && RESULTS[check.result]

  return (
    <Page title="Seguimiento">
      <h2>Mis reportes</h2>
      {reports.length === 0 && <div className="box"><p>Todavía no has hecho ningún reporte.</p></div>}
      {reports.map((r) => (
        <div className="box" key={r.id}>
          <strong>Caso #{r.case_number} · {r.what}</strong><br />
          <span className="note">{fmtDate(r.happened_at)}</span>
          <p><span className="pill">{r.status}</span> {STATUS[r.status]}</p>
          {r.status !== 'cerrado' && (<>
            <strong>¿Cómo sigues?</strong>
            <div className="chips">
              {['mejor', 'igual', 'peor'].map((x) => (
                <button key={x} className={`chip ${fu[r.id] === x ? 'on' : ''}`} onClick={() => answer(r.id, x)}>{x[0].toUpperCase() + x.slice(1)}</button>
              ))}
            </div>
            {fu[r.id] === 'peor' && <p className="note">Gracias por avisar. Dimos prioridad a tu caso.</p>}
          </>)}
        </div>
      ))}

      <h2>Mi diagnóstico</h2>
      <div className={`box ${res?.cls ?? ''}`}>
        {res ? (<><strong>{res.title}</strong><p>{res.explain}</p><span className="note">Hecho el {fmtDate(iso(new Date(check.created_at)))}</span></>)
          : <p>Aún no has realizado tu diagnóstico.</p>}
        <div style={{ marginTop: 12 }}><button className="chip" onClick={() => nav('/checkin')}>{res ? 'Hacerlo de nuevo' : 'Realizar diagnóstico'}</button></div>
      </div>

      <h2>Mi cita</h2>
      <div className="box">
        {appt ? (<>
          <p><strong>{fmtSlot(appt.slot)}</strong></p>
          <button className="chip" onClick={cancel}>Cancelar cita</button>
        </>) : (<>
          <label>Elige un día (de lunes a viernes)
            <input type="date" min={iso(tomorrow)} max={iso(new Date(Date.now() + 30 * 864e5))} value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          {weekend && <p className="error">Ese día no hay citas. Elige un día entre semana.</p>}
          {date && !weekend && (<>
            <strong>Horarios disponibles</strong>
            <div className="chips">
              {HOURS.filter((h) => !taken.includes(new Date(`${date}T${h}:00`).getTime())).map((h) => (
                <button key={h} className="chip" onClick={() => book(h)}>{h}</button>
              ))}
            </div>
          </>)}
          {msg && <p className="error">{msg}</p>}
          {!date && <p className="note">No tienes una cita agendada.</p>}
        </>)}
      </div>
    </Page>
  )
}
