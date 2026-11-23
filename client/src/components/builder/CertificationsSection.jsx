import { Grid, InputAdornment, TextField, Typography } from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import EntryCard from './EntryCard';
import AddEntryButton from './AddEntryButton';

const isBadUrl = (value) => !!value && !/^https?:\/\/\S+$/i.test(value.trim());

export default function CertificationsSection({ entries, form }) {
  const { addEntry, updateEntry, removeEntry, moveEntry } = form;

  return (
    <>
      {entries.length === 0 && (
        <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', mb: 1.5 }}>
          Courses and credentials, with a verification link where you have one.
        </Typography>
      )}

      {entries.map((cert, index) => (
        <EntryCard
          key={cert.id}
          index={index}
          total={entries.length}
          title={[cert.name, cert.issuer].filter(Boolean).join(' — ')}
          onMoveUp={() => moveEntry('certifications', cert.id, -1)}
          onMoveDown={() => moveEntry('certifications', cert.id, 1)}
          onRemove={() => removeEntry('certifications', cert.id)}
        >
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Certificate"
                value={cert.name || ''}
                onChange={(e) => updateEntry('certifications', cert.id, 'name', e.target.value)}
              />
            </Grid>
            <Grid item xs={8} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Issuer"
                value={cert.issuer || ''}
                onChange={(e) => updateEntry('certifications', cert.id, 'issuer', e.target.value)}
              />
            </Grid>
            <Grid item xs={4} sm={2}>
              <TextField
                fullWidth
                size="small"
                label="Year"
                inputProps={{ inputMode: 'numeric', maxLength: 4 }}
                value={cert.year || ''}
                onChange={(e) => updateEntry('certifications', cert.id, 'year', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Certificate Link"
                placeholder="https://www.credential.net/…"
                value={cert.link || ''}
                error={isBadUrl(cert.link)}
                helperText={isBadUrl(cert.link) ? 'Links must start with http:// or https://' : ' '}
                onChange={(e) => updateEntry('certifications', cert.id, 'link', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LinkIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </EntryCard>
      ))}

      <AddEntryButton label="Add certificate" onClick={() => addEntry('certifications')} />
    </>
  );
}
