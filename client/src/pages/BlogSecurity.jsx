import { Container, Typography, Box, Chip, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SecurityIcon from '@mui/icons-material/Security';
import LockIcon from '@mui/icons-material/Lock';
import ShieldIcon from '@mui/icons-material/Shield';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import Layout from '../components/Layout';

export default function BlogSecurity() {
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
            <Chip icon={<SecurityIcon />} label="Security" sx={{ mb: 2, bgcolor: 'rgba(102,126,234,0.12)', color: '#8b9cf7', fontWeight: 500 }} />
            <Typography variant="h3" sx={{ fontWeight: 700, fontFamily: "'Space Grotesk'", mb: 2 }}>
              Enterprise-Grade <Box component="span" className="gradient-text">Security</Box>
            </Typography>
            <Typography sx={{ color: 'text.secondary', mb: 6, fontSize: '1.1rem', lineHeight: 1.8 }}>
              CV Builder is built with security at every layer — from authentication to data storage. Here's how we keep your data safe.
            </Typography>
          </Box>

          <Box className="blog-content">
            {/* Section 1 */}
            <Box className="glass-card fade-in-up" sx={{ p: 4, mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <LockIcon sx={{ color: '#8b9cf7', fontSize: 28 }} />
                <Typography variant="h5" sx={{ fontWeight: 600, fontFamily: "'Space Grotesk'" }}>
                  JWT Authentication
                </Typography>
              </Box>
              <Typography sx={{ color: 'text.secondary', lineHeight: 1.85, mb: 2 }}>
                We use JSON Web Tokens (JWT) with short-lived access tokens (15 minutes) and longer-lived refresh tokens (7 days).
                Access tokens are stored in <code>HttpOnly</code> cookies, making them inaccessible to JavaScript and immune to XSS token theft.
              </Typography>
              <Typography sx={{ color: 'text.secondary', lineHeight: 1.85 }}>
                The refresh token rotation ensures that even if a token is compromised, the window of exploitation is minimal.
                All tokens are signed with industry-standard HMAC-SHA256 algorithms.
              </Typography>
            </Box>

            {/* Section 2 */}
            <Box className="glass-card fade-in-up" sx={{ p: 4, mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <ShieldIcon sx={{ color: '#34d399', fontSize: 28 }} />
                <Typography variant="h5" sx={{ fontWeight: 600, fontFamily: "'Space Grotesk'" }}>
                  Brute-Force Protection
                </Typography>
              </Box>
              <Typography sx={{ color: 'text.secondary', lineHeight: 1.85, mb: 2 }}>
                After 5 failed login attempts, the account is automatically locked for 30 minutes. This prevents
                automated password-guessing attacks while maintaining usability for legitimate users.
              </Typography>
              <Typography sx={{ color: 'text.secondary', lineHeight: 1.85 }}>
                Additionally, per-route rate limiting restricts login and signup endpoints to 5 requests per 10-minute window,
                and a global rate limit of 1000 requests per 15 minutes protects against DDoS attacks.
              </Typography>
            </Box>

            {/* Section 3 */}
            <Box className="glass-card fade-in-up" sx={{ p: 4, mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <VerifiedUserIcon sx={{ color: '#fbbf24', fontSize: 28 }} />
                <Typography variant="h5" sx={{ fontWeight: 600, fontFamily: "'Space Grotesk'" }}>
                  Input Validation & Sanitization
                </Typography>
              </Box>
              <Typography sx={{ color: 'text.secondary', lineHeight: 1.85, mb: 2 }}>
                Every API endpoint validates and sanitizes input using <code>express-validator</code> and <code>sanitize-html</code>.
                User-provided content is stripped of potentially malicious HTML tags and attributes before being stored.
              </Typography>
              <Typography sx={{ color: 'text.secondary', lineHeight: 1.85 }}>
                All database queries use parameterized statements, completely eliminating SQL injection vulnerabilities.
                The Helmet middleware sets strict Content Security Policy headers, preventing inline script execution.
              </Typography>
            </Box>

            {/* Section 4 */}
            <Box className="glass-card fade-in-up" sx={{ p: 4, mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <SecurityIcon sx={{ color: '#f472b6', fontSize: 28 }} />
                <Typography variant="h5" sx={{ fontWeight: 600, fontFamily: "'Space Grotesk'" }}>
                  Audit Logging
                </Typography>
              </Box>
              <Typography sx={{ color: 'text.secondary', lineHeight: 1.85, mb: 2 }}>
                Every login and signup attempt is recorded in an audit log, capturing the IP address, user agent,
                timestamp, and success/failure status. This provides a complete forensic trail for security analysis.
              </Typography>
              <Typography sx={{ color: 'text.secondary', lineHeight: 1.85 }}>
                Administrators can review these logs through a protected admin API endpoint, enabling rapid response
                to suspicious activity patterns.
              </Typography>
            </Box>

            {/* Security Summary */}
            <Box className="glass-card fade-in-up" sx={{ p: 4, background: 'rgba(102, 126, 234, 0.08)', border: '1px solid rgba(102, 126, 234, 0.2)' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Security at a Glance</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {['JWT + HttpOnly Cookies', 'bcrypt (12 rounds)', 'Rate Limiting', 'Brute-Force Lockout',
                  'Helmet CSP', 'Input Sanitization', 'SQL Injection Prevention', 'CORS Protection',
                  'Audit Logging', 'Email Verification'].map((item) => (
                  <Chip key={item} label={item} size="small"
                    sx={{ bgcolor: 'rgba(102,126,234,0.1)', color: '#8b9cf7', fontWeight: 500 }} />
                ))}
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>
    </Layout>
  );
}
