import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth.jsx'
import { fmtDate, fmtSlot } from '../lib/dates.js'

const GRADES = [['all', 'General'], ['1', '1° sec.'], ['2', '2° sec.'], ['3', '3° sec.'], ['4', '4° sec.'], ['5', '5° sec.']]
const gradeOf = (r) => (r.profiles?.grade || '').match(/\d/)?.[0]
const count = (rows, key) => rows.reduce((o, r) => { const k = (r[key] || '—').split(':')[0]; o[k] = (o[k] || 0) + 1; return o }, {})

function Bars({ title, data }) {
  const max = Math.max(1, ...Object.values(data))
  return (
    <div className="box">
      <h2>{title}</h2>
      {Object.keys(data).length === 0 && <p>Sin datos para esta selección.</p>}
      {Object.entries(data).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
        <div className="bar" key={k}><span>{k}</span><i style={{ width: `${(v / max) * 60}%` }} /><b>{v}</b></div>
      ))}
    </div>
  )
}

export default function StaffHome() {
  const { profile, signOut } = useAuth()
  const psych = profile.staff_kind === 'psicologo'
  const [grade, setGrade] = useState('all')
  const [tab, setTab] = useState('resumen')
  const [reports, setReports] = useState([])
  const [follow, setFollow] = useState({})
  const [open, setOpen] = useState(null)
  const [convs, setConvs] = useState([])
  const [appts, setAppts] = useState([])
  const [sel, setSel] = useState(null)
  const [reply, setReply] = useState('')

  async function loadReports() {
    const { data } = await supabase.from('reports').select('*, profiles(full_name, grade, section)').order('created_at', { ascending: false })
    setReports(data ?? [])
    const { data: fu } = await supabase.from('followups').select('*').order('created_at')
    const g = {}; (fu ?? []).forEach((x) => (g[x.report_id] = [...(g[x.report_id] || []), x])); setFollow(g)
  }
  async function loadChats() {
    if (!psych) return
    const { data: ms } = await supabase.from('messages').select('*').order('created_at')
    const ids = [...new Set((ms ?? []).map((m) => m.student_id))]
    const { data: ps } = ids.length ? await supabase.from('profiles').select('id, full_name, grade, section').in('id', ids) : { data: [] }
    const list = ids.map((id) => ({ id, p: ps.find((p) => p.id === id), msgs: ms.filter((m) => m.student_id === id) }))
    list.forEach((c) => (c.urgent = c.msgs[c.msgs.length - 1].sender_id === c.id))
    setConvs(list.sort((a, b) => b.urgent - a.urgent))
    const { data: ap } = await supabase.from('appointments').select('*, profiles(full_name, grade, section)')
      .eq('status', 'agendada').gt('slot', new Date().toISOString()).order('slot')
    setAppts(ap ?? [])
  }
  useEffect(() => { loadReports(); loadChats(); const t = setInterval(loadChats, 8000); return () => clearInterval(t) }, [])

  const shown = grade === 'all' ? reports : reports.filter((r) => gradeOf(r) === grade)
  const pend = shown.filter((r) => r.status === 'pendiente').length
  const alta = shown.filter((r) => r.priority === 'alta' && r.status !== 'cerrado').length
  const conv = convs.find((c) => c.id === sel)

  const setStatus = async (id, status) => { await supabase.from('reports').update({ status }).eq('id', id); loadReports() }
  async function evidence(path) {
    const { data } = await supabase.storage.from('evidencias').createSignedUrl(path, 300)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }
  async function send() {
    const body = reply.trim(); if (!body) return
    setReply('')
    await supabase.from('messages').insert({ student_id: sel, sender_id: profile.id, body }); loadChats()
  }

  return (
    <main className="page">
      <img className="logo" style={{ width: 150, margin: '0 0 6px' }} src="/logo.png" alt="UYARIY" />
      <h1>Hola, {profile.full_name}</h1>
      <div className="gradebar">
        {GRADES.map(([k, l]) => <button key={k} className={`chip ${grade === k ? 'on' : ''}`} onClick={() => setGrade(k)}>{l}</button>)}
      </div>
      <div className="tabs">
        {[['resumen', 'Resumen'], ['casos', 'Casos'], ['mensajes', 'Mensajes']].map(([k, l]) => (
          <button key={k} className={`chip ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === 'resumen' && (<>
        <div className="stats">
          <div className="stat"><b>{shown.length}</b>Reportes</div>
          <div className="stat green"><b>{pend}</b>Pendientes</div>
          <div className="stat red"><b>{alta}</b>Prioridad alta</div>
        </div>
        <Bars title="Dónde ocurre" data={count(shown, 'place')} />
        <Bars title="Tipo de agresión" data={count(shown, 'what')} />
        <Bars title="Con qué frecuencia" data={count(shown, 'times')} />
      </>)}

      {tab === 'casos' && (<>
        {shown.length === 0 && <p>No hay reportes en esta selección.</p>}
        {shown.map((r) => (
          <div key={r.id} className={`case ${r.priority}`} onClick={() => setOpen(open === r.id ? null : r.id)}>
            <strong>Caso #{r.case_number} · {r.what}</strong><br />
            <small>{r.profiles?.full_name} · {r.profiles?.grade}{r.profiles?.section} · {r.status} · prioridad {r.priority}</small>
            {open === r.id && (
              <div onClick={(e) => e.stopPropagation()}>
                <dl>
                  <dt>Rol</dt><dd>{r.kind === 'victima' ? 'Víctima' : 'Testigo'}</dd>
                  <dt>Lugar</dt><dd>{r.place}</dd><dt>Cuándo</dt><dd>{fmtDate(r.happened_at)}</dd>
                  <dt>Frecuencia</dt><dd>{r.times}</dd><dt>Señalado</dt><dd>{r.aggressor_name || 'No indicó'}</dd>
                  <dt>Comentario</dt><dd>{r.comment || '—'}</dd>
                  <dt>Seguimiento</dt><dd>{(follow[r.id] || []).map((x) => x.feeling).join(' → ') || 'Sin respuestas'}</dd>
                </dl>
                <div className="chips" style={{ marginTop: 12 }}>
                  {r.evidence_path && <button className="chip" onClick={() => evidence(r.evidence_path)}>Ver evidencia</button>}
                  {['pendiente', 'revisado', 'cerrado'].map((s) => (
                    <button key={s} className={`chip ${r.status === s ? 'on' : ''}`} onClick={() => setStatus(r.id, s)}>{s}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </>)}

      {tab === 'mensajes' && (!psych ? (
        <div className="box"><p>Los mensajes urgentes de los estudiantes los atiende el psicólogo. Son privados.</p></div>
      ) : !sel ? (<>
        <p className="note">Los mensajes y las citas no dependen del grado seleccionado.</p>
        {convs.length === 0 && <p>Nadie ha escrito todavía.</p>}
        {convs.map((c) => (
          <div key={c.id} className={`case ${c.urgent ? 'alta' : 'media'}`} onClick={() => setSel(c.id)}>
            <strong>{c.urgent && '🚨 '}{c.p?.full_name}</strong> <small>{c.p?.grade}{c.p?.section}{c.urgent && ' · URGENTE sin responder'}</small><br />
            <small>{c.msgs[c.msgs.length - 1].body.slice(0, 60)}</small>
          </div>
        ))}
        <h2 style={{ marginTop: 20 }}>Próximas citas</h2>
        {appts.length === 0 && <p>No hay citas agendadas.</p>}
        {appts.map((a) => <div className="box" key={a.id}><strong>{fmtSlot(a.slot)}</strong><br />{a.profiles?.full_name} · {a.profiles?.grade}{a.profiles?.section}</div>)}
      </>) : (<>
        <button className="link" style={{ marginTop: 0 }} onClick={() => setSel(null)}>← Todas las conversaciones</button>
        <h2>{conv?.p?.full_name}</h2>
        <div className="chat">
          {conv?.msgs.map((m) => <div key={m.id} className={`bubble ${m.sender_id === profile.id ? 'me' : 'them'}`}>{m.body}</div>)}
        </div>
        <div className="send">
          <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Responder…" onKeyDown={(e) => e.key === 'Enter' && send()} />
          <button className="btn" onClick={send}>Enviar</button>
        </div>
      </>))}

      <button className="link" onClick={signOut}>Cerrar sesión</button>
    </main>
  )
}
