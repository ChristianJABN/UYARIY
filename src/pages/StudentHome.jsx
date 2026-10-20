import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth.jsx'
import Mascot from '../components/Mascot.jsx'

export default function StudentHome() {
  const { profile, session, signOut } = useAuth()
  const nav = useNavigate()
  const [days, setDays] = useState(null)

  useEffect(() => {
    supabase.from('checkins').select('created_at').eq('student_id', session.user.id)
      .order('created_at', { ascending: false }).limit(1)
      .then(({ data }) => setDays(data?.length ? Math.floor((Date.now() - new Date(data[0].created_at)) / 864e5) : 99))
  }, [session])

  const mood = days === null || days <= 7 ? 'happy' : days <= 14 ? 'neutral' : 'sad'
  const msg = { happy: 'Qué bueno verte. ¿Cómo va tu semana?', neutral: 'Te extrañé. Cuéntame cómo estás.', sad: 'Hace tiempo que no nos vemos. Aquí sigo.' }[mood]

  return (
    <main className="page">
      <section className="hero">
        <Mascot mood={mood} />
        <div>
          <h1>Hola, {profile.full_name?.split(' ')[0]}</h1>
          <p>{msg}</p>
        </div>
      </section>
      <div className="tiles">
        <button className="tile" onClick={() => nav('/checkin')}>
          <span className="ico">💛</span><strong>Realizar diagnóstico</strong><span>Una evaluación corta y privada</span>
        </button>
        <button className="tile help" onClick={() => nav('/ayuda')}>
          <span className="ico">✋</span><strong>Reportar caso</strong><span>Cuéntanos qué pasó</span>
        </button>
        <button className="tile chat" onClick={() => nav('/seguimiento')}>
          <span className="ico">📋</span><strong>Seguimiento</strong><span>Tu reporte, diagnóstico y citas</span>
        </button>
        <button className="tile rose" onClick={() => nav('/urgente')}>
          <span className="ico">🚨</span><strong>Algo urgente</strong><span>Si te sientes en riesgo</span>
        </button>
      </div>
      <button className="link" onClick={signOut}>Cerrar sesión</button>
    </main>
  )
}
