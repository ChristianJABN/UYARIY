// Yari: la mascota. Su ánimo cambia según cuánto hace que el estudiante hizo su check-in.
export default function Mascot({ mood = 'happy' }) {
  const mouth = { happy: 'M38 62 Q50 74 62 62', neutral: 'M40 66 L60 66', sad: 'M38 70 Q50 58 62 70' }[mood]
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label={`Yari está ${mood === 'happy' ? 'contenta' : mood === 'neutral' ? 'tranquila' : 'triste'}`}>
      <path d="M12 100 Q12 74 50 74 Q88 74 88 100 Z" fill="#1a1a1a" />
      <circle cx="50" cy="46" r="26" fill="#fff8e1" stroke="#1a1a1a" strokeWidth="4" />
      <circle cx="40" cy="42" r="3.5" fill="#1a1a1a" /><circle cx="60" cy="42" r="3.5" fill="#1a1a1a" />
      <path d={mouth} fill="none" stroke="#1a1a1a" strokeWidth="4" strokeLinecap="round" />
      <path d="M26 18 L20 8 M50 12 L50 2 M74 18 L80 8" stroke="#1a1a1a" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}
