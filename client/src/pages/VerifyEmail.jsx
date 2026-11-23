import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Alert, Box, Button, Container, InputAdornment, TextField, Typography,
} from '@mui/material';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import EmailIcon from '@mui/icons-material/Email';
import PinIcon from '@mui/icons-material/Pin';
import Layout from '../components/Layout';
import api, { errorMessage } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

/**
 * Confirmation gateway. An account exists after signup but stays unverified —
 * and unverified accounts cannot export a PDF — until the emailed code is
 * entered here (the emailed link still works too).
 */
export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshUser } = useAuth();

  const [email, setEmail] = useState(location.state?.email || user?.email || '');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(location.state?.notice || '');

  const confirm = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      await api.post('/auth/verify-code', { email, code });
      await refreshUser();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Could not confirm that code'));
    } finally { setBusy(false); }
  };

  const resend = async () => {
    setError(''); setNotice(''); setResending(true);
    try {
      await api.post('/auth/resend-verification', { email });
      setNotice('If that address needs confirming, a new code is on its way.');
    } catch (err) {
      setError(errorMessage(err, 'Could not resend the code'));
    } finally { setResending(false); }
  };

  return (
    <Layout>
      <Box sx={{ position: 'relative', minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center' }}>
        <div className="animated-bg"><div className="mesh-orb-3" /></div>
        <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1, py: 6 }}>
          <Box className="glass-card fade-in-up" sx={{ p: { xs: 4, md: 6 }, maxWidth: 480, mx: 'auto' }}>
            <MarkEmailReadIcon sx={{ fontSize: 40, color: '#8b9cf7', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, fontFamily: "'Space Grotesk'" }}>
              Confirm your email
            </Typography>
            <Typography sx={{ color: 'text.secondary', mb: 3 }}>
              We sent a 6-digit code to your inbox. Enter it to activate your account.
            </Typography>

            {notice && !error && <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>{notice}</Alert>}
            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

            <Box component="form" onSubmit={confirm} sx={{ display: 'grid', gap: 2.5 }}>
              <TextField
                fullWidth required type="email" label="Email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: 'text.secondary' }} /></InputAdornment> }}
              />
              <TextField
                fullWidth required label="Confirmation code" value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputProps={{ inputMode: 'numeric', maxLength: 6, style: { letterSpacing: '0.4em' } }}
                InputProps={{ startAdornment: <InputAdornment position="start"><PinIcon sx={{ color: 'text.secondary' }} /></InputAdornment> }}
              />
              <Button type="submit" variant="contained" size="large" disabled={busy || code.length !== 6}
                sx={{ py: 1.5, borderRadius: 3 }}>
                {busy ? 'Confirming…' : 'Confirm email'}
              </Button>
              <Button onClick={resend} disabled={resending || !email} sx={{ color: 'text.secondary' }}>
                {resending ? 'Sending…' : 'Resend code'}
              </Button>
            </Box>

            <Typography sx={{ mt: 3, textAlign: 'center', color: 'text.secondary', fontSize: '0.9rem' }}>
              Wrong account? <Link to="/login" style={{ color: '#8b9cf7', fontWeight: 600 }}>Sign in</Link>
            </Typography>
          </Box>
        </Container>
      </Box>
    </Layout>
  );
}
