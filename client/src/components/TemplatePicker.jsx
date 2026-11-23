import { Box, Card, CardActionArea, CardContent, Typography } from '@mui/material';

export default function TemplatePicker({ templates, selected, onSelect }) {
  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      {templates.map((template) => (
        <Card
          key={template.id}
          sx={{
            border: selected === template.id ? '2px solid #8b5cf6' : '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <CardActionArea onClick={() => onSelect(template)}>
            <CardContent>
              <Typography variant="subtitle1">{template.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {template.description}
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      ))}
    </Box>
  );
}
