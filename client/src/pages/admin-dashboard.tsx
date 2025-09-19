import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Users, 
  ShoppingCart, 
  DollarSign,
  Calendar,
  Eye,
  MoreHorizontal,
  Plus,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import AdminSidebar from "@/components/admin-sidebar";

// Get store ID from environment or localStorage for development
const STORE_ID = import.meta.env.VITE_SHOPIFY_STORE_ID || localStorage.getItem('SHOPIFY_STORE_ID');

// Utility functions for formatting
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

function calculateProgress(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = Date.now();
  
  if (now < start) return 0;
  if (now > end) return 100;
  
  return Math.round(((now - start) / (end - start)) * 100);
}

function StatusBadge({ status }: { status: string }) {
  const variants = {
    active: "bg-green-500/20 text-green-400 border-green-500/30",
    paused: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", 
    expired: "bg-red-500/20 text-red-400 border-red-500/30",
    draft: "bg-gray-500/20 text-gray-400 border-gray-500/30"
  };

  return (
    <Badge 
      variant="outline"
      className={cn("capitalize", variants[status as keyof typeof variants])}
      data-testid={`status-${status}`}
    >
      {status}
    </Badge>
  );
}

export default function AdminDashboard() {
  const [timeRange, setTimeRange] = useState("30d");
  const { toast } = useToast();

  // Fetch analytics data
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/stores', STORE_ID, 'analytics', timeRange],
    enabled: !!STORE_ID,
  });

  // Fetch campaigns data
  const { data: campaignsData, isLoading: campaignsLoading } = useQuery({
    queryKey: ['/api/stores', STORE_ID, 'campaigns'],
    enabled: !!STORE_ID,
  });

  // Refresh data mutation
  const refreshMutation = useMutation({
    mutationFn: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/stores', STORE_ID, 'analytics'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/stores', STORE_ID, 'campaigns'] })
      ]);
    },
    onSuccess: () => {
      toast({
        title: "Data refreshed",
        description: "Dashboard data has been updated",
      });
    },
  });


  // Calculate overview metrics from real data
  const overviewMetrics = [
    {
      title: "Total Revenue Impact",
      value: analyticsData ? formatCurrency(analyticsData.totalRevenueImpact || 0) : "Loading...",
      change: "N/A", // Will come from analytics comparison
      trend: "up" as const,
      icon: DollarSign,
      description: "Last 30 days vs previous period"
    },
    {
      title: "Active Campaigns",
      value: campaignsData ? campaignsData.filter((c: any) => c.status === 'active').length.toString() : "Loading...",
      change: "N/A",
      trend: "up" as const, 
      icon: Target,
      description: "Currently running promotions"
    },
    {
      title: "Conversion Rate",
      value: analyticsData ? `${(analyticsData.conversionRate || 0).toFixed(1)}%` : "Loading...",
      change: "N/A",
      trend: "up" as const,
      icon: TrendingUp,
      description: "Campaign-driven conversions"
    },
    {
      title: "Average Order Value",
      value: analyticsData ? formatCurrency(analyticsData.averageOrderValue || 0) : "Loading...",
      change: "N/A",
      trend: "up" as const, 
      icon: ShoppingCart,
      description: "With active promotions"
    }
  ];

  // Get recent campaigns from real data
  const recentCampaigns = campaignsData ? campaignsData.slice(0, 5).map((campaign: any) => ({
    ...campaign,
    progress: calculateProgress(campaign.startDate, campaign.endDate),
    revenue: formatCurrency(0), // This would come from analytics
    conversions: 0 // This would come from analytics
  })) : [];

  // Top performing products will be calculated from real Shopify analytics
  const topPerformingProducts: Array<{
    name: string;
    revenue: string;
    conversions: number;
    discount: string;
  }> = [];

  const isLoading = analyticsLoading || campaignsLoading;

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="space-y-6 p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground" data-testid="dashboard-title">
                Dashboard Overview
              </h1>
              <p className="text-muted-foreground">
                Real Beauty discount management and analytics
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refreshMutation.mutate()}
                disabled={refreshMutation.isPending}
                data-testid="button-refresh"
              >
                <RefreshCw className={cn("mr-2 h-4 w-4", refreshMutation.isPending && "animate-spin")} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" data-testid="button-export">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Link href="/admin/campaigns">
                <Button size="sm" data-testid="button-create-campaign">
                  <Plus className="mr-2 h-4 w-4" />
                  New Campaign
                </Button>
              </Link>
            </div>
          </div>

          {/* Overview Metrics */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {overviewMetrics.map((metric) => (
              <Card key={metric.title} className="card-hover glass-effect" data-testid={`metric-${metric.title.toLowerCase().replace(/\s+/g, '-')}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </CardTitle>
                  <metric.icon className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {isLoading ? (
                      <div className="h-8 w-24 animate-pulse bg-muted rounded" />
                    ) : (
                      metric.value
                    )}
                  </div>
                  <div className="flex items-center text-xs">
                    {metric.trend === "up" ? (
                      <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                    )}
                    <span className={metric.trend === "up" ? "text-green-500" : "text-red-500"}>
                      {metric.change}
                    </span>
                    <span className="ml-1 text-muted-foreground">from last period</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{metric.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Recent Campaigns */}
            <Card className="lg:col-span-2 card-hover">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-foreground" data-testid="recent-campaigns-title">
                    Recent Campaigns
                  </CardTitle>
                  <CardDescription>
                    Latest discount campaigns and their performance
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" data-testid="button-filter-campaigns">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                  <Link href="/admin/campaigns">
                    <Button variant="outline" size="sm" data-testid="button-view-all-campaigns">
                      <Eye className="mr-2 h-4 w-4" />
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoading ? (
                    // Loading skeleton
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="animate-pulse rounded-lg border border-border bg-card/50 p-4">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <div className="h-4 w-48 bg-muted rounded" />
                            <div className="h-5 w-16 bg-muted rounded" />
                            <div className="h-5 w-12 bg-muted rounded" />
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="h-3 w-32 bg-muted rounded" />
                            <div className="h-3 w-24 bg-muted rounded" />
                            <div className="h-3 w-20 bg-muted rounded" />
                          </div>
                          <div className="h-2 w-full bg-muted rounded" />
                        </div>
                      </div>
                    ))
                  ) : recentCampaigns.length > 0 ? (
                    recentCampaigns.map((campaign: any) => (
                      <div 
                        key={campaign.id}
                        className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-4"
                        data-testid={`campaign-${campaign.id}`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h4 className="font-medium text-foreground">{campaign.name}</h4>
                            <StatusBadge status={campaign.status} />
                            <Badge variant="secondary" className="text-xs">
                              {campaign.type}
                            </Badge>
                          </div>
                          <div className="mt-2 flex items-center space-x-4 text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <Calendar className="mr-1 h-3 w-3" />
                              {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                            </span>
                            <span>Revenue: {campaign.revenue}</span>
                            <span>Conversions: {campaign.conversions}</span>
                          </div>
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="text-foreground">{campaign.progress}%</span>
                            </div>
                            <Progress value={campaign.progress} className="mt-1" />
                          </div>
                        </div>
                        <Link href={`/admin/campaigns?edit=${campaign.id}`}>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Target className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <h3 className="mt-4 text-sm font-medium text-foreground">No campaigns yet</h3>
                      <p className="mt-2 text-xs text-muted-foreground">Get started by creating your first discount campaign.</p>
                      <Link href="/admin/campaigns">
                        <Button size="sm" className="mt-4">
                          <Plus className="mr-2 h-4 w-4" />
                          Create Campaign
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Performing Products */}
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="text-foreground" data-testid="top-products-title">
                  Top Performing Products
                </CardTitle>
                <CardDescription>
                  Best performers with active discounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topPerformingProducts.map((product, index) => (
                    <div 
                      key={product.name}
                      className="flex items-center space-x-3"
                      data-testid={`top-product-${index}`}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.discount}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">{product.revenue}</p>
                        <p className="text-xs text-muted-foreground">{product.conversions} sales</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <Link href="/admin/analytics">
                  <Button variant="outline" size="sm" className="w-full" data-testid="button-view-detailed-analytics">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Detailed Analytics
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="text-foreground" data-testid="quick-actions-title">
                Quick Actions
              </CardTitle>
              <CardDescription>
                Common administrative tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Link href="/admin/campaigns">
                  <Button variant="outline" className="h-20 w-full flex-col" data-testid="action-create-campaign">
                    <Target className="mb-2 h-6 w-6" />
                    <span>Create Campaign</span>
                  </Button>
                </Link>
                <Link href="/admin/seasonal">
                  <Button variant="outline" className="h-20 w-full flex-col" data-testid="action-seasonal-promo">
                    <Calendar className="mb-2 h-6 w-6" />
                    <span>Seasonal Promo</span>
                  </Button>
                </Link>
                <Link href="/admin/analytics">
                  <Button variant="outline" className="h-20 w-full flex-col" data-testid="action-view-analytics">
                    <TrendingUp className="mb-2 h-6 w-6" />
                    <span>View Analytics</span>
                  </Button>
                </Link>
                <Link href="/admin/milestones">
                  <Button variant="outline" className="h-20 w-full flex-col" data-testid="action-milestone-management">
                    <Target className="mb-2 h-6 w-6" />
                    <span>Milestone Management</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}