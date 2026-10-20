export const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10)
export const fmtDate = (s) => /^\d{4}-\d\d-\d\d$/.test(s || '')
  ? new Date(s + 'T00:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }) : s
export const fmtSlot = (s) => new Date(s).toLocaleString('es-PE',
  { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
