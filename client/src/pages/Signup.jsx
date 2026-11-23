import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, TextField, Button, Typography, Box, Alert, InputAdornment, IconButton, LinearProgress } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { errorMessage } from '../api/client';
import Layout from '../components/Layout';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

function getPasswordStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0-5
}
const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
const strengthColors = ['', '#f87171', '#fbbf24', '#fbbf24', '#34d399', '#22d3ee'];

export default function Signup() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const strength = getPasswordStrength(password);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard');
    }
  }, [authLoading, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (strength < 3) { setError('Password is too weak. Add uppercase, numbers, and symbols.'); return; }
    setLoading(true);
    try {
      const result = await signup({ firstName, lastName, email, password });
      if (result?.requiresVerification === false) {
        navigate('/login', { replace: true, state: { notice: 'Account created. Sign in to continue.' } });
        return;
      }
      // Straight into the confirmation gateway with the address prefilled.
      navigate('/verify-email', {
        replace: true,
        state: { email, notice: 'Account created. Enter the code we emailed you.' },
      });
    } catch (err) {
      setError(errorMessage(err, 'Signup failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Box sx={{ position: 'relative', minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center' }}>
        <div className="animated-bg"><div className="mesh-orb-3" /></div>
        <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1, py: 6 }}>
          <Box className="glass-card fade-in-up" sx={{ p: { xs: 4, md: 6 }, maxWidth: 480, mx: 'auto' }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, fontFamily: "'Space Grotesk'" }}>Create Account</Typography>
            <Typography sx={{ color: 'text.secondary', mb: 4 }}>Start building your professional CV today</Typography>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2.5 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField fullWidth label="First Name" value={firstName}
                  onChange={(e) => setFirstName(e.target.value)} required
                  InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon sx={{ color: 'text.secondary' }} /></InputAdornment> }}
                />
                <TextField fullWidth label="Last Name" value={lastName}
                  onChange={(e) => setLastName(e.target.value)} required
                  InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon sx={{ color: 'text.secondary' }} /></InputAdornment> }}
                />
              </Box>
              <TextField fullWidth label="Email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)} required
                InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: 'text.secondary' }} /></InputAdornment> }}
              />
              <Box>
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
                {password && (
                  <Box sx={{ mt: 1.5 }}>
                    <LinearProgress variant="determinate" value={strength * 20}
                      sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.06)',
                        '& .MuiLinearProgress-bar': { bgcolor: strengthColors[strength], borderRadius: 3 } }}
                    />
                    <Typography sx={{ fontSize: '0.75rem', mt: 0.5, color: strengthColors[strength] }}>
                      {strengthLabels[strength]}
                    </Typography>
                  </Box>
                )}
              </Box>
              <Button type="submit" variant="contained" size="large" disabled={loading}
                endIcon={!loading && <ArrowForwardIcon />}
                sx={{ py: 1.5, mt: 1, borderRadius: 3 }}>
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </Box>

            <Typography sx={{ mt: 3, textAlign: 'center', color: 'text.secondary', fontSize: '0.9rem' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#8b9cf7', fontWeight: 600 }}>Sign in</Link>
            </Typography>
          </Box>
        </Container>
      </Box>
    </Layout>
  );
}
