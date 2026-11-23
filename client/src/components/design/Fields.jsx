import { Box, MenuItem, Slider, TextField, Tooltip, Typography } from '@mui/material';

/** Labelled slider with its current value shown, used all over the designer. */
export function SliderField({ label, value, onChange, min, max, step = 1, unit = '', help }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Tooltip title={help || ''} placement="top-start">
          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{label}</Typography>
        </Tooltip>
        <Typography sx={{ fontSize: '0.78rem', fontWeight: 600 }}>{value}{unit}</Typography>
      </Box>
      <Slider
        size="small"
        value={typeof value === 'number' ? value : min}
        min={min}
        max={max}
        step={step}
        onChange={(_, next) => onChange(next)}
        sx={{ mt: -0.5 }}
      />
    </Box>
  );
}

export function SelectField({ label, value, onChange, options, sx }) {
  return (
    <TextField
      select
      fullWidth
      size="small"
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      sx={{ mb: 1.5, ...sx }}
    >
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
      ))}
    </TextField>
  );
}

export function ColorField({ label, value, onChange, disabled }) {
  return (
    <Box sx={{ opacity: disabled ? 0.45 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
      <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', mb: 0.5 }}>{label}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: 40, height: 32, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'none', padding: 0 }}
        />
        <TextField
          size="small"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          sx={{ flex: 1, '& input': { fontSize: '0.78rem', fontFamily: 'monospace' } }}
        />
      </Box>
    </Box>
  );
}
