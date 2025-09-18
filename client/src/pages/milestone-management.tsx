import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Play, Pause, Copy, Trash2, Edit, BarChart3, Settings, Users, Calendar, Gift, Truck, Target, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Milestone } from "@shared/schema";

const STORE_ID = "demo-store-id";

// Form schemas
const milestoneFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  thresholdAmount: z.string().min(1, "Threshold amount is required"),
  currency: z.string().default("PKR"),
  rewardType: z.enum(["free_delivery", "free_products", "discount"]),
  freeProductCount: z.number().min(0).default(0),
  discountValue: z.string().default("0"),
  discountType: z.enum(["percentage", "fixed"]).default("percentage"),
  customerSegments: z.array(z.string()).default(["all"]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  usageLimit: z.number().optional(),
  maxUsagePerCustomer: z.number().default(1),
  priority: z.number().default(1),
  displayOrder: z.number().default(1),
  icon: z.string().default("🎁"),
  color: z.string().default("#e91e63"),
});

type MilestoneFormData = z.infer<typeof milestoneFormSchema>;

export default function MilestoneManagement() {
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'paused' | 'deleted'>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [showStats, setShowStats] = useState<string | null>(null);
  
  const { toast } = useToast();

  // Fetch milestones with status filter
  const { data: milestones = [], isLoading } = useQuery<Milestone[]>({
    queryKey: ['/api/stores', STORE_ID, 'milestones', selectedStatus],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedStatus === 'all') {
        params.set('includeDeleted', 'true');
      } else {
        params.set('status', selectedStatus);
      }
      return fetch(`/api/stores/${STORE_ID}/milestones?${params}`).then(res => res.json());
    },
  });

  // Fetch milestone stats
  const { data: milestoneStats } = useQuery({
    queryKey: ['/api/milestones', showStats, 'stats'],
    queryFn: () => apiRequest("GET", `/api/milestones/${showStats}/stats`).then(res => res.json()),
    enabled: !!showStats,
  });

  // Form for creating/editing milestones
  const form = useForm<MilestoneFormData>({
    resolver: zodResolver(milestoneFormSchema),
    defaultValues: {
      currency: "PKR",
      rewardType: "free_delivery",
      freeProductCount: 0,
      discountValue: "0",
      discountType: "percentage",
      customerSegments: ["all"],
      priority: 1,
      displayOrder: 1,
      maxUsagePerCustomer: 1,
      icon: "🎁",
      color: "#e91e63",
    },
  });

  // Create milestone mutation
  const createMilestoneMutation = useMutation({
    mutationFn: async (data: MilestoneFormData) => {
      const payload = {
        name: data.name,
        description: data.description || "",
        thresholdAmount: data.thresholdAmount, // Keep as string for decimal field
        currency: data.currency || "PKR",
        rewardType: data.rewardType,
        freeProductCount: data.freeProductCount || 0,
        discountValue: data.discountValue || "0",
        discountType: data.discountType || "percentage",
        customerSegments: data.customerSegments || ["all"],
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        usageLimit: data.usageLimit || undefined,
        maxUsagePerCustomer: data.maxUsagePerCustomer || 1,
        priority: data.priority || 1,
        displayOrder: data.displayOrder || 1,
        icon: data.icon || "🎁",
        color: data.color || "#e91e63",
        status: "active",
        isActive: true,
        createdBy: "admin",
        lastModifiedBy: "admin",
        // Remove updatedAt - let database handle with defaultNow()
      };
      
      console.log("Creating milestone with payload:", payload);
      return apiRequest("POST", `/api/stores/${STORE_ID}/milestones`, payload);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Milestone created successfully",
      });
      setIsCreateDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/stores', STORE_ID, 'milestones'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create milestone",
        variant: "destructive",
      });
    },
  });

  // Update milestone mutation
  const updateMilestoneMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<MilestoneFormData> }) => {
      return apiRequest("PUT", `/api/milestones/${id}`, {
        name: data.name,
        description: data.description,
        thresholdAmount: data.thresholdAmount,
        currency: data.currency,
        rewardType: data.rewardType,
        freeProductCount: data.freeProductCount,
        discountValue: data.discountValue,
        discountType: data.discountType,
        customerSegments: data.customerSegments,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        usageLimit: data.usageLimit || undefined,
        maxUsagePerCustomer: data.maxUsagePerCustomer,
        priority: data.priority,
        displayOrder: data.displayOrder,
        icon: data.icon,
        color: data.color,
        modifiedBy: "admin",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Milestone updated successfully",
      });
      setIsEditDialogOpen(false);
      setSelectedMilestone(null);
      queryClient.invalidateQueries({ queryKey: ['/api/stores', STORE_ID, 'milestones'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update milestone",
        variant: "destructive",
      });
    },
  });

  // Pause milestone mutation
  const pauseMilestoneMutation = useMutation({
    mutationFn: async (milestoneId: string) => {
      return apiRequest("POST", `/api/milestones/${milestoneId}/pause`, { modifiedBy: "admin" });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Milestone paused successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/stores', STORE_ID, 'milestones'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to pause milestone",
        variant: "destructive",
      });
    },
  });

  // Resume milestone mutation
  const resumeMilestoneMutation = useMutation({
    mutationFn: async (milestoneId: string) => {
      return apiRequest("POST", `/api/milestones/${milestoneId}/resume`, { modifiedBy: "admin" });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Milestone resumed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/stores', STORE_ID, 'milestones'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to resume milestone",
        variant: "destructive",
      });
    },
  });

  // Delete milestone mutation
  const deleteMilestoneMutation = useMutation({
    mutationFn: async (milestoneId: string) => {
      return apiRequest("DELETE", `/api/milestones/${milestoneId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Milestone deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/stores', STORE_ID, 'milestones'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete milestone",
        variant: "destructive",
      });
    },
  });

  // Duplicate milestone mutation
  const duplicateMilestoneMutation = useMutation({
    mutationFn: async ({ milestoneId, newName }: { milestoneId: string, newName: string }) => {
      return apiRequest("POST", `/api/milestones/${milestoneId}/duplicate`, { 
        newName, 
        createdBy: "admin" 
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Milestone duplicated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/stores', STORE_ID, 'milestones'] });
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to duplicate milestone",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    form.reset({
      name: milestone.name || "",
      description: milestone.description || "",
      thresholdAmount: milestone.thresholdAmount,
      currency: milestone.currency || "PKR",
      rewardType: milestone.rewardType as "free_delivery" | "free_products" | "discount",
      freeProductCount: milestone.freeProductCount || 0,
      discountValue: milestone.discountValue || "0",
      discountType: (milestone.discountType || "percentage") as "percentage" | "fixed",
      customerSegments: milestone.customerSegments || ["all"],
      startDate: milestone.startDate ? new Date(milestone.startDate).toISOString().split('T')[0] : "",
      endDate: milestone.endDate ? new Date(milestone.endDate).toISOString().split('T')[0] : "",
      usageLimit: milestone.usageLimit || undefined,
      maxUsagePerCustomer: milestone.maxUsagePerCustomer || 1,
      priority: milestone.priority || 1,
      displayOrder: milestone.displayOrder || 1,
      icon: milestone.icon || "🎁",
      color: milestone.color || "#e91e63",
    });
    setIsEditDialogOpen(true);
  };

  const handleDuplicate = (milestone: Milestone) => {
    const newName = prompt("Enter name for duplicated milestone:", `${milestone.name} (Copy)`);
    if (newName) {
      duplicateMilestoneMutation.mutate({ milestoneId: milestone.id, newName });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case 'paused':
        return <Badge variant="secondary">Paused</Badge>;
      case 'deleted':
        return <Badge variant="destructive">Deleted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRewardIcon = (rewardType: string) => {
    switch (rewardType) {
      case 'free_delivery':
        return <Truck className="w-4 h-4" />;
      case 'free_products':
        return <Gift className="w-4 h-4" />;
      case 'discount':
        return <Target className="w-4 h-4" />;
      default:
        return <Gift className="w-4 h-4" />;
    }
  };

  const onSubmit = (data: MilestoneFormData) => {
    if (selectedMilestone) {
      updateMilestoneMutation.mutate({ id: selectedMilestone.id, data });
    } else {
      createMilestoneMutation.mutate(data);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Milestone Management</h1>
          <p className="text-muted-foreground">Manage milestone rewards, conditions, and rules</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-milestone">
          <Plus className="w-4 h-4 mr-2" />
          Create Milestone
        </Button>
      </div>

      {/* Status Filter Tabs */}
      <Tabs value={selectedStatus} onValueChange={(value: any) => setSelectedStatus(value)}>
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all-milestones">All Milestones</TabsTrigger>
          <TabsTrigger value="active" data-testid="tab-active-milestones">Active</TabsTrigger>
          <TabsTrigger value="paused" data-testid="tab-paused-milestones">Paused</TabsTrigger>
          <TabsTrigger value="deleted" data-testid="tab-deleted-milestones">Deleted</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Milestones List */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-8">Loading milestones...</div>
        ) : milestones.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No milestones found</h3>
              <p className="text-muted-foreground mb-4">Create your first milestone to get started with reward campaigns.</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Milestone
              </Button>
            </CardContent>
          </Card>
        ) : (
          milestones.map((milestone) => (
            <Card key={milestone.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{milestone.icon}</div>
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>{milestone.name}</span>
                        {getStatusBadge(milestone.status || 'active')}
                      </CardTitle>
                      <CardDescription className="flex items-center space-x-2 mt-1">
                        {getRewardIcon(milestone.rewardType)}
                        <span>
                          {milestone.thresholdAmount} {milestone.currency} - {milestone.rewardType.replace('_', ' ')}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowStats(milestone.id)}
                      data-testid={`button-stats-${milestone.id}`}
                    >
                      <BarChart3 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEdit(milestone)}
                      data-testid={`button-edit-${milestone.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDuplicate(milestone)}
                      data-testid={`button-duplicate-${milestone.id}`}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    {milestone.status === 'active' ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => pauseMilestoneMutation.mutate(milestone.id)}
                        data-testid={`button-pause-${milestone.id}`}
                      >
                        <Pause className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => resumeMilestoneMutation.mutate(milestone.id)}
                        data-testid={`button-resume-${milestone.id}`}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteMilestoneMutation.mutate(milestone.id)}
                      data-testid={`button-delete-${milestone.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Reward Details</Label>
                    <p className="text-sm">
                      {milestone.rewardType === 'free_products' && `${milestone.freeProductCount} free products`}
                      {milestone.rewardType === 'free_delivery' && 'Free shipping'}
                      {milestone.rewardType === 'discount' && `${milestone.discountValue}${milestone.discountType === 'percentage' ? '%' : ` ${milestone.currency}`} off`}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Usage</Label>
                    <p className="text-sm">
                      {milestone.usageCount || 0} uses
                      {milestone.usageLimit && ` / ${milestone.usageLimit} max`}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Customer Segments</Label>
                    <div className="flex flex-wrap gap-1">
                      {milestone.customerSegments?.map((segment) => (
                        <Badge key={segment} variant="outline" className="text-xs">{segment}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
                {milestone.description && (
                  <p className="text-sm text-muted-foreground mt-3">{milestone.description}</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Milestone Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setIsEditDialogOpen(false);
          setSelectedMilestone(null);
          form.reset();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="dialog-milestone-title">
              {selectedMilestone ? "Edit Milestone" : "Create New Milestone"}
            </DialogTitle>
            <DialogDescription>
              {selectedMilestone ? "Update milestone settings and conditions." : "Set up a new milestone reward with conditions and rules."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="rewards">Rewards</TabsTrigger>
                  <TabsTrigger value="conditions">Conditions</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Milestone Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., 2500 PKR Free Delivery" data-testid="input-milestone-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Optional description for this milestone" data-testid="input-milestone-description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="thresholdAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Threshold Amount</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="2500" data-testid="input-threshold-amount" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-currency">
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="PKR">PKR</SelectItem>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                              <SelectItem value="GBP">GBP</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              value={field.value || 1}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)} 
                              data-testid="input-priority"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="displayOrder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display Order</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              value={field.value || 1}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)} 
                              data-testid="input-display-order"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="icon"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Icon</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="🎁" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="rewards" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="rewardType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reward Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-reward-type">
                              <SelectValue placeholder="Select reward type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="free_delivery">Free Delivery</SelectItem>
                            <SelectItem value="free_products">Free Products</SelectItem>
                            <SelectItem value="discount">Discount</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("rewardType") === "free_products" && (
                    <FormField
                      control={form.control}
                      name="freeProductCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Free Products</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              min="0"
                              value={field.value || 0}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              data-testid="input-free-product-count"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {form.watch("rewardType") === "discount" && (
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="discountValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Discount Value</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="10" data-testid="input-discount-value" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="discountType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Discount Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-discount-type">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="percentage">Percentage (%)</SelectItem>
                                <SelectItem value="fixed">Fixed Amount</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="conditions" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" data-testid="input-start-date" />
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
                          <FormLabel>End Date (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" data-testid="input-end-date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="usageLimit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Usage Limit (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              placeholder="Unlimited"
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              data-testid="input-usage-limit"
                            />
                          </FormControl>
                          <FormDescription>Maximum times this milestone can be used</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maxUsagePerCustomer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Usage Per Customer</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              min="1"
                              value={field.value || 1}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              data-testid="input-max-usage-per-customer"
                            />
                          </FormControl>
                          <FormDescription>How many times each customer can use this</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="customerSegments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Segments</FormLabel>
                        <FormDescription>Who can use this milestone</FormDescription>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {["all", "new", "returning", "vip"].map((segment) => (
                            <Button
                              key={segment}
                              type="button"
                              variant={field.value.includes(segment) ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                const current = field.value;
                                if (current.includes(segment)) {
                                  field.onChange(current.filter(s => s !== segment));
                                } else {
                                  field.onChange([...current, segment]);
                                }
                              }}
                              data-testid={`button-segment-${segment}`}
                            >
                              {segment.charAt(0).toUpperCase() + segment.slice(1)}
                            </Button>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setIsEditDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMilestoneMutation.isPending || updateMilestoneMutation.isPending}
                  data-testid="button-save-milestone"
                >
                  {selectedMilestone ? "Update" : "Create"} Milestone
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Stats Dialog */}
      {showStats && (
        <Dialog open={!!showStats} onOpenChange={() => setShowStats(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Milestone Statistics</DialogTitle>
              <DialogDescription>Performance metrics for this milestone</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{milestoneStats?.totalUsage || 0}</div>
                <div className="text-sm text-muted-foreground">Total Uses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{milestoneStats?.uniqueCustomers || 0}</div>
                <div className="text-sm text-muted-foreground">Unique Customers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">PKR {milestoneStats?.totalDiscount || 0}</div>
                <div className="text-sm text-muted-foreground">Total Discount</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">PKR {milestoneStats?.averageOrderValue || 0}</div>
                <div className="text-sm text-muted-foreground">Avg Order Value</div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}