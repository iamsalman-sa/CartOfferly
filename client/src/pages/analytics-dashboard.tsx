import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminSidebar from "@/components/admin-sidebar";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Calendar,
  Download,
  Filter,
  Eye,
  DollarSign,
  Users,
  ShoppingCart,
  Target,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock store ID
const STORE_ID = "demo-store-id";

// Mock analytics data
const overviewMetrics = [
  {
    title: "Total Revenue Impact",
    value: "PKR 2,450,000",
    change: "+15.2%",
    trend: "up" as const,
    icon: DollarSign,
    color: "text-green-500"
  },
  {
    title: "Campaign ROI",
    value: "340%",
    change: "+23.8%",
    trend: "up" as const,
    icon: TrendingUp,
    color: "text-green-500"
  },
  {
    title: "Conversion Rate",
    value: "23.8%",
    change: "+4.2%",
    trend: "up" as const,
    icon: Target,
    color: "text-blue-500"
  },
  {
    title: "Cost Per Acquisition",
    value: "PKR 485",
    change: "-12.5%",
    trend: "down" as const,
    icon: Users,
    color: "text-green-500"
  }
];

const campaignPerformance = [
  {
    id: "1",
    name: "Eid Special - 30% Off Skincare",
    type: "percentage",
    status: "active",
    impressions: 45230,
    clicks: 3420,
    conversions: 814,
    revenue: "PKR 450,000",
    spend: "PKR 89,000",
    roi: "405%",
    ctr: "7.56%",
    conversionRate: "23.8%"
  },
  {
    id: "2",
    name: "Buy 2 Get 1 Free Lipsticks",
    type: "bogo",
    status: "active",
    impressions: 32100,
    clicks: 2890,
    conversions: 567,
    revenue: "PKR 320,000",
    spend: "PKR 76,000",
    roi: "321%",
    ctr: "9.00%",
    conversionRate: "19.6%"
  },
  {
    id: "3",
    name: "Spring Bundle Collection",
    type: "bundle",
    status: "paused",
    impressions: 28750,
    clicks: 2100,
    conversions: 378,
    revenue: "PKR 290,000",
    spend: "PKR 65,000",
    roi: "346%",
    ctr: "7.30%",
    conversionRate: "18.0%"
  }
];

const topProducts = [
  {
    name: "Premium Face Serum",
    revenue: "PKR 450,000",
    orders: 234,
    conversionRate: "34.2%",
    averageDiscount: "25%"
  },
  {
    name: "Luxury Lipstick Set",
    revenue: "PKR 380,000", 
    orders: 189,
    conversionRate: "28.7%",
    averageDiscount: "30%"
  },
  {
    name: "Skincare Bundle Pack",
    revenue: "PKR 320,000",
    orders: 156,
    conversionRate: "31.5%",
    averageDiscount: "35%"
  }
];

const monthlyTrends = [
  { month: "Jan", revenue: 1200000, orders: 580, campaigns: 8 },
  { month: "Feb", revenue: 1450000, orders: 720, campaigns: 10 },
  { month: "Mar", revenue: 1680000, orders: 834, campaigns: 12 },
  { month: "Apr", revenue: 2100000, orders: 1024, campaigns: 15 },
  { month: "May", revenue: 2450000, orders: 1247, campaigns: 18 },
  { month: "Jun", revenue: 2680000, orders: 1389, campaigns: 16 }
];

function MetricCard({ 
  title, 
  value, 
  change, 
  trend, 
  icon: Icon, 
  color 
}: { 
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: any;
  color: string;
}) {
  return (
    <Card className="card-hover glass-effect">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={cn("h-4 w-4", color)} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="flex items-center text-xs">
          {trend === "up" ? (
            <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
          ) : (
            <ArrowDownRight className="mr-1 h-3 w-3 text-green-500" />
          )}
          <span className="text-green-500">{change}</span>
          <span className="ml-1 text-muted-foreground">vs last period</span>
        </div>
      </CardContent>
    </Card>
  );
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
    >
      {status}
    </Badge>
  );
}

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState("30d");
  const [campaignFilter, setCampaignFilter] = useState("all");

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['/api/stores', STORE_ID, 'analytics', timeRange],
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
              <h1 className="text-3xl font-bold text-foreground" data-testid="analytics-title">
                Analytics Dashboard
              </h1>
              <p className="text-muted-foreground">
                Performance insights and campaign analytics
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[150px]" data-testid="select-time-range">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" data-testid="button-refresh-analytics">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" data-testid="button-export-analytics">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Overview Metrics */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {overviewMetrics.map((metric) => (
              <MetricCard key={metric.title} {...metric} />
            ))}
          </div>

          {/* Main Analytics Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
              <TabsTrigger value="campaigns" data-testid="tab-campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="products" data-testid="tab-products">Products</TabsTrigger>
              <TabsTrigger value="trends" data-testid="tab-trends">Trends</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Revenue Chart Placeholder */}
                <Card className="card-hover">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5" />
                      <span>Revenue Trends</span>
                    </CardTitle>
                    <CardDescription>
                      Monthly revenue and growth trends
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg border border-dashed">
                      <div className="text-center">
                        <BarChart3 className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Revenue Chart Placeholder</p>
                        <p className="text-xs text-muted-foreground">Chart visualization would appear here</p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <p className="font-medium text-foreground">PKR 2.45M</p>
                        <p className="text-muted-foreground">This Month</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-foreground">PKR 2.1M</p>
                        <p className="text-muted-foreground">Last Month</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-green-500">+16.7%</p>
                        <p className="text-muted-foreground">Growth</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Conversion Funnel */}
                <Card className="card-hover">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="h-5 w-5" />
                      <span>Conversion Funnel</span>
                    </CardTitle>
                    <CardDescription>
                      Campaign performance breakdown
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Impressions</span>
                        <span className="font-medium">106,080</span>
                      </div>
                      <Progress value={100} className="h-2" />
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Clicks</span>
                        <span className="font-medium">8,410 (7.9%)</span>
                      </div>
                      <Progress value={79} className="h-2" />
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Conversions</span>
                        <span className="font-medium">1,759 (20.9%)</span>
                      </div>
                      <Progress value={21} className="h-2" />
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Revenue</span>
                        <span className="font-medium text-green-500">PKR 1,060,000</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Insights */}
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle>Key Insights</CardTitle>
                  <CardDescription>
                    AI-powered recommendations and observations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium text-green-500">High Performance</span>
                      </div>
                      <p className="text-sm text-foreground">
                        BOGO campaigns are showing 23% higher conversion rates compared to percentage discounts
                      </p>
                    </div>
                    
                    <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Eye className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-blue-500">Opportunity</span>
                      </div>
                      <p className="text-sm text-foreground">
                        Skincare products have 45% higher AOV when bundled together vs sold individually
                      </p>
                    </div>
                    
                    <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Target className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium text-yellow-500">Recommendation</span>
                      </div>
                      <p className="text-sm text-foreground">
                        Consider increasing campaign budgets for weekends - 34% higher engagement
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Campaigns Tab */}
            <TabsContent value="campaigns" className="space-y-6">
              <Card className="card-hover">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Campaign Performance</CardTitle>
                    <CardDescription>
                      Detailed performance metrics for all campaigns
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" data-testid="button-filter-campaigns">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {campaignPerformance.map((campaign) => (
                      <div 
                        key={campaign.id}
                        className="rounded-lg border border-border bg-card/50 p-4"
                        data-testid={`campaign-analytics-${campaign.id}`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <h4 className="font-medium text-foreground">{campaign.name}</h4>
                            <StatusBadge status={campaign.status} />
                            <Badge variant="secondary" className="capitalize">
                              {campaign.type}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-foreground">{campaign.revenue}</p>
                            <p className="text-sm text-green-500">ROI: {campaign.roi}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm lg:grid-cols-5">
                          <div>
                            <p className="text-muted-foreground">Impressions</p>
                            <p className="font-medium text-foreground">{campaign.impressions.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Clicks</p>
                            <p className="font-medium text-foreground">{campaign.clicks.toLocaleString()}</p>
                            <p className="text-xs text-blue-500">CTR: {campaign.ctr}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Conversions</p>
                            <p className="font-medium text-foreground">{campaign.conversions}</p>
                            <p className="text-xs text-green-500">CR: {campaign.conversionRate}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Spend</p>
                            <p className="font-medium text-foreground">{campaign.spend}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">ROI</p>
                            <p className="font-medium text-green-500">{campaign.roi}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products" className="space-y-6">
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle>Top Performing Products</CardTitle>
                  <CardDescription>
                    Products driving the most revenue through campaigns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topProducts.map((product, index) => (
                      <div 
                        key={product.name}
                        className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-4"
                        data-testid={`top-product-analytics-${index}`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-medium text-primary">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">{product.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {product.orders} orders • {product.conversionRate} conversion rate
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-foreground">{product.revenue}</p>
                          <p className="text-sm text-primary">Avg discount: {product.averageDiscount}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Trends Tab */}
            <TabsContent value="trends" className="space-y-6">
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Monthly Trends</span>
                  </CardTitle>
                  <CardDescription>
                    Historical performance and growth patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg border border-dashed mb-6">
                    <div className="text-center">
                      <BarChart3 className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Trend Chart Placeholder</p>
                      <p className="text-xs text-muted-foreground">Time series visualization would appear here</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {monthlyTrends.slice(-3).map((month) => (
                      <div key={month.month} className="text-center">
                        <p className="text-2xl font-bold text-foreground">
                          PKR {(month.revenue / 1000000).toFixed(1)}M
                        </p>
                        <p className="text-sm text-muted-foreground">{month.month} Revenue</p>
                        <p className="text-xs text-muted-foreground">
                          {month.orders} orders • {month.campaigns} campaigns
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}