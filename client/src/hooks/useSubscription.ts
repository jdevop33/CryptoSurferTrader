import { useQuery } from "@tanstack/react-query";

interface SubscriptionFeatures {
  basicTrading: boolean;
  performanceStory: boolean;
  strategySimulator: boolean;
  portfolioRiskDashboard: boolean;
  advancedAnalytics: boolean;
  realTimeAlerts: boolean;
}

interface SubscriptionStatus {
  status: 'free' | 'pro';
  expiresAt: string | null;
  features: SubscriptionFeatures;
}

export function useSubscription(userId: string = "demo-user") {
  const { data: subscription, isLoading } = useQuery<SubscriptionStatus>({
    queryKey: ["/api/subscriptions/status", userId],
    retry: false,
  });

  const isPro = subscription?.status === 'pro';
  const isFree = subscription?.status === 'free' || !subscription;

  return {
    subscription,
    isLoading,
    isPro,
    isFree,
    features: subscription?.features || {
      basicTrading: true,
      performanceStory: true,
      strategySimulator: false,
      portfolioRiskDashboard: false,
      advancedAnalytics: false,
      realTimeAlerts: false,
    },
  };
}