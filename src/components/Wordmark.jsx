// Фирменный знак GAS. Буквы нарисованы одной линией с круглыми концами — тот же характер, что у иконок и у Гаса.
// Особенность: у «A» вместо перекладины точка (метка на карте), единственный зелёный акцент.
export function Wordmark({ height = 28, className = '', dot = 'var(--green)' }) {
  return (
    <svg className={`wordmark-svg ${className}`} height={height} viewBox="0 0 105 40" role="img" aria-label="GAS" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M28.7 12.5A13 13 0 1 0 31 20H20" />
      <path d="M40 33L53 8L66 33" />
      <circle cx="53" cy="26" r="3.4" fill={dot} stroke="none" />
      <path transform="translate(-3 0)" d="M98 11.5C92 6.5 82 8 82 15C82 22 96 18 96 26C96 33 86 35 80 29" />
    </svg>
  )
}
