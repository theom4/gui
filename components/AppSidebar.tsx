import { Zap, Phone, Settings, Users, LayoutDashboard, Megaphone, MessagesSquare, MessageCircle, LogOut } from "lucide-react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/auth/AuthContext"
import { useEffect } from "react"
import nanoassistLogo from '@/assets/nanoassist-logo.jpg'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Automations", url: "/automations", icon: Zap },
  { title: "Call Recordings", url: "/call-recordings", icon: Phone },
  { title: "CRM", url: "#", icon: Users },
  { title: "Campaigns", url: "/campaigns", icon: Megaphone },
  { title: "AI Chat", url: "/chat", icon: MessagesSquare },
  { title: "WhatsApp", url: "/whatsapp", icon: MessageCircle },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { profile } = useAuth()
  const currentPath = location.pathname
  const collapsed = state === "collapsed"
  const name = (profile?.full_name || "Account").trim()

  // Preload images pentru încărcare instant
  useEffect(() => {
    if (profile?.role === 'admin') {
      const img = new Image()
      img.src = nanoassistLogo
    } else if (profile?.avatar_url) {
      const img = new Image()
      img.src = profile.avatar_url
    }
  }, [profile?.avatar_url, profile?.role])

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error)
        toast({
          title: "Sign Out Failed",
          description: error.message,
          variant: "destructive",
        })
        return
      }
      // Force navigation to auth in addition to auth listener
      navigate('/auth', { replace: true })
    } catch (e: unknown) {
      console.error('Unexpected error during sign out:', e)
      toast({
        title: "An Unexpected Error Occurred",
        description: e instanceof Error ? e.message : "Please try signing out again.",
        variant: "destructive",
      })
    }
  }

  const isActive = (path: string) => currentPath === path
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-primary before:rounded-r bg-white text-primary font-medium" 
      : "hover:bg-muted/50"

  return (
    <Sidebar
      collapsible="icon"
    >
      <SidebarContent className="flex flex-col h-full">
        {/* Brand / Logo */}
        <div className="pt-3 px-2">
          <div className="flex items-center justify-center">
            {profile?.role === 'admin' ? (
              <img
                src={nanoassistLogo}
                alt="NanoAssist"
                className={`${collapsed ? 'h-12 w-12' : 'h-20 w-full'} object-contain select-none`}
                draggable={false}
                loading="eager"
                fetchpriority="high"
              />
            ) : profile?.avatar_url && (
              <img
                src={profile.avatar_url}
                alt={name || 'Account'}
                className={`${collapsed ? 'h-12 w-12' : 'h-20 w-full'} object-contain select-none`}
                draggable={false}
                loading="eager"
                fetchpriority="high"
              />
            )}
          </div>
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {items.map((item) => {
                const active = isActive(item.url)
                return (
                  <SidebarMenuItem key={item.title}>
                    {item.url === "#" ? (
                      <SidebarMenuButton className="cursor-not-allowed opacity-50">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span className="ml-2">{item.title}</span>}
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        className={active
                          ? "relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-primary before:rounded-r bg-white text-primary font-medium"
                          : "bg-transparent hover:bg-muted/50"}
                      >
                        <NavLink to={item.url} end className="flex items-center">
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span className="ml-2">{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/account")}
                  className={
                    isActive("/account")
                      ? "relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-primary before:rounded-r bg-white text-primary font-medium"
                      : "bg-transparent hover:bg-muted/50"
                  }
                >
                  <NavLink to="/settings" end className="flex items-center">
                    <Users className="h-4 w-4" />
                    {!collapsed && <span className="ml-2">User Account</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <button
                  role="menuitem"
                  tabIndex={0}
                  onClick={async (e) => {
                    e.preventDefault()
                    await handleSignOut()
                  }}
                  onKeyDown={async (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      await handleSignOut()
                    }
                  }}
                  className="w-full h-8 text-sm flex items-center gap-2 px-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 outline-none pointer-events-auto relative z-10"
                >
                  <LogOut className="h-4 w-4" />
                  {!collapsed && <span>Sign Out</span>}
                </button>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
