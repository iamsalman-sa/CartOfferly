import { useQuery } from "@tanstack/react-query";
import type { Milestone } from "@shared/schema";

export function useMilestones(storeId: string) {
  const { data: milestones, isLoading } = useQuery<Milestone[]>({
    queryKey: ["/api/stores", storeId, "milestones"],
    enabled: !!storeId,
  });

  const getMilestoneStatus = (cartValue: number) => {
    if (!milestones) return { unlocked: [], next: null };

    const unlocked = milestones.filter(m => cartValue >= parseFloat(m.thresholdAmount));
    const next = milestones.find(m => cartValue < parseFloat(m.thresholdAmount));

    return { unlocked, next };
  };

  const getFreeProductCount = (cartValue: number) => {
    if (!milestones) return 0;

    const unlockedProductMilestones = milestones
      .filter(m => m.rewardType === 'free_products' && cartValue >= parseFloat(m.thresholdAmount))
      .sort((a, b) => parseFloat(b.thresholdAmount) - parseFloat(a.thresholdAmount));

    return unlockedProductMilestones[0]?.freeProductCount || 0;
  };

  const hasDeliveryReward = (cartValue: number) => {
    if (!milestones) return false;
    
    return milestones.some(m => 
      m.rewardType === 'free_delivery' && cartValue >= parseFloat(m.thresholdAmount)
    );
  };

  return {
    milestones,
    isLoading,
    getMilestoneStatus,
    getFreeProductCount,
    hasDeliveryReward,
  };
}
