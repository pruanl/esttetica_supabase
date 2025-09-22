import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';

interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'cancellation_requested';
  current_period_start: string;
  current_period_end: string;
  plan_type: 'monthly' | 'yearly';
  created_at: string;
  updated_at: string;
  cancel_at_period_end?: boolean;
  cancellation_requested_at?: string;
  canceled_at?: string;
}

interface SubscriptionContextType {
  subscription: Subscription | null;
  loading: boolean;
  isActive: boolean;
  isPremium: boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

interface SubscriptionProviderProps {
  children: React.ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Get the most recent active subscription (or most recent if none active)
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error loading subscription:', error);
        setSubscription(null);
        return;
      }

      // If we have subscriptions, get the most recent one
      const mostRecentSubscription = data && data.length > 0 ? data[0] : null;
      
      // If there's an active subscription, prefer it over canceled ones
      if (data && data.length > 1) {
        const activeSubscription = data.find(sub => sub.status === 'active' || sub.status === 'cancellation_requested');
        if (activeSubscription) {
          setSubscription(activeSubscription);
          return;
        }
      }

      setSubscription(mostRecentSubscription);
    } catch (error) {
      console.error('Error loading subscription:', error);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshSubscription = async () => {
    await loadSubscription();
  };

  useEffect(() => {
    loadSubscription();
  }, [user]);

  // Set up real-time subscription to subscription changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Subscription changed:', payload);
          loadSubscription();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const isActive = subscription?.status === 'active' || subscription?.status === 'cancellation_requested';
  const isPremium = isActive;

  const value: SubscriptionContextType = {
    subscription,
    loading,
    isActive,
    isPremium,
    refreshSubscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};