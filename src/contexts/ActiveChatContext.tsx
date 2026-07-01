import { createContext, useContext, useState, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { api } from '../lib/api'

export type ChatStatus = 'Connecting' | 'Active' | 'Processing' | 'Escalated' | 'Disconnected'

export interface ChatMessage {
  id: string
  sender: 'ai' | 'customer' | 'staff'
  text: string
  createdAt: string
}

interface ActiveChatContextType {
  status: ChatStatus
  messages: ChatMessage[]
  connect: (conversationId: string) => void
  disconnect: () => void
  sendMessage: (text: string, sender: 'customer' | 'staff') => void
  takeover: () => Promise<void>
  release: () => Promise<void>
}

const ActiveChatContext = createContext<ActiveChatContextType | undefined>(undefined)

export function ActiveChatProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ChatStatus>('Disconnected')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const activeId = useRef<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const connect = (conversationId: string) => {
    if (activeId.current === conversationId && wsRef.current?.readyState === WebSocket.OPEN) return
    
    disconnect() // clean up existing
    
    activeId.current = conversationId
    setStatus('Connecting')
    
    const token = sessionStorage.getItem('token') || ''
    const wsUrl = `${import.meta.env.VITE_WS_BASE_URL || 'ws://localhost/api/v1'}/chat/ws/${conversationId}?token=${token}`
    
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      if (activeId.current === conversationId) {
        setStatus('Active')
      }
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'typing') {
          setStatus(data.status ? 'Processing' : 'Active')
        } else if (data.type === 'new_message' || data.type === 'message') {
          setStatus('Active') // reset processing
          setMessages(prev => [...prev, {
            id: crypto.randomUUID(),
            sender: data.sender || 'ai',
            text: data.messages || data.text || '',
            createdAt: new Date().toLocaleTimeString()
          }])
        } else if (data.type === 'status_update') {
          if (data.status === 'human_handling') {
             setStatus('Escalated')
          } else if (data.status === 'active_ai') {
             setStatus('Active')
          }
        } else if (data.type === 'escalation') {
          setStatus('Escalated')
          if (data.message) {
            setMessages(prev => [...prev, {
              id: crypto.randomUUID(),
              sender: 'ai',
              text: data.message,
              createdAt: new Date().toLocaleTimeString()
            }])
          }
        }
      } catch (e) {
        console.error('Invalid WS message', e)
      }
    }

    ws.onclose = (event) => {
      if (activeId.current === conversationId) {
        setStatus('Disconnected')
        // Auto-reconnect on 1006 (Abnormal Closure)
        if (event.code === 1006) {
          reconnectTimeout.current = setTimeout(() => {
            connect(conversationId)
          }, 3000)
        }
      }
    }
  }

  const disconnect = () => {
    activeId.current = null
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current)
    }
    setStatus('Disconnected')
    setMessages([])
  }

  const sendMessage = (text: string, sender: 'customer' | 'staff') => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(text) // Send plain text as expected by backend chat.py
      // Optimistically add to UI
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        sender,
        text,
        createdAt: new Date().toLocaleTimeString()
      }])
    }
  }

  const takeover = async () => {
    if (!activeId.current) return
    try {
      await api.post(`/conversations/${activeId.current}/takeover`)
      setStatus('Escalated')
    } catch (error) {
      console.error('Failed to takeover', error)
    }
  }

  const release = async () => {
    if (!activeId.current) return
    try {
      await api.post(`/conversations/${activeId.current}/release`)
      setStatus('Active')
    } catch (error) {
      console.error('Failed to release', error)
    }
  }

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [])

  return (
    <ActiveChatContext.Provider value={{ status, messages, connect, disconnect, sendMessage, takeover, release }}>
      {children}
    </ActiveChatContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useActiveChat() {
  const context = useContext(ActiveChatContext)
  if (context === undefined) {
    throw new Error('useActiveChat must be used within an ActiveChatProvider')
  }
  return context
}
