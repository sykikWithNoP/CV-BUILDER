import { Box, TextField, Typography } from '@mui/material';

const RECOMMENDED_MIN = 40;
const RECOMMENDED_MAX = 600;

export default function SummarySection({ data, setField }) {
  const value = data.summary || '';
  const tooLong = value.length > RECOMMENDED_MAX;

  return (
    <Box>
      <TextField
        fullWidth
        multiline
        rows={5}
        label="Professional Summary"
        placeholder="Two or three sentences: what you do, how long you have done it, and what you are looking for."
        value={value}
        error={tooLong}
        onChange={(e) => setField('summary', e.target.value)}
      />
      <Typography
        sx={{
          mt: 0.5,
          fontSize: '0.75rem',
          textAlign: 'right',
          color: tooLong ? 'error.main' : value.length >= RECOMMENDED_MIN ? '#34d399' : 'text.secondary',
        }}
      >
        {value.length} / {RECOMMENDED_MAX} characters
      </Typography>
    </Box>
  );
}
