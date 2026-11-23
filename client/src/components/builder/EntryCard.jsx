import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DeleteIcon from '@mui/icons-material/Delete';

/**
 * One repeatable row (a job, a degree, a certificate) with its reorder and
 * delete controls in a fixed place, instead of a delete button floating under
 * the fields.
 */
export default function EntryCard({ title, index, total, onMoveUp, onMoveDown, onRemove, children }) {
  return (
    <Box
      sx={{
        p: 2,
        mb: 1.5,
        borderRadius: 2,
        border: '1px solid var(--glass-border)',
        background: 'var(--bg-glass)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
        <Typography sx={{ flex: 1, fontSize: '0.8rem', fontWeight: 600, color: 'text.secondary' }} noWrap>
          {title || `Entry ${index + 1}`}
        </Typography>
        <Tooltip title="Move up">
          <span>
            <IconButton size="small" disabled={index === 0} onClick={onMoveUp}>
              <ArrowUpwardIcon fontSize="inherit" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Move down">
          <span>
            <IconButton size="small" disabled={index === total - 1} onClick={onMoveDown}>
              <ArrowDownwardIcon fontSize="inherit" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Remove">
          <IconButton size="small" color="error" onClick={onRemove}>
            <DeleteIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      </Box>
      {children}
    </Box>
  );
}
