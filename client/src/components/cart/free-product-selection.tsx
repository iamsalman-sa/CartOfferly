import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useStoreBootstrap } from "@/hooks/use-store-bootstrap";

interface FreeProduct {
  id: string;
  name: string;
  image: string;
  description: string;
  value: number;
  isEligibleForRewards?: boolean;
}

interface FreeProductSelectionProps {
  cartValue: number;
  onProductsSelected?: (products: {id: string, value: number}[]) => void;
}

// Interface for API product response
interface ApiProduct {
  id: string;
  name: string;
  price: number;
  images?: string[];
  description?: string;
  isEligibleForRewards?: boolean;
}

export default function FreeProductSelection({ cartValue, onProductsSelected }: FreeProductSelectionProps) {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [appliedProducts, setAppliedProducts] = useState<string[]>([]);
  
  // Get store ID to fetch products
  const { storeId } = useStoreBootstrap();
  
  // Fetch eligible products from API
  const { data: productsData, isLoading } = useQuery<ApiProduct[]>({
    queryKey: ['/api/stores', storeId, 'products'],
    enabled: !!storeId,
  });
  
  // Filter products eligible for rewards
  const freeProducts: FreeProduct[] = (productsData || [])
    .filter(p => p.isEligibleForRewards)
    .map(p => ({
      id: p.id,
      name: p.name,
      image: p.images?.[0] || '/api/placeholder/150/150',
      description: p.description || `Get this ${p.name} for free!`,
      value: p.price
    }));

  // Calculate how many products can be selected
  const maxProducts = cartValue >= 5000 ? 3 : cartValue >= 4000 ? 2 : cartValue >= 3000 ? 1 : 0;

  if (maxProducts === 0) return null;
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-accent/10 to-primary/10 rounded-lg p-6 border border-accent/30 animate-pulse">
        <div className="h-6 bg-muted rounded mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-32 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    );
  }
  
  // Show message if no eligible products found
  if (!freeProducts.length) {
    return (
      <div className="bg-gradient-to-r from-accent/10 to-primary/10 rounded-lg p-6 border border-accent/30">
        <div className="text-center py-8">
          <Star className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Free Products Coming Soon!</h3>
          <p className="text-muted-foreground">
            You've unlocked {maxProducts} free product{maxProducts !== 1 ? 's' : ''}, but eligible products are still being set up.
          </p>
        </div>
      </div>
    );
  }

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else if (prev.length < maxProducts) {
        return [...prev, productId];
      }
      return prev;
    });
  };

  const handleAddProducts = () => {
    console.log("Adding selected free products:", selectedProducts);
    
    // Calculate selected products with their values
    const selectedProductsWithValues = selectedProducts.map(id => {
      const product = freeProducts.find(p => p.id === id);
      return { id, value: product?.value || 0 };
    });
    
    // Apply the products
    setAppliedProducts(selectedProducts);
    onProductsSelected?.(selectedProductsWithValues);
  };

  return (
    <div className="bg-gradient-to-r from-accent/10 to-primary/10 rounded-lg p-6 border border-accent/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground" data-testid="free-products-title">
          Choose Your Free Products
        </h3>
        <Badge variant="secondary" className="bg-accent/20 text-accent-foreground">
          <Star className="w-3 h-3 mr-1" />
          <span data-testid="available-count">{maxProducts} Available</span>
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {freeProducts.slice(0, 6).map((product) => {
          const isSelected = selectedProducts.includes(product.id);
          const isDisabled = !isSelected && selectedProducts.length >= maxProducts;
          
          return (
            <div
              key={product.id}
              className={`relative group transition-all duration-300 ${
                isDisabled ? 'opacity-50' : ''
              }`}
              data-testid={`free-product-${product.id}`}
            >
              <div
                className={`p-3 bg-card border rounded-lg cursor-pointer transition-all hover:scale-105 ${
                  isSelected 
                    ? 'border-accent ring-2 ring-accent/20' 
                    : 'border-border hover:border-accent'
                } ${isDisabled ? 'cursor-not-allowed hover:scale-100' : ''}`}
                onClick={() => !isDisabled && toggleProduct(product.id)}
              >
                <img 
                  src={product.image}
                  alt={product.name}
                  className="w-full h-20 object-cover rounded-md mb-2"
                />
                <h4 className="font-medium text-sm text-foreground truncate">
                  {product.name}
                </h4>
                <p className="text-xs text-muted-foreground mb-1">
                  {product.description}
                </p>
                <p className="text-xs font-semibold text-accent">
                  Value: PKR {product.value}
                </p>
                
                {/* Selection Indicator */}
                <div className="absolute top-2 right-2">
                  <Checkbox 
                    checked={isSelected}
                    disabled={isDisabled}
                    className="w-5 h-5"
                    data-testid={`checkbox-${product.id}`}
                  />
                </div>
                
                {/* Hover Indicator */}
                {!isSelected && !isDisabled && (
                  <div className="absolute top-2 left-2 w-6 h-6 bg-accent rounded-full hidden group-hover:flex items-center justify-center">
                    <Plus className="text-xs text-primary" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selection Summary */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          <span data-testid="selected-count">{selectedProducts.length}</span> of {maxProducts} products selected
        </div>
        {selectedProducts.length > 0 && (
          <div className="text-sm font-medium text-green-600">
            Free value: PKR {selectedProducts.reduce((total, id) => {
              const product = freeProducts.find(p => p.id === id);
              return total + (product?.value || 0);
            }, 0).toLocaleString()}
          </div>
        )}
      </div>

      <Button 
        onClick={handleAddProducts}
        disabled={selectedProducts.length === 0 || JSON.stringify(appliedProducts) === JSON.stringify(selectedProducts)}
        className="w-full mt-4 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
        data-testid="button-add-free-products"
      >
        {JSON.stringify(appliedProducts) === JSON.stringify(selectedProducts) 
          ? `Applied ${appliedProducts.length} Products ✓` 
          : `Add Selected Products (${selectedProducts.length})`}
      </Button>
    </div>
  );
}
