import { useNavigate } from 'react-router-dom'

export default function Page({ title, children }) {
  const nav = useNavigate()
  return (
    <main className="page">
      <div className="top">
        <button className="back" onClick={() => nav('/')} aria-label="Volver al inicio">←</button>
        <h1>{title}</h1>
      </div>
      {children}
    </main>
  )
}
