import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ClientsProvider } from './context/ClientsContext';

import ProtectedRoute from './components/ProtectedRoute';
import PrivateLayout from './layouts/PrivateLayout';

const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const ClientsManager = React.lazy(() => import('./pages/ClientsManager'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));

const ControlPanel = React.lazy(() => import('./pages/ControlPanel'));
const SavedValuations = React.lazy(() => import('./pages/SavedValuations'));
const CalendarPage = React.lazy(() => import('./pages/CalendarPage'));
const FilesPage = React.lazy(() => import('./pages/FilesPage'));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <ClientsProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Navigate to="/app" replace />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Rutas Privadas */}
              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <PrivateLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<ControlPanel />} />
                <Route path="tasaciones" element={<SavedValuations />} />
                <Route path="tasaciones/editar" element={<Dashboard />} />
                <Route path="clients" element={<ClientsManager />} />
                <Route path="archivos" element={<FilesPage />} />
                <Route path="calendar" element={<CalendarPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ClientsProvider>
    </AuthProvider>
  );
}

export default App;
