import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth.jsx'
import Login from './pages/Login.jsx'
import Consent from './pages/Consent.jsx'
import StudentHome from './pages/StudentHome.jsx'
import CheckIn from './pages/CheckIn.jsx'
import Help from './pages/Help.jsx'
import Urgent from './pages/Urgent.jsx'
import Follow from './pages/Follow.jsx'
import StaffHome from './pages/StaffHome.jsx'
import Neutral from './pages/Neutral.jsx'
import QuickExit from './components/QuickExit.jsx'

export default function App() {
  const { session, profile, consented, loading } = useAuth()
  if (loading) return <p className="center">Cargando…</p>

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

  if (profile.role === 'staff') {
    return (
      <Routes>
        <Route path="/" element={<StaffHome />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    )
  }
  return (
    <>
      <QuickExit />
      <Routes>
        <Route path="/" element={<StudentHome />} />
        <Route path="/checkin" element={<CheckIn />} />
        <Route path="/ayuda" element={<Help />} />
        <Route path="/urgente" element={<Urgent />} />
        <Route path="/seguimiento" element={<Follow />} />
        <Route path="/tareas" element={<Neutral />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  )
}
