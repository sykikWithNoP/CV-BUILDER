import { useEffect, useState } from 'react';
import { Container, Typography, Box, Grid, Card, CardActionArea, CardContent, Button, Chip, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PreviewIcon from '@mui/icons-material/Preview';
import Layout from '../components/Layout';
import HtmlFrame from '../components/HtmlFrame';
import { useAuth } from '../contexts/AuthContext';
import api, { errorMessage } from '../api/client';

export default function Templates() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [previews, setPreviews] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await api.get('/cv/templates');
        if (cancelled) return;
        const list = res.data || [];
        setTemplates(list);

        const loaded = await Promise.all(
          list.map((t) =>
            api.get(`/cv/template-preview/${t.id}`)
              .then((p) => [t.id, p.data.html])
              .catch(() => null)
          )
        );
        if (cancelled) return;
        setPreviews(Object.fromEntries(loaded.filter(Boolean)));
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, 'Could not load templates'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const handleSelectTemplate = () => {
    navigate(user ? '/dashboard' : '/login', user ? undefined : { state: { from: '/dashboard' } });
  };

  return (
    <Layout>
      <Box sx={{ position: 'relative', minHeight: '100vh' }}>
        <div className="animated-bg"><div className="mesh-orb-3" /></div>
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: 8 }}>
          <Typography variant="h3" className="fade-in-up" sx={{ fontWeight: 700, fontFamily: "'Space Grotesk'", mb: 2, textAlign: 'center' }}>
            Designer <Box component="span" className="gradient-text">Templates</Box>
          </Typography>
          <Typography className="fade-in-up" sx={{ color: 'text.secondary', textAlign: 'center', mb: 8, maxWidth: 600, mx: 'auto', lineHeight: 1.8 }}>
            Choose from our collection of professionally designed CV templates. Each template is crafted for a specific style and industry.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>}

          <Grid container spacing={4}>
            {templates.map((t) => (
              <Grid item xs={12} sm={6} md={4} key={t.id}>
                <Card className="fade-in-up" sx={{
                  height: '100%', display: 'flex', flexDirection: 'column',
                  transition: 'all 0.3s',
                  '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 12px 40px rgba(102,126,234,0.2)' },
                }}>
                  <CardActionArea onClick={handleSelectTemplate} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                    {/* Rendered inside an iframe so template CSS cannot leak into this page */}
                    <Box sx={{
                      height: 280, overflow: 'hidden',
                      borderBottom: '1px solid var(--glass-border)',
                      position: 'relative',
                      background: previews[t.id] ? '#fff' : 'transparent',
                    }}>
                      {previews[t.id] && <HtmlFrame html={previews[t.id]} title={`${t.name} preview`} />}
                      <Box sx={{
                        position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
                        background: 'linear-gradient(transparent, var(--bg-card))',
                        pointerEvents: 'none',
                      }} />
                    </Box>
                    <CardContent sx={{ flex: 1, p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: "'Space Grotesk'" }}>{t.name}</Typography>
                        {t.is_premium
                          ? <Chip label={t.required_plan === 'free' ? 'Premium' : t.required_plan} size="small"
                              sx={{ bgcolor: 'rgba(251,191,36,0.12)', color: '#fbbf24', fontWeight: 500, textTransform: 'capitalize' }} />
                          : <Chip label="Free" size="small"
                              sx={{ bgcolor: 'rgba(52,211,153,0.12)', color: '#34d399', fontWeight: 500 }} />}
                      </Box>
                      <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', lineHeight: 1.6 }}>
                        {t.description}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                  <Box sx={{ p: 2, pt: 0 }}>
                    <Button fullWidth variant="contained" size="small" endIcon={<ArrowForwardIcon />}
                      onClick={handleSelectTemplate}
                      sx={{ borderRadius: 2 }}>
                      {user ? 'Use Template' : 'Login to Use'}
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>

          {!loading && templates.length === 0 && !error && (
            <Box sx={{ textAlign: 'center', py: 12 }}>
              <PreviewIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" sx={{ color: 'text.secondary' }}>No templates available yet</Typography>
            </Box>
          )}

          {loading && (
            <Box sx={{ textAlign: 'center', py: 12 }}>
              <Typography variant="h5" sx={{ color: 'text.secondary' }}>Loading templates…</Typography>
            </Box>
          )}
        </Container>
      </Box>
    </Layout>
  );
}
