import React from 'react'
import { Navigate } from 'react-router-dom'
import { useSubscription } from '@/contexts/SubscriptionContext'

interface PremiumRouteProps {
  children: React.ReactNode
}

export const PremiumRoute: React.FC<PremiumRouteProps> = ({ children }) => {
  const { isActive } = useSubscription()

  if (!isActive) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}