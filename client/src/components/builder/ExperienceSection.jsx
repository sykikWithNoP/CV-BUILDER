import { Grid, TextField, Typography } from '@mui/material';
import EntryCard from './EntryCard';
import AddEntryButton from './AddEntryButton';
import { isRangeInvalid } from '../../utils/cv';

export default function ExperienceSection({ entries, form }) {
  const { addEntry, updateEntry, removeEntry, moveEntry } = form;

  return (
    <>
      {entries.length === 0 && (
        <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', mb: 1.5 }}>
          Add your roles newest first — recruiters read the top three lines.
        </Typography>
      )}

      {entries.map((exp, index) => {
        const badRange = isRangeInvalid(exp.start, exp.end);
        return (
          <EntryCard
            key={exp.id}
            index={index}
            total={entries.length}
            title={[exp.title, exp.company].filter(Boolean).join(' — ')}
            onMoveUp={() => moveEntry('experience', exp.id, -1)}
            onMoveDown={() => moveEntry('experience', exp.id, 1)}
            onRemove={() => removeEntry('experience', exp.id)}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Job Title"
                  value={exp.title || ''}
                  onChange={(e) => updateEntry('experience', exp.id, 'title', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Company"
                  value={exp.company || ''}
                  onChange={(e) => updateEntry('experience', exp.id, 'company', e.target.value)}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Start Date"
                  type="month"
                  value={exp.start || ''}
                  onChange={(e) => updateEntry('experience', exp.id, 'start', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="End Date"
                  type="month"
                  value={exp.end || ''}
                  onChange={(e) => updateEntry('experience', exp.id, 'end', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  error={badRange}
                  helperText={badRange ? 'Ends before it starts' : 'Empty = present'}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={3}
                  label="What you did"
                  placeholder="Led a team of 6 engineers; cut page load time by 40%."
                  value={exp.description || ''}
                  onChange={(e) => updateEntry('experience', exp.id, 'description', e.target.value)}
                />
              </Grid>
            </Grid>
          </EntryCard>
        );
      })}

      <AddEntryButton label="Add role" onClick={() => addEntry('experience')} />
    </>
  );
}
