import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  BarChart3
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import AdminSidebar from "@/components/admin-sidebar";

// Mock store ID for demo
const STORE_ID = "demo-store-id";

const overviewMetrics = [
  {
    title: "Total Revenue Impact",
    value: "PKR 2,450,000",
    change: "+15.2%",
    trend: "up",
    icon: DollarSign,
    description: "Last 30 days vs previous period"
  },
  {
    title: "Active Campaigns",
    value: "12",
    change: "+3",
    trend: "up", 
    icon: Target,
    description: "Currently running promotions"
  },
  {
    title: "Conversion Rate",
    value: "23.8%",
    change: "+4.2%",
    trend: "up",
    icon: TrendingUp,
    description: "Campaign-driven conversions"
  },
  {
    title: "Average Order Value",
    value: "PKR 4,850",
    change: "+8.7%",
    trend: "up", 
    icon: ShoppingCart,
    description: "With active promotions"
  }
];

const recentCampaigns = [
  {
    id: "1",
    name: "Eid Special - 30% Off Skincare",
    status: "active",
    type: "percentage",
    startDate: "2024-04-10",
    endDate: "2024-04-20",
    revenue: "PKR 450,000",
    conversions: 234,
    progress: 65
  },
  {
    id: "2", 
    name: "Buy 2 Get 1 Free Lipsticks",
    status: "active",
    type: "bogo",
    startDate: "2024-04-08",
    endDate: "2024-04-15",
    revenue: "PKR 320,000",
    conversions: 156,
    progress: 80
  },
  {
    id: "3",
    name: "Free Delivery on Orders 2500+",
    status: "active", 
    type: "shipping",
    startDate: "2024-04-01",
    endDate: "2024-04-30",
    revenue: "PKR 180,000",
    conversions: 89,
    progress: 35
  },
  {
    id: "4",
    name: "Spring Bundle Collection",
    status: "paused",
    type: "bundle", 
    startDate: "2024-03-25",
    endDate: "2024-04-10",
    revenue: "PKR 290,000",
    conversions: 67,
    progress: 45
  },
  {
    id: "5",
    name: "Valentine's Flash Sale",
    status: "expired",
    type: "flash_sale",
    startDate: "2024-02-10",
    endDate: "2024-02-15",
    revenue: "PKR 680,000",
    conversions: 412,
    progress: 100
  }
];

const topPerformingProducts = [
  {
    name: "Premium Face Serum",
    revenue: "PKR 450,000",
    conversions: 234,
    discount: "25% off"
  },
  {
    name: "Luxury Lipstick Set", 
    revenue: "PKR 380,000",
    conversions: 189,
    discount: "Buy 2 Get 1"
  },
  {
    name: "Skincare Bundle",
    revenue: "PKR 320,000", 
    conversions: 156,
    discount: "30% off"
  }
];

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

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['/api/stores', STORE_ID, 'analytics', timeRange],
    enabled: !!STORE_ID,
  });

  const { data: campaignsData } = useQuery({
    queryKey: ['/api/stores', STORE_ID, 'campaigns'],
    enabled: !!STORE_ID,
  });

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
              <Button variant="outline" size="sm" data-testid="button-refresh">
                <RefreshCw className="mr-2 h-4 w-4" />
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
                  <div className="text-2xl font-bold text-foreground">{metric.value}</div>
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
                  {recentCampaigns.map((campaign) => (
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
                            {campaign.startDate} - {campaign.endDate}
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
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
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
                <Button variant="outline" className="h-20 w-full flex-col" data-testid="action-bulk-import">
                  <Users className="mb-2 h-6 w-6" />
                  <span>Bulk Import</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}