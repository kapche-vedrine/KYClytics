import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  Users, 
  ShieldAlert, 
  Settings, 
  LogOut, 
  Menu,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('auth_user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setLocation('/');
  };

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/clients', label: 'Clients', icon: Users },
    { href: '/audit', label: 'Audit Logs', icon: ShieldAlert },
    { href: '/admin', label: 'Settings', icon: Settings },
  ];

  const NavContent = () => (
    <div className="flex flex-col h-full text-sidebar-foreground">
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-sidebar-primary flex items-center justify-center text-white font-bold font-display">
            K
          </div>
          <span className="font-display font-bold text-xl tracking-tight">KYClytics</span>
        </div>
      </div>
      
      <div className="flex-1 py-6 px-3 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.startsWith(link.href);
          return (
            <Link key={link.href} href={link.href}>
              <button
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-sidebar-primary text-white shadow-sm' 
                    : 'text-slate-400 hover:bg-sidebar-accent hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </button>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-4 px-2">
          <Avatar className="w-8 h-8 bg-slate-700 text-white border border-slate-600">
            <AvatarFallback>{user?.name?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-slate-400 truncate">{user?.role || 'User'}</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
          onClick={logout}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      <div className="hidden md:block w-64 bg-sidebar border-r border-sidebar-border shrink-0">
        <NavContent />
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <header className="h-16 bg-white dark:bg-slate-800 border-b dark:border-slate-700 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 bg-sidebar border-r-slate-800">
                <NavContent />
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex-1 max-w-md ml-4 md:ml-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <Input 
                placeholder="Global search..." 
                className="pl-9 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:bg-white dark:focus:bg-slate-600 transition-all rounded-full dark:text-slate-100 dark:placeholder:text-slate-400" 
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              System Operational
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
