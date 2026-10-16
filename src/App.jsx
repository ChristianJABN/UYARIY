import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth.jsx'
import Login from './pages/Login.jsx'
import Consent from './pages/Consent.jsx'
import StudentHome from './pages/StudentHome.jsx'
import StaffHome from './pages/StaffHome.jsx'
import Neutral from './pages/Neutral.jsx'
import QuickExit from './components/QuickExit.jsx'

export default function App() {
  const { session, profile, consented, loading } = useAuth()
  if (loading) return <p className="center">Cargando…</p>

  // Ruta pública: pantalla neutra de la salida rápida
  if (!session) {
    return (
      <Routes>
        <Route path="/tareas" element={<Neutral />} />
        <Route path="*" element={<Login />} />
      </Routes>
    )
  }
  if (!profile) return <p className="center">Tu cuenta aún no tiene perfil. Avisa a tu colegio.</p>
  if (!consented) return <Consent />

  const Home = profile.role === 'staff' ? StaffHome : StudentHome
  return (
    <>
      {profile.role === 'student' && <QuickExit />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tareas" element={<Neutral />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  )
}
