import { Accordion, AccordionDetails, AccordionSummary, Box, Chip, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

/**
 * Collapsible wrapper shared by every editor section, so a long CV form stays
 * navigable instead of being one endless scroll.
 */
export default function SectionCard({ icon, title, hint, count, complete, expanded, onToggle, children }) {
  return (
    <Accordion
      expanded={expanded}
      onChange={onToggle}
      disableGutters
      elevation={0}
      sx={{
        mb: 1.5,
        borderRadius: 2,
        border: '1px solid var(--glass-border)',
        '&::before': { display: 'none' },
        '&.Mui-expanded': { borderColor: 'rgba(102,126,234,0.35)' },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2, minHeight: 56 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%', pr: 1 }}>
          <Box sx={{ display: 'flex', color: complete ? '#34d399' : 'text.secondary' }}>{icon}</Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>{title}</Typography>
            {hint && (
              <Typography sx={{ color: 'text.secondary', fontSize: '0.78rem' }} noWrap>
                {hint}
              </Typography>
            )}
          </Box>
          {count > 0 && (
            <Chip
              label={count}
              size="small"
              sx={{ bgcolor: 'rgba(102,126,234,0.12)', color: '#8b9cf7', fontWeight: 600, height: 22 }}
            />
          )}
          {complete && <CheckCircleIcon sx={{ fontSize: 18, color: '#34d399' }} />}
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 2, pt: 0, pb: 2.5 }}>{children}</AccordionDetails>
    </Accordion>
  );
}
