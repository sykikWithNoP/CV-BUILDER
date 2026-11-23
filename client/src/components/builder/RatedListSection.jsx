import { Box, IconButton, MenuItem, TextField, Tooltip, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import AddEntryButton from './AddEntryButton';

/**
 * Skills and languages are the same shape — a name plus a level from a fixed
 * list — so they share one component instead of two near-identical blocks.
 */
export default function RatedListSection({
  section,
  entries,
  form,
  levels,
  nameLabel,
  levelLabel,
  addLabel,
  placeholder,
  emptyHint,
}) {
  const { addEntry, updateEntry, removeEntry, moveEntry } = form;
  const defaultLevel = levels[Math.floor(levels.length / 2)].value;

  return (
    <>
      {entries.length === 0 && (
        <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', mb: 1.5 }}>{emptyHint}</Typography>
      )}

      {entries.map((item, index) => (
        <Box key={item.id} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 1.5 }}>
          <TextField
            size="small"
            label={nameLabel}
            placeholder={placeholder}
            value={item.name || ''}
            onChange={(e) => updateEntry(section, item.id, 'name', e.target.value)}
            sx={{ flex: 1, minWidth: 0 }}
          />
          <TextField
            select
            size="small"
            label={levelLabel}
            value={levels.some((l) => l.value === item.level) ? item.level : defaultLevel}
            onChange={(e) => updateEntry(section, item.id, 'level', Number(e.target.value))}
            sx={{ width: 160, flexShrink: 0 }}
          >
            {levels.map((level) => (
              <MenuItem key={level.value} value={level.value}>
                {level.label}
              </MenuItem>
            ))}
          </TextField>
          <Box sx={{ display: 'flex', flexShrink: 0 }}>
            <Tooltip title="Move up">
              <span>
                <IconButton size="small" disabled={index === 0} onClick={() => moveEntry(section, item.id, -1)}>
                  <ArrowUpwardIcon fontSize="inherit" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Move down">
              <span>
                <IconButton
                  size="small"
                  disabled={index === entries.length - 1}
                  onClick={() => moveEntry(section, item.id, 1)}
                >
                  <ArrowDownwardIcon fontSize="inherit" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Remove">
              <IconButton size="small" color="error" onClick={() => removeEntry(section, item.id)}>
                <DeleteIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      ))}

      <AddEntryButton label={addLabel} onClick={() => addEntry(section, { level: defaultLevel })} />
    </>
  );
}
