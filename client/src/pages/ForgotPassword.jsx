import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Alert, Box, Button, Container, IconButton, InputAdornment, Step, StepLabel, Stepper,
  TextField, Typography,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import PinIcon from '@mui/icons-material/Pin';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Layout from '../components/Layout';
import api, { errorMessage } from '../api/client';

const STEPS = ['Your email', 'Verification code', 'New password'];

/**
 * Password reset. The OTP endpoints already existed on the server but nothing in
 * the UI ever called them, so a forgotten password was a dead end.
 */
export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [token, setToken] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const requestCode = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setToken(data.token || '');
      setNotice('If that email exists, we sent a 6-digit code. It expires in 15 minutes.');
      setStep(1);
    } catch (err) {
      setError(errorMessage(err, 'Could not send the code'));
    } finally { setBusy(false); }
  };

  const verifyCode = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { token, otp });
      setResetToken(data.resetToken);
      setNotice('Code verified. Choose a new password.');
      setStep(2);
    } catch (err) {
      setError(errorMessage(err, 'Invalid or expired code'));
    } finally { setBusy(false); }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password needs at least 8 characters, one uppercase letter and one number.');
      return;
    }
    setBusy(true);
    try {
      await api.post('/auth/reset-password', { resetToken, newPassword: password });
      navigate('/login', { replace: true, state: { notice: 'Password reset. Sign in with your new password.' } });
    } catch (err) {
      setError(errorMessage(err, 'Could not reset the password'));
    } finally { setBusy(false); }
  };

  return (
    <Layout>
      <Box sx={{ position: 'relative', minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center' }}>
        <div className="animated-bg"><div className="mesh-orb-3" /></div>
        <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1, py: 6 }}>
          <Box className="glass-card fade-in-up" sx={{ p: { xs: 4, md: 6 }, maxWidth: 480, mx: 'auto' }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, fontFamily: "'Space Grotesk'" }}>
              Reset password
            </Typography>
            <Typography sx={{ color: 'text.secondary', mb: 3 }}>
              We&apos;ll email you a verification code.
            </Typography>

            <Stepper activeStep={step} sx={{ mb: 3 }}>
              {STEPS.map((label) => (
                <Step key={label}><StepLabel>{label}</StepLabel></Step>
              ))}
            </Stepper>

            {notice && !error && <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>{notice}</Alert>}
            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

            {step === 0 && (
              <Box component="form" onSubmit={requestCode} sx={{ display: 'grid', gap: 2.5 }}>
                <TextField
                  fullWidth required type="email" label="Email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: 'text.secondary' }} /></InputAdornment> }}
                />
                <Button type="submit" variant="contained" size="large" disabled={busy}
                  endIcon={!busy && <ArrowForwardIcon />} sx={{ py: 1.5, borderRadius: 3 }}>
                  {busy ? 'Sending…' : 'Send code'}
                </Button>
              </Box>
            )}

            {step === 1 && (
              <Box component="form" onSubmit={verifyCode} sx={{ display: 'grid', gap: 2.5 }}>
                <TextField
                  fullWidth required label="6-digit code" value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputProps={{ inputMode: 'numeric', maxLength: 6, style: { letterSpacing: '0.4em' } }}
                  InputProps={{ startAdornment: <InputAdornment position="start"><PinIcon sx={{ color: 'text.secondary' }} /></InputAdornment> }}
                />
                <Button type="submit" variant="contained" size="large" disabled={busy || otp.length !== 6}
                  endIcon={!busy && <ArrowForwardIcon />} sx={{ py: 1.5, borderRadius: 3 }}>
                  {busy ? 'Checking…' : 'Verify code'}
                </Button>
                <Button size="small" onClick={() => { setStep(0); setOtp(''); setNotice(''); }} sx={{ color: 'text.secondary' }}>
                  Use a different email
                </Button>
              </Box>
            )}

            {step === 2 && (
              <Box component="form" onSubmit={resetPassword} sx={{ display: 'grid', gap: 2.5 }}>
                <TextField
                  fullWidth required label="New password" type={showPw ? 'text' : 'password'}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  helperText="Min 8 characters, 1 uppercase, 1 number"
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: 'text.secondary' }} /></InputAdornment>,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPw(!showPw)} edge="end" size="small" sx={{ color: 'text.secondary' }}>
                          {showPw ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  fullWidth required label="Confirm new password" type={showPw ? 'text' : 'password'}
                  value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: 'text.secondary' }} /></InputAdornment> }}
                />
                <Button type="submit" variant="contained" size="large" disabled={busy}
                  sx={{ py: 1.5, borderRadius: 3 }}>
                  {busy ? 'Saving…' : 'Set new password'}
                </Button>
              </Box>
            )}

            <Typography sx={{ mt: 3, textAlign: 'center', color: 'text.secondary', fontSize: '0.9rem' }}>
              Remembered it?{' '}
              <Link to="/login" style={{ color: '#8b9cf7', fontWeight: 600 }}>Sign in</Link>
            </Typography>
          </Box>
        </Container>
      </Box>
    </Layout>
  );
}
