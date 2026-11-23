import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import Layout from './Layout';
import { useAuth } from '../contexts/AuthContext';

/**
 * Route guard for signed-in-only pages.
 *
 * Pages used to redirect from inside render (or from an effect after the page
 * had already tried to render with no user), which caused React warnings and, in
 * CustomDesign, an early return that changed the hook order. One guard here
 * keeps that logic out of the pages entirely.
 */
export default function ProtectedRoute({ children, redirectTo = '/login' }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress sx={{ color: '#667eea' }} />
        </Box>
      </Layout>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} replace state={{ from: location.pathname }} />;
  }

  return children;
}
