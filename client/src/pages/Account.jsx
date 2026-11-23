import { useEffect, useState } from 'react';
import {
  Container, Box, Paper, Typography, TextField, Button, Avatar,
  Grid, Alert, Divider, Chip, Stack,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import LockIcon from '@mui/icons-material/Lock';
import VerifiedIcon from '@mui/icons-material/Verified';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import api, { errorMessage } from '../api/client';

export default function Account() {
  const { user, refreshUser } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Seed the form from the signed-in user (ProtectedRoute guarantees one).
  useEffect(() => {
    setFirstName(user?.first_name || '');
    setLastName(user?.last_name || '');
  }, [user]);

  const handleUpdateProfile = async () => {
    setErrorMsg(''); setSuccessMsg('');
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      setErrorMsg('First and last name need at least 2 characters');
      return;
    }
    setSavingProfile(true);
    try {
      await api.put('/auth/update-profile', { firstName: firstName.trim(), lastName: lastName.trim() });
      await refreshUser();
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(errorMessage(err, 'Failed to update profile'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setErrorMsg(''); setSuccessMsg('');
    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match');
      return;
    }
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setErrorMsg('Password needs at least 8 characters, one uppercase letter and one number');
      return;
    }
    setSavingPassword(true);
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      setSuccessMsg('Password changed successfully!');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(errorMessage(err, 'Failed to change password'));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <Layout>
      <Box sx={{ position: 'relative', minHeight: '100vh' }}>
        <div className="animated-bg" style={{ opacity: 0.3 }}><div className="mesh-orb-3" /></div>
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, py: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, fontFamily: "'Space Grotesk'", mb: 3 }}>
            <Box component="span" className="gradient-text">Account</Box> Management
          </Typography>

          {successMsg && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}
          {errorMsg && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setErrorMsg('')}>{errorMsg}</Alert>}

          {/* Profile Info Card */}
          <Paper sx={{ p: 4, mb: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar sx={{ width: 64, height: 64, fontSize: '1.5rem', background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>{user?.first_name} {user?.last_name}</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>{user?.email}</Typography>
                  {user?.verified ? (
                    <Chip icon={<VerifiedIcon />} label="Verified" size="small"
                      sx={{ bgcolor: 'rgba(52,211,153,0.12)', color: '#34d399', fontWeight: 500 }} />
                  ) : (
                    <Chip label="Unverified" size="small"
                      sx={{ bgcolor: 'rgba(248,113,113,0.12)', color: '#f87171', fontWeight: 500 }} />
                  )}
                </Stack>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon /> Edit Profile
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Email" value={user?.email || ''} disabled
                  helperText="Email cannot be changed"
                  InputProps={{ startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
                />
              </Grid>
            </Grid>
            <Button variant="contained" startIcon={<SaveIcon />} sx={{ mt: 2 }}
              disabled={savingProfile} onClick={handleUpdateProfile}>
              {savingProfile ? 'Saving…' : 'Save Profile'}
            </Button>
          </Paper>

          {/* Change Password Card */}
          <Paper sx={{ p: 4, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <LockIcon /> Change Password
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth type="password" label="Current Password" value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth type="password" label="New Password" value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  helperText="Min 8 chars, 1 uppercase, 1 number" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth type="password" label="Confirm New Password" value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} />
              </Grid>
            </Grid>
            <Button variant="contained" startIcon={<LockIcon />} sx={{ mt: 2 }}
              disabled={savingPassword || !currentPassword || !newPassword} onClick={handleChangePassword}>
              {savingPassword ? 'Changing…' : 'Change Password'}
            </Button>
          </Paper>
        </Container>
      </Box>
    </Layout>
  );
}
