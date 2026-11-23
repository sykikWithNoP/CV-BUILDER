import { Container, Typography, Box, Chip } from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import BalanceIcon from '@mui/icons-material/Balance';
import PublicIcon from '@mui/icons-material/Public';
import PrivacyTipIcon from '@mui/icons-material/PrivacyTip';
import PsychologyIcon from '@mui/icons-material/Psychology';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Layout from '../components/Layout';

export default function Legal() {
  const sections = [
    {
      icon: <BalanceIcon sx={{ color: '#fbbf24', fontSize: 28 }} />,
      title: 'Ethical Considerations',
      content: [
        'Automated CV generation fundamentally changes how individuals present themselves professionally. While our platform streamlines the CV creation process, users should be aware that the content they provide must be truthful and accurate.',
        'Auto-generated suggestions and templates are tools to enhance presentation, not to fabricate qualifications. Users bear full responsibility for the accuracy of information included in their CVs.',
        'We encourage users to review all content carefully before exporting their CV. Misrepresentation of qualifications can have serious professional and legal consequences.',
      ],
    },
    {
      icon: <PublicIcon sx={{ color: '#8b9cf7', fontSize: 28 }} />,
      title: 'Social Impact',
      content: [
        'CV Builder aims to democratize access to professional CV design. Traditionally, high-quality CV templates and formatting expertise were available only to those who could afford professional CV writing services.',
        'However, we acknowledge that automated CV tools contribute to the growing volume of digital content. As more users generate CVs, the overall quality bar rises, potentially making it harder for candidates to stand out on formatting alone.',
        'Our platform emphasizes that while design and layout matter, the substance of a CV — genuine experience, skills, and achievements — remains paramount.',
      ],
    },
    {
      icon: <PrivacyTipIcon sx={{ color: '#34d399', fontSize: 28 }} />,
      title: 'Data Privacy & GDPR',
      content: [
        'CV Builder processes sensitive personal data including names, email addresses, phone numbers, employment history, and educational background. We treat this data with the highest level of care.',
        'All data is stored in encrypted databases with parameterized queries preventing SQL injection. User passwords are hashed using bcrypt with 12 salt rounds. Access tokens use HttpOnly cookies to prevent XSS-based theft.',
        'Users have the right to request deletion of their data at any time. In development environments, no data leaves the local machine. In production, HTTPS is enforced for all communications.',
      ],
    },
    {
      icon: <WarningAmberIcon sx={{ color: '#f87171', fontSize: 28 }} />,
      title: 'Impact on Traditional CV Writing',
      content: [
        'Automated CV builders will significantly reduce the time traditionally spent on CV writing. What once took hours of formatting and design can now be accomplished in minutes.',
        'This shift impacts professional CV writers, recruitment consultants, and career services who historically provided these services. Our platform complements rather than replaces human career advice — we handle the formatting while professionals focus on content strategy.',
        'We recommend users still seek feedback from mentors, career counsellors, or peers on the content and messaging of their CVs, even when using automated tools.',
      ],
    },
    {
      icon: <PsychologyIcon sx={{ color: '#f472b6', fontSize: 28 }} />,
      title: 'Auto-Generated Content Considerations',
      content: [
        'As AI and template-based systems generate more content, there is a growing concern about homogenization — CVs starting to look and read alike. CV Builder addresses this by offering diverse templates and encouraging personalization.',
        'Auto-generated content, including AI-suggested summaries and descriptions, occupies internet bandwidth and storage. We optimize our systems to minimize unnecessary data generation and storage footprint.',
        'Users should be aware that some employers use Applicant Tracking Systems (ATS) that may flag auto-generated content. Our templates are designed to be ATS-friendly while maintaining visual appeal.',
      ],
    },
  ];

  return (
    <Layout>
      <Box sx={{ position: 'relative', minHeight: '100vh' }}>
        <div className="animated-bg"><div className="mesh-orb-3" /></div>
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, py: 8 }}>
          <Box className="fade-in-up" sx={{ textAlign: 'center', mb: 8 }}>
            <Chip icon={<GavelIcon />} label="Legal & Ethics" sx={{ mb: 2, bgcolor: 'rgba(251,191,36,0.12)', color: '#fbbf24', fontWeight: 500 }} />
            <Typography variant="h3" sx={{ fontWeight: 700, fontFamily: "'Space Grotesk'", mb: 2 }}>
              Legal, Ethical & <Box component="span" className="gradient-text">Social Issues</Box>
            </Typography>
            <Typography sx={{ color: 'text.secondary', maxWidth: 600, mx: 'auto', lineHeight: 1.8 }}>
              Understanding the implications of automated CV generation on individuals, organizations, and society.
            </Typography>
          </Box>

          {sections.map((section, i) => (
            <Box key={i} className="glass-card fade-in-up" sx={{ p: 4, mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                {section.icon}
                <Typography variant="h5" sx={{ fontWeight: 600, fontFamily: "'Space Grotesk'" }}>
                  {section.title}
                </Typography>
              </Box>
              {section.content.map((para, j) => (
                <Typography key={j} sx={{ color: 'text.secondary', lineHeight: 1.85, mb: j < section.content.length - 1 ? 2 : 0 }}>
                  {para}
                </Typography>
              ))}
            </Box>
          ))}

          {/* Cookie Policy (Issue 7) */}
          <Box id="cookie-policy" className="glass-card fade-in-up" sx={{ p: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <PrivacyTipIcon sx={{ color: '#22d3ee', fontSize: 28 }} />
              <Typography variant="h5" sx={{ fontWeight: 600, fontFamily: "'Space Grotesk'" }}>
                Cookie Policy
              </Typography>
            </Box>
            <Typography sx={{ color: 'text.secondary', lineHeight: 1.85, mb: 2 }}>
              CV Builder uses cookies to ensure the proper functioning of our platform and to enhance your experience. Here is how we use cookies:
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>Essential Cookies</Typography>
            <Typography sx={{ color: 'text.secondary', lineHeight: 1.85, mb: 2 }}>
              These cookies are necessary for the website to function. They include authentication tokens (access_token, refresh_token) stored as HttpOnly cookies for security, CSRF protection tokens, and session identifiers. These cannot be disabled as they are required for core functionality.
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>Preference Cookies</Typography>
            <Typography sx={{ color: 'text.secondary', lineHeight: 1.85, mb: 2 }}>
              We store your theme preference (dark/light/system) and cookie consent status in your browser's localStorage. These help us remember your settings across visits.
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>How to Manage Cookies</Typography>
            <Typography sx={{ color: 'text.secondary', lineHeight: 1.85 }}>
              You can manage cookie preferences through the cookie consent banner that appears on your first visit. You can also clear cookies at any time through your browser settings. Note that disabling essential cookies will prevent you from using authenticated features of the platform.
            </Typography>
          </Box>

          {/* Disclaimer */}
          <Box className="glass-card fade-in-up" sx={{ p: 4, background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>Disclaimer</Typography>
            <Typography sx={{ color: 'text.secondary', lineHeight: 1.85, fontSize: '0.95rem' }}>
              CV Builder is provided "as is" for educational and professional use. Users are solely responsible for the
              accuracy and legality of the information they include in their CVs. This platform does not verify the
              authenticity of user-provided credentials, qualifications, or employment history. By using this service,
              you agree that CV Builder is not liable for any consequences arising from the use of generated documents.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Layout>
  );
}
