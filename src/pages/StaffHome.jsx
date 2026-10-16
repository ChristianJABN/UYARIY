import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth.jsx'

export default function StaffHome() {
  const { profile, signOut } = useAuth()
  const [reports, setReports] = useState([])

  useEffect(() => {
    supabase.from('reports').select('case_number, kind, priority, status, created_at')
      .order('created_at', { ascending: false })
      .then(({ data }) => setReports(data ?? []))
  }, [])

  return (
    <main className="page">
      <h1>Panel de {profile.full_name}</h1>
      <h2>Reportes recientes</h2>
      {reports.length === 0 && <p>Aún no hay reportes.</p>}
      <ul className="list">
        {reports.map((r) => (
          <li key={r.case_number} className={r.priority === 'alta' ? 'high' : ''}>
            Caso #{r.case_number} · {r.kind} · prioridad {r.priority} · {r.status}
          </li>
        ))}
      </ul>
      {/* Siguiente fase: dashboard con gráficos, detalle del caso y seguimiento */}
      <button className="link" onClick={signOut}>Cerrar sesión</button>
    </main>
  )
}
