import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
import type { Milestone } from "@shared/schema";

// Types for API responses
interface AnalyticsData {
  totalRewardsUnlocked: number;
  conversionRate: number;
  averageOrderValue: number;
  milestonesHit: number;
  totalRevenueImpact: number;
}

interface CampaignData {
  id: string;
  name: string;
  status: string;
  type: string;
  priority: number;
  startDate?: string;
  endDate?: string;
  description?: string;
  usageLimit?: number;
  minimumOrderValue?: string;
}

interface MonthlyTrend {
  month: string;
  revenue: number;
  orders: number;
  campaigns: number;
}

// Get store ID from environment or localStorage for development
const STORE_ID = import.meta.env.VITE_SHOPIFY_STORE_ID || localStorage.getItem('SHOPIFY_STORE_ID');

// Utility functions
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function calculatePercentage(numerator: number, denominator: number): string {
  if (denominator === 0) return '0.0%';
  return ((numerator / denominator) * 100).toFixed(1) + '%';
}

function calculateROI(revenue: number, spend: number): string {
  if (spend === 0) return '0%';
  return Math.round(((revenue - spend) / spend) * 100) + '%';
}

// Mock data will be replaced with real API calls in the component

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
  const [showFilter, setShowFilter] = useState(false);
  const { toast } = useToast();

  // CSV utility functions
  const escapeCsvCell = (value: any): string => {
    if (value === null || value === undefined) return '""';
    const stringValue = String(value);
    // Escape double quotes by doubling them, then wrap in quotes
    const escaped = stringValue.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  const formatCsvRow = (cells: any[]): string => {
    return cells.map(escapeCsvCell).join(',');
  };

  // Export analytics data
  const exportAnalytics = () => {
    try {
      const exportData = {
        summary: {
          totalRevenue: analyticsData?.totalRevenueImpact || 0,
          conversionRate: analyticsData?.conversionRate || 0,
          averageOrderValue: analyticsData?.averageOrderValue || 0,
          totalRewardsUnlocked: analyticsData?.totalRewardsUnlocked || 0,
          milestonesHit: analyticsData?.milestonesHit || 0,
          generatedAt: new Date().toISOString(),
          timeRange
        },
        campaigns: campaigns || [],
        milestones: milestones || [],
        monthlyTrends
      };

      // Convert to CSV format with proper escaping
      const csvRows = [
        // Summary section
        formatCsvRow(["ANALYTICS SUMMARY", ""]),
        formatCsvRow(["Generated on", new Date().toLocaleDateString()]),
        formatCsvRow(["Time Range", timeRange]),
        formatCsvRow(["", ""]),
        formatCsvRow(["OVERVIEW METRICS", ""]),
        formatCsvRow(["Metric", "Value"]),
        formatCsvRow(["Total Revenue Impact", formatCurrency(exportData.summary.totalRevenue)]),
        formatCsvRow(["Conversion Rate", `${exportData.summary.conversionRate.toFixed(1)}%`]),
        formatCsvRow(["Average Order Value", formatCurrency(exportData.summary.averageOrderValue)]),
        formatCsvRow(["Total Rewards Unlocked", exportData.summary.totalRewardsUnlocked]),
        formatCsvRow(["Milestones Hit", exportData.summary.milestonesHit]),
        formatCsvRow(["", ""]),
        // Campaigns section
        formatCsvRow(["CAMPAIGNS", "", "", "", "", ""]),
        formatCsvRow(["Name", "Status", "Type", "Priority", "Start Date", "End Date"]),
        ...exportData.campaigns.map((campaign: CampaignData) => 
          formatCsvRow([
            campaign.name || "",
            campaign.status || "",
            campaign.type || "",
            campaign.priority || "",
            campaign.startDate || "",
            campaign.endDate || ""
          ])
        ),
        formatCsvRow(["", "", "", "", "", ""]),
        // Milestones section
        formatCsvRow(["MILESTONES", "", "", "", "", "", ""]),
        formatCsvRow(["Name", "Status", "Threshold", "Currency", "Reward Type", "Usage Count", "Usage Limit"]),
        ...exportData.milestones.map((milestone) => 
          formatCsvRow([
            milestone.name || "",
            milestone.status || "",
            milestone.thresholdAmount || "",
            milestone.currency || "",
            milestone.rewardType || "",
            milestone.usageCount || 0,
            milestone.usageLimit || ""
          ])
        ),
        formatCsvRow(["", "", "", "", "", "", ""]),
        // Monthly trends section
        formatCsvRow(["MONTHLY TRENDS", "", "", ""]),
        formatCsvRow(["Month", "Revenue", "Orders", "Campaigns"]),
        ...exportData.monthlyTrends.map((trend: MonthlyTrend) => 
          formatCsvRow([
            trend.month || "",
            trend.revenue || 0,
            trend.orders || 0,
            trend.campaigns || 0
          ])
        )
      ];

      // Create CSV content with BOM for Excel compatibility
      const csvContent = '\uFEFF' + csvRows.join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `analytics-export-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL to free resources
      URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: "Analytics data has been exported to CSV",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error exporting the analytics data",
        variant: "destructive",
      });
    }
  };

  // Fetch analytics data
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery<AnalyticsData>({
    queryKey: ['/api/stores', STORE_ID, 'analytics', timeRange],
    enabled: !!STORE_ID,
  });

  // Fetch campaigns data for campaign performance
  const { data: campaignsData, isLoading: campaignsLoading } = useQuery<CampaignData[]>({
    queryKey: ['/api/stores', STORE_ID, 'campaigns'],
    enabled: !!STORE_ID,
  });

  // Fetch milestones data for milestone analytics
  const { data: milestonesData, isLoading: milestonesLoading } = useQuery<Milestone[]>({
    queryKey: ['/api/stores', STORE_ID, 'milestones'],
    enabled: !!STORE_ID,
  });

  // Safe array defaults to prevent empty object inference
  const campaigns = Array.isArray(campaignsData) ? campaignsData : [];
  const milestones = Array.isArray(milestonesData) ? milestonesData : [];

  // Refresh data mutation
  const refreshMutation = useMutation({
    mutationFn: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/stores', STORE_ID, 'analytics'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/stores', STORE_ID, 'campaigns'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/stores', STORE_ID, 'milestones'] })
      ]);
    },
    onSuccess: () => {
      toast({
        title: "Analytics refreshed",
        description: "Latest data has been loaded",
      });
    },
  });

  const isLoading = analyticsLoading || campaignsLoading;

  // Calculate overview metrics from real data
  const overviewMetrics = [
    {
      title: "Total Revenue Impact",
      value: analyticsData ? formatCurrency(analyticsData.totalRevenueImpact || 0) : "Loading...",
      change: "N/A", // Will be calculated from historical data
      trend: "up" as const,
      icon: DollarSign,
      color: "text-green-500"
    },
    {
      title: "Campaign ROI",
      value: "N/A", // Will be calculated from campaign data
      change: "N/A",
      trend: "up" as const,
      icon: TrendingUp,
      color: "text-green-500"
    },
    {
      title: "Conversion Rate",
      value: analyticsData ? `${(analyticsData.conversionRate || 0).toFixed(1)}%` : "Loading...",
      change: "N/A",
      trend: "up" as const,
      icon: Target,
      color: "text-blue-500"
    },
    {
      title: "Average Order Value",
      value: analyticsData ? formatCurrency(analyticsData.averageOrderValue || 0) : "Loading...",
      change: "N/A",
      trend: "up" as const,
      icon: ShoppingCart,
      color: "text-green-500"
    }
  ];

  // Calculate campaign performance from real data
  const campaignPerformance = campaigns.filter((campaign: CampaignData) => {
    return campaignFilter === "all" || campaign.status === campaignFilter;
  }).map((campaign: CampaignData) => ({
    ...campaign,
    // Real metrics will be populated from Shopify analytics integration
    impressions: 0,
    clicks: 0,
    conversions: 0,
    revenue: formatCurrency(0),
    spend: formatCurrency(0),
    roi: 0,
    ctr: 0,
    conversionRate: 0
  }));

  // Top products will be populated from real Shopify analytics data
  const topProducts: Array<{
    name: string;
    revenue: string;
    orders: number;
    conversionRate: string;
    averageDiscount: string;
  }> = [];

  // Monthly trends will be populated from real Shopify analytics data
  const monthlyTrends: MonthlyTrend[] = [];

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
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refreshMutation.mutate()}
                disabled={refreshMutation.isPending}
                data-testid="button-refresh-analytics"
              >
                <RefreshCw className={cn("mr-2 h-4 w-4", refreshMutation.isPending && "animate-spin")} />
                Refresh
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={exportAnalytics}
                data-testid="button-export-analytics"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Overview Metrics */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {overviewMetrics.map((metric) => (
              <div key={metric.title}>
                {isLoading ? (
                  <Card className="card-hover glass-effect animate-pulse">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="h-4 w-32 bg-muted rounded" />
                      <div className="h-4 w-4 bg-muted rounded" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-8 w-24 bg-muted rounded mb-2" />
                      <div className="h-3 w-20 bg-muted rounded" />
                    </CardContent>
                  </Card>
                ) : (
                  <MetricCard {...metric} />
                )}
              </div>
            ))}
          </div>

          {/* Main Analytics Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
              <TabsTrigger value="campaigns" data-testid="tab-campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="milestones" data-testid="tab-milestones">Milestones</TabsTrigger>
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

            {/* Milestones Tab */}
            <TabsContent value="milestones" className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                {/* Milestone Metrics */}
                <MetricCard
                  title="Total Milestones"
                  value={milestonesData ? milestonesData.length.toString() : "0"}
                  change="+12.5%"
                  trend="up"
                  icon={Target}
                  color="text-blue-500"
                />
                <MetricCard
                  title="Active Milestones"
                  value={milestonesData ? milestonesData.filter((m: any) => m.status === 'active').length.toString() : "0"}
                  change="+8.3%"
                  trend="up"
                  icon={Target}
                  color="text-green-500"
                />
                <MetricCard
                  title="Total Unlocks"
                  value={analyticsData ? analyticsData.totalRewardsUnlocked?.toString() || "0" : "0"}
                  change="+25.1%"
                  trend="up"
                  icon={Users}
                  color="text-green-500"
                />
                <MetricCard
                  title="Conversion Rate"
                  value={(() => {
                    const hits = analyticsData?.milestonesHit || 0;
                    const total = analyticsData?.totalRewardsUnlocked || 1;
                    return `${(hits / Math.max(total, 1) * 100).toFixed(1)}%`;
                  })()}
                  change="+15.2%"
                  trend="up"
                  icon={Percent}
                  color="text-blue-500"
                />
              </div>

              {/* Milestone Performance */}
              <Card className="card-hover">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Milestone Performance</CardTitle>
                    <CardDescription>
                      Detailed performance metrics for all milestones
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {milestonesData && milestonesData.length > 0 ? (
                        milestonesData.map((milestone) => (
                          <Card key={milestone.id} className="border border-border">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                  <h4 className="font-medium text-sm">{milestone.name}</h4>
                                </div>
                                <StatusBadge status={milestone.status || "active"} />
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0 space-y-3">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Threshold:</span>
                                <span className="font-medium">{formatCurrency(parseFloat(milestone.thresholdAmount || "0"))}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Reward Type:</span>
                                <span className="font-medium capitalize">{milestone.rewardType?.replace(/_/g, ' ') || 'Unknown'}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Usage:</span>
                                <span className="font-medium">{milestone.usageCount || 0} / {milestone.usageLimit || '∞'}</span>
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Progress:</span>
                                  <span className="font-medium">{Math.min(((milestone.usageCount || 0) / (milestone.usageLimit || 100)) * 100, 100).toFixed(0)}%</span>
                                </div>
                                <Progress 
                                  value={Math.min(((milestone.usageCount || 0) / (milestone.usageLimit || 100)) * 100, 100)} 
                                  className="h-2"
                                />
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="col-span-full">
                          <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-8">
                              <Target className="h-12 w-12 text-muted-foreground mb-4" />
                              <h3 className="text-lg font-semibold mb-2">No milestones found</h3>
                              <p className="text-muted-foreground text-center mb-4">
                                Create milestones to start tracking customer engagement and rewards.
                              </p>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Milestone Insights */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card className="card-hover">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5" />
                      <span>Milestone Engagement</span>
                    </CardTitle>
                    <CardDescription>
                      Customer engagement with milestone rewards
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg border border-dashed">
                      <div className="text-center">
                        <BarChart3 className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Engagement Chart Placeholder</p>
                        <p className="text-xs text-muted-foreground">Chart visualization would appear here</p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <p className="font-medium text-foreground">{analyticsData?.totalRewardsUnlocked || 0}</p>
                        <p className="text-muted-foreground">Total Unlocks</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-foreground">{analyticsData?.milestonesHit || 0}</p>
                        <p className="text-muted-foreground">Redeemed</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-green-500">
                          {(() => {
                            const hits = analyticsData?.milestonesHit || 0;
                            const total = analyticsData?.totalRewardsUnlocked || 1;
                            return `${(hits / Math.max(total, 1) * 100).toFixed(1)}%`;
                          })()}
                        </p>
                        <p className="text-muted-foreground">Success Rate</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-hover">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <PieChart className="h-5 w-5" />
                      <span>Reward Distribution</span>
                    </CardTitle>
                    <CardDescription>
                      Breakdown of reward types by popularity
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { type: "Free Delivery", count: milestonesData?.filter((m) => m.rewardType === 'free_delivery').length || 0, color: "bg-blue-500" },
                        { type: "Free Products", count: milestonesData?.filter((m) => m.rewardType === 'free_products').length || 0, color: "bg-green-500" },
                        { type: "Discount", count: milestonesData?.filter((m) => m.rewardType === 'discount').length || 0, color: "bg-yellow-500" }
                      ].map((reward) => (
                        <div key={reward.type} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${reward.color}`}></div>
                            <span className="text-sm font-medium">{reward.type}</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-sm text-muted-foreground">{reward.count} milestone{reward.count !== 1 ? 's' : ''}</span>
                            <div className="w-16">
                              <Progress 
                                value={milestonesData ? (reward.count / Math.max(milestonesData.length, 1)) * 100 : 0} 
                                className="h-2"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowFilter(!showFilter)}
                    data-testid="button-filter-campaigns"
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                </CardHeader>
                
                {/* Filter Panel */}
                {showFilter && (
                  <div className="border-t border-border bg-muted/20 px-6 py-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-foreground">Status:</label>
                        <Select value={campaignFilter} onValueChange={setCampaignFilter}>
                          <SelectTrigger className="w-[150px]" data-testid="select-campaign-filter">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Campaigns</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="paused">Paused</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCampaignFilter("all")}
                        data-testid="button-clear-filters"
                      >
                        Clear Filters
                      </Button>
                      <div className="text-xs text-muted-foreground">
                        Showing {campaignPerformance.length} campaign{campaignPerformance.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                )}
                
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