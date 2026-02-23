import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './ThemeContext'
import ThemeToggle from './ThemeToggle'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ItemDetail from './pages/ItemDetail'
import PostItem from './pages/PostItem'
import Dashboard from './pages/Dashboard'
import Navbar from './components/Navbar'

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/items/:id" element={<ItemDetail />} />
          <Route path="/post" element={<PostItem />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
        <ThemeToggle />
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App