import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import CartDrawer from "@/pages/cart-drawer";
import NotFound from "@/pages/not-found";
// Admin pages
import AdminDashboard from "@/pages/admin-dashboard";
import CampaignManagement from "@/pages/campaign-management";
import AnalyticsDashboard from "@/pages/analytics-dashboard";
import SeasonalPromotions from "@/pages/seasonal-promotions";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Dashboard} />
      <Route path="/cart" component={CartDrawer} />
      
      {/* Admin routes */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/campaigns" component={CampaignManagement} />
      <Route path="/admin/analytics" component={AnalyticsDashboard} />
      <Route path="/admin/seasonal" component={SeasonalPromotions} />
      
      {/* 404 fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
