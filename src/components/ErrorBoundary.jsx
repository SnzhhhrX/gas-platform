import { Component } from 'react'
import { Icon } from './Icon'

/**
 * Catches render errors in heavy interactive modules (maps, quizzes, charts)
 * so a single failing subtree never takes down the whole app.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    if (typeof console !== 'undefined') {
      console.error('[GAS ErrorBoundary]', error, info?.componentStack)
    }
  }

  reset = () => this.setState({ error: null })

  render() {
    if (this.state.error) {
      const { fallback, title = 'Что-то пошло не так', onRetry } = this.props
      if (fallback) return typeof fallback === 'function' ? fallback(this.reset) : fallback
      return (
        <div className="error-boundary" role="alert">
          <div className="error-boundary-icon">
            <Icon name="alert" size={28} />
          </div>
          <b>{title}</b>
          <p>Раздел временно недоступен. Попробуйте ещё раз.</p>
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              this.reset()
              onRetry?.()
            }}
          >
            Повторить
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
