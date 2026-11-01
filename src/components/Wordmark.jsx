// Фирменный знак GAS: минималистичный набор шрифтом Manrope, плотный трекинг. Единственный акцент — зелёная точка.
export function Wordmark({ height = 28, className = '', dot = 'var(--green)' }) {
  return (
    <span className={`wordmark-text ${className}`} style={{ fontSize: height, '--dot': dot }} role="img" aria-label="GAS">
      GAS<i aria-hidden="true" />
    </span>
  )
}
