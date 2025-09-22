import React from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';

export const DebugSubscription: React.FC = () => {
  const { user } = useAuth();
  const { subscription, loading, isActive, isPremium } = useSubscription();

  return (
    <div className="fixed top-4 right-4 bg-black text-white p-4 rounded-lg text-xs z-50 max-w-sm">
      <h3 className="font-bold mb-2">Debug Subscription</h3>
      <div>User ID: {user?.id || 'No user'}</div>
      <div>Loading: {loading ? 'Yes' : 'No'}</div>
      <div>Subscription: {subscription ? 'Found' : 'Not found'}</div>
      {subscription && (
        <>
          <div>Status: {subscription.status}</div>
          <div>Stripe ID: {subscription.stripe_subscription_id}</div>
          <div>Plan: {subscription.plan_type}</div>
        </>
      )}
      <div>Is Active: {isActive ? 'Yes' : 'No'}</div>
      <div>Is Premium: {isPremium ? 'Yes' : 'No'}</div>
    </div>
  );
};