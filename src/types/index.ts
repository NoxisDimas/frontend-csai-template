export type MetricCard = {
  id: string
  label: string
  value: string
  delta: string
  status: 'primary' | 'success' | 'warning' | 'danger'
}

export type ChartPoint = {
  name: string
  value: number
  target?: number
}

export type ChatMessage = {
  id: string
  sender: 'user' | 'ai' | 'human'
  content: string
  createdAt: string
  status?: 'seen' | 'delivered'
  type?: 'text' | 'code' | 'image'
}

export type Conversation = {
  id: string
  name: string
  email: string
  subject: string
  status: 'online' | 'waiting' | 'active' | 'escalated' | 'closed'
  channel: 'AI' | 'Human'
  lastMessage: string
  updatedAt: string
  unread: number
}

export type Ticket = {
  id: string
  customer: string
  subject: string
  priority: 'Low' | 'Medium' | 'High' | 'Urgent'
  status: 'Open' | 'Pending' | 'Solved' | 'Closed'
  assignedAgent: string
  createdAt: string
}

export type Customer = {
  id: string
  name: string
  email: string
  phone: string
  company: string
  status: 'Online' | 'Offline' | 'Waiting'
  lastActivity: string
  conversations: number
  rating: number
}

export type Agent = {
  id: string
  name: string
  role: string
  status: 'Online' | 'Offline' | 'Busy'
  performance: {
    chats: number
    rating: number
    resolutionTime: string
  }
}

export type PromptDefinition = {
  id: string
  label: string
  type: 'system' | 'welcome' | 'escalation'
  content: string
}

export type KnowledgeFile = {
  id: string
  name: string
  uploadedAt: string
  status: 'Processing' | 'Ready' | 'Error'
  embedding: 'Pending' | 'Complete'
}

export type NotificationItem = {
  id: string
  title: string
  description: string
  type: 'new-chat' | 'escalation' | 'ticket' | 'ai-error' | 'agent-mention'
  timestamp: string
}

export type AuditEvent = {
  id: string
  user: string
  action: string
  target: string
  date: string
}
