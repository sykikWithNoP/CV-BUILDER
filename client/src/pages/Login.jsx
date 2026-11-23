import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Container, TextField, Button, Typography, Box, Alert, InputAdornment, IconButton } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { errorMessage } from '../api/client';
import Layout from '../components/Layout';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Where to land after signing in: the page that sent us here, or the dashboard.
  const destination = location.state?.from || '/dashboard';

  // Redirect to dashboard if already logged in (Item 18)
  useEffect(() => {
    if (!authLoading && user) {
      navigate(destination, { replace: true });
    }
  }, [authLoading, user, navigate, destination]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(destination, { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Box sx={{ position: 'relative', minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center' }}>
        <div className="animated-bg"><div className="mesh-orb-3" /></div>
        <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1, py: 6 }}>
          <Box className="glass-card fade-in-up" sx={{ p: { xs: 4, md: 6 }, maxWidth: 460, mx: 'auto' }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, fontFamily: "'Space Grotesk'" }}>Welcome back</Typography>
            <Typography sx={{ color: 'text.secondary', mb: 4 }}>Sign in to continue building your CV</Typography>

            {location.state?.notice && !error && (
              <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{location.state.notice}</Alert>
            )}
            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2.5 }}>
              <TextField fullWidth label="Email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)} required
                InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: 'text.secondary' }} /></InputAdornment> }}
              />
              <TextField fullWidth label="Password" type={showPw ? 'text' : 'password'}
                value={password} onChange={(e) => setPassword(e.target.value)} required
                InputProps={{
                  startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: 'text.secondary' }} /></InputAdornment>,
                  endAdornment: <InputAdornment position="end">
                    <IconButton onClick={() => setShowPw(!showPw)} edge="end" size="small" sx={{ color: 'text.secondary' }}>
                      {showPw ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>,
                }}
              />
              <Box sx={{ textAlign: 'right', mt: -1 }}>
                <Link to="/forgot-password" style={{ color: '#8b9cf7', fontSize: '0.85rem' }}>
                  Forgot password?
                </Link>
              </Box>
              <Button type="submit" variant="contained" size="large" disabled={loading}
                endIcon={!loading && <ArrowForwardIcon />}
                sx={{ py: 1.5, mt: 1, borderRadius: 3 }}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </Box>

            <Typography sx={{ mt: 3, textAlign: 'center', color: 'text.secondary', fontSize: '0.9rem' }}>
              Don&apos;t have an account?{' '}
              <Link to="/signup" style={{ color: '#8b9cf7', fontWeight: 600 }}>Sign up</Link>
            </Typography>
          </Box>
        </Container>
      </Box>
    </Layout>
  );
}
