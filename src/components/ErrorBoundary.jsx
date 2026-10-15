import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack)
  }

  componentDidUpdate(previousProps) {
    if (this.state.error && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null })
    }
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-6">
        <div className="card max-w-md text-center">
          <AlertTriangle className="w-10 h-10 text-warning mx-auto mb-3" />
          <h2 className="font-display text-xl font-bold text-text-p">Something went wrong</h2>
          <p className="text-sm text-text-m mt-2">This page hit an unexpected error. Your data is safe.</p>
          <div className="flex justify-center gap-2 mt-5">
            <button className="btn btn-primary" onClick={() => this.setState({ error: null })}>Try again</button>
            <a className="btn btn-ghost" href="/">Home</a>
          </div>
        </div>
      </div>
    )
  }
}
