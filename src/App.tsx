import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { SubscriptionProvider } from '@/contexts/SubscriptionContext'
import { ThemeProvider } from '@/components/theme-provider'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { PremiumRoute } from '@/components/PremiumRoute'
import { Login } from '@/pages/Login'
import { SignUp } from '@/pages/SignUp'
import { Dashboard } from '@/pages/Dashboard'
import { Procedures } from '@/pages/Procedures'
import { Patients } from '@/pages/Patients'
import { PatientDetailPage } from '@/pages/PatientDetailPage'
import { Appointments } from '@/pages/Appointments'
import { SettingsPage } from '@/pages/SettingsPage'
import ExpensesPage from '@/pages/ExpensesPage'
import FinancialSettingsPage from '@/pages/FinancialSettingsPage'
import PriceSimulatorPage from '@/pages/tools/PriceSimulatorPage'
import RemindersPage from '@/pages/RemindersPage'
import { CashFlowPage } from '@/pages/CashFlowPage'
import ClinicProfilePage from '@/pages/profile/ClinicProfilePage'
import BillingPage from '@/pages/profile/BillingPage'
import { HelpPage } from '@/pages/HelpPage'
import SubscriptionPage from '@/pages/SubscriptionPage'
import { Layout } from '@/components/Layout'

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
      />
      <Route 
        path="/signup" 
        element={user ? <Navigate to="/dashboard" replace /> : <SignUp />} 
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/procedures"
        element={
          <ProtectedRoute>
            <PremiumRoute>
              <Layout>
                <Procedures />
              </Layout>
            </PremiumRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients"
        element={
          <ProtectedRoute>
            <PremiumRoute>
              <Layout>
                <Patients />
              </Layout>
            </PremiumRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients/:id"
        element={
          <ProtectedRoute>
            <PremiumRoute>
              <Layout>
                <PatientDetailPage />
              </Layout>
            </PremiumRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/appointments"
        element={
          <ProtectedRoute>
            <PremiumRoute>
              <Layout>
                <Appointments />
              </Layout>
            </PremiumRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <SettingsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/financial"
        element={
          <ProtectedRoute>
            <PremiumRoute>
              <Layout>
                <FinancialSettingsPage />
              </Layout>
            </PremiumRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/clinic"
        element={
          <ProtectedRoute>
            <PremiumRoute>
              <Layout>
                <ClinicProfilePage />
              </Layout>
            </PremiumRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/billing"
        element={
          <ProtectedRoute>
            <PremiumRoute>
              <Layout>
                <BillingPage />
              </Layout>
            </PremiumRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/expenses"
        element={
          <ProtectedRoute>
            <PremiumRoute>
              <Layout>
                <ExpensesPage />
              </Layout>
            </PremiumRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tools/price-simulator"
        element={
          <ProtectedRoute>
            <PremiumRoute>
              <Layout>
                <PriceSimulatorPage />
              </Layout>
            </PremiumRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reminders"
        element={
          <ProtectedRoute>
            <PremiumRoute>
              <Layout>
                <RemindersPage />
              </Layout>
            </PremiumRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cash-flow"
        element={
          <ProtectedRoute>
            <PremiumRoute>
              <Layout>
                <CashFlowPage />
              </Layout>
            </PremiumRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/help"
        element={
          <ProtectedRoute>
            <Layout>
              <HelpPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/subscribe"
        element={
          <ProtectedRoute>
            <Layout>
              <SubscriptionPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route 
        path="/" 
        element={<Navigate to={user ? "/dashboard" : "/login"} replace />} 
      />
    </Routes>
  )
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <AuthProvider>
        <SubscriptionProvider>
          <Router>
            <AppRoutes />
          </Router>
        </SubscriptionProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
