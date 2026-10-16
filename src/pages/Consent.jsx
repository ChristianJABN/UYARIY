import { useState } from 'react'
import { useAuth } from '../auth.jsx'

export default function Consent() {
  const { acceptConsent, signOut } = useAuth()
  const [ok, setOk] = useState(false)

  return (
    <main className="page narrow">
      <h1>Tu privacidad</h1>
      <p>Antes de empezar, esto es lo que debes saber:</p>
      <ul>
        <li>Lo que cuentes aquí solo lo ve el tutor o psicólogo de tu colegio.</li>
        <li>Tus compañeros nunca sabrán que hiciste un reporte.</li>
        <li>Los resultados del check-in te orientan, pero no son un diagnóstico.</li>
        <li>Si estás en peligro ahora, avisa a un adulto de confianza o llama a la Línea 100.</li>
      </ul>
      <label className="check">
        <input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} />
        He leído esto y acepto usar UYARIY.
      </label>
      {/* TODO: agregar consentimiento de padres/IE según asesoría legal (Ley 29733) */}
      <button className="btn" disabled={!ok} onClick={acceptConsent}>Aceptar y continuar</button>
      <button className="link" onClick={signOut}>No acepto</button>
    </main>
  )
}
