import { Box, Tooltip, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { DEFAULT_THEME, THEME_SWATCHES } from '../../constants/cv';

export default function ThemeSection({ data, setField }) {
  const active = data.theme?.a || DEFAULT_THEME.a;

  return (
    <Box>
      <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', mb: 1.5 }}>
        Sets the accent colours inside the CV itself — not the colours of this site.
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {THEME_SWATCHES.map((swatch) => {
          const selected = active === swatch.a;
          const isWhite = swatch.a === '#ffffff';
          return (
            <Tooltip key={swatch.a + swatch.b} title={swatch.label}>
              <Box
                role="button"
                tabIndex={0}
                aria-label={swatch.label}
                aria-pressed={selected}
                onClick={() => setField('theme', { a: swatch.a, b: swatch.b })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setField('theme', { a: swatch.a, b: swatch.b });
                  }
                }}
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isWhite ? '#1a1a2e' : '#fff',
                  background: isWhite
                    ? 'linear-gradient(135deg, #f8f8f8, #e0e0e0)'
                    : `linear-gradient(135deg,${swatch.a},${swatch.b})`,
                  border: selected
                    ? '3px solid #667eea'
                    : isWhite
                      ? '2px solid rgba(0,0,0,0.2)'
                      : '2px solid rgba(255,255,255,0.2)',
                  cursor: 'pointer',
                  transition: 'all .2s',
                  '&:hover': { transform: 'scale(1.15)', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' },
                }}
              >
                {selected && <CheckIcon sx={{ fontSize: 16 }} />}
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
}
