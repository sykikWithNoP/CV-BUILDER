import { Box, Chip, TextField } from '@mui/material';
import { hobbiesToList } from '../../utils/cv';

export default function HobbiesSection({ data, setField }) {
  const hobbies = hobbiesToList(data.hobbies);

  const removeHobby = (name) => {
    setField('hobbies', hobbies.filter((h) => h.name !== name).map((h) => h.name).join(', '));
  };

  return (
    <Box>
      <TextField
        fullWidth
        size="small"
        label="Hobbies (comma-separated)"
        placeholder="Reading, Hiking, Photography"
        value={data.hobbies || ''}
        onChange={(e) => setField('hobbies', e.target.value)}
      />
      {hobbies.length > 0 && (
        <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          {hobbies.map((h) => (
            <Chip
              key={h.name}
              label={h.name}
              size="small"
              onDelete={() => removeHobby(h.name)}
              sx={{ bgcolor: 'rgba(102,126,234,0.1)' }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
