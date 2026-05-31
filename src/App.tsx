import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider }      from '@/contexts/AuthContext';
import { ProtectedRoute }    from '@/components/ProtectedRoute';
import Layout                from './components/Layout';
import Login                 from './pages/Login';
import Customers             from './pages/customers/Customers';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public route — no auth required */}
          <Route path="/login" element={<Login />} />

          {/* Protected shell — redirects to /login if unauthenticated */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<div className="p-2 text-gray-500">Dashboard Page</div>} />
            <Route path="products" element={<div className="p-2 text-gray-500">Products Page</div>} />

            {/* customer:view required — unauthorized → / with banner */}
            <Route
              path="customers"
              element={
                <ProtectedRoute requiredPermission="customer:view">
                  <Customers />
                </ProtectedRoute>
              }
            />

            <Route path="income"  element={<div className="p-2 text-gray-500">Income Page</div>} />
            <Route path="promote" element={<div className="p-2 text-gray-500">Promote Page</div>} />
            <Route path="help"    element={<div className="p-2 text-gray-500">Help Page</div>} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
