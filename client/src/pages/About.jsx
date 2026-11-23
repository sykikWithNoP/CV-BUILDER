import { Container, Typography, Box, Grid, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import BrushIcon from '@mui/icons-material/Brush';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Layout from '../components/Layout';

export default function About() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <BrushIcon sx={{ fontSize: 32 }} />,
      title: 'Designer Templates',
      desc: 'Multiple professionally designed templates — from minimalist to bold creative styles.',
      action: () => navigate('/templates'),
      actionLabel: 'Browse Templates',
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 32 }} />,
      title: 'Enterprise Security',
      desc: 'JWT authentication, HttpOnly cookies, rate limiting, brute-force protection, and full audit logging.',
      action: () => navigate('/blog/security'),
      actionLabel: 'Learn More',
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 32 }} />,
      title: 'Blazing Fast',
      desc: 'Server-rendered PDF generation with optimized Puppeteer pipeline. Your CV is ready in seconds.',
      action: () => navigate('/blog/performance'),
      actionLabel: 'Learn More',
    },
  ];

  return (
    <Layout>
      <Box sx={{ position: 'relative', minHeight: '100vh' }}>
        <div className="animated-bg"><div className="mesh-orb-3" /></div>
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, py: 8 }}>
          <Typography variant="h3" className="fade-in-up" sx={{ fontWeight: 700, fontFamily: "'Space Grotesk'", mb: 2, textAlign: 'center' }}>
            About <Box component="span" className="gradient-text">CV Builder</Box>
          </Typography>
          <Typography className="fade-in-up" sx={{ color: 'text.secondary', textAlign: 'center', mb: 8, maxWidth: 600, mx: 'auto', lineHeight: 1.8 }}>
            A professional-grade CV creation platform built with security-first architecture
            and designer-crafted templates. Designed for individuals and institutions alike.
          </Typography>
          <Grid container spacing={3}>
            {features.map((f, i) => (
              <Grid item xs={12} md={4} key={i}>
                <Box className="glass-card fade-in-up" sx={{
                  p: 4, textAlign: 'center', height: '100%',
                  display: 'flex', flexDirection: 'column', cursor: 'pointer',
                  '&:hover': { borderColor: 'rgba(102, 126, 234, 0.3)' },
                }}
                  onClick={f.action}
                >
                  <Box sx={{ color: '#8b9cf7', mb: 2 }}>{f.icon}</Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>{f.title}</Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', lineHeight: 1.7, flex: 1 }}>{f.desc}</Typography>
                  <Button size="small" endIcon={<ArrowForwardIcon />}
                    sx={{ mt: 2, color: '#8b9cf7', fontWeight: 500, '&:hover': { background: 'rgba(102,126,234,0.08)' } }}>
                    {f.actionLabel}
                  </Button>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Mission Section */}
          <Box className="glass-card fade-in-up" sx={{ mt: 8, p: 5 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: "'Space Grotesk'", mb: 2 }}>
              Our Mission
            </Typography>
            <Typography sx={{ color: 'text.secondary', lineHeight: 1.9, mb: 2 }}>
              We believe everyone deserves a professional CV that stands out. CV Builder was created to democratize
              access to premium CV design — giving students, professionals, and organizations the tools they need
              to present their best selves.
            </Typography>
            <Typography sx={{ color: 'text.secondary', lineHeight: 1.9 }}>
              With security at its core and design in its DNA, our platform ensures your data is protected while
              delivering beautiful, print-ready CVs in seconds.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Layout>
  );
}
