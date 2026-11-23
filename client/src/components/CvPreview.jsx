import { useState } from 'react';
import { Box, Button, IconButton, Tooltip, Typography } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import HtmlFrame from './HtmlFrame';

const ZOOM_STEPS = [0.75, 1, 1.25, 1.5, 2];

export default function CvPreview({ html, maxHeight = 720, pageWidth }) {
  const [zoomIndex, setZoomIndex] = useState(1); // 1 = fits the column exactly

  if (!html) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          minHeight: 400,
          borderRadius: 3,
          border: '1px dashed var(--glass-border)',
          color: 'text.secondary',
          textAlign: 'center',
          px: 3,
        }}
      >
        <DescriptionOutlinedIcon sx={{ fontSize: 40, opacity: 0.5 }} />
        <Typography sx={{ fontSize: '0.95rem' }}>Fill in your details to see a live preview</Typography>
      </Box>
    );
  }

  const zoom = ZOOM_STEPS[zoomIndex];

  // Opened from a blob URL: window.open(..., 'noopener') returns null in Chrome,
  // so writing into the new window's document would silently do nothing.
  const openInNewTab = () => {
    const page = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>CV preview</title></head><body>${html}</body></html>`;
    const url = URL.createObjectURL(new Blob([page], { type: 'text/html' }));
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
        <Tooltip title="Zoom out">
          <span>
            <IconButton size="small" disabled={zoomIndex === 0} onClick={() => setZoomIndex((i) => i - 1)}>
              <ZoomOutIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', width: 46, textAlign: 'center' }}>
          {Math.round(zoom * 100)}%
        </Typography>
        <Tooltip title="Zoom in">
          <span>
            <IconButton
              size="small"
              disabled={zoomIndex === ZOOM_STEPS.length - 1}
              onClick={() => setZoomIndex((i) => i + 1)}
            >
              <ZoomInIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Box sx={{ flex: 1 }} />
        <Button size="small" startIcon={<OpenInNewIcon />} onClick={openInNewTab} sx={{ color: 'text.secondary' }}>
          Full size
        </Button>
      </Box>

      <Box
        sx={{
          maxHeight,
          overflow: 'auto',
          borderRadius: 3,
          border: '1px solid var(--glass-border)',
          background: '#fff',
        }}
      >
        <HtmlFrame html={html} zoom={zoom} title="CV preview" minHeight={320} {...(pageWidth ? { pageWidth } : {})} />
      </Box>
    </Box>
  );
}
