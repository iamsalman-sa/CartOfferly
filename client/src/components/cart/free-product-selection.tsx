import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Star } from "lucide-react";

interface FreeProduct {
  id: string;
  name: string;
  image: string;
  description: string;
  value: number;
}

interface FreeProductSelectionProps {
  cartValue: number;
}

const freeProducts: FreeProduct[] = [
  {
    id: "fp-1",
    name: "Luxury Perfume",
    image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=300&h=200&fit=crop",
    description: "50ml Bottle",
    value: 800
  },
  {
    id: "fp-2", 
    name: "Designer Sunglasses",
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300&h=200&fit=crop",
    description: "UV Protection",
    value: 1200
  },
  {
    id: "fp-3",
    name: "Premium Wallet",
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=300&h=200&fit=crop",
    description: "Genuine Leather",
    value: 900
  },
  {
    id: "fp-4",
    name: "Silk Scarf",
    image: "https://images.unsplash.com/photo-1601924287153-c4147f4b2f30?w=300&h=200&fit=crop", 
    description: "Premium Silk",
    value: 600
  },
  {
    id: "fp-5",
    name: "Phone Accessory Set",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&h=200&fit=crop",
    description: "Case & Stand",
    value: 500
  },
  {
    id: "fp-6",
    name: "Essential Oil Set",
    image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=300&h=200&fit=crop",
    description: "3 Bottles",
    value: 700
  }
];

export default function FreeProductSelection({ cartValue }: FreeProductSelectionProps) {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // Calculate how many products can be selected
  const maxProducts = cartValue >= 5000 ? 3 : cartValue >= 4000 ? 2 : cartValue >= 3000 ? 1 : 0;

  if (maxProducts === 0) return null;

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
    // Implementation would add products to cart
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
        disabled={selectedProducts.length === 0}
        className="w-full mt-4 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
        data-testid="button-add-free-products"
      >
        Add Selected Products ({selectedProducts.length})
      </Button>
    </div>
  );
}
