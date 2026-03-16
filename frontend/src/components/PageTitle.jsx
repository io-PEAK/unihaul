import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const TITLES = {
  '/':              'Home',
  '/home':          'Home',
  '/login':         'Login',
  '/register':      'Register',
  '/post':          'Post Item',
  '/dashboard':     'Dashboard',
  '/messages':      'Messages',
  '/settings':      'Settings',
  '/cart':          'Cart',
  '/transactions':  'Transactions',
  '/sellers':       'Find Sellers',
  '/users':          'Seller Profile',
}

const APP_NAME = 'Student Shop'

function PageTitle() {
  const location = useLocation()

  useEffect(() => {
    // Check exact match first, then try startsWith for dynamic routes like /items/:id
    const pageTitle =
      TITLES[location.pathname] ||
      Object.entries(TITLES).find(([path]) => location.pathname.startsWith(path + '/'))?.[1]

    document.title = pageTitle
      ? `${pageTitle} | ${APP_NAME}`
      : APP_NAME
  }, [location.pathname])

  return null // renders nothing, just a side effect
}

export default PageTitle