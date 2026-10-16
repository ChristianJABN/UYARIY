import { useAuth } from '../auth.jsx'

// Botón fijo: cierra la sesión y muestra una pantalla neutra.
export default function QuickExit() {
  const { signOut } = useAuth()
  const exit = async () => {
    await signOut()
    window.location.replace('/tareas')
  }
  return (
    <button className="quick-exit" onClick={exit} aria-label="Salir rápido">
      Salir
    </button>
  )
}
