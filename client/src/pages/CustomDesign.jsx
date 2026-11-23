import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Chip, Container,
  Divider, FormControlLabel, Grid, IconButton, Paper, Stack, Switch, TextField, Tooltip, Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import LaunchIcon from '@mui/icons-material/Launch';
import ViewSidebarIcon from '@mui/icons-material/ViewSidebar';
import Mustache from 'mustache';

import Layout from '../components/Layout';
import CvPreview from '../components/CvPreview';
import { SliderField, SelectField, ColorField } from '../components/design/Fields';
import SectionArranger from '../components/design/SectionArranger';
import api, { errorMessage } from '../api/client';
import { buildTemplateData, normalizeTemplate, withStableIds } from '../utils/cv';
import { buildCustomTemplate, pageContentHeightPx, pageContentWidthPx } from '../utils/customTemplate';
import {
  DEFAULT_DESIGN, FONT_OPTIONS, PAGE_SIZES, STORAGE_KEY, mergeDesign,
} from '../constants/customDesign';

const SAMPLE_CV = {
  firstName: 'Jane', lastName: 'Doe', jobTitle: 'Software Engineer',
  email: 'jane@example.com', phone: '+977 980-0000000', location: 'Kathmandu, Nepal',
  linkedin: 'linkedin.com/in/janedoe', github: 'github.com/janedoe',
  summary: 'Engineer with six years building web platforms, most recently leading a team of six on a payments product used by 40,000 people a month.',
  experience: [
    { id: 'x1', title: 'Senior Developer', company: 'TechCorp', start: '2022-01', end: '', description: 'Led the frontend team, cut page load time by 40%, and introduced the design system now used across four products.' },
    { id: 'x2', title: 'Developer', company: 'Webshop Ltd', start: '2019-03', end: '2021-12', description: 'Built and maintained the checkout service handling 2,000 orders a day.' },
    { id: 'x3', title: 'Junior Developer', company: 'Studio Nine', start: '2018-01', end: '2019-02', description: 'Shipped client sites and internal tooling.' },
  ],
  education: [
    { id: 'e1', degree: 'BSc Computer Science', school: 'Tribhuvan University', startDate: '2014-08', endDate: '2018-06', grade: 'First class' },
  ],
  skills: [
    { id: 's1', name: 'React', level: 100 }, { id: 's2', name: 'Node.js', level: 80 },
    { id: 's3', name: 'PostgreSQL', level: 60 }, { id: 's4', name: 'AWS', level: 60 },
  ],
  languages: [{ id: 'l1', name: 'English', level: 4 }, { id: 'l2', name: 'Nepali', level: 5 }],
  certifications: [{ id: 'c1', name: 'AWS Solutions Architect', issuer: 'Amazon', year: '2023', link: 'https://example.com' }],
  hobbies: 'Reading, Hiking, Photography',
};

export default function CustomDesign() {
  const navigate = useNavigate();

  const [config, setConfig] = useState(() => {
    try { return mergeDesign(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')); }
    catch { return DEFAULT_DESIGN; }
  });
  const [saved, setSaved] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [myCv, setMyCv] = useState(null);
  const [useMyData, setUseMyData] = useState(true);
  const [showGuides, setShowGuides] = useState(true);
  const [busy, setBusy] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const set = useCallback((key, value) => setConfig((prev) => ({ ...prev, [key]: value })), []);
  const setIn = useCallback((group, key, value) => {
    setConfig((prev) => ({ ...prev, [group]: { ...prev[group], [key]: value } }));
  }, []);

  const twoColumn = config.layout === 'sidebar';
  const mono = config.colors.mode === 'mono';

  /* ---------- load saved designs and the user's own CV ---------- */
  const loadSaved = useCallback(async () => {
    try {
      const { data } = await api.get('/user-templates');
      setSaved(data || []);
    } catch (err) {
      setErrorMsg(errorMessage(err, 'Could not load your saved designs'));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadSaved();
    (async () => {
      try {
        const { data } = await api.get('/cv/my');
        if (!cancelled && data) setMyCv(withStableIds(data.data || {}));
      } catch { /* previewing with sample data is fine */ }
    })();
    return () => { cancelled = true; };
  }, [loadSaved]);

  // Keep the working design in the browser between visits.
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); } catch { /* private mode */ }
  }, [config]);

  /* ---------- the design compiled to a real template ---------- */
  const template = useMemo(() => buildCustomTemplate(config), [config]);

  const previewHtml = useMemo(() => {
    const source = useMyData && myCv && Object.keys(myCv).length ? myCv : SAMPLE_CV;
    const data = buildTemplateData(source, { origin: window.location.origin });
    let html;
    try {
      html = Mustache.render(normalizeTemplate(template.html), data);
    } catch (err) {
      return `<pre style="color:#b91c1c;padding:16px">${err.message}</pre>`;
    }
    const pageHeight = pageContentHeightPx(config);
    const guides = showGuides
      ? `<style>body{position:relative}.cv-page-guides{position:absolute;inset:0;pointer-events:none;` +
        `background:repeating-linear-gradient(to bottom,rgba(0,0,0,0) 0,rgba(0,0,0,0) ${pageHeight - 1}px,` +
        `rgba(239,68,68,.5) ${pageHeight - 1}px,rgba(239,68,68,.5) ${pageHeight}px)}</style>` +
        '<div class="cv-page-guides"></div>'
      : '';
    return `<style>${template.css}</style>${guides}${html}`;
  }, [template, config, useMyData, myCv, showGuides]);

  /* ---------- saving ---------- */
  const saveDesign = async ({ asNew } = {}) => {
    setBusy(true); setErrorMsg(''); setSuccessMsg('');
    const payload = {
      name: (config.name || 'My design').trim() || 'My design',
      config,
      stylesheet: template.css,
      htmlTemplate: template.html,
    };
    try {
      if (editingId && !asNew) {
        await api.put(`/user-templates/${editingId}`, payload);
        setSuccessMsg('Design updated. Pick it in the dashboard to use it on your CV.');
      } else {
        const { data } = await api.post('/user-templates', payload);
        setEditingId(data.id);
        setSuccessMsg('Design saved. Pick it in the dashboard to use it on your CV.');
      }
      await loadSaved();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setErrorMsg(errorMessage(err, 'Could not save the design'));
    } finally { setBusy(false); }
  };

  const loadDesign = (item) => {
    setConfig(mergeDesign({ ...item.config, name: item.name }));
    setEditingId(item.id);
    setSuccessMsg(`Editing "${item.name}"`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const deleteDesign = async (item) => {
    setBusy(true); setErrorMsg('');
    try {
      await api.delete(`/user-templates/${item.id}`);
      if (editingId === item.id) setEditingId(null);
      await loadSaved();
    } catch (err) {
      setErrorMsg(errorMessage(err, 'Could not delete that design'));
    } finally { setBusy(false); }
  };

  const useInDashboard = (item) => navigate(`/dashboard?template=user:${item.id}`);

  return (
    <Layout>
      <Box sx={{ position: 'relative', minHeight: '100vh' }}>
        <div className="animated-bg" style={{ opacity: 0.2 }}><div className="mesh-orb-3" /></div>
        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1, py: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, fontFamily: "'Space Grotesk'", mb: 0.5 }}>
            <Box component="span" className="gradient-text">Custom</Box> CV Designer
          </Typography>
          <Typography sx={{ color: 'text.secondary', mb: 3 }}>
            Arrange the sections, set the spacing and colours, then save it as a template you can use for your CV and PDF.
          </Typography>

          {successMsg && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}
          {errorMsg && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMsg('')}>{errorMsg}</Alert>}

          <Grid container spacing={3}>
            {/* ---------------- controls ---------------- */}
            <Grid item xs={12} md={5} lg={4}>
              <Paper sx={{ p: 2.5, borderRadius: 3, mb: 2 }}>
                <TextField
                  fullWidth size="small" label="Design name" value={config.name}
                  onChange={(e) => set('name', e.target.value)} sx={{ mb: 1.5 }}
                />
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Button variant="contained" size="small" startIcon={<SaveIcon />} disabled={busy}
                    onClick={() => saveDesign()}>
                    {editingId ? 'Update design' : 'Save design'}
                  </Button>
                  {editingId && (
                    <Button size="small" variant="outlined" disabled={busy} onClick={() => saveDesign({ asNew: true })}
                      sx={{ borderColor: 'var(--glass-border)', color: 'text.secondary' }}>
                      Save as new
                    </Button>
                  )}
                  <Button size="small" startIcon={<RestartAltIcon />} onClick={() => { setConfig(DEFAULT_DESIGN); setEditingId(null); }}
                    sx={{ color: 'text.secondary' }}>
                    Reset
                  </Button>
                </Stack>

                {saved.length > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1, color: 'text.secondary' }}>
                      Saved designs ({saved.length}/10)
                    </Typography>
                    {saved.map((item) => (
                      <Box key={item.id} sx={{
                        display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75, px: 1, py: 0.5,
                        borderRadius: 2, border: '1px solid var(--glass-border)',
                        background: editingId === item.id ? 'rgba(102,126,234,0.08)' : 'transparent',
                      }}>
                        <Typography sx={{ flex: 1, fontSize: '0.85rem' }} noWrap>{item.name}</Typography>
                        {editingId === item.id && <Chip label="editing" size="small" sx={{ height: 20, fontSize: '0.65rem' }} />}
                        <Tooltip title="Load into the editor">
                          <IconButton size="small" onClick={() => loadDesign(item)}><EditIcon sx={{ fontSize: 16 }} /></IconButton>
                        </Tooltip>
                        <Tooltip title="Use for my CV">
                          <IconButton size="small" onClick={() => useInDashboard(item)}><LaunchIcon sx={{ fontSize: 16 }} /></IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => deleteDesign(item)}><DeleteIcon sx={{ fontSize: 16 }} /></IconButton>
                        </Tooltip>
                      </Box>
                    ))}
                  </>
                )}
              </Paper>

              <ControlGroup title="Page & layout" defaultExpanded>
                <SelectField label="Layout" value={config.layout} onChange={(v) => set('layout', v)}
                  options={[{ value: 'single', label: 'Single column' }, { value: 'sidebar', label: 'Two columns' }]} />
                <SelectField label="Page size" value={config.page.size} onChange={(v) => setIn('page', 'size', v)}
                  options={Object.entries(PAGE_SIZES).map(([value, p]) => ({ value, label: p.label }))} />
                <SliderField label="Page margin" value={config.page.margin} onChange={(v) => setIn('page', 'margin', v)}
                  min={6} max={25} step={1} unit="mm" />

                {twoColumn && (
                  <>
                    <Divider sx={{ my: 1.5 }} />
                    <SelectField label="Sidebar side" value={config.sidebarSide} onChange={(v) => set('sidebarSide', v)}
                      options={[{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }]} />
                    <SliderField label="Sidebar width" value={config.sidebarWidth} onChange={(v) => set('sidebarWidth', v)}
                      min={20} max={50} unit="%" />
                    <SliderField label="Gap between columns" value={config.columnGap} onChange={(v) => set('columnGap', v)}
                      min={0} max={48} unit="px" />
                    <SelectField label="Line between columns" value={config.columnRule.style}
                      onChange={(v) => setIn('columnRule', 'style', v)}
                      options={[
                        { value: 'none', label: 'None' }, { value: 'solid', label: 'Solid' },
                        { value: 'dashed', label: 'Dashed' }, { value: 'dotted', label: 'Dotted' },
                      ]} />
                    {config.columnRule.style !== 'none' && (
                      <>
                        <SliderField label="Column line thickness" value={config.columnRule.width}
                          onChange={(v) => setIn('columnRule', 'width', v)} min={1} max={6} unit="px" />
                        <ColorField label="Column line colour" value={config.columnRule.color}
                          onChange={(v) => setIn('columnRule', 'color', v)} disabled={mono} />
                      </>
                    )}
                  </>
                )}
              </ControlGroup>

              <ControlGroup title="Sections & order">
                <SectionArranger sections={config.sections} twoColumn={twoColumn}
                  onChange={(sections) => set('sections', sections)} />
              </ControlGroup>

              <ControlGroup title="Typography">
                <SelectField label="Body font" value={config.font.body} onChange={(v) => setIn('font', 'body', v)} options={FONT_OPTIONS} />
                <SelectField label="Heading font" value={config.font.heading} onChange={(v) => setIn('font', 'heading', v)} options={FONT_OPTIONS} />
                <SliderField label="Body text size" value={config.font.size} onChange={(v) => setIn('font', 'size', v)}
                  min={8} max={14} step={0.5} unit="pt" />
                <SliderField label="Line height" value={config.font.lineHeight} onChange={(v) => setIn('font', 'lineHeight', v)}
                  min={1} max={2} step={0.05} help="How far apart the lines inside a paragraph sit" />
                <Divider sx={{ my: 1.5 }} />
                <SliderField label="Name size" value={config.header.nameSize} onChange={(v) => setIn('header', 'nameSize', v)}
                  min={16} max={44} unit="px" />
                <SliderField label="Job title size" value={config.header.titleSize} onChange={(v) => setIn('header', 'titleSize', v)}
                  min={8} max={20} unit="px" />
                <SliderField label="Section heading size" value={config.headings.size} onChange={(v) => setIn('headings', 'size', v)}
                  min={8} max={18} unit="px" />
                <SliderField label="Heading letter spacing" value={config.headings.letterSpacing}
                  onChange={(v) => setIn('headings', 'letterSpacing', v)} min={0} max={4} step={0.1} unit="px" />
                <SelectField label="Heading case" value={config.headings.transform} onChange={(v) => setIn('headings', 'transform', v)}
                  options={[{ value: 'uppercase', label: 'UPPERCASE' }, { value: 'capitalize', label: 'Capitalised' }, { value: 'none', label: 'As typed' }]} />
                <SelectField label="Heading underline" value={config.headings.underline} onChange={(v) => setIn('headings', 'underline', v)}
                  options={[{ value: 'line', label: 'Thin line' }, { value: 'bar', label: 'Left bar' }, { value: 'none', label: 'None' }]} />
              </ControlGroup>

              <ControlGroup title="Spacing">
                <SliderField label="Between paragraphs" value={config.spacing.paragraph}
                  onChange={(v) => setIn('spacing', 'paragraph', v)} min={0} max={16} unit="px"
                  help="Gap under each paragraph — turn it down for a tighter CV" />
                <SliderField label="Between sections" value={config.spacing.section}
                  onChange={(v) => setIn('spacing', 'section', v)} min={2} max={40} unit="px" />
                <SliderField label="Under section headings" value={config.spacing.heading}
                  onChange={(v) => setIn('spacing', 'heading', v)} min={0} max={20} unit="px" />
                <SliderField label="Between entries" value={config.spacing.entry}
                  onChange={(v) => setIn('spacing', 'entry', v)} min={0} max={28} unit="px"
                  help="Gap between jobs, degrees and certificates" />
                <SliderField label="Between list rows" value={config.spacing.item}
                  onChange={(v) => setIn('spacing', 'item', v)} min={0} max={14} unit="px" />
                <SelectField label="Divider between sections" value={config.sectionDivider} onChange={(v) => set('sectionDivider', v)}
                  options={[{ value: 'none', label: 'None' }, { value: 'line', label: 'Line' }, { value: 'double', label: 'Double line' }]} />
              </ControlGroup>

              <ControlGroup title="Colours">
                <FormControlLabel
                  sx={{ mb: 1 }}
                  control={<Switch size="small" checked={mono}
                    onChange={(e) => setIn('colors', 'mode', e.target.checked ? 'mono' : 'color')} />}
                  label={<Typography sx={{ fontSize: '0.85rem' }}>No colour (black and white)</Typography>}
                />
                <Grid container spacing={1.5}>
                  <Grid item xs={6}><ColorField label="Primary text" value={config.colors.text} onChange={(v) => setIn('colors', 'text', v)} disabled={false} /></Grid>
                  <Grid item xs={6}><ColorField label="Muted text" value={config.colors.muted} onChange={(v) => setIn('colors', 'muted', v)} disabled={mono} /></Grid>
                  <Grid item xs={6}><ColorField label="Section headings" value={config.colors.heading} onChange={(v) => setIn('colors', 'heading', v)} disabled={mono} /></Grid>
                  <Grid item xs={6}><ColorField label="Name" value={config.colors.name} onChange={(v) => setIn('colors', 'name', v)} disabled={mono} /></Grid>
                  <Grid item xs={6}><ColorField label="Accent" value={config.colors.accent} onChange={(v) => setIn('colors', 'accent', v)} disabled={mono} /></Grid>
                  <Grid item xs={6}><ColorField label="Accent 2" value={config.colors.accent2} onChange={(v) => setIn('colors', 'accent2', v)} disabled={mono} /></Grid>
                  <Grid item xs={6}><ColorField label="Links" value={config.colors.link} onChange={(v) => setIn('colors', 'link', v)} disabled={mono} /></Grid>
                  <Grid item xs={6}><ColorField label="Page background" value={config.colors.background} onChange={(v) => setIn('colors', 'background', v)} disabled={mono} /></Grid>
                  <Grid item xs={6}><ColorField label="Rules & borders" value={config.colors.rule} onChange={(v) => setIn('colors', 'rule', v)} disabled={mono} /></Grid>
                  {twoColumn && (
                    <>
                      <Grid item xs={6}><ColorField label="Sidebar background" value={config.colors.sidebarBg} onChange={(v) => setIn('colors', 'sidebarBg', v)} disabled={mono} /></Grid>
                      <Grid item xs={6}><ColorField label="Sidebar text" value={config.colors.sidebarText} onChange={(v) => setIn('colors', 'sidebarText', v)} disabled={mono} /></Grid>
                    </>
                  )}
                </Grid>
              </ControlGroup>

              <ControlGroup title="Header & details">
                <SelectField label="Header style" value={config.header.style} onChange={(v) => setIn('header', 'style', v)}
                  options={[
                    { value: 'line', label: 'Underline' }, { value: 'gradient', label: 'Gradient band' },
                    { value: 'solid', label: 'Solid band' }, { value: 'none', label: 'Plain' },
                  ]} />
                <SelectField label="Header alignment" value={config.header.align} onChange={(v) => setIn('header', 'align', v)}
                  options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Centred' }]} />
                <FormControlLabel
                  control={<Switch size="small" checked={config.header.showPhoto}
                    onChange={(e) => setIn('header', 'showPhoto', e.target.checked)} />}
                  label={<Typography sx={{ fontSize: '0.85rem' }}>Show photo (when your CV has one)</Typography>}
                />
                {config.header.showPhoto && (
                  <SliderField label="Photo size" value={config.header.photoSize}
                    onChange={(v) => setIn('header', 'photoSize', v)} min={48} max={140} unit="px" />
                )}
                <Divider sx={{ my: 1.5 }} />
                <SelectField label="Skill style" value={config.skillStyle} onChange={(v) => set('skillStyle', v)}
                  options={[
                    { value: 'pill', label: 'Pill' }, { value: 'tag', label: 'Tag' },
                    { value: 'plain', label: 'Plain text' }, { value: 'bar', label: 'Level bar' },
                  ]} />
                <SelectField label="Dates" value={config.entryDateStyle} onChange={(v) => set('entryDateStyle', v)}
                  options={[{ value: 'inline', label: 'Next to the employer' }, { value: 'right', label: 'Right aligned' }]} />
              </ControlGroup>
            </Grid>

            {/* ---------------- preview ---------------- */}
            <Grid item xs={12} md={7} lg={8}>
              <Paper sx={{ p: 2, borderRadius: 3, position: 'sticky', top: 80 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                  <ViewSidebarIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: 'text.secondary', flex: 1 }}>
                    Live preview
                  </Typography>
                  <FormControlLabel
                    control={<Switch size="small" checked={useMyData} onChange={(e) => setUseMyData(e.target.checked)} />}
                    label={<Typography sx={{ fontSize: '0.78rem' }}>My CV data</Typography>}
                  />
                  <FormControlLabel
                    control={<Switch size="small" checked={showGuides} onChange={(e) => setShowGuides(e.target.checked)} />}
                    label={<Typography sx={{ fontSize: '0.78rem' }}>Page breaks</Typography>}
                  />
                </Box>
                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mb: 1 }}>
                  Red lines mark where a page ends. Anything past a line continues on the next page — nothing is dropped.
                </Typography>
                <CvPreview html={previewHtml} maxHeight={820} pageWidth={pageContentWidthPx(config)} />
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Layout>
  );
}

function ControlGroup({ title, children, defaultExpanded = false }) {
  return (
    <Accordion
      defaultExpanded={defaultExpanded}
      disableGutters
      elevation={0}
      sx={{
        mb: 1.5, borderRadius: 2, border: '1px solid var(--glass-border)',
        '&::before': { display: 'none' },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2, minHeight: 52 }}>
        <Typography sx={{ fontWeight: 600, fontSize: '0.92rem' }}>{title}</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 2, pt: 0, pb: 2 }}>{children}</AccordionDetails>
    </Accordion>
  );
}
