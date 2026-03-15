import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './components/auth-provider'
import AppLayout from './components/layout/app-layout'
import Dashboard from './features/dashboard/dashboard-page'
import Collections from './features/collections/collections-page'
import CollectionTypes from './features/collection-types/collection-types-page'
import Wishlist from './features/wishlist/wishlist-page'
import Profile from './features/profile/profile-page'
import Login from './features/auth/login-page'
import Register from './features/auth/register-page'
import CollectionDetail from './features/collections/collection-detail-page'
import CatalogItemDetail from './features/collections/catalog-item-detail-page'

function RequireAuth() {
  const { token, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

function GuestOnly() {
  const { token, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (token) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

function App() {
  return (
    <Routes>
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/collections/:id" element={<CollectionDetail />} />
          <Route path="/collections/:id/items/:itemId" element={<CatalogItemDetail />} />
          <Route path="/collection-types" element={<CollectionTypes />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
