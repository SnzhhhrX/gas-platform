// Применяется до отрисовки — без вспышки белого экрана при тёмной теме
try {
  var p = localStorage.getItem('gas-theme') || 'auto'
  var d = p === 'dark' || (p === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = d ? 'dark' : 'light'
  document.querySelector('meta[name=theme-color]').setAttribute('content', d ? '#111e1d' : '#f1f6f3')
} catch (e) {}
