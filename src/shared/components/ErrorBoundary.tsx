'use client'
import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }
  static getDerivedStateFromError(): State { return { hasError: true } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('ErrorBoundary:', error, info) }
  render() {
    if (this.state.hasError) return this.props.fallback ?? <div>문제가 발생했습니다. 새로고침해주세요.</div>
    return this.props.children
  }
}
