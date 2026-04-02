import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  BarChart3, 
  LogOut, 
  User, 
  PlusCircle
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout, isLoggingOut } = useAuth();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
    { href: "/monthly", label: "Monthly Summary", icon: BarChart3 },
  ];

  return (
    <aside className="w-72 bg-sidebar text-sidebar-foreground flex flex-col h-screen sticky top-0 border-r border-sidebar-border shadow-2xl">
      <div className="p-6 flex items-center space-x-3 mb-6">
        <div className="bg-primary/20 p-2 rounded-xl border border-primary/30">
          <img 
            src={`${import.meta.env.BASE_URL}images/logo.png`} 
            alt="Finance Tracker Logo" 
            className="w-8 h-8 object-contain drop-shadow-md"
          />
        </div>
        <span className="font-display text-2xl font-bold tracking-tight bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent">
          FinanceFlow
        </span>
      </div>

      <div className="px-4 mb-8">
        <Link href="/transactions/new" className="w-full flex items-center justify-center space-x-2 bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-4 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0">
          <PlusCircle className="w-5 h-5" />
          <span>New Transaction</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className="block relative">
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-sidebar-accent rounded-xl"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <div className={`
                relative flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors
                ${isActive ? 'text-white' : 'text-sidebar-foreground/70 hover:text-white hover:bg-sidebar-accent/50'}
              `}>
                <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                <span className="font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border bg-sidebar-accent/30 backdrop-blur-md">
        <div className="flex items-center space-x-3 px-4 py-3 mb-2 rounded-xl bg-sidebar-accent/50 border border-sidebar-border/50">
          <div className="bg-primary/20 p-1.5 rounded-full">
            <User className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.username}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</p>
          </div>
        </div>
        
        <button
          onClick={() => logout()}
          disabled={isLoggingOut}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sidebar-foreground/70 hover:text-white hover:bg-destructive/20 hover:text-destructive-foreground transition-all duration-200 group"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
