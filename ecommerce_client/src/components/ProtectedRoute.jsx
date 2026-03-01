import { Navigate } from 'react-router-dom'
import { useAppSelector } from '../hooks/redux'

const ProtectedRoute = ({ children, roles = [] }) => {
  const { isAuthenticated, user, token } = useAppSelector((state) => state.auth)

  console.log('=== PROTECTED ROUTE CHECK ===');
  console.log('isAuthenticated:', isAuthenticated);
  console.log('token exists:', !!token);
  console.log('user:', user);
  console.log('user.role:', user?.role);
  console.log('required roles:', roles);
  console.log('role match:', roles.length === 0 || roles.includes(user?.role));
  console.log('current path:', window.location.pathname);
  console.log('============================');

  // Check authentication - either isAuthenticated flag or token exists
  if (!isAuthenticated && !token) {
    console.log('❌ Not authenticated, redirecting to login')
    return <Navigate to="/login" replace />
  }

  // Check role authorization if roles are specified
  if (roles.length > 0 && !roles.includes(user?.role)) {
    console.log('❌ User role not authorized:', user?.role, 'Required:', roles)
    console.log('Redirecting to home page...')
    return <Navigate to="/" replace />
  }

  console.log('✅ Access granted to:', window.location.pathname)
  return children
}

export default ProtectedRoute
