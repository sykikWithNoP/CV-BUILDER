import { useRef, useState } from 'react';
import { Alert, Avatar, Box, Button, Grid, TextField, Typography } from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import api, { errorMessage } from '../../api/client';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const FIELDS = [
  { key: 'firstName', label: 'First Name', span: 6, required: true },
  { key: 'lastName', label: 'Last Name', span: 6, required: true },
  { key: 'jobTitle', label: 'Job Title', span: 12, required: true, placeholder: 'Software Engineer' },
  { key: 'email', label: 'Email', span: 4, required: true, type: 'email' },
  { key: 'phone', label: 'Phone', span: 4 },
  { key: 'location', label: 'Location', span: 4, placeholder: 'Kathmandu, Nepal' },
  { key: 'linkedin', label: 'LinkedIn', span: 4, placeholder: 'linkedin.com/in/you' },
  { key: 'github', label: 'GitHub', span: 4, placeholder: 'github.com/you' },
  { key: 'website', label: 'Website', span: 4, placeholder: 'yoursite.com' },
];

export default function PersonalSection({ data, setField }) {
  const fileInput = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const uploadPhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // allow re-picking the same file after an error
    if (!file) return;
    setUploadError('');

    if (!file.type.startsWith('image/')) {
      setUploadError('That file is not an image.');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setUploadError('Photo must be 2 MB or smaller.');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);
    setUploading(true);
    try {
      const response = await api.post('/cv/upload-avatar', formData);
      setField('avatar', response.data.url);
    } catch (err) {
      setUploadError(errorMessage(err, 'Photo upload failed'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Grid container spacing={2}>
      {FIELDS.map((field) => (
        <Grid item xs={12} sm={field.span} key={field.key}>
          <TextField
            fullWidth
            size="small"
            type={field.type || 'text'}
            label={field.label}
            required={field.required}
            placeholder={field.placeholder}
            value={data[field.key] || ''}
            onChange={(e) => setField(field.key, e.target.value)}
          />
        </Grid>
      ))}

      <Grid item xs={12}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Avatar src={data.avatar || undefined} sx={{ width: 64, height: 64 }}>
            {data.firstName?.[0] || data.lastName?.[0] || '?'}
          </Avatar>
          <Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<PhotoCameraIcon />}
              disabled={uploading}
              onClick={() => fileInput.current?.click()}
            >
              {uploading ? 'Uploading…' : data.avatar ? 'Replace Photo' : 'Upload Photo'}
            </Button>
            {data.avatar && (
              <Button size="small" color="error" sx={{ ml: 1 }} onClick={() => setField('avatar', '')}>
                Remove
              </Button>
            )}
            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.5 }}>
              JPG or PNG, up to 2 MB. Optional — many employers prefer no photo.
            </Typography>
          </Box>
          <input type="file" accept="image/*" ref={fileInput} hidden onChange={uploadPhoto} />
        </Box>
        {uploadError && (
          <Alert severity="error" sx={{ mt: 1.5 }} onClose={() => setUploadError('')}>
            {uploadError}
          </Alert>
        )}
      </Grid>
    </Grid>
  );
}
