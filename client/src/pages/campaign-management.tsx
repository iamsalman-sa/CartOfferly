import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AdminSidebar from "@/components/admin-sidebar";
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  Copy,
  Calendar,
  Target,
  DollarSign,
  Percent,
  Gift,
  Eye,
  Save,
  X,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

// Mock store ID
const STORE_ID = "demo-store-id";

// Campaign form schema
const campaignSchema = z.object({
  name: z.string().min(3, "Campaign name must be at least 3 characters"),
  description: z.string().optional(),
  type: z.enum(["percentage", "fixed_amount", "bogo", "bundle", "seasonal", "tiered"]),
  status: z.enum(["draft", "active", "paused", "expired"]).default("draft"),
  priority: z.number().min(1).max(10).default(1),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  usageLimit: z.number().min(1).optional(),
  minimumOrderValue: z.string().optional(),
  maximumDiscountAmount: z.string().optional(),
  stackable: z.boolean().default(false),
  customerSegment: z.enum(["all", "new", "returning", "vip"]).default("all"),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

// Mock campaigns data
const mockCampaigns = [
  {
    id: "1",
    name: "Eid Special - 30% Off Skincare",
    description: "Exclusive Eid promotion on premium skincare products",
    type: "percentage",
    status: "active",
    priority: 1,
    startDate: "2024-04-10",
    endDate: "2024-04-20",
    usageLimit: 1000,
    usageCount: 234,
    minimumOrderValue: "2000.00",
    maximumDiscountAmount: "1500.00",
    stackable: false,
    customerSegment: "all",
    createdAt: "2024-04-10T09:00:00Z",
    revenue: "PKR 450,000",
    conversions: 234
  },
  {
    id: "2",
    name: "Buy 2 Get 1 Free Lipsticks",
    description: "Popular BOGO offer on lipstick collection",
    type: "bogo",
    status: "active",
    priority: 2,
    startDate: "2024-04-08",
    endDate: "2024-04-15",
    usageLimit: 500,
    usageCount: 156,
    minimumOrderValue: "1000.00",
    stackable: true,
    customerSegment: "all",
    createdAt: "2024-04-08T10:00:00Z",
    revenue: "PKR 320,000",
    conversions: 156
  },
  {
    id: "3",
    name: "Spring Bundle Collection",
    description: "Seasonal beauty bundle with discounted pricing",
    type: "bundle",
    status: "paused",
    priority: 3,
    startDate: "2024-03-25",
    endDate: "2024-04-10",
    usageLimit: 200,
    usageCount: 67,
    minimumOrderValue: "3000.00",
    maximumDiscountAmount: "2000.00",
    stackable: false,
    customerSegment: "returning",
    createdAt: "2024-03-25T08:00:00Z",
    revenue: "PKR 290,000",
    conversions: 67
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
    >
      {status}
    </Badge>
  );
}

function CampaignTypeIcon({ type }: { type: string }) {
  const icons = {
    percentage: Percent,
    fixed_amount: DollarSign,
    bogo: Gift,
    bundle: Target,
    seasonal: Calendar,
    tiered: TrendingUp
  };
  
  const Icon = icons[type as keyof typeof icons] || Target;
  return <Icon className="h-4 w-4" />;
}

function CampaignForm({ 
  campaign, 
  onSubmit, 
  onCancel, 
  isLoading 
}: { 
  campaign?: any; 
  onSubmit: (data: CampaignFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: campaign || {
      name: "",
      description: "",
      type: "percentage",
      status: "draft",
      priority: 1,
      stackable: false,
      customerSegment: "all"
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Campaign Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., Summer Sale 2024" 
                    {...field} 
                    data-testid="input-campaign-name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Campaign Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-campaign-type">
                      <SelectValue placeholder="Select campaign type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage Off</SelectItem>
                    <SelectItem value="fixed_amount">Fixed Amount Off</SelectItem>
                    <SelectItem value="bogo">Buy One Get One</SelectItem>
                    <SelectItem value="bundle">Bundle Discount</SelectItem>
                    <SelectItem value="seasonal">Seasonal Promotion</SelectItem>
                    <SelectItem value="tiered">Tiered Discount</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe your campaign..."
                  {...field}
                  data-testid="textarea-description"
                />
              </FormControl>
              <FormDescription>
                Optional description for internal reference
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    {...field}
                    data-testid="input-start-date"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    {...field}
                    data-testid="input-end-date"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority (1-10)</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    min="1"
                    max="10"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                    data-testid="input-priority"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <FormField
            control={form.control}
            name="minimumOrderValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Order Value (PKR)</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    placeholder="e.g., 2000"
                    {...field}
                    data-testid="input-min-order"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="usageLimit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Usage Limit</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    placeholder="e.g., 1000"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    data-testid="input-usage-limit"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <FormField
            control={form.control}
            name="customerSegment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Segment</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-customer-segment">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="all">All Customers</SelectItem>
                    <SelectItem value="new">New Customers</SelectItem>
                    <SelectItem value="returning">Returning Customers</SelectItem>
                    <SelectItem value="vip">VIP Customers</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stackable"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Stackable</FormLabel>
                  <FormDescription>
                    Allow this campaign to stack with other offers
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="switch-stackable"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            data-testid="button-cancel-campaign"
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} data-testid="button-save-campaign">
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? "Saving..." : campaign ? "Update" : "Create"} Campaign
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function CampaignManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const { toast } = useToast();

  // Mock data for now
  const campaigns = mockCampaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter;
    const matchesType = typeFilter === "all" || campaign.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (data: CampaignFormData) => {
      return apiRequest("POST", `/api/stores/${STORE_ID}/campaigns`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Campaign created successfully",
      });
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/stores', STORE_ID, 'campaigns'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create campaign",
        variant: "destructive",
      });
    },
  });

  const updateCampaignMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CampaignFormData> }) => {
      return apiRequest("PUT", `/api/campaigns/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Campaign updated successfully",
      });
      setEditingCampaign(null);
      queryClient.invalidateQueries({ queryKey: ['/api/stores', STORE_ID, 'campaigns'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update campaign",
        variant: "destructive",
      });
    },
  });

  const updateCampaignStatus = async (campaignId: string, newStatus: string) => {
    try {
      await apiRequest("PATCH", `/api/campaigns/${campaignId}/status`, { status: newStatus });
      toast({
        title: "Success",
        description: `Campaign ${newStatus} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/stores', STORE_ID, 'campaigns'] });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${newStatus} campaign`,
        variant: "destructive",
      });
    }
  };

  const handleCreateCampaign = (data: CampaignFormData) => {
    createCampaignMutation.mutate(data);
  };

  const handleUpdateCampaign = (data: CampaignFormData) => {
    if (editingCampaign) {
      updateCampaignMutation.mutate({ id: editingCampaign.id, data });
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="space-y-6 p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground" data-testid="campaigns-title">
                Campaign Management
              </h1>
              <p className="text-muted-foreground">
                Create and manage discount campaigns for Real Beauty
              </p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-new-campaign">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Campaign
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>Create New Campaign</DialogTitle>
                  <DialogDescription>
                    Set up a new discount campaign for your store
                  </DialogDescription>
                </DialogHeader>
                <CampaignForm
                  onSubmit={handleCreateCampaign}
                  onCancel={() => setIsCreateDialogOpen(false)}
                  isLoading={createCampaignMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>

          {/* Filters and Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search campaigns..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-campaigns"
                  />
                </div>
                <div className="flex gap-4">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[150px]" data-testid="select-type-filter">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                      <SelectItem value="bogo">BOGO</SelectItem>
                      <SelectItem value="bundle">Bundle</SelectItem>
                      <SelectItem value="seasonal">Seasonal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campaigns List */}
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="card-hover" data-testid={`campaign-card-${campaign.id}`}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <CampaignTypeIcon type={campaign.type} />
                        <h3 className="text-lg font-medium text-foreground">{campaign.name}</h3>
                        <StatusBadge status={campaign.status} />
                        <Badge variant="secondary" className="capitalize">
                          {campaign.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      {campaign.description && (
                        <p className="text-sm text-muted-foreground mb-3">{campaign.description}</p>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4 text-sm lg:grid-cols-4">
                        <div>
                          <span className="text-muted-foreground">Period: </span>
                          <span className="text-foreground">
                            {campaign.startDate} - {campaign.endDate}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Usage: </span>
                          <span className="text-foreground">
                            {campaign.usageCount}/{campaign.usageLimit}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Revenue: </span>
                          <span className="text-foreground">{campaign.revenue}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Conversions: </span>
                          <span className="text-foreground">{campaign.conversions}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {campaign.status === "active" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCampaignStatus(campaign.id, "paused")}
                          data-testid={`button-pause-${campaign.id}`}
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      )}
                      {campaign.status === "paused" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCampaignStatus(campaign.id, "active")}
                          data-testid={`button-resume-${campaign.id}`}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingCampaign(campaign)}
                        data-testid={`button-edit-${campaign.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        data-testid={`button-copy-${campaign.id}`}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Link href={`/admin/analytics?campaign=${campaign.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          data-testid={`button-view-analytics-${campaign.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {campaigns.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No campaigns found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || statusFilter !== "all" || typeFilter !== "all" 
                    ? "Try adjusting your filters" 
                    : "Get started by creating your first campaign"}
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Campaign
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Edit Dialog */}
          <Dialog 
            open={!!editingCampaign} 
            onOpenChange={(open) => !open && setEditingCampaign(null)}
          >
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Edit Campaign</DialogTitle>
                <DialogDescription>
                  Update campaign settings and configuration
                </DialogDescription>
              </DialogHeader>
              {editingCampaign && (
                <CampaignForm
                  campaign={editingCampaign}
                  onSubmit={handleUpdateCampaign}
                  onCancel={() => setEditingCampaign(null)}
                  isLoading={updateCampaignMutation.isPending}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}