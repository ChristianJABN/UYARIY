import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth.jsx'
import Page from '../components/Page.jsx'

const TYPES = ['Insultos o burlas', 'Golpes o empujones', 'Amenazas', 'Ciberacoso', 'Me excluyen', 'Otro']
const PLACES = ['Salón', 'Patio', 'Baños', 'Entrada o salida', 'Redes sociales', 'Otro']
const WHEN = ['Hoy', 'Esta semana', 'Hace tiempo']
const FREQ = ['Una vez', 'Varias veces', 'Todos los días']

function Pick({ label, opts, value, onChange }) {
  return (
    <>
      <strong>{label}</strong>
      <div className="chips">
        {opts.map((o) => <button key={o} className={`chip ${value === o ? 'on' : ''}`} onClick={() => onChange(o)}>{o}</button>)}
      </div>
    </>
  )
}

export default function Help() {
  const { session } = useAuth()
  const uid = session.user.id
  const [f, setF] = useState({ kind: '', type: '', place: '', when: '', freq: '', who: '' })
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [caseNo, setCaseNo] = useState(null)
  const [last, setLast] = useState(null)
  const [followed, setFollowed] = useState(false)
  const set = (k) => (v) => setF({ ...f, [k]: v })

  useEffect(() => {
    supabase.from('reports').select('id, case_number').eq('reporter_id', uid)
      .order('created_at', { ascending: false }).limit(1).then(({ data }) => setLast(data?.[0] ?? null))
  }, [uid])

  async function submit() {
    setBusy(true); setError('')
    let path = null
    if (file) {
      path = `${uid}/${Date.now()}-${file.name.replace(/[^\w.-]/g, '_')}`
      const { error: upErr } = await supabase.storage.from('evidencias').upload(path, file)
      if (upErr) { setError('No se pudo subir el archivo. Intenta sin él o con uno más pequeño.'); setBusy(false); return }
    }
    const priority = f.freq === 'Una vez' ? 'media' : 'alta'
    const { data, error: err } = await supabase.from('reports').insert({
      reporter_id: uid, kind: f.kind, what: f.type, place: f.place, happened_at: f.when,
      times: f.freq, aggressor_name: f.who || null, evidence_path: path, priority
    }).select('case_number').single()
    if (err) setError('No se pudo enviar. Intenta de nuevo.')
    else setCaseNo(data.case_number)
    setBusy(false)
  }

  async function followup(feeling) {
    await supabase.from('followups').insert({ report_id: last.id, feeling })
    setFollowed(feeling)
  }

  if (caseNo) {
    return (
      <Page title="Lo recibimos">
        <div className="box good">
          <p>Tu número de caso es</p><div className="big">#{caseNo}</div>
          <p>Un adulto de tu colegio lo revisará pronto. Guarda este número.</p>
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

  const ready = f.kind && f.type && f.place && f.when && f.freq
  return (
    <Page title="Necesito ayuda">
      {last && (
        <div className="box soft">
          <strong>Sobre tu caso #{last.case_number}: ¿cómo sigues?</strong>
          {followed ? <p>Gracias por contarnos. {followed === 'peor' ? 'Vamos a darle prioridad a tu caso.' : 'Seguimos atentos.'}</p> : (
            <div className="chips">
              {['mejor', 'igual', 'peor'].map((x) => <button key={x} className="chip" onClick={() => followup(x)}>{x[0].toUpperCase() + x.slice(1)}</button>)}
            </div>
          )}
        </div>
      )}
      <Pick label="¿A quién le pasó?" opts={['Me pasó a mí', 'Lo vi pasar']} value={f.kind === 'victima' ? 'Me pasó a mí' : f.kind === 'testigo' ? 'Lo vi pasar' : ''}
        onChange={(v) => set('kind')(v === 'Me pasó a mí' ? 'victima' : 'testigo')} />
      <Pick label="¿Qué pasó?" opts={TYPES} value={f.type} onChange={set('type')} />
      <Pick label="¿Dónde?" opts={PLACES} value={f.place} onChange={set('place')} />
      <Pick label="¿Cuándo?" opts={WHEN} value={f.when} onChange={set('when')} />
      <Pick label="¿Cuántas veces?" opts={FREQ} value={f.freq} onChange={set('freq')} />
      <label>¿Quién fue? (opcional)
        <input value={f.who} onChange={(e) => set('who')(e.target.value)} placeholder="Nombre o apodo" />
      </label>
      <label>Foto o captura (opcional)
        <input type="file" accept="image/*,video/*" onChange={(e) => setFile(e.target.files[0] ?? null)} />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn" disabled={!ready || busy} onClick={submit}>{busy ? 'Enviando…' : 'Enviar reporte'}</button>
    </Page>
  )
}
