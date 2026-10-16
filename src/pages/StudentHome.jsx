import { useAuth } from '../auth.jsx'

const ACTIONS = [
  { title: 'Cuéntanos cómo estás', text: 'Un check-in corto y privado.', soon: true },
  { title: 'Necesito ayuda', text: 'Reporta lo que te pasa o lo que viste.', soon: true },
  { title: 'Quiero hablar con alguien', text: 'Escríbele a tu psicólogo o tutor.', soon: true },
  { title: 'Mi mascota', text: 'Visítala cada semana.', soon: true }
]

export default function StudentHome() {
  const { profile, signOut } = useAuth()
  return (
    <main className="page">
      <h1>Hola, {profile.full_name?.split(' ')[0]}</h1>
      <div className="grid">
        {ACTIONS.map((a) => (
          <button key={a.title} className="card" disabled={a.soon}>
            <strong>{a.title}</strong>
            <span>{a.text}</span>
            {a.soon && <em>Próximamente</em>}
          </button>
        ))}
      </div>
      <button className="link" onClick={signOut}>Cerrar sesión</button>
    </main>
  )
}
