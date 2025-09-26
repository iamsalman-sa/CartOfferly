import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface Store {
  id: string;
  shopifyStoreId: string;
  storeName: string;
  accessToken: string;
  isActive: boolean;
  createdAt: string;
}

interface UseStoreBootstrapResult {
  storeId: string | null;
  isLoading: boolean;
  error: string | null;
  store: Store | null;
}

export function useStoreBootstrap(): UseStoreBootstrapResult {
  const [storeId, setStoreId] = useState<string | null>(() => {
    // Check if we have a cached store ID
    return localStorage.getItem('resolved_store_id');
  });
  
  // Get Shopify store configuration from environment
  const shopifyStoreId = useMemo(() => import.meta.env.VITE_SHOPIFY_STORE_ID || 'development-store', []);
  const shopifyStoreName = useMemo(() => import.meta.env.VITE_SHOPIFY_STORE_NAME || 'Development Store', []);
  // Use VITE_ prefixed environment variable for development - in production use secure secrets
  const shopifyAccessToken = useMemo(() => import.meta.env.VITE_SHOPIFY_ADMIN_API_KEY || 
    (import.meta.env.NODE_ENV === 'development' ? 'dev-access-token' : null), []);

  // Check if we have required configuration for store creation
  const canCreateStore = useMemo(() => !!(shopifyStoreId && shopifyStoreName && shopifyAccessToken), [shopifyStoreId, shopifyStoreName, shopifyAccessToken]);
  
  // Check if we're in production mode (safer fallback)
  const isProduction = useMemo(() => import.meta.env.NODE_ENV === 'production', []);

  // Query to fetch store by Shopify ID
  const { data: store, isLoading: isFetching, error: fetchError } = useQuery({
    queryKey: ['/api/stores', shopifyStoreId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/stores/${shopifyStoreId}`);
        if (response.status === 404) {
          return null; // Store doesn't exist, we'll create it
        }
        if (!response.ok) {
          throw new Error(`Failed to fetch store: ${response.statusText}`);
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching store:', error);
        return null;
      }
    },
    enabled: !!shopifyStoreId, // Always try to fetch the store
  });

  // Mutation to create store if it doesn't exist
  const createStoreMutation = useMutation({
    mutationFn: async (): Promise<Store> => {
      const storeData = {
        shopifyStoreId,
        storeName: shopifyStoreName,
        accessToken: shopifyAccessToken,
      };
      
      const response = await apiRequest('POST', '/api/stores', storeData);
      return response;
    },
    onSuccess: (newStore: Store) => {
      setStoreId(newStore.id);
      localStorage.setItem('resolved_store_id', newStore.id);
      queryClient.setQueryData(['/api/stores', shopifyStoreId], newStore);
    },
    onError: (error) => {
      console.error('Error creating store:', error);
    },
  });

  // Effect to handle store resolution
  useEffect(() => {
    if (store) {
      // Store exists, cache the ID
      setStoreId(store.id);
      localStorage.setItem('resolved_store_id', store.id);
    } else if (!isFetching && !store && !createStoreMutation.isPending && !createStoreMutation.isSuccess && !storeId) {
      // In production, don't try to create store if canCreateStore is false
      // This prevents infinite loops when environment variables are missing
      if (canCreateStore) {
        createStoreMutation.mutate();
      } else if (isProduction) {
        // In production, if we can't create store but need one, clear any stale cache
        // and let the hook return appropriate error
        localStorage.removeItem('resolved_store_id');
      }
    }
  }, [store, isFetching, createStoreMutation.isPending, createStoreMutation.isSuccess, storeId, canCreateStore, isProduction]);

  const isLoading = isFetching || createStoreMutation.isPending;
  
  // Provide clear error messages for configuration issues
  const configError = !canCreateStore && !store && isProduction ? 
    'Store configuration not available in production mode. Store should exist in database.' : 
    (!canCreateStore && !store ? 'Missing Shopify configuration. Please set VITE_SHOPIFY_ADMIN_API_KEY environment variable.' : null);
  
  const error = configError || 
                (fetchError ? String(fetchError) : null) ||
                (createStoreMutation.error ? String(createStoreMutation.error) : null);

  return {
    storeId,
    isLoading,
    error,
    store: store || createStoreMutation.data || null,
  };
}