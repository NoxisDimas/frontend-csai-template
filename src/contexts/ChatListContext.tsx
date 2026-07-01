import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import type { ReactNode } from 'react'
import { api } from '../lib/api'

export interface ConversationMeta {
  id: string
  status: string
  created_at: string
  lastMessage?: string
  updatedAt?: string
  unread?: number
}

interface ChatListContextType {
  conversations: ConversationMeta[]
  isLoading: boolean
  hasMore: boolean
  loadMore: () => Promise<void>
}

const ChatListContext = createContext<ChatListContextType | undefined>(undefined)

export function ChatListProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<ConversationMeta[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const limit = 15
  const wsRef = useRef<WebSocket | null>(null)

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return
    setIsLoading(true)
    try {
      const res = await api.get(`/conversations?skip=${offset}&limit=${limit}`)
      const response = res.data.data || []
      setConversations(prev => {
        const existingIds = new Set(prev.map(c => c.id))
        const newConvs = response.filter((c: any) => !existingIds.has(c.id))
        return [...prev, ...newConvs]
      })
      setHasMore(response.length === limit)
      setOffset(prev => prev + limit)
    } catch (error) {
      console.error('Failed to fetch conversations', error)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, hasMore, offset])

  useEffect(() => {
    // Initial load
    if (conversations.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadMore()
    }
    
    // Connect to Inbox WebSocket
    const token = sessionStorage.getItem('token') || ''
    const wsUrl = `${import.meta.env.VITE_WS_BASE_URL || 'ws://localhost/api/v1'}/ws/inbox?token=${token}`
    
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.type === 'new_message') {
          setConversations(prev => {
            const convIndex = prev.findIndex(c => c.id === data.conversation_id)
            if (convIndex > -1) {
              const updatedConv = {
                ...prev[convIndex],
                lastMessage: data.messages || data.text || 'New message',
                updatedAt: new Date().toISOString(),
                unread: (prev[convIndex].unread || 0) + 1
              }
              const newArray = [...prev]
              newArray.splice(convIndex, 1)
              return [updatedConv, ...newArray] // Move to top
            }
            return prev
          })
        } else if (data.type === 'status_update') {
          setConversations(prev => {
            return prev.map(c => 
              c.id === data.conversation_id ? { ...c, status: data.status } : c
            )
          })
        }
      } catch (e) {
        console.error('Inbox WS parse error:', e)
      }
    }
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <ChatListContext.Provider value={{ conversations, isLoading, hasMore, loadMore }}>
      {children}
    </ChatListContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useChatList() {
  const context = useContext(ChatListContext)
  if (context === undefined) {
    throw new Error('useChatList must be used within a ChatListProvider')
  }
  return context
}
