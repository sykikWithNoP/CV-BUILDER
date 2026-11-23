import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

export default function AddEntryButton({ label, onClick }) {
  return (
    <Button
      fullWidth
      size="small"
      startIcon={<AddIcon />}
      onClick={onClick}
      sx={{
        mt: 0.5,
        py: 1,
        borderRadius: 2,
        border: '1px dashed var(--glass-border)',
        color: 'text.secondary',
        '&:hover': { borderColor: '#667eea', color: '#8b9cf7', background: 'rgba(102,126,234,0.06)' },
      }}
    >
      {label}
    </Button>
  );
}
