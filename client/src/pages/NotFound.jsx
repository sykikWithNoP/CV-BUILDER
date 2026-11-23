import { Box, Container, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import Layout from '../components/Layout';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <Layout>
      <Box sx={{ position: 'relative', minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animated-bg"><div className="mesh-orb-3" /></div>
        <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <Typography className="gradient-text" sx={{ fontSize: '8rem', fontWeight: 800, fontFamily: "'Space Grotesk'", lineHeight: 1 }}>
            404
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>Page Not Found</Typography>
          <Typography sx={{ color: 'text.secondary', mb: 4 }}>
            The page you're looking for doesn't exist or has been moved.
          </Typography>
          <Button variant="contained" startIcon={<HomeIcon />} onClick={() => navigate('/')} sx={{ borderRadius: 3 }}>
            Go Home
          </Button>
        </Container>
      </Box>
    </Layout>
  );
}
