import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RewardProgress from "@/components/cart/reward-progress";
import UrgencyTimer from "@/components/cart/urgency-timer";
import FreeProductSelection from "@/components/cart/free-product-selection";
import CelebrationAnimation from "@/components/animations/celebration";
import { X, Plus, Minus } from "lucide-react";

// Mock cart items data
const mockCartItems = [
  {
    id: "1",
    name: "Premium Leather Handbag",
    price: 1500,
    quantity: 2,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=150&h=150&fit=crop",
    variant: "Color: Black | Size: Medium"
  },
  {
    id: "2", 
    name: "Designer Watch",
    price: 1200,
    quantity: 1,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150&h=150&fit=crop",
    variant: "Color: Silver | Band: Steel"
  }
];

export default function CartDrawer() {
  const [cartItems, setCartItems] = useState(mockCartItems);
  const [showCelebration, setShowCelebration] = useState(false);
  const [selectedFreeProducts, setSelectedFreeProducts] = useState<{id: string, value: number}[]>([]);
  
  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const freeDelivery = cartTotal >= 2500 ? 300 : 0;
  const freeProductsValue = selectedFreeProducts.reduce((total, product) => total + product.value, 0);
  const finalTotal = cartTotal - freeDelivery - freeProductsValue;

  const updateQuantity = (id: string, change: number) => {
    setCartItems(items => 
      items.map(item => 
        item.id === id 
          ? { ...item, quantity: Math.max(0, item.quantity + change) }
          : item
      ).filter(item => item.quantity > 0)
    );
  };

  const handleMilestoneUnlocked = () => {
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);
  };

  const handleFreeProductsSelected = (products: {id: string, value: number}[]) => {
    setSelectedFreeProducts(products);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Celebration Animation Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <CelebrationAnimation />
        </div>
      )}

      <div className="max-w-md mx-auto">
        <Card className="shadow-xl border border-border overflow-hidden">
          {/* Cart Header */}
          <div className="bg-primary text-primary-foreground p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold" data-testid="cart-title">Your Cart</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary-foreground hover:bg-primary/80"
                data-testid="button-close-cart"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Cart Items */}
          <CardContent className="p-6 space-y-4">
            {cartItems.map((item) => (
              <div 
                key={item.id} 
                className="flex items-center space-x-4 p-4 bg-muted rounded-lg"
                data-testid={`cart-item-${item.id}`}
              >
                <img 
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-md"
                />
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">{item.variant}</p>
                  <p className="text-sm font-semibold text-foreground">PKR {item.price.toLocaleString()}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-8 h-8 p-0"
                    onClick={() => updateQuantity(item.id, -1)}
                    data-testid={`button-decrease-${item.id}`}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-8 text-center font-medium" data-testid={`quantity-${item.id}`}>
                    {item.quantity}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-8 h-8 p-0"
                    onClick={() => updateQuantity(item.id, 1)}
                    data-testid={`button-increase-${item.id}`}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>

          {/* Rewards Progress Section */}
          <div className="px-6 pb-6">
            <RewardProgress 
              cartValue={cartTotal} 
              onMilestoneUnlocked={handleMilestoneUnlocked}
            />
          </div>

          {/* Urgency Timer */}
          <div className="px-6 pb-6">
            <UrgencyTimer />
          </div>

          {/* Free Product Selection */}
          {cartTotal >= 3000 && (
            <div className="px-6 pb-6">
              <FreeProductSelection 
                cartValue={cartTotal} 
                onProductsSelected={handleFreeProductsSelected}
              />
            </div>
          )}

          {/* Cart Summary */}
          <div className="p-6 bg-muted border-t border-border">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-foreground">Subtotal</span>
                <span className="font-medium" data-testid="cart-subtotal">
                  PKR {cartTotal.toLocaleString()}
                </span>
              </div>
              {freeDelivery > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Free Delivery</span>
                  <span className="font-medium" data-testid="free-delivery-discount">
                    -PKR {freeDelivery}
                  </span>
                </div>
              )}
              {freeProductsValue > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Free Products ({cartTotal >= 5000 ? 3 : cartTotal >= 4000 ? 2 : 1})</span>
                  <span className="font-medium" data-testid="free-products-discount">
                    -PKR {freeProductsValue}
                  </span>
                </div>
              )}
              <hr className="border-border" />
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span data-testid="cart-total">PKR {finalTotal.toLocaleString()}</span>
              </div>
            </div>
            <Button 
              className="w-full mt-4 luxury-gradient text-primary-foreground font-semibold py-4 px-6 rounded-lg hover:opacity-90 transition-opacity"
              data-testid="button-checkout"
            >
              Proceed to Checkout
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
