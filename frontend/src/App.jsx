import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'
import Layout from './components/Layout/Layout'
import LoginModal from './pages/Login/Login'
import Products from './pages/Products/Products'
import Suppliers from './pages/Suppliers/Suppliers'
import Returns from './pages/Returns/Returns'
import Sales from './pages/Sales/Sales'
import LoadingSpinner from './components/common/LoadingSpinner'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-900">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout key={user ? 'auth' : 'guest'} />
            </ProtectedRoute>
          }
        >
          <Route index element={<Products />} />
          <Route path="products" element={<Products />} />
          <Route path="sales" element={<Sales />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="returns" element={<Returns />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!user && <LoginModal />}
    </>
  )
}

export default App
