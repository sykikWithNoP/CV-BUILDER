import { Box, Container, Typography, Button, Grid, Stack, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SecurityIcon from '@mui/icons-material/Security';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import SpeedIcon from '@mui/icons-material/Speed';
import GroupsIcon from '@mui/icons-material/Groups';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';

const features = [
  { icon: <DashboardCustomizeIcon sx={{ fontSize: 36 }} />, title: '5+ Pro Templates', desc: 'Hand-crafted, pixel-perfect templates designed for every industry.' },
  { icon: <PictureAsPdfIcon sx={{ fontSize: 36 }} />, title: 'Instant PDF Export', desc: 'Server-rendered PDF with perfect typography and print-ready quality.' },
  { icon: <SecurityIcon sx={{ fontSize: 36 }} />, title: 'Bank-Grade Security', desc: 'JWT auth, encrypted cookies, rate limiting, and audit logging built-in.' },
  { icon: <SpeedIcon sx={{ fontSize: 36 }} />, title: 'Real-Time Preview', desc: 'See your CV update instantly as you type — no refresh needed.' },
  { icon: <AutoAwesomeIcon sx={{ fontSize: 36 }} />, title: 'Smart Sections', desc: 'Experience, education, skills, languages, certifications — all covered.' },
  { icon: <GroupsIcon sx={{ fontSize: 36 }} />, title: 'Institutional Ready', desc: 'White-label support for colleges and organizations with custom branding.' },
];

const stats = [
  { value: '5+', label: 'Templates' },
  { value: '256-bit', label: 'Encryption' },
  { value: '<2s', label: 'PDF Generation' },
  { value: '99.9%', label: 'Uptime' },
];

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    navigate(user ? '/dashboard' : '/signup');
  };

  const handleLogin = () => {
    navigate(user ? '/dashboard' : '/login');
  };

  return (
    <Layout>
      <Box sx={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
        {/* Animated background */}
        <div className="animated-bg"><div className="mesh-orb-3" /></div>

        {/* Hero Section */}
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, pt: { xs: 4, md: 10 }, pb: 10, textAlign: 'center' }}>
          <Box className="fade-in-up" sx={{ mb: 3, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{
              display: 'inline-flex', alignItems: 'center', gap: 1,
              px: 2.5, py: 0.8, borderRadius: 99,
              background: 'rgba(102, 126, 234, 0.12)', border: '1px solid rgba(102, 126, 234, 0.25)',
              fontSize: '0.85rem', color: '#8b9cf7', fontWeight: 500,
            }}>
              <AutoAwesomeIcon sx={{ fontSize: 16 }} /> Trusted by Institutions
            </Box>
            {user ? (
              <Chip
                label={`Welcome back, ${user.first_name}!`}
                sx={{
                  bgcolor: 'rgba(52, 211, 153, 0.12)', color: '#34d399',
                  border: '1px solid rgba(52,211,153,0.25)', fontWeight: 600,
                  fontSize: '0.85rem', px: 1,
                }}
              />
            ) : (
              <Chip
                label="Not Signed In"
                sx={{
                  bgcolor: 'rgba(248, 113, 113, 0.12)', color: '#f87171',
                  border: '1px solid rgba(248,113,113,0.25)', fontWeight: 600,
                  fontSize: '0.85rem', px: 1,
                }}
              />
            )}
          </Box>

          <Typography variant="h1" className="fade-in-up" sx={{
            fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
            lineHeight: 1.1, mb: 3, fontWeight: 800,
          }}>
            Build a{' '}
            <Box component="span" className="gradient-text">Professional CV</Box>
            <br />in Seconds
          </Typography>

          <Typography className="fade-in-up" sx={{
            fontSize: { xs: '1.05rem', md: '1.25rem' },
            color: 'text.secondary', maxWidth: 640, mx: 'auto', mb: 5, lineHeight: 1.7,
          }}>
            Choose from designer-crafted templates, fill in your details, and download a verified PDF — with enterprise-grade security built in.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" className="fade-in-up">
            {user ? (
              <Button variant="contained" size="large" endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/dashboard')}
                sx={{ px: 5, py: 1.8, fontSize: '1.05rem', borderRadius: 3 }}>
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button variant="contained" size="large" endIcon={<ArrowForwardIcon />}
                  onClick={handleGetStarted}
                  sx={{ px: 5, py: 1.8, fontSize: '1.05rem', borderRadius: 3 }}>
                  Get Started — Free
                </Button>
                <Button variant="outlined" size="large"
                  onClick={handleLogin}
                  sx={{ px: 5, py: 1.8, fontSize: '1.05rem', borderRadius: 3,
                    borderColor: 'rgba(255,255,255,0.15)', color: 'text.primary',
                    '&:hover': { borderColor: '#667eea', background: 'rgba(102,126,234,0.08)' } }}>
                  Login
                </Button>
              </>
            )}
          </Stack>

          {/* Floating 3D CV Mockup */}
          <Box className="floating fade-in-up" sx={{
            mt: 8, mx: 'auto', maxWidth: 520, p: 0.5,
            borderRadius: 4, background: 'linear-gradient(135deg, rgba(102,126,234,0.4), rgba(118,75,162,0.4))',
            boxShadow: '0 25px 80px rgba(102, 126, 234, 0.25)',
          }}>
            <Box sx={{
              background: '#11142f', borderRadius: 3.5, p: 4,
              fontFamily: "'Inter', sans-serif",
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography sx={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>Jane Doe</Typography>
                  <Typography sx={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>Software Engineer</Typography>
                </Box>
                <Box sx={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--gradient-main)' }} />
              </Box>
              {['Experience', 'Education', 'Skills'].map((s) => (
                <Box key={s} sx={{ mb: 2 }}>
                  <Typography sx={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#a5b4fc', mb: 0.5 }}>{s}</Typography>
                  <Box sx={{ height: 8, borderRadius: 1, background: 'rgba(255,255,255,0.06)', mb: 0.5 }} />
                  <Box sx={{ height: 8, width: '70%', borderRadius: 1, background: 'rgba(255,255,255,0.04)' }} />
                </Box>
              ))}
            </Box>
          </Box>
        </Container>

        {/* Stats Section */}
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: 8 }}>
          <Grid container spacing={3} justifyContent="center">
            {stats.map((s, i) => (
              <Grid item xs={6} md={3} key={i}>
                <Box className="glass-card" sx={{ textAlign: 'center', p: 4 }}>
                  <Typography className="gradient-text" sx={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: "'Space Grotesk'" }}>
                    {s.value}
                  </Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', mt: 0.5 }}>{s.label}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>

        {/* Features Section */}
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: 10 }}>
          <Typography variant="h3" sx={{ textAlign: 'center', mb: 2, fontWeight: 700 }}>
            Everything You Need
          </Typography>
          <Typography sx={{ textAlign: 'center', color: 'text.secondary', mb: 8, maxWidth: 500, mx: 'auto' }}>
            A complete platform to create, manage, and export professional CVs with confidence.
          </Typography>
          <Grid container spacing={3}>
            {features.map((f, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Box className="glass-card tilt-card" sx={{ p: 4, height: '100%', cursor: 'default' }}>
                  <Box className="tilt-card-inner">
                    <Box sx={{
                      width: 60, height: 60, borderRadius: 3,
                      background: 'rgba(102, 126, 234, 0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#8b9cf7', mb: 2.5,
                    }}>
                      {f.icon}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>{f.title}</Typography>
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.92rem', lineHeight: 1.7 }}>{f.desc}</Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>

        {/* CTA */}
        <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1, py: 10, textAlign: 'center' }}>
          <Box className="glass-card" sx={{ p: 6, background: 'rgba(102, 126, 234, 0.08)', border: '1px solid rgba(102, 126, 234, 0.2)' }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>Ready to Build?</Typography>
            <Typography sx={{ color: 'text.secondary', mb: 4 }}>
              Create your first professional CV in under 5 minutes.
            </Typography>
            <Button variant="contained" size="large" endIcon={<ArrowForwardIcon />}
              onClick={handleGetStarted}
              sx={{ px: 5, py: 1.6, borderRadius: 3 }}>
              Start Building Now
            </Button>
          </Box>
        </Container>

        {/* Footer */}
        <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', py: 4, borderTop: '1px solid var(--glass-border)' }}>
          <Typography sx={{ color: 'text.muted', fontSize: '0.85rem' }}>
            © 2026 CV Builder. Professional CV creation platform.
          </Typography>
        </Box>
      </Box>
    </Layout>
  );
}
