import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { CartSession } from "@shared/schema";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variant?: string;
}

export function useCart(cartToken: string) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<CartItem[]>([]);

  // Fetch cart session
  const { data: session, isLoading } = useQuery<CartSession>({
    queryKey: ["/api/cart-sessions", cartToken],
    enabled: !!cartToken,
  });

  // Sync local cartTotal with session currentValue to prevent infinite loops
  useEffect(() => {
    if (session && session.currentValue) {
      const sessionValue = parseFloat(session.currentValue);
      const localTotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
      
      // If session has a value but local items are empty (common in production), 
      // avoid triggering mutations that would reset the session value to 0
      if (items.length === 0 && sessionValue > 0) {
        console.log('Preventing cart value reset - session has value but local items empty:', { sessionValue, localTotal });
        // Don't trigger any mutations when local is empty but session has value
        return;
      }
    }
  }, [session?.currentValue, items.length]);

  // Update cart value mutation
  const updateCartValueMutation = useMutation({
    mutationFn: async (currentValue: number) => {
      const response = await apiRequest("PUT", `/api/cart-sessions/${cartToken}/value`, {
        currentValue,
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch cart session
      queryClient.invalidateQueries({ queryKey: ["/api/cart-sessions", cartToken] });
      
      // Trigger celebration if new milestones were unlocked
      if (data.newMilestones) {
        // This could trigger a toast or celebration animation
        console.log("New milestones unlocked!", data.unlockedMilestones);
      }
    },
  });

  // Update selected free products mutation
  const updateFreeProductsMutation = useMutation({
    mutationFn: async (productIds: string[]) => {
      const response = await apiRequest("PUT", `/api/cart-sessions/${cartToken}/free-products`, {
        productIds,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart-sessions", cartToken] });
    },
  });

  // Calculate total cart value
  const cartTotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);

  // Update cart items and sync with backend
  const updateItems = useCallback((newItems: CartItem[]) => {
    setItems(newItems);
    const newTotal = newItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    // Guard against unnecessary mutations - only update if value actually changed
    const currentSessionValue = session?.currentValue ? parseFloat(session.currentValue) : 0;
    if (Math.abs(newTotal - currentSessionValue) > 0.01) {
      updateCartValueMutation.mutate(newTotal);
    }
  }, [session?.currentValue]);

  // Add item to cart
  const addItem = useCallback((item: CartItem) => {
    setItems(prev => {
      const existingIndex = prev.findIndex(i => i.id === item.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + item.quantity,
        };
        return updated;
      }
      return [...prev, item];
    });
  }, []);

  // Remove item from cart
  const removeItem = useCallback((itemId: string) => {
    setItems(prevItems => {
      const newItems = prevItems.filter(item => item.id !== itemId);
      const newTotal = newItems.reduce((total, item) => total + (item.price * item.quantity), 0);
      
      // Guard against unnecessary mutations - only update if value actually changed
      const currentSessionValue = session?.currentValue ? parseFloat(session.currentValue) : 0;
      if (Math.abs(newTotal - currentSessionValue) > 0.01) {
        updateCartValueMutation.mutate(newTotal);
      }
      return newItems;
    });
  }, [session?.currentValue]);

  // Update item quantity
  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    
    setItems(prevItems => {
      const newItems = prevItems.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      );
      const newTotal = newItems.reduce((total, item) => total + (item.price * item.quantity), 0);
      
      // Guard against unnecessary mutations - only update if value actually changed
      const currentSessionValue = session?.currentValue ? parseFloat(session.currentValue) : 0;
      if (Math.abs(newTotal - currentSessionValue) > 0.01) {
        updateCartValueMutation.mutate(newTotal);
      }
      return newItems;
    });
  }, [removeItem, session?.currentValue]);

  // Select free products
  const selectFreeProducts = useCallback((productIds: string[]) => {
    updateFreeProductsMutation.mutate(productIds);
  }, []);

  return {
    items,
    cartTotal,
    session,
    isLoading,
    addItem,
    removeItem,
    updateQuantity,
    selectFreeProducts,
    isUpdating: updateCartValueMutation.isPending || updateFreeProductsMutation.isPending,
  };
}
