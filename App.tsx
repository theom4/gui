import { BrowserRouter, Routes, Route, Navigate, useLocation, NavLink } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/auth/AuthContext';
import { Home, Users, Settings, PanelLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { queryClient } from "@/lib/queryClient";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Automations from "./pages/Automations";
import SettingsPage from "./pages/Settings";
import Campaigns from "./pages/Campaigns";
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";
import CallRecordings from "./pages/CallRecordings";
import WhatsApp from "./pages/WhatsApp";

import ManageUsers from "./pages/admin/ManageUsers";
import AdminDashboard from "./pages/admin/AdminDashboard";
import PageTitle from "./components/PageTitle";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <PageTitle />
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

const AppRoutes = () => {
  const { session, profile } = useAuth();
  const location = useLocation();

  if (!session) {
    return (
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={<Navigate to="/auth" state={{ from: location }} replace />} />
      </Routes>
    );
  }

  if (!profile) {
    return <div className="flex items-center justify-center min-h-screen">Verifying profile...</div>;
  }

  if (profile.role === 'admin') {
    return (
      <Routes>
        <Route path="/admin/*" element={<AdminLayout />} />
        <Route path="/*" element={<Navigate to="/admin" replace />} />
      </Routes>
    );
  }

  if (profile.role === 'user') {
    return (
      <Routes>
        <Route path="/*" element={<UserLayout />} />
        <Route path="/admin/*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return <div className="flex items-center justify-center min-h-screen">Unknown user role.</div>;
};


const UserLayout = () => (
  <SidebarProvider>
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <header className="h-12 flex items-center gap-2 border-b bg-background px-2">
          <SidebarTrigger />
          <div className="ml-auto pr-2">
            <UserAvatarButton />
          </div>
        </header>
        <main className="flex-1 bg-background">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/automations" element={<Automations />} />
            <Route path="/call-recordings" element={<CallRecordings />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/whatsapp" element={<WhatsApp />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </div>
  </SidebarProvider>
);

const AdminLayout = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        toast({
          title: "Sign Out Failed",
          description: error.message,
          variant: "destructive",
        });
      }
      navigate('/auth', { replace: true });
    } catch (e: unknown) {
      console.error('Unexpected error during sign out:', e);
      toast({
        title: "An Unexpected Error Occurred",
        description: e instanceof Error ? e.message : "Please try signing out again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) => `flex h-9 w-9 items-center justify-center rounded-lg transition-colors md:h-8 md:w-8 ${isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Home className="h-5 w-5" />
            <span className="sr-only">Dashboard</span>
          </NavLink>
          <NavLink
            to="/admin/users"
            className={({ isActive }) => `flex h-9 w-9 items-center justify-center rounded-lg transition-colors md:h-8 md:w-8 ${isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Users className="h-5 w-5" />
            <span className="sr-only">Manage Users</span>
          </NavLink>
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
        </nav>
      </aside>
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs">
              <nav className="grid gap-6 text-lg font-medium">
                <NavLink to="/admin" end className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
                  <Home className="h-5 w-5" />
                  Dashboard
                </NavLink>
                <NavLink to="/admin/users" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
                  <Users className="h-5 w-5" />
                  Manage Users
                </NavLink>
              </nav>
            </SheetContent>
          </Sheet>
          <div className="relative ml-auto flex-1 md:grow-0">
            {/* Can add a search bar here later */}
          </div>
          <UserAvatarButton onLogout={handleSignOut} displayName={profile?.full_name || undefined} />
        </header>
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/users" element={<ManageUsers />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;

// Reusable avatar button used in top-right user area
function UserAvatarButton({ onLogout, displayName }: { onLogout?: () => void; displayName?: string }) {
  const { profile } = useAuth();
  const name = displayName || profile?.full_name || 'My Account';
  const initial = (name || 'U').trim().charAt(0).toUpperCase();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="inline-flex items-center cursor-pointer">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onSelect={() => onLogout && onLogout()}>Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
