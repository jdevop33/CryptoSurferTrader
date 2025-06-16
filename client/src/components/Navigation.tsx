import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Home,
  Brain,
  TrendingUp,
  Settings,
  Wallet,
  BarChart3,
  Shield,
  Cloud,
  Activity,
  Bell,
  BookOpen,
  Crown
} from 'lucide-react';

export function Navigation() {
  const [location] = useLocation();

  const navItems = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: Home,
      description: 'View your portfolio and trading activity'
    },
    {
      href: '/ai-insights',
      label: 'Strategy Simulator',
      icon: Brain,
      description: 'Test trading strategies with AI'
    },
    {
      href: '/gs-quant',
      label: 'Portfolio Risk',
      icon: Shield,
      description: 'Risk management and analytics',
      badge: 'PRO'
    },
    {
      href: '/market-sentiment',
      label: 'Market Sentiment',
      icon: TrendingUp,
      description: 'Real-time market analysis'
    },
    {
      href: '/pricing',
      label: 'Settings',
      icon: Settings,
      description: 'Account and preferences'
    }
  ];

  return (
    <nav className="bg-slate-800/50 border-b border-slate-700 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">8Trader8Panda</h1>
                <p className="text-xs text-slate-400">AI Trading Platform</p>
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={`
                      relative h-12 px-4 flex flex-col items-center justify-center space-y-1
                      ${item.primary ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
                      ${isActive && !item.primary ? 'bg-slate-700 text-white' : ''}
                    `}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4" />
                      <span className="text-xs font-medium">{item.label}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="text-xs py-0 px-1 h-4">
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <Button variant="ghost" size="sm">
              <Bell className="w-4 h-4" />
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="hidden lg:flex items-center space-x-3">
            <Link href="/dashboard">
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                <Activity className="w-4 h-4 mr-2" />
                Start Trading
              </Button>
            </Link>
            
            <Link href="/gs-quant">
              <Button variant="outline" size="sm">
                <Shield className="w-4 h-4 mr-2" />
                PRO Tools
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden mt-4 grid grid-cols-2 gap-2">
          {navItems.slice(0, 4).map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  className="w-full justify-start"
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.label}
                  {item.badge && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}