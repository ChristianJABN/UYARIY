import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth.jsx'
import { iso } from '../lib/dates.js'
import Page from '../components/Page.jsx'

const TYPES = ['Insultos o burlas', 'Golpes o empujones', 'Amenazas', 'Ciberacoso', 'Me excluyen', 'Otro']
const PLACES = ['Salón', 'Patio', 'Baños', 'Entrada o salida', 'Redes sociales', 'Otro']
const FREQ = ['Una vez', 'Varias veces', 'Todos los días']

function Pick({ label, opts, value, onChange, other, onOther, otherLabel }) {
  return (
    <>
      <strong>{label}</strong>
      <div className="chips">
        {opts.map((o) => <button key={o} className={`chip ${value === o ? 'on' : ''}`} onClick={() => onChange(o)}>{o}</button>)}
      </div>
      {value === 'Otro' && (
        <label>{otherLabel}
          <input value={other} onChange={(e) => onOther(e.target.value)} placeholder="Escríbelo con tus palabras" />
        </label>
      )}
    </>
  )
}

export default function Help() {
  const { session } = useAuth()
  const uid = session.user.id
  const [f, setF] = useState({ kind: '', type: '', typeOther: '', place: '', placeOther: '', when: '', freq: '', who: '', comment: '' })
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [caseNo, setCaseNo] = useState(null)
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }))

  async function submit() {
    setBusy(true); setError('')
    let path = null
    if (file) {
      path = `${uid}/${Date.now()}-${file.name.replace(/[^\w.-]/g, '_')}`
      const { error: upErr } = await supabase.storage.from('evidencias').upload(path, file)
      if (upErr) { setError('No se pudo subir el archivo. Intenta sin él o con uno más pequeño.'); setBusy(false); return }
    }
    const { data, error: err } = await supabase.from('reports').insert({
      reporter_id: uid, kind: f.kind,
      what: f.type === 'Otro' ? `Otro: ${f.typeOther.trim()}` : f.type,
      place: f.place === 'Otro' ? `Otro: ${f.placeOther.trim()}` : f.place,
      happened_at: f.when, times: f.freq, aggressor_name: f.who || null,
      comment: f.comment.trim() || null, evidence_path: path,
      priority: f.freq === 'Una vez' ? 'media' : 'alta'
    }).select('case_number').single()
    if (err) setError('No se pudo enviar. Intenta de nuevo.')
    else setCaseNo(data.case_number)
    setBusy(false)
  }

  if (caseNo) {
    return (
      <Page title="Lo recibimos">
        <div className="box good">
          <p>Tu número de caso es</p><div className="big">#{caseNo}</div>
          <p>Un adulto de tu colegio lo revisará pronto. Puedes ver su estado en “Seguimiento”.</p>
        </div>
        <div className="box warn">
          <strong>Si estás en peligro ahora</strong>
          <p>Avisa a un adulto de confianza o llama a la Línea 100.</p>
        </div>
        <a className="btn dark" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
          href="https://www.siseve.pe" target="_blank" rel="noreferrer">Reportar también en SíseVe</a>
      </Page>
    )
  }

  const otherOk = (v, o) => v !== 'Otro' || o.trim()
  const ready = f.kind && f.type && f.place && f.when && f.freq && otherOk(f.type, f.typeOther) && otherOk(f.place, f.placeOther)
  return (
    <Page title="Reportar caso">
      <Pick label="¿A quién le pasó?" opts={['Me pasó a mí', 'Lo vi pasar']}
        value={f.kind === 'victima' ? 'Me pasó a mí' : f.kind === 'testigo' ? 'Lo vi pasar' : ''}
        onChange={(v) => set('kind')(v === 'Me pasó a mí' ? 'victima' : 'testigo')} />
      <Pick label="¿Qué pasó?" opts={TYPES} value={f.type} onChange={set('type')} other={f.typeOther} onOther={set('typeOther')} otherLabel="¿Qué pasó?" />
      <Pick label="¿Dónde ocurrió?" opts={PLACES} value={f.place} onChange={set('place')} other={f.placeOther} onOther={set('placeOther')} otherLabel="¿Dónde ocurrió?" />
      <label>¿Cuándo pasó?
        <input type="date" max={iso(new Date())} value={f.when} onChange={(e) => set('when')(e.target.value)} />
      </label>
      <Pick label="¿Cuántas veces?" opts={FREQ} value={f.freq} onChange={set('freq')} />
      <label>¿Quién fue? (opcional)
        <input value={f.who} onChange={(e) => set('who')(e.target.value)} placeholder="Nombre o apodo" />
      </label>
      <label>Comentario adicional (opcional)
        <textarea value={f.comment} onChange={(e) => set('comment')(e.target.value)} placeholder="Cualquier detalle que quieras agregar" />
      </label>
      <label>Foto o captura (opcional)
        <input type="file" accept="image/*,video/*" onChange={(e) => setFile(e.target.files[0] ?? null)} />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn" disabled={!ready || busy} onClick={submit}>{busy ? 'Enviando…' : 'Enviar reporte'}</button>
    </Page>
  )
}
