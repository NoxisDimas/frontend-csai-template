import React from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router";
import { AppLayout } from "./components/layout/AppLayout";
import { Login } from "./pages/Login";
import { Overview } from "./pages/Overview";
import { ChatSimulator } from "./pages/ChatSimulator";
import { LiveInbox } from "./pages/LiveInbox";
import { KnowledgeBase } from "./pages/KnowledgeBase";
import { UserManagement } from "./pages/UserManagement";
import { PlaceholderPage } from "./pages/Placeholder";
import { Products } from "./pages/Products";
import { Tickets } from "./pages/Tickets";
import { ConversationHistory } from "./pages/ConversationHistory";
import { Settings } from "./pages/Settings";
import { Integrations } from "./pages/Integrations";
import NotFoundPage from "./pages/NotFoundPage";
import { useAuth } from "./contexts/AuthContext";

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout />;
}

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/chat-simulator",
    Component: ChatSimulator,
  },
  {
    path: "/",
    Component: ProtectedRoute,
    children: [
      { index: true, Component: Overview },
      { path: "inbox", Component: LiveInbox },
      { path: "history", Component: ConversationHistory },
      { path: "knowledge", Component: KnowledgeBase },
      { path: "products", Component: Products },
      { path: "tickets", Component: Tickets },
      { path: "analytics", Component: () => <PlaceholderPage title="Analytics" description="Analyze system performance." /> },
      { path: "settings", Component: Settings },
      { path: "integrations", Component: Integrations },
      { path: "users", Component: UserManagement },
      { path: "*", Component: NotFoundPage },
    ],
  },
  {
    path: "*",
    Component: NotFoundPage,
  }
]);
