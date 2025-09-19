import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Store, Settings, ExternalLink } from "lucide-react";

interface SetupScreenProps {
  onComplete: (storeId: string, customerId: string) => void;
}

export default function SetupScreen({ onComplete }: SetupScreenProps) {
  const [storeId, setStoreId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (storeId && customerId) {
      setIsLoading(true);
      // Store in localStorage temporarily for development
      localStorage.setItem('SHOPIFY_STORE_ID', storeId);
      localStorage.setItem('SHOPIFY_CUSTOMER_ID', customerId);
      onComplete(storeId, customerId);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-primary rounded-full flex items-center justify-center">
            <Store className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Shopify Store Setup</CardTitle>
          <CardDescription>
            Configure your Shopify store connection to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <Settings className="h-4 w-4" />
            <AlertDescription>
              For production deployment, set <code>VITE_SHOPIFY_STORE_ID</code> and <code>VITE_SHOPIFY_CUSTOMER_ID</code> environment variables.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storeId">Shopify Store ID</Label>
              <Input
                id="storeId"
                type="text"
                placeholder="your-store.myshopify.com"
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                required
                data-testid="input-store-id"
              />
              <p className="text-sm text-muted-foreground">
                Your Shopify store domain (e.g., mystore.myshopify.com)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerId">Customer ID</Label>
              <Input
                id="customerId"
                type="text"
                placeholder="customer-id"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
                data-testid="input-customer-id"
              />
              <p className="text-sm text-muted-foreground">
                Shopify customer ID for testing (optional in development)
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={!storeId || !customerId || isLoading}
              data-testid="button-setup-complete"
            >
              {isLoading ? "Setting up..." : "Complete Setup"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t text-center text-sm text-muted-foreground">
            <p className="mb-2">Need help setting up your Shopify app?</p>
            <Button variant="link" size="sm" className="h-auto p-0" data-testid="link-deployment-guide">
              <ExternalLink className="w-3 h-3 mr-1" />
              View Deployment Guide
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}