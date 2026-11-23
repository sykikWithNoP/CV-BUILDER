import { Container, Typography, Box, Chip, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SpeedIcon from '@mui/icons-material/Speed';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import BoltIcon from '@mui/icons-material/Bolt';
import MemoryIcon from '@mui/icons-material/Memory';
import Layout from '../components/Layout';

export default function BlogPerformance() {
  const navigate = useNavigate();

  return (
    <Layout>
      <Box sx={{ position: 'relative', minHeight: '100vh' }}>
        <div className="animated-bg"><div className="mesh-orb-3" /></div>
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, py: 8 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/about')}
            sx={{ mb: 4, color: 'text.secondary', '&:hover': { color: '#8b9cf7' } }}>
            Back to About
          </Button>

          <Box className="fade-in-up">
            <Chip icon={<SpeedIcon />} label="Performance" sx={{ mb: 2, bgcolor: 'rgba(52,211,153,0.12)', color: '#34d399', fontWeight: 500 }} />
            <Typography variant="h3" sx={{ fontWeight: 700, fontFamily: "'Space Grotesk'", mb: 2 }}>
              Blazing Fast <Box component="span" className="gradient-text">PDF Generation</Box>
            </Typography>
            <Typography sx={{ color: 'text.secondary', mb: 6, fontSize: '1.1rem', lineHeight: 1.8 }}>
              From clicking "Download" to holding your finished CV — here's how we achieve sub-2-second PDF generation.
            </Typography>
          </Box>

          <Box className="blog-content">
            {/* Section 1 */}
            <Box className="glass-card fade-in-up" sx={{ p: 4, mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <RocketLaunchIcon sx={{ color: '#34d399', fontSize: 28 }} />
                <Typography variant="h5" sx={{ fontWeight: 600, fontFamily: "'Space Grotesk'" }}>
                  Server-Side Rendering with Puppeteer
                </Typography>
              </Box>
              <Typography sx={{ color: 'text.secondary', lineHeight: 1.85, mb: 2 }}>
                Unlike browser-based PDF solutions that rely on the client's machine, CV Builder uses Puppeteer — a headless
                Chromium browser running on the server. This ensures pixel-perfect rendering regardless of the user's device or browser.
              </Typography>
              <Typography sx={{ color: 'text.secondary', lineHeight: 1.85 }}>
                The server receives your CV data, merges it with a Mustache template, injects the template's stylesheet,
                and renders the final HTML into a high-quality A4 PDF with precise margins and print-optimized backgrounds.
              </Typography>
            </Box>

            {/* Section 2 */}
            <Box className="glass-card fade-in-up" sx={{ p: 4, mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <BoltIcon sx={{ color: '#fbbf24', fontSize: 28 }} />
                <Typography variant="h5" sx={{ fontWeight: 600, fontFamily: "'Space Grotesk'" }}>
                  Template Engine Optimization
                </Typography>
              </Box>
              <Typography sx={{ color: 'text.secondary', lineHeight: 1.85, mb: 2 }}>
                Each CV template is stored as a pre-compiled Mustache template with an accompanying CSS stylesheet.
                The rendering pipeline:
              </Typography>
              <Box component="ol" sx={{ color: 'text.secondary', lineHeight: 2, pl: 3 }}>
                <li>Fetch template + user data from SQLite (single indexed query)</li>
                <li>Merge data into HTML via <code>Mustache.render()</code> (microseconds)</li>
                <li>Inject CSS inline — no external stylesheet requests</li>
                <li>Set content in Puppeteer with <code>waitUntil: 'networkidle0'</code></li>
                <li>Generate PDF with <code>printBackground: true</code> for full-color output</li>
              </Box>
            </Box>

            {/* Section 3 */}
            <Box className="glass-card fade-in-up" sx={{ p: 4, mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <MemoryIcon sx={{ color: '#8b9cf7', fontSize: 28 }} />
                <Typography variant="h5" sx={{ fontWeight: 600, fontFamily: "'Space Grotesk'" }}>
                  Real-Time Live Preview
                </Typography>
              </Box>
              <Typography sx={{ color: 'text.secondary', lineHeight: 1.85, mb: 2 }}>
                The dashboard features a true live preview that updates as you type. Rather than making API calls on every keystroke,
                the client-side renderer uses the same Mustache template engine to generate HTML locally, providing instant feedback.
              </Typography>
              <Typography sx={{ color: 'text.secondary', lineHeight: 1.85 }}>
                The preview is rendered inside a sandboxed iframe with adjustable zoom levels (40%–100%), giving you an accurate
                representation of how your final PDF will look — in real time.
              </Typography>
            </Box>

            {/* Performance Stats */}
            <Box className="glass-card fade-in-up" sx={{ p: 4, background: 'rgba(52, 211, 153, 0.06)', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Performance Metrics</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 3 }}>
                {[
                  { value: '<2s', label: 'PDF Generation' },
                  { value: '0ms', label: 'Preview Latency' },
                  { value: 'A4', label: 'Print Quality' },
                  { value: '100%', label: 'Font Fidelity' },
                ].map((stat) => (
                  <Box key={stat.label} sx={{ textAlign: 'center' }}>
                    <Typography className="gradient-text" sx={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: "'Space Grotesk'" }}>
                      {stat.value}
                    </Typography>
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{stat.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>
    </Layout>
  );
}
