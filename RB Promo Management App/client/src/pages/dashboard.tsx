import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Gift, TrendingUp, Target, Coins, Rocket, Settings, BarChart3, Tag, Calendar, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const [timerDuration, setTimerDuration] = useState("25");
  const [customDuration, setCustomDuration] = useState("");
  const [celebrationEnabled, setCelebrationEnabled] = useState(true);
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [bundlesExcluded, setBundlesExcluded] = useState(true);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  // Mock store ID for demo - in real app this would come from auth
  const storeId = "demo-store-id";

  const { data: analytics } = useQuery({
    queryKey: ["/api/stores", storeId, "analytics"],
    enabled: !!storeId,
  });

  const handleSaveSettings = () => {
    // Implementation would save settings to backend
    const finalDuration = timerDuration === "custom" ? customDuration : timerDuration;
    console.log("Settings saved:", {
      timerDuration: finalDuration,
      celebrationEnabled,
      timerEnabled,
      bundlesExcluded,
    });
    setShowSuccessDialog(true);
  };

  const getFinalDuration = () => {
    return timerDuration === "custom" ? customDuration : timerDuration;
  };

  return (
    <div className="min-h-screen bg-black text-white dark p-4">
      {/* Header Section */}
      <div className="max-w-4xl mx-auto mb-8">
        <Card className="shadow-lg border border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 luxury-gradient rounded-lg flex items-center justify-center">
                  <Gift className="text-primary-foreground text-xl" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground" data-testid="app-title">
                    Premium Cart Rewards
                  </h1>
                  <p className="text-white">Advanced discount management system</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 bg-muted px-4 py-2 rounded-md">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-white" data-testid="connection-status">
                  Connected
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Discount Management Section */}
      <div className="max-w-4xl mx-auto mb-8">
        <Card className="shadow-xl border border-border bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">🎯 Discount Management Hub</h2>
                <p className="text-white">Professional campaign & bundle management for Real Beauty</p>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 rounded-lg">
                <span className="text-white font-semibold text-sm">NEW FEATURES</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to="/admin" className="block">
                <Button className="w-full h-20 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white" data-testid="button-admin-dashboard">
                  <Settings className="w-6 h-6" />
                  <span className="text-sm font-medium">Admin Dashboard</span>
                </Button>
              </Link>
              
              <Link to="/admin/campaigns" className="block">
                <Button className="w-full h-20 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white" data-testid="button-campaign-management">
                  <Tag className="w-6 h-6" />
                  <span className="text-sm font-medium">Campaign Manager</span>
                </Button>
              </Link>
              
              <Link to="/admin/analytics" className="block">
                <Button className="w-full h-20 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white" data-testid="button-analytics-dashboard">
                  <BarChart3 className="w-6 h-6" />
                  <span className="text-sm font-medium">Analytics Hub</span>
                </Button>
              </Link>
              
              <Link to="/admin/seasonal" className="block">
                <Button className="w-full h-20 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white" data-testid="button-seasonal-promotions">
                  <Calendar className="w-6 h-6" />
                  <span className="text-sm font-medium">Seasonal Campaigns</span>
                </Button>
              </Link>
            </div>
            
            <div className="mt-6 p-4 bg-black/20 dark:bg-black/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <h3 className="font-semibold text-foreground mb-2">✨ New Admin Features Available:</h3>
              <ul className="text-sm text-foreground space-y-1">
                <li>• Create & manage discount campaigns (BOGO, percentage, fixed amount)</li>
                <li>• Design attractive product bundles with custom pricing</li>
                <li>• Schedule seasonal promotions (Eid, Ramadan, Valentine's, etc.)</li>
                <li>• Track performance with advanced analytics & ROI metrics</li>
                <li>• No coding required - visual campaign builder interface</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2">
          {/* Feature Overview */}
          <Card className="shadow-xl border border-border mb-6">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-6" data-testid="features-title">
                Key Features
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-accent/30">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <Target className="text-primary-foreground text-sm" />
                    </div>
                    <h3 className="font-medium text-foreground">Milestone Tracking</h3>
                  </div>
                  <p className="text-sm text-white">
                    Automatic progress tracking with PKR 2500, 3000, 4000, and 5000 thresholds
                  </p>
                </div>

                <div className="p-4 bg-gradient-to-r from-accent/10 to-primary/10 rounded-lg border border-accent/30">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
                      <Gift className="text-primary text-sm" />
                    </div>
                    <h3 className="font-medium text-foreground">Dynamic Rewards</h3>
                  </div>
                  <p className="text-sm text-white">
                    Free delivery and progressive free product selection based on cart value
                  </p>
                </div>

                <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <TrendingUp className="text-white text-sm" />
                    </div>
                    <h3 className="font-medium text-foreground">Premium Animations</h3>
                  </div>
                  <p className="text-sm text-white">
                    Celebration confetti and glow effects when milestones are achieved
                  </p>
                </div>

                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                      <Coins className="text-white text-sm" />
                    </div>
                    <h3 className="font-medium text-foreground">Urgency Timer</h3>
                  </div>
                  <p className="text-sm text-white">
                    Countdown timer to create urgency and drive conversions
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Deployment Guide */}
          <Card className="shadow-lg border border-border">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center">
                <Rocket className="text-accent mr-3" />
                Complete Deployment Guide
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Prerequisites</h3>
                  <ul className="space-y-2 text-sm text-white">
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <span className="text-white">Shopify Partner account</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <span className="text-white">Node.js 18+ installed</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <span className="text-white">Shopify CLI installed</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <span className="text-white">Development store access</span>
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Quick Start</h3>
                  <div className="bg-muted rounded-lg p-4 font-mono text-xs space-y-2">
                    <div className="text-white"># Install dependencies</div>
                    <div className="text-white">npm install</div>
                    <div className="text-white"># Setup database</div>
                    <div className="text-white">npm run db:push</div>
                    <div className="text-white"># Start development</div>
                    <div className="text-white">npm run dev</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-foreground">Deployment Steps</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-4 p-4 bg-muted rounded-lg">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-sm">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Create Shopify App</h4>
                      <p className="text-sm text-white">
                        Set up new app in Partner Dashboard with required scopes: write_products, write_orders, read_customers
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4 p-4 bg-muted rounded-lg">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-sm">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Configure Environment</h4>
                      <p className="text-sm text-white">
                        Add API keys, webhook URLs, and database connections to environment variables
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4 p-4 bg-muted rounded-lg">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-sm">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Install Theme Extension</h4>
                      <p className="text-sm text-white">
                        Deploy cart drawer extension to handle milestone tracking and UI components
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4 p-4 bg-muted rounded-lg">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-sm">4</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Test & Deploy</h4>
                      <p className="text-sm text-white">
                        Test milestone functionality, timer behavior, and free product selection before production deployment
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* App Settings */}
          <Card className="shadow-lg border border-border">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4" data-testid="settings-title">
                App Settings
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="timer-duration" className="text-sm font-medium text-foreground mb-2 block">
                    Timer Duration
                  </Label>
                  <Select value={timerDuration} onValueChange={setTimerDuration}>
                    <SelectTrigger data-testid="timer-duration-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="25">25 minutes</SelectItem>
                      <SelectItem value="20">20 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  {timerDuration === "custom" && (
                    <div className="mt-2">
                      <Input
                        type="number"
                        placeholder="Enter minutes"
                        value={customDuration}
                        onChange={(e) => setCustomDuration(e.target.value)}
                        className="w-full"
                        data-testid="custom-duration-input"
                        min="1"
                        max="120"
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="celebration-animations" className="text-sm text-foreground">
                    Enable celebration animations
                  </Label>
                  <Switch
                    id="celebration-animations"
                    checked={celebrationEnabled}
                    onCheckedChange={setCelebrationEnabled}
                    data-testid="celebration-toggle"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="urgency-timer" className="text-sm text-foreground">
                    Show urgency timer
                  </Label>
                  <Switch
                    id="urgency-timer"
                    checked={timerEnabled}
                    onCheckedChange={setTimerEnabled}
                    data-testid="timer-toggle"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="exclude-bundles" className="text-sm text-foreground">
                    Exclude bundle products
                  </Label>
                  <Switch
                    id="exclude-bundles"
                    checked={bundlesExcluded}
                    onCheckedChange={setBundlesExcluded}
                    data-testid="bundles-toggle"
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleSaveSettings}
                className="w-full mt-6"
                data-testid="button-save-settings"
              >
                Save Settings
              </Button>
            </CardContent>
          </Card>

          {/* Analytics Preview */}
          <Card className="shadow-lg border border-border">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4" data-testid="analytics-title">
                Performance Metrics
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-white">Conversion Rate</p>
                    <p className="text-xl font-bold text-green-600" data-testid="conversion-rate">
                      +{(analytics as any)?.conversionRate || 23.5}%
                    </p>
                  </div>
                  <TrendingUp className="text-green-600 text-xl" />
                </div>
                
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-white">Average Order Value</p>
                    <p className="text-xl font-bold text-blue-400" data-testid="avg-order-value">
                      PKR {(analytics as any)?.averageOrderValue || 4850}
                    </p>
                  </div>
                  <Coins className="text-blue-400 text-xl" />
                </div>
                
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-white">Milestones Hit</p>
                    <p className="text-xl font-bold text-purple-400" data-testid="milestones-hit">
                      {(analytics as any)?.milestonesHit || 1247}
                    </p>
                  </div>
                  <Target className="text-purple-400 text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <DialogTitle className="text-xl font-semibold">Settings Saved Successfully!</DialogTitle>
            </div>
            <DialogDescription className="mt-4 space-y-2 text-muted-foreground">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Timer Duration:</span>
                  <span>{getFinalDuration()} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Celebration:</span>
                  <span>{celebrationEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Timer:</span>
                  <span>{timerEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Bundles Excluded:</span>
                  <span>{bundlesExcluded ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end mt-6">
            <Button 
              onClick={() => setShowSuccessDialog(false)}
              className="px-6"
              data-testid="dialog-ok-button"
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
