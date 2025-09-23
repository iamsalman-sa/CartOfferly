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
import { Checkbox } from "@/components/ui/checkbox";
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
  TrendingUp,
  CheckSquare,
  Square,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

// Get store ID from environment or localStorage
const STORE_ID = import.meta.env.VITE_SHOPIFY_STORE_ID || localStorage.getItem('SHOPIFY_STORE_ID');

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

// Utility function to format dates
function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
  }).format(amount);
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
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      field.onChange(isNaN(value) ? 1 : value);
                    }}
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
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      field.onChange(e.target.value && !isNaN(value) ? value : undefined);
                    }}
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
  // Early return if no store ID is configured
  if (!STORE_ID) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Store Configuration Required</h2>
          <p className="text-muted-foreground">Please configure your Shopify store ID to access campaign management.</p>
        </div>
      </div>
    );
  }
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showStats, setShowStats] = useState<string | null>(null);
  const [duplicateDialog, setDuplicateDialog] = useState<{ open: boolean; campaign: any | null }>({ open: false, campaign: null });
  const [previewingCampaign, setPreviewingCampaign] = useState<any>(null);
  const { toast } = useToast();

  // Fetch campaigns data
  const { data: campaignsData, isLoading: campaignsLoading, error: campaignsError } = useQuery<any[]>({
    queryKey: ['/api/stores', STORE_ID, 'campaigns'],
    enabled: !!STORE_ID,
  });

  // Filter campaigns based on search and filters  
  const campaigns = Array.isArray(campaignsData) ? campaignsData.filter((campaign: any) => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter;
    const matchesType = typeFilter === "all" || campaign.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  }) : [];

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

  const updateCampaignStatusMutation = useMutation({
    mutationFn: async ({ campaignId, newStatus }: { campaignId: string; newStatus: string }) => {
      return apiRequest("PATCH", `/api/campaigns/${campaignId}/status`, { status: newStatus });
    },
    onSuccess: (_, { newStatus }) => {
      toast({
        title: "Success",
        description: `Campaign ${newStatus} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/stores', STORE_ID, 'campaigns'] });
    },
    onError: (_, { newStatus }) => {
      toast({
        title: "Error",
        description: `Failed to ${newStatus} campaign`,
        variant: "destructive",
      });
    },
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      return apiRequest("DELETE", `/api/campaigns/${campaignId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Campaign deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/stores', STORE_ID, 'campaigns'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete campaign",
        variant: "destructive",
      });
    },
  });

  // Bulk operations
  const bulkActivateMutation = useMutation({
    mutationFn: async (campaignIds: string[]) => {
      await Promise.all(campaignIds.map(id => 
        apiRequest("POST", `/api/campaigns/${id}/resume`)
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stores', STORE_ID, 'campaigns'] });
      setSelectedCampaigns([]);
      toast({ title: "Campaigns activated successfully" });
    },
    onError: () => {
      toast({ title: "Error activating campaigns", variant: "destructive" });
    }
  });

  const bulkPauseMutation = useMutation({
    mutationFn: async (campaignIds: string[]) => {
      await Promise.all(campaignIds.map(id => 
        apiRequest("POST", `/api/campaigns/${id}/pause`)
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stores', STORE_ID, 'campaigns'] });
      setSelectedCampaigns([]);
      toast({ title: "Campaigns paused successfully" });
    },
    onError: () => {
      toast({ title: "Error pausing campaigns", variant: "destructive" });
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (campaignIds: string[]) => {
      await Promise.all(campaignIds.map(id => 
        apiRequest("DELETE", `/api/campaigns/${id}`)
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stores', STORE_ID, 'campaigns'] });
      setSelectedCampaigns([]);
      toast({ title: "Campaigns deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error deleting campaigns", variant: "destructive" });
    }
  });

  // Fetch campaign stats
  const { data: campaignStats } = useQuery({
    queryKey: ['/api/campaigns', showStats, 'stats'],
    queryFn: () => apiRequest("GET", `/api/campaigns/${showStats}/stats`).then(res => res.json()),
    enabled: !!showStats,
  });

  // Duplicate campaign mutation
  const duplicateCampaignMutation = useMutation({
    mutationFn: async ({ campaignId, newName }: { campaignId: string; newName: string }) => {
      return apiRequest("POST", `/api/campaigns/${campaignId}/duplicate`, { 
        newName, 
        modifiedBy: "admin" 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stores', STORE_ID, 'campaigns'] });
      toast({
        title: "Success",
        description: "Campaign duplicated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to duplicate campaign",
        variant: "destructive",
      });
    },
  });

  const updateCampaignStatus = (campaignId: string, newStatus: string) => {
    updateCampaignStatusMutation.mutate({ campaignId, newStatus });
  };

  const handleDeleteCampaign = (campaignId: string) => {
    if (confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      deleteCampaignMutation.mutate(campaignId);
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

  // Bulk selection helpers
  const toggleCampaignSelection = (campaignId: string) => {
    setSelectedCampaigns(prev => {
      if (prev.includes(campaignId)) {
        return prev.filter(id => id !== campaignId);
      } else {
        return [...prev, campaignId];
      }
    });
  };

  const toggleAllCampaigns = () => {
    if (selectedCampaigns.length === campaigns.length) {
      setSelectedCampaigns([]);
    } else {
      setSelectedCampaigns(campaigns.map((c: any) => c.id));
    }
  };

  const handleBulkAction = (action: 'activate' | 'pause' | 'delete') => {
    if (selectedCampaigns.length === 0) return;
    
    if (action === 'delete') {
      if (confirm(`Are you sure you want to delete ${selectedCampaigns.length} campaign(s)? This action cannot be undone.`)) {
        bulkDeleteMutation.mutate(selectedCampaigns);
      }
    } else if (action === 'activate') {
      bulkActivateMutation.mutate(selectedCampaigns);
    } else if (action === 'pause') {
      bulkPauseMutation.mutate(selectedCampaigns);
    }
  };

  const handleDuplicate = (campaign: any) => {
    setDuplicateDialog({ open: true, campaign });
  };

  const handleConfirmDuplicate = (newName?: string) => {
    if (duplicateDialog.campaign && newName) {
      duplicateCampaignMutation.mutate({ campaignId: duplicateDialog.campaign.id, newName });
    }
    setDuplicateDialog({ open: false, campaign: null });
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
                <div className="flex items-center gap-4">
                  {campaigns.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedCampaigns.length === campaigns.length && campaigns.length > 0}
                        onCheckedChange={toggleAllCampaigns}
                        data-testid="checkbox-select-all-campaigns"
                      />
                      <span className="text-sm text-muted-foreground">
                        Select All ({campaigns.length})
                      </span>
                    </div>
                  )}
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

          {/* Bulk Actions Bar */}
          {selectedCampaigns.length > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckSquare className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">
                      {selectedCampaigns.length} campaign{selectedCampaigns.length === 1 ? '' : 's'} selected
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBulkAction('activate')}
                      disabled={bulkActivateMutation.isPending}
                      data-testid="button-bulk-activate"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Activate
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBulkAction('pause')}
                      disabled={bulkPauseMutation.isPending}
                      data-testid="button-bulk-pause"
                    >
                      <Pause className="mr-2 h-4 w-4" />
                      Pause
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBulkAction('delete')}
                      disabled={bulkDeleteMutation.isPending}
                      data-testid="button-bulk-delete"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedCampaigns([])}
                      data-testid="button-clear-selection"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Campaigns List */}
          <div className="space-y-4">
            {campaignsLoading ? (
              // Loading skeleton
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-5 w-5 bg-muted rounded" />
                        <div className="h-6 w-48 bg-muted rounded" />
                        <div className="h-5 w-16 bg-muted rounded" />
                        <div className="h-5 w-20 bg-muted rounded" />
                      </div>
                      <div className="h-4 w-96 bg-muted rounded" />
                      <div className="grid grid-cols-4 gap-4">
                        <div className="h-4 w-32 bg-muted rounded" />
                        <div className="h-4 w-24 bg-muted rounded" />
                        <div className="h-4 w-28 bg-muted rounded" />
                        <div className="h-4 w-20 bg-muted rounded" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : campaignsError ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Target className="mx-auto h-12 w-12 text-red-500 mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">Error loading campaigns</h3>
                  <p className="text-muted-foreground mb-4">
                    There was an error loading your campaigns. Please try again.
                  </p>
                  <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/stores', STORE_ID, 'campaigns'] })}>
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : campaigns.map((campaign: any) => (
              <Card key={campaign.id} className="card-hover" data-testid={`campaign-card-${campaign.id}`}>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-4">
                    <Checkbox
                      checked={selectedCampaigns.includes(campaign.id)}
                      onCheckedChange={() => toggleCampaignSelection(campaign.id)}
                      data-testid={`checkbox-campaign-${campaign.id}`}
                    />
                    <div className="flex-1">
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
                                {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Usage: </span>
                              <span className="text-foreground">
                                {campaign.usageCount || 0}/{campaign.usageLimit || 'Unlimited'}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Min Order: </span>
                              <span className="text-foreground">
                                {campaign.minimumOrderValue ? formatCurrency(parseFloat(campaign.minimumOrderValue)) : 'None'}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Priority: </span>
                              <span className="text-foreground">{campaign.priority}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                      {campaign.status === "active" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCampaignStatus(campaign.id, "paused")}
                          disabled={updateCampaignStatusMutation.isPending}
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
                          disabled={updateCampaignStatusMutation.isPending}
                          data-testid={`button-resume-${campaign.id}`}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      {campaign.status === "draft" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCampaignStatus(campaign.id, "active")}
                          disabled={updateCampaignStatusMutation.isPending}
                          data-testid={`button-activate-${campaign.id}`}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowStats(campaign.id)}
                        data-testid={`button-stats-${campaign.id}`}
                      >
                        <BarChart3 className="h-4 w-4" />
                      </Button>
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
                        onClick={() => handleDuplicate(campaign)}
                        data-testid={`button-duplicate-${campaign.id}`}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewingCampaign(campaign)}
                        data-testid={`button-preview-${campaign.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCampaign(campaign.id)}
                        disabled={deleteCampaignMutation.isPending}
                        data-testid={`button-delete-${campaign.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Link href={`/admin/analytics?campaign=${campaign.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          data-testid={`button-view-analytics-${campaign.id}`}
                        >
                          <TrendingUp className="h-4 w-4" />
                        </Button>
                      </Link>
                        </div>
                      </div>
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

          {/* Stats Dialog */}
          {showStats && (
            <Dialog open={!!showStats} onOpenChange={() => setShowStats(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Campaign Statistics</DialogTitle>
                  <DialogDescription>Performance metrics for this campaign</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{campaignStats?.totalUsage || 0}</div>
                    <div className="text-sm text-muted-foreground">Total Uses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{campaignStats?.uniqueCustomers || 0}</div>
                    <div className="text-sm text-muted-foreground">Unique Customers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">PKR {campaignStats?.totalDiscount || 0}</div>
                    <div className="text-sm text-muted-foreground">Total Discount</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">PKR {campaignStats?.averageOrderValue || 0}</div>
                    <div className="text-sm text-muted-foreground">Avg Order Value</div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Duplicate Campaign Confirmation Dialog */}
          <Dialog
            open={duplicateDialog.open}
            onOpenChange={(open) => setDuplicateDialog({ open, campaign: duplicateDialog.campaign })}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Duplicate Campaign</DialogTitle>
                <DialogDescription>
                  Enter a name for the duplicated campaign
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="duplicate-campaign-name">New Campaign Name</Label>
                  <Input
                    id="duplicate-campaign-name"
                    defaultValue={duplicateDialog.campaign ? `${duplicateDialog.campaign.name} (Copy)` : ""}
                    placeholder="Enter new campaign name"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const target = e.target as HTMLInputElement;
                        handleConfirmDuplicate(target.value);
                      }
                    }}
                    data-testid="input-duplicate-campaign-name"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setDuplicateDialog({ open: false, campaign: null })}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      const input = document.getElementById('duplicate-campaign-name') as HTMLInputElement;
                      if (input?.value) {
                        handleConfirmDuplicate(input.value);
                      }
                    }}
                    data-testid="button-confirm-duplicate-campaign"
                  >
                    Duplicate
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Preview Campaign Dialog */}
          <Dialog 
            open={!!previewingCampaign} 
            onOpenChange={(open) => !open && setPreviewingCampaign(null)}
          >
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Campaign Preview</DialogTitle>
                <DialogDescription>
                  Preview how this campaign will appear to customers
                </DialogDescription>
              </DialogHeader>
              {previewingCampaign && (
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="font-medium text-muted-foreground">Campaign Name:</span>
                    <span>{previewingCampaign.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-muted-foreground">Type:</span>
                    <span className="capitalize">{previewingCampaign.type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-muted-foreground">Status:</span>
                    <span className="capitalize">{previewingCampaign.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-muted-foreground">Priority:</span>
                    <span>{previewingCampaign.priority}</span>
                  </div>
                  {previewingCampaign.description && (
                    <div>
                      <span className="font-medium text-muted-foreground">Description:</span>
                      <p className="mt-1 text-sm">{previewingCampaign.description}</p>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-medium text-muted-foreground">Min Order Value:</span>
                    <span>{previewingCampaign.minimumOrderValue ? `PKR ${previewingCampaign.minimumOrderValue}` : 'None'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-muted-foreground">Usage Limit:</span>
                    <span>{previewingCampaign.usageLimit || 'Unlimited'}</span>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      variant="outline" 
                      onClick={() => setPreviewingCampaign(null)}
                      data-testid="button-close-campaign-preview"
                    >
                      Close Preview
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}