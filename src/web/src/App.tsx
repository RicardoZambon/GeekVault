import { Routes, Route } from 'react-router-dom'
import AppLayout from './components/app-layout'
import Dashboard from './pages/Dashboard'
import Collections from './pages/Collections'
import Wishlist from './pages/Wishlist'
import Profile from './pages/Profile'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/collections" element={<Collections />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
    </Routes>
  )
}

export default App
