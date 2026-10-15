import { useEffect, useRef } from 'react'

const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')

export const SSE_EVENTS = [
  'kyc:status_changed', 'order:status_changed', 'order:rider_assigned', 'escrow:released',
  'fulfillment:status_changed', 'fulfillment:rider_assigned', 'fulfillment:confirmed',
  'waiver:approved', 'waiver:rejected', 'payment:confirmed',
]

export function useSSE(enabled, handlers) {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    if (!enabled || typeof EventSource === 'undefined') return undefined
    let source
    let timer
    let attempts = 0
    let closed = false

    const connect = () => {
      source = new EventSource(`${BASE}/api/events/subscribe`, { withCredentials: true })
      source.addEventListener('connected', () => { attempts = 0 })
      SSE_EVENTS.forEach((name) => {
        source.addEventListener(name, (event) => {
          let payload = {}
          try {
            payload = JSON.parse(event.data)
          } catch {
            // Ignore malformed events without interrupting the stream.
          }
          handlersRef.current?.[name]?.(payload)
          handlersRef.current?.['*']?.(name, payload)
        })
      })
      source.onerror = () => {
        source.close()
        if (closed) return
        attempts += 1
        timer = setTimeout(connect, Math.min(30000, 1000 * 2 ** attempts))
      }
    }

    connect()
    return () => {
      closed = true
      clearTimeout(timer)
      source?.close()
    }
  }, [enabled])
}
