import React from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppProvider, useApp } from './state/AppState'
import Layout from './components/Layout'
import Home from './pages/Home'
import LoginPage from './pages/LoginPage'
import GeneralPage from './pages/GeneralPage'
import ConsentPage from './pages/ConsentPage'
import ProductionPage from './pages/ProductionPage'
import WaterPage from './pages/WaterPage'
import EffluentPage from './pages/EffluentPage'
import EtpPage from './pages/EtpPage'
import SewagePage from './pages/SewagePage'
import HazardousWastePage from './pages/HazardousWastePage'
import FuelPage from './pages/FuelPage'
import AirPage from './pages/AirPage'
import OcemsPage from './pages/OcemsPage'
import PhotographsPage from './pages/PhotographsPage'
import DocumentsPage from './pages/DocumentsPage'
import ReviewExportPage from './pages/ReviewExportPage'

function Protected({ children }) {
  const { authenticated } = useApp()
  const location = useLocation()
  if (!authenticated) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return <Layout>{children}</Layout>
}

function LoginRoute() {
  const { authenticated } = useApp()
  const location = useLocation()
  const from = location.state?.from || '/'
  if (authenticated) return <Navigate to={from} replace />
  return <LoginPage />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/" element={<Protected><Home /></Protected>} />
      <Route path="/a-general" element={<Protected><GeneralPage /></Protected>} />
      <Route path="/b-consent" element={<Protected><ConsentPage /></Protected>} />
      <Route path="/c-production" element={<Protected><ProductionPage /></Protected>} />
      <Route path="/d-water" element={<Protected><WaterPage /></Protected>} />
      <Route path="/e-effluent" element={<Protected><EffluentPage /></Protected>} />
      <Route path="/etp" element={<Protected><EtpPage /></Protected>} />
      <Route path="/f-sewage" element={<Protected><SewagePage /></Protected>} />
      <Route path="/g-hazardous" element={<Protected><HazardousWastePage /></Protected>} />
      <Route path="/h-fuel" element={<Protected><FuelPage /></Protected>} />
      <Route path="/i-air" element={<Protected><AirPage /></Protected>} />
      <Route path="/j-ocems" element={<Protected><OcemsPage /></Protected>} />
      <Route path="/photographs" element={<Protected><PhotographsPage /></Protected>} />
      <Route path="/documents" element={<Protected><DocumentsPage /></Protected>} />
      <Route path="/review" element={<Protected><ReviewExportPage /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AppProvider>
  )
}
