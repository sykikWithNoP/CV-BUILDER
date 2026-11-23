import { Box, IconButton, Switch, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

/**
 * Orders the CV's sections, turns them on and off, and — in a two-column
 * layout — says which column each one belongs to.
 */
export default function SectionArranger({ sections, twoColumn, onChange }) {
  const move = (index, direction) => {
    const next = [...sections];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const update = (index, patch) => {
    const next = sections.map((section, i) => (i === index ? { ...section, ...patch } : section));
    onChange(next);
  };

  return (
    <Box>
      <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', mb: 1 }}>
        Drag order with the arrows. Sections print in this order.
      </Typography>
      {sections.map((section, index) => (
        <Box
          key={section.key}
          sx={{
            display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75, px: 1, py: 0.5,
            borderRadius: 2, border: '1px solid var(--glass-border)',
            background: section.enabled ? 'var(--bg-glass)' : 'transparent',
            opacity: section.enabled ? 1 : 0.55,
          }}
        >
          <DragIndicatorIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography sx={{ flex: 1, fontSize: '0.85rem', fontWeight: 500 }}>{section.label}</Typography>

          {twoColumn && section.enabled && (
            <ToggleButtonGroup
              size="small"
              exclusive
              value={section.column}
              onChange={(_, value) => value && update(index, { column: value })}
              sx={{ mr: 0.5, '& .MuiToggleButton-root': { py: 0.1, px: 0.9, fontSize: '0.68rem', textTransform: 'none' } }}
            >
              <ToggleButton value="sidebar">Side</ToggleButton>
              <ToggleButton value="main">Main</ToggleButton>
            </ToggleButtonGroup>
          )}

          <Tooltip title="Move up">
            <span>
              <IconButton size="small" disabled={index === 0} onClick={() => move(index, -1)}>
                <ArrowUpwardIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Move down">
            <span>
              <IconButton size="small" disabled={index === sections.length - 1} onClick={() => move(index, 1)}>
                <ArrowDownwardIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={section.enabled ? 'Hide section' : 'Show section'}>
            <Switch
              size="small"
              checked={section.enabled}
              onChange={(e) => update(index, { enabled: e.target.checked })}
            />
          </Tooltip>
        </Box>
      ))}
    </Box>
  );
}
