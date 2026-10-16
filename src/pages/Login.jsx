import { useState } from 'react'
import { useAuth } from '../auth.jsx'

export default function Login() {
  const { signIn } = useAuth()
  const [code, setCode] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true); setError('')
    const { error } = await signIn(code, pin)
    if (error) setError('Código o PIN incorrecto. Revisa e intenta de nuevo.')
    setBusy(false)
  }

  return (
    <main className="page narrow">
      <h1 className="brand">UYARIY</h1>
      <p className="lead">Aquí te escuchamos.</p>
      <label>Código de estudiante
        <input value={code} onChange={(e) => setCode(e.target.value)} autoComplete="username" />
      </label>
      <label>PIN
        <input type="password" inputMode="numeric" value={pin}
          onChange={(e) => setPin(e.target.value)} autoComplete="current-password" />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn" onClick={submit} disabled={busy || !code || !pin}>
        {busy ? 'Entrando…' : 'Entrar'}
      </button>
    </main>
  )
}
