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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AdminSidebar from "@/components/admin-sidebar";
import { 
  Plus, 
  Calendar, 
  Heart, 
  Sun, 
  Snowflake, 
  Gift,
  Star,
  Sparkles,
  Flower,
  Crown,
  Edit,
  Play,
  Pause,
  Trash2,
  Eye,
  Save,
  X,
  Palette
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock store ID
const STORE_ID = "demo-store-id";

// Seasonal promotion schema
const seasonalPromotionSchema = z.object({
  name: z.string().min(3, "Promotion name must be at least 3 characters"),
  theme: z.enum(["eid", "ramadan", "valentine", "summer", "winter", "black_friday", "christmas", "new_year"]),
  bannerText: z.string().min(5, "Banner text must be at least 5 characters"),
  bannerColor: z.string().default("#000000"),
  textColor: z.string().default("#ffffff"),
  autoActivate: z.boolean().default(false),
  activationDate: z.string().optional(),
  deactivationDate: z.string().optional(),
});

type SeasonalPromotionFormData = z.infer<typeof seasonalPromotionSchema>;

// Theme configurations
const seasonalThemes = {
  eid: {
    icon: Star,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20",
    defaultBanner: "🌙 Blessed Eid Mubarak! Enjoy exclusive discounts on all beauty essentials",
    defaultColors: { banner: "#D4AF37", text: "#FFFFFF" }
  },
  ramadan: {
    icon: Crown,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    defaultBanner: "🕌 Ramadan Kareem! Special beauty offers for the holy month",
    defaultColors: { banner: "#6B46C1", text: "#FFFFFF" }
  },
  valentine: {
    icon: Heart,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    defaultBanner: "💖 Valentine's Day Special! Show love with beautiful gifts",
    defaultColors: { banner: "#DC2626", text: "#FFFFFF" }
  },
  summer: {
    icon: Sun,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
    defaultBanner: "☀️ Summer Glow Collection! Beat the heat with fresh beauty looks",
    defaultColors: { banner: "#EA580C", text: "#FFFFFF" }
  },
  winter: {
    icon: Snowflake,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    defaultBanner: "❄️ Winter Wonderland! Cozy up with our winter beauty essentials",
    defaultColors: { banner: "#2563EB", text: "#FFFFFF" }
  },
  black_friday: {
    icon: Gift,
    color: "text-black",
    bgColor: "bg-gray-900/10",
    borderColor: "border-gray-900/20",
    defaultBanner: "🛍️ BLACK FRIDAY MEGA SALE! Biggest discounts of the year",
    defaultColors: { banner: "#000000", text: "#FFFFFF" }
  },
  christmas: {
    icon: Sparkles,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    defaultBanner: "🎄 Merry Christmas! Festive beauty gifts for everyone",
    defaultColors: { banner: "#16A34A", text: "#FFFFFF" }
  },
  new_year: {
    icon: Flower,
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/20",
    defaultBanner: "✨ New Year, New You! Start fresh with our beauty collection",
    defaultColors: { banner: "#4F46E5", text: "#FFFFFF" }
  }
};

// Mock data removed - now using real API calls

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge 
      variant="outline"
      className={cn(
        isActive 
          ? "bg-green-500/20 text-green-400 border-green-500/30" 
          : "bg-gray-500/20 text-gray-400 border-gray-500/30"
      )}
    >
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}

function ThemeIcon({ theme }: { theme: string }) {
  const config = seasonalThemes[theme as keyof typeof seasonalThemes];
  if (!config) return <Calendar className="h-4 w-4" />;
  
  const Icon = config.icon;
  return <Icon className={cn("h-4 w-4", config.color)} />;
}

function SeasonalPromotionForm({ 
  promotion, 
  onSubmit, 
  onCancel, 
  isLoading 
}: { 
  promotion?: any; 
  onSubmit: (data: SeasonalPromotionFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const form = useForm<SeasonalPromotionFormData>({
    resolver: zodResolver(seasonalPromotionSchema),
    defaultValues: promotion || {
      name: "",
      theme: "eid",
      bannerText: "",
      bannerColor: "#000000",
      textColor: "#ffffff",
      autoActivate: false
    }
  });

  const selectedTheme = form.watch("theme");
  const themeConfig = seasonalThemes[selectedTheme];

  const applyThemeDefaults = () => {
    if (themeConfig) {
      form.setValue("bannerText", themeConfig.defaultBanner);
      form.setValue("bannerColor", themeConfig.defaultColors.banner);
      form.setValue("textColor", themeConfig.defaultColors.text);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Promotion Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., Eid Special 2024" 
                    {...field} 
                    data-testid="input-promotion-name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="theme"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Seasonal Theme</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-theme">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="eid">🌙 Eid</SelectItem>
                    <SelectItem value="ramadan">🕌 Ramadan</SelectItem>
                    <SelectItem value="valentine">💖 Valentine's Day</SelectItem>
                    <SelectItem value="summer">☀️ Summer</SelectItem>
                    <SelectItem value="winter">❄️ Winter</SelectItem>
                    <SelectItem value="black_friday">🛍️ Black Friday</SelectItem>
                    <SelectItem value="christmas">🎄 Christmas</SelectItem>
                    <SelectItem value="new_year">✨ New Year</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="bannerText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Banner Text</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter your promotional banner text..."
                  {...field}
                  data-testid="textarea-banner-text"
                />
              </FormControl>
              <FormDescription>
                This will be displayed prominently on your store
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-between p-4 rounded-lg border border-border">
          <Button 
            type="button" 
            variant="outline" 
            onClick={applyThemeDefaults}
            data-testid="button-apply-theme-defaults"
          >
            <Palette className="mr-2 h-4 w-4" />
            Apply {themeConfig?.icon && <themeConfig.icon className="mx-1 h-4 w-4" />} Theme Defaults
          </Button>
          <div className="text-sm text-muted-foreground">
            Quick setup with theme-appropriate colors and text
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <FormField
            control={form.control}
            name="bannerColor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Banner Background Color</FormLabel>
                <FormControl>
                  <div className="flex items-center space-x-2">
                    <Input 
                      type="color"
                      {...field}
                      className="w-16 h-10 rounded border-border"
                      data-testid="input-banner-color"
                    />
                    <Input 
                      type="text"
                      {...field}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="textColor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Text Color</FormLabel>
                <FormControl>
                  <div className="flex items-center space-x-2">
                    <Input 
                      type="color"
                      {...field}
                      className="w-16 h-10 rounded border-border"
                      data-testid="input-text-color"
                    />
                    <Input 
                      type="text"
                      {...field}
                      placeholder="#ffffff"
                      className="flex-1"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <FormField
            control={form.control}
            name="activationDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Activation Date</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    {...field}
                    data-testid="input-activation-date"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="deactivationDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Deactivation Date</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    {...field}
                    data-testid="input-deactivation-date"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="autoActivate"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Auto-Activate</FormLabel>
                <FormDescription>
                  Automatically activate this promotion on the activation date
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  data-testid="switch-auto-activate"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Preview */}
        <div className="rounded-lg border border-border p-4">
          <h4 className="text-sm font-medium text-foreground mb-3">Preview</h4>
          <div 
            className="rounded-lg p-4 text-center"
            style={{ 
              backgroundColor: form.watch("bannerColor") || "#000000",
              color: form.watch("textColor") || "#ffffff"
            }}
          >
            <p className="font-medium">
              {form.watch("bannerText") || "Your banner text will appear here"}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            data-testid="button-cancel-promotion"
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} data-testid="button-save-promotion">
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? "Saving..." : promotion ? "Update" : "Create"} Promotion
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function SeasonalPromotions() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<any>(null);
  const [previewingPromotion, setPreviewingPromotion] = useState<any>(null);
  const { toast } = useToast();

  // Fetch real seasonal promotions data
  const { data: promotions = [], isLoading, isError } = useQuery({
    queryKey: ['/api/stores', STORE_ID, 'seasonal-promotions'],
    enabled: !!STORE_ID,
  });

  const createPromotionMutation = useMutation({
    mutationFn: async (data: SeasonalPromotionFormData) => {
      return apiRequest("POST", `/api/stores/${STORE_ID}/seasonal-promotions`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Seasonal promotion created successfully",
      });
      setIsCreateDialogOpen(false);
      setEditingPromotion(null);
      queryClient.invalidateQueries({ queryKey: ['/api/stores', STORE_ID, 'seasonal-promotions'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create seasonal promotion",
        variant: "destructive",
      });
    },
  });

  const togglePromotionStatus = async (promotionId: string, isActive: boolean) => {
    try {
      const endpoint = isActive 
        ? `/api/seasonal-promotions/${promotionId}/activate`
        : `/api/seasonal-promotions/${promotionId}/deactivate`;
        
      await apiRequest("PATCH", endpoint);
      
      toast({
        title: "Success",
        description: `Promotion ${isActive ? 'activated' : 'deactivated'} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/stores', STORE_ID, 'seasonal-promotions'] });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${isActive ? 'activate' : 'deactivate'} promotion`,
        variant: "destructive",
      });
    }
  };

  const handleCreatePromotion = (data: SeasonalPromotionFormData) => {
    createPromotionMutation.mutate(data);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="space-y-6 p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground" data-testid="seasonal-promotions-title">
                Seasonal Promotions
              </h1>
              <p className="text-muted-foreground">
                Manage holiday and seasonal campaigns for Real Beauty
              </p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-seasonal-promotion">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Seasonal Promotion
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>Create Seasonal Promotion</DialogTitle>
                  <DialogDescription>
                    Set up a new seasonal campaign for your store
                  </DialogDescription>
                </DialogHeader>
                <SeasonalPromotionForm
                  onSubmit={handleCreatePromotion}
                  onCancel={() => setIsCreateDialogOpen(false)}
                  isLoading={createPromotionMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>

          {/* Theme Quick Actions */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle>Popular Seasonal Themes</CardTitle>
              <CardDescription>
                Quick setup for common seasonal campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {Object.entries(seasonalThemes).slice(0, 4).map(([key, theme]) => (
                  <Button
                    key={key}
                    variant="outline"
                    className={cn(
                      "h-20 flex-col space-y-2 border-dashed card-hover",
                      theme.bgColor,
                      theme.borderColor
                    )}
                    onClick={() => {
                      // Pre-fill form with theme defaults
                      setIsCreateDialogOpen(true);
                    }}
                    data-testid={`theme-quick-${key}`}
                  >
                    <theme.icon className={cn("h-6 w-6", theme.color)} />
                    <span className="capitalize text-sm font-medium">{key.replace('_', ' ')}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Promotions List */}
          <div className="space-y-4">
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="card-hover animate-pulse">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="h-4 w-4 bg-muted rounded" />
                          <div className="h-5 w-48 bg-muted rounded" />
                          <div className="h-5 w-16 bg-muted rounded" />
                          <div className="h-5 w-20 bg-muted rounded" />
                        </div>
                        <div className="h-12 w-full bg-muted rounded-lg" />
                        <div className="grid grid-cols-3 gap-4">
                          <div className="h-4 w-full bg-muted rounded" />
                          <div className="h-4 w-full bg-muted rounded" />
                          <div className="h-4 w-full bg-muted rounded" />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 bg-muted rounded" />
                        <div className="h-8 w-8 bg-muted rounded" />
                        <div className="h-8 w-8 bg-muted rounded" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : isError ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <X className="mx-auto h-12 w-12 text-red-500 mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">Failed to load promotions</h3>
                  <p className="text-muted-foreground mb-4">
                    There was an error loading seasonal promotions. Please try refreshing the page.
                  </p>
                  <Button onClick={() => window.location.reload()}>
                    Refresh Page
                  </Button>
                </CardContent>
              </Card>
            ) : (promotions as any[])?.length > 0 ? (
              (promotions as any[]).map((promotion: any) => (
              <Card key={promotion.id} className="card-hover" data-testid={`promotion-card-${promotion.id}`}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <ThemeIcon theme={promotion.theme} />
                        <h3 className="text-lg font-medium text-foreground">{promotion.name}</h3>
                        <StatusBadge isActive={promotion.isActive} />
                        <Badge variant="secondary" className="capitalize">
                          {promotion.theme.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div 
                        className="rounded-lg p-3 mb-3 text-sm"
                        style={{ 
                          backgroundColor: promotion.bannerColor,
                          color: promotion.textColor
                        }}
                      >
                        {promotion.bannerText}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm lg:grid-cols-3">
                        <div>
                          <span className="text-muted-foreground">Period: </span>
                          <span className="text-foreground">
                            {promotion.activationDate} - {promotion.deactivationDate}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Auto-activate: </span>
                          <span className="text-foreground">
                            {promotion.autoActivate ? "Yes" : "No"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Created: </span>
                          <span className="text-foreground">
                            {new Date(promotion.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {promotion.isActive ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => togglePromotionStatus(promotion.id, false)}
                          data-testid={`button-deactivate-${promotion.id}`}
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => togglePromotionStatus(promotion.id, true)}
                          data-testid={`button-activate-${promotion.id}`}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingPromotion(promotion)}
                        data-testid={`button-edit-${promotion.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewingPromotion(promotion)}
                        data-testid={`button-preview-${promotion.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))
            ) : null}
          </div>

          {!isLoading && !isError && (promotions as any[])?.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No seasonal promotions found</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first seasonal campaign to engage customers during holidays
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-first-promotion">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Seasonal Promotion
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Edit Dialog */}
          <Dialog 
            open={!!editingPromotion} 
            onOpenChange={(open) => !open && setEditingPromotion(null)}
          >
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Edit Seasonal Promotion</DialogTitle>
                <DialogDescription>
                  Update seasonal promotion settings and configuration
                </DialogDescription>
              </DialogHeader>
              {editingPromotion && (
                <SeasonalPromotionForm
                  promotion={editingPromotion}
                  onSubmit={handleCreatePromotion}
                  onCancel={() => setEditingPromotion(null)}
                  isLoading={createPromotionMutation.isPending}
                />
              )}
            </DialogContent>
          </Dialog>

          {/* Preview Dialog */}
          <Dialog 
            open={!!previewingPromotion} 
            onOpenChange={(open) => !open && setPreviewingPromotion(null)}
          >
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Promotion Preview</DialogTitle>
                <DialogDescription>
                  See how this promotion will appear to your customers
                </DialogDescription>
              </DialogHeader>
              {previewingPromotion && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <ThemeIcon theme={previewingPromotion.theme} />
                    <h3 className="text-xl font-semibold">{previewingPromotion.name}</h3>
                    <StatusBadge isActive={previewingPromotion.isActive} />
                  </div>
                  
                  <div 
                    className="rounded-lg p-6 text-center text-lg font-medium"
                    style={{ 
                      backgroundColor: previewingPromotion.bannerColor,
                      color: previewingPromotion.textColor
                    }}
                  >
                    {previewingPromotion.bannerText}
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Theme:</span>
                      <span className="capitalize">{previewingPromotion.theme.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Banner Color:</span>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: previewingPromotion.bannerColor }}
                        />
                        <span>{previewingPromotion.bannerColor}</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Text Color:</span>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: previewingPromotion.textColor }}
                        />
                        <span>{previewingPromotion.textColor}</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Auto-activate:</span>
                      <span>{previewingPromotion.autoActivate ? "Yes" : "No"}</span>
                    </div>
                    {previewingPromotion.activationDate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Activation Date:</span>
                        <span>{previewingPromotion.activationDate}</span>
                      </div>
                    )}
                    {previewingPromotion.deactivationDate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Deactivation Date:</span>
                        <span>{previewingPromotion.deactivationDate}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      variant="outline" 
                      onClick={() => setPreviewingPromotion(null)}
                      data-testid="button-close-preview"
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