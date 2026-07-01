import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

interface UiContextType {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
}

const UiContext = createContext<UiContextType | undefined>(undefined)

export function UiProvider({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev)
  }

  return (
    <UiContext.Provider value={{ sidebarCollapsed, toggleSidebar }}>
      {children}
    </UiContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUi() {
  const context = useContext(UiContext)
  if (context === undefined) {
    throw new Error('useUi must be used within a UiProvider')
  }
  return context
}
