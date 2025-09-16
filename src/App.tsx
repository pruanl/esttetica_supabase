import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
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
            <Layout>
              <Procedures />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients"
        element={
          <ProtectedRoute>
            <Layout>
              <Patients />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <PatientDetailPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/appointments"
        element={
          <ProtectedRoute>
            <Layout>
              <Appointments />
            </Layout>
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
            <Layout>
              <FinancialSettingsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/clinic"
        element={
          <ProtectedRoute>
            <Layout>
              <ClinicProfilePage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/expenses"
        element={
          <ProtectedRoute>
            <Layout>
              <ExpensesPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tools/price-simulator"
        element={
          <ProtectedRoute>
            <Layout>
              <PriceSimulatorPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reminders"
        element={
          <ProtectedRoute>
            <Layout>
              <RemindersPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cash-flow"
        element={
          <ProtectedRoute>
            <Layout>
              <CashFlowPage />
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
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  )
}

export default App
