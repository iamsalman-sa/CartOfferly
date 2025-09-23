import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  LayoutDashboard, 
  Target, 
  BarChart3, 
  Calendar, 
  Settings,
  Users,
  TrendingUp,
  Package,
  Gift,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const adminNavItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    description: "Overview & insights"
  },
  {
    title: "Campaign Management", 
    href: "/admin/campaigns",
    icon: Target,
    description: "Create & manage campaigns"
  },
  {
    title: "Seasonal Promotions",
    href: "/admin/seasonal",
    icon: Calendar,
    description: "Holiday campaigns"
  },
  {
    title: "Milestone Management",
    href: "/admin/milestones",
    icon: Gift,
    description: "Cart reward milestones"
  },
  {
    title: "Analytics",
    href: "/admin/analytics", 
    icon: BarChart3,
    description: "Performance metrics"
  }
];

// Get store ID from environment or localStorage
const STORE_ID = import.meta.env.VITE_SHOPIFY_STORE_ID || localStorage.getItem('SHOPIFY_STORE_ID');

export default function AdminSidebar() {
  const [location] = useLocation();
  
  // Fetch real analytics data for KPIs
  const { data: analyticsData } = useQuery({
    queryKey: ['/api/stores', STORE_ID, 'analytics'],
    enabled: !!STORE_ID,
  });
  
  // Fetch campaigns data for active campaigns count
  const { data: campaignsData } = useQuery({
    queryKey: ['/api/stores', STORE_ID, 'campaigns'],
    enabled: !!STORE_ID,
  });
  
  // Calculate real KPI values
  const activeCampaigns = campaignsData ? (campaignsData as any[]).filter((c: any) => c.status === 'active').length : 0;
  const revenueImpact = (analyticsData as any)?.totalRevenueImpact || 0;
  const conversions = (analyticsData as any)?.totalRewardsUnlocked || 0;
  
  const quickStatsItems = [
    {
      title: "Active Campaigns",
      value: activeCampaigns.toString(),
      icon: Target
    },
    {
      title: "Revenue Impact",
      value: `PKR ${revenueImpact.toLocaleString()}`,
      icon: TrendingUp
    },
    {
      title: "Conversions",
      value: conversions.toString(),
      icon: Users
    }
  ];

  return (
    <div className="flex h-screen w-80 flex-col bg-sidebar border-r border-sidebar-border shadow-2xl">
      {/* Header */}
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg beauty-gradient">
            <Gift className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground" data-testid="admin-title">
              Real Beauty Admin
            </h1>
            <p className="text-xs text-muted-foreground">Discount Management</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="border-b border-sidebar-border px-6 py-4">
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">Quick Stats</h3>
        <div className="space-y-2">
          {quickStatsItems.map((stat) => (
            <div 
              key={stat.title}
              className="flex items-center justify-between rounded-lg bg-card/50 p-3 glass-effect"
              data-testid={`stat-${stat.title.toLowerCase().replace(' ', '-')}`}
            >
              <div className="flex items-center space-x-2">
                <stat.icon className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">{stat.title}</p>
                  <p className="text-sm font-medium text-foreground">{stat.value}</p>
                </div>
              </div>
              {/* Trend data requires historical comparison - removed for clean state */}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-6 py-4">
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">Navigation</h3>
        {adminNavItems.map((item) => {
          const isActive = location === item.href || 
            (item.href !== "/admin" && location.startsWith(item.href));
          
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start space-x-3 text-left card-hover",
                  isActive 
                    ? "beauty-gradient text-white shadow-lg" 
                    : "text-sidebar-foreground hover:bg-sidebar-accent/10"
                )}
                data-testid={`nav-${item.title.toLowerCase().replace(' ', '-')}`}
              >
                <item.icon className="h-5 w-5" />
                <div className="flex-1">
                  <div className="font-medium">{item.title}</div>
                  <div className="text-xs opacity-70">{item.description}</div>
                </div>
              </Button>
            </Link>
          );
        })}
      </nav>

      <Separator className="mx-6" />

      {/* Footer */}
      <div className="border-t border-sidebar-border px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
            <Star className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Admin Panel</p>
            <p className="text-xs text-muted-foreground">v2.1.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}