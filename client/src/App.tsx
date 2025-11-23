// Reference: javascript_log_in_with_replit blueprint
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";

// Pages
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Chat from "@/pages/Chat";
import VoiceMode from "@/pages/VoiceMode";
import ImageGenPage from "@/pages/ImageGenPage";
import Playground from "@/pages/Playground";
import Settings from "@/pages/Settings";
import Pricing from "@/pages/Pricing";
import ApiDocs from "@/pages/ApiDocs";
import Admin from "@/pages/Admin";
import Terms from "@/pages/legal/Terms";
import Privacy from "@/pages/legal/Privacy";
import Baa from "@/pages/legal/Baa";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Custom sidebar width for chat application (reference: Shadcn sidebar docs)
  const style = {
    "--sidebar-width": "16rem",       // 256px for better content
    "--sidebar-width-icon": "4rem",   // default icon width
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Unified routing for both authenticated and unauthenticated users
  return (
    <Switch>
      {/* Public routes - accessible to everyone */}
      <Route path="/" component={isAuthenticated ? Dashboard : Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/docs" component={ApiDocs} />
      <Route path="/legal/terms" component={Terms} />
      <Route path="/legal/privacy" component={Privacy} />
      <Route path="/legal/baa" component={Baa} />

      {/* Full-screen pages (no sidebar) */}
      <Route path="/chat" component={Chat} />
      <Route path="/voice" component={VoiceMode} />
      <Route path="/images" component={ImageGenPage} />

      {/* Protected pages - component handles redirect if not authenticated */}
      <Route path="/playground" component={Playground} />
      <Route path="/settings" component={Settings} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/admin" component={Admin} />

      {/* 404 catch-all */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <ServiceWorkerRegistration />
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
