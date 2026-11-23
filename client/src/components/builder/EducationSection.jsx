import { Grid, TextField, Typography } from '@mui/material';
import EntryCard from './EntryCard';
import AddEntryButton from './AddEntryButton';
import { isRangeInvalid } from '../../utils/cv';

export default function EducationSection({ entries, form }) {
  const { addEntry, updateEntry, removeEntry, moveEntry } = form;

  return (
    <>
      {entries.length === 0 && (
        <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', mb: 1.5 }}>
          Degrees, diplomas and courses — most recent first.
        </Typography>
      )}

      {entries.map((ed, index) => {
        // Older saves only had a single `year` field; keep showing it as the start.
        const start = ed.startDate || ed.year || '';
        const badRange = isRangeInvalid(start, ed.endDate);
        return (
          <EntryCard
            key={ed.id}
            index={index}
            total={entries.length}
            title={[ed.degree, ed.school].filter(Boolean).join(' — ')}
            onMoveUp={() => moveEntry('education', ed.id, -1)}
            onMoveDown={() => moveEntry('education', ed.id, 1)}
            onRemove={() => removeEntry('education', ed.id)}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Degree / Qualification"
                  value={ed.degree || ''}
                  onChange={(e) => updateEntry('education', ed.id, 'degree', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="School / Institution"
                  value={ed.school || ''}
                  onChange={(e) => updateEntry('education', ed.id, 'school', e.target.value)}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Start Date"
                  type="month"
                  value={start}
                  onChange={(e) => updateEntry('education', ed.id, 'startDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="End Date"
                  type="month"
                  value={ed.endDate || ''}
                  onChange={(e) => updateEntry('education', ed.id, 'endDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  error={badRange}
                  helperText={badRange ? 'Ends before it starts' : 'Empty = ongoing'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="GPA / Grade"
                  value={ed.grade || ''}
                  onChange={(e) => updateEntry('education', ed.id, 'grade', e.target.value)}
                />
              </Grid>
            </Grid>
          </EntryCard>
        );
      })}

      <AddEntryButton label="Add education" onClick={() => addEntry('education')} />
    </>
  );
}
