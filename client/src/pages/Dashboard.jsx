import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import {
  Alert, Box, Button, Card, CardActionArea, CardContent, Chip, CircularProgress,
  Container, Grid, LinearProgress, Paper, Stack, Tooltip, Typography,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import SaveIcon from '@mui/icons-material/Save';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Mustache from 'mustache';

import Layout from '../components/Layout';
import CvBuilder from '../components/CvBuilder';
import CvPreview from '../components/CvPreview';
import HtmlFrame from '../components/HtmlFrame';
import { useAuth } from '../contexts/AuthContext';
import api, { errorMessage } from '../api/client';
import { buildTemplateData, completeness, cvFileName, normalizeTemplate, withStableIds } from '../utils/cv';

const AUTO_DISMISS_MS = 3000;

/** Stable key for a selection, since built-in and saved designs number separately. */
const templateKey = (template) =>
  template ? `${template.custom ? 'user' : 'builtin'}:${template.id}` : null;

const THUMB_SAMPLE = {
  firstName: 'Jane', lastName: 'Doe', jobTitle: 'Software Engineer',
  email: 'jane@example.com', phone: '+977 980-0000000', location: 'Kathmandu',
  summary: 'Engineer with six years building web platforms.',
  experience: [{ title: 'Senior Developer', company: 'TechCorp', start: '2022-01', end: '', description: 'Led the frontend team.' }],
  education: [{ degree: 'BSc Computer Science', school: 'Tribhuvan University', endDate: '2018-06' }],
  skills: [{ name: 'React', level: 100 }, { name: 'Node.js', level: 80 }],
  languages: [{ name: 'English', level: 4 }],
  hobbies: 'Reading, Hiking',
};

/** Thumbnail for a saved design: its own markup filled with stand-in data. */
function renderSample(htmlTemplate) {
  try {
    return Mustache.render(normalizeTemplate(htmlTemplate), buildTemplateData(THUMB_SAMPLE));
  } catch {
    return '';
  }
}

export default function Dashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [templates, setTemplates] = useState([]);
  const [customTemplates, setCustomTemplates] = useState([]);
  const [templatePreviews, setTemplatePreviews] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateRaw, setTemplateRaw] = useState(null);

  const [formData, setFormData] = useState({});
  const [savedCvId, setSavedCvId] = useState(null);
  const [savedSnapshot, setSavedSnapshot] = useState(null);

  const [loadingCv, setLoadingCv] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPreview, setShowPreview] = useState(true);

  const { percent, missing } = completeness(formData);

  const snapshot = useMemo(
    () => JSON.stringify({ template: templateKey(selectedTemplate), data: formData }),
    [selectedTemplate, formData]
  );
  const dirty = savedSnapshot !== null && snapshot !== savedSnapshot;
  const neverSaved = savedCvId === null;

  /* ---------- initial load ---------- */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [templateRes, myRes, customRes] = await Promise.all([
          api.get('/cv/templates'),
          api.get('/cv/my').catch(() => ({ data: null })),
          api.get('/user-templates').catch(() => ({ data: [] })),
        ]);
        if (cancelled) return;

        const list = templateRes.data || [];
        // Saved designs are used exactly like built-in templates, only their
        // markup travels with them.
        const custom = (customRes.data || []).map((t) => ({ ...t, custom: true }));
        setTemplates(list);
        setCustomTemplates(custom);

        const saved = myRes.data;
        const data = saved ? withStableIds(saved.data || {}) : {};

        // ?template=user:12 comes from the "use for my CV" button in the designer.
        const requested = searchParams.get('template');
        const requestedCustom = requested?.startsWith('user:')
          ? custom.find((t) => String(t.id) === requested.slice(5))
          : null;
        if (requested) setSearchParams({}, { replace: true });

        // What the CV is currently stored with…
        const storedTemplate =
          (saved?.user_template_id && custom.find((t) => t.id === saved.user_template_id))
          || (saved && list.find((t) => t.id === saved.template_id))
          || null;
        // …versus what we are about to show. Arriving with ?template= is an
        // unsaved change, so the Save button has to stay live.
        const template = requestedCustom || storedTemplate || list[0] || null;

        setFormData(data);
        setSelectedTemplate(template);
        setSavedCvId(saved?.id ?? null);
        setSavedSnapshot(JSON.stringify({ template: templateKey(storedTemplate), data }));

        // Thumbnails load together rather than one after another.
        const previews = await Promise.all(
          list.map((t) =>
            api.get(`/cv/template-preview/${t.id}`)
              .then((res) => [t.id, res.data.html])
              .catch(() => null)
          )
        );
        if (cancelled) return;
        setTemplatePreviews(Object.fromEntries(previews.filter(Boolean)));
      } catch (err) {
        if (!cancelled) setErrorMsg(errorMessage(err, 'Failed to load your CV'));
      } finally {
        if (!cancelled) setLoadingCv(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  /* ---------- template markup for the live preview ---------- */
  useEffect(() => {
    if (!selectedTemplate) return undefined;
    let cancelled = false;

    // A saved design already carries its markup — no request needed.
    if (selectedTemplate.custom) {
      setTemplateRaw({
        html_template: selectedTemplate.html_template,
        stylesheet: selectedTemplate.stylesheet,
      });
      return undefined;
    }

    (async () => {
      try {
        const res = await api.get(`/cv/template-raw/${selectedTemplate.id}`);
        if (!cancelled) setTemplateRaw(res.data);
      } catch {
        try {
          const res = await api.get(`/cv/template-preview/${selectedTemplate.id}`);
          if (!cancelled) setTemplateRaw({ html: res.data.html, fallback: true });
        } catch {
          if (!cancelled) setTemplateRaw(null);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [selectedTemplate]);

  const previewHtml = useMemo(() => {
    if (!templateRaw) return '';

    if (templateRaw.html_template && templateRaw.stylesheet) {
      try {
        const renderData = buildTemplateData(formData, { origin: window.location.origin });
        const html = Mustache.render(normalizeTemplate(templateRaw.html_template), renderData);
        const colours = `<style>:root,.cv-root{--cv-c1:${renderData.color1};--cv-c2:${renderData.color2}}</style>`;
        return `<style>${templateRaw.stylesheet}</style>${colours}${html}`;
      } catch (err) {
        console.error('Preview render error:', err);
        return '';
      }
    }

    return templateRaw.html || '';
  }, [templateRaw, formData]);

  /* ---------- save ---------- */
  const saveCv = useCallback(async () => {
    if (!selectedTemplate) { setErrorMsg('Select a template first'); return false; }
    setSaving(true); setErrorMsg('');
    const pending = snapshot;
    try {
      await api.post('/cv/save', {
        templateId: selectedTemplate.custom ? null : selectedTemplate.id,
        userTemplateId: selectedTemplate.custom ? selectedTemplate.id : null,
        data: formData,
      });
      const { data } = await api.get('/cv/my');
      setSavedCvId(data?.id ?? null);
      setSavedSnapshot(pending);
      setSuccessMsg('CV saved');
      setTimeout(() => setSuccessMsg(''), AUTO_DISMISS_MS);
      return true;
    } catch (err) {
      setErrorMsg(errorMessage(err, 'Save failed'));
      return false;
    } finally {
      setSaving(false);
    }
  }, [selectedTemplate, formData, snapshot]);

  // Ctrl/Cmd+S saves, like any other editor.
  const saveRef = useRef(saveCv);
  saveRef.current = saveCv;
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveRef.current();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Warn before losing unsaved edits.
  useEffect(() => {
    if (!dirty) return undefined;
    const onBeforeUnload = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  /* ---------- download ---------- */
  const downloadPdf = async () => {
    setDownloading(true); setErrorMsg('');
    try {
      // Always export what is on screen, not an older saved version.
      let cvId = savedCvId;
      if (dirty || !cvId) {
        const ok = await saveCv();
        if (!ok) return;
        const { data } = await api.get('/cv/my');
        cvId = data?.id ?? null;
        setSavedCvId(cvId);
      }
      if (!cvId) { setErrorMsg('Save your CV before downloading'); return; }

      const res = await api.get(`/cv/download/${cvId}`, { responseType: 'arraybuffer' });

      // An error can still come back as JSON inside the arraybuffer.
      if ((res.headers['content-type'] || '').includes('application/json')) {
        const errData = JSON.parse(new TextDecoder().decode(res.data));
        setErrorMsg(`PDF download failed: ${errData.error || 'Unknown error'}`);
        return;
      }

      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = cvFileName(formData);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setSuccessMsg('PDF downloaded');
      setTimeout(() => setSuccessMsg(''), AUTO_DISMISS_MS);
    } catch (err) {
      let message = errorMessage(err, 'PDF download failed');
      if (err.response?.data instanceof ArrayBuffer) {
        try {
          message = JSON.parse(new TextDecoder().decode(err.response.data)).error || message;
        } catch { /* keep the generic message */ }
      }
      if (err.response?.status === 403) {
        message = 'Verify your email address before downloading a PDF.';
      }
      setErrorMsg(`PDF download failed: ${message}`);
    } finally {
      setDownloading(false);
    }
  };

  if (loadingCv) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress sx={{ color: '#667eea' }} />
        </Box>
      </Layout>
    );
  }

  const statusChip = dirty || neverSaved
    ? <Chip label="Unsaved changes" size="small" sx={{ bgcolor: 'rgba(251,191,36,0.12)', color: '#fbbf24', fontWeight: 500 }} />
    : <Chip icon={<CheckCircleIcon />} label="Saved" size="small" sx={{ bgcolor: 'rgba(52,211,153,0.1)', color: '#34d399', fontWeight: 500 }} />;

  return (
    <Layout>
      <Box sx={{ position: 'relative', minHeight: '100vh' }}>
        <div className="animated-bg" style={{ opacity: 0.3 }}><div className="mesh-orb-3" /></div>
        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1, py: 3 }}>
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, fontFamily: "'Space Grotesk'", mb: 0.5 }}>
              Welcome back, <Box component="span" className="gradient-text">{user.first_name}</Box> 👋
            </Typography>
            <Typography sx={{ color: 'text.secondary' }}>Create and manage your professional CV</Typography>
          </Box>

          {successMsg && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}
          {errorMsg && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMsg('')}>{errorMsg}</Alert>}

          {/* PDF export stays locked until the address is confirmed. */}
          {!user.verified && (
            <Alert
              severity="warning"
              sx={{ mb: 2 }}
              action={
                <Button component={RouterLink} to="/verify-email" size="small" color="inherit">
                  Confirm now
                </Button>
              }
            >
              Your email isn&apos;t confirmed yet — you can edit and save, but PDF export stays locked.
            </Alert>
          )}

          {/* Action bar — stays in reach however far down the form you are */}
          <Paper sx={{ p: 2, mb: 2.5, position: 'sticky', top: 72, zIndex: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
              <Box sx={{ flex: 1, minWidth: 220 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>CV completeness</Typography>
                  <Typography sx={{
                    fontSize: '0.85rem', fontWeight: 700,
                    color: percent >= 80 ? '#34d399' : percent >= 50 ? '#fbbf24' : '#f87171',
                  }}>
                    {percent}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={percent}
                  sx={{
                    height: 8, borderRadius: 4,
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      background: percent >= 80
                        ? 'linear-gradient(90deg, #34d399, #22d3ee)'
                        : percent >= 50
                          ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
                          : 'linear-gradient(90deg, #f87171, #ef4444)',
                    },
                  }}
                />
              </Box>

              <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0, flexWrap: 'wrap' }}>
                {statusChip}
                <Button
                  variant="outlined" size="small"
                  startIcon={showPreview ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  onClick={() => setShowPreview((v) => !v)}
                  sx={{ borderColor: 'var(--glass-border)', color: 'text.secondary' }}
                >
                  {showPreview ? 'Hide' : 'Show'} preview
                </Button>
                <Tooltip title="Ctrl+S">
                  <span>
                    <Button
                      variant="contained" size="small" startIcon={<SaveIcon />}
                      onClick={saveCv} disabled={saving || (!dirty && !neverSaved)}
                    >
                      {saving ? 'Saving…' : 'Save'}
                    </Button>
                  </span>
                </Tooltip>
                <Button
                  variant="contained" size="small" color="success" startIcon={<DownloadIcon />}
                  onClick={downloadPdf} disabled={downloading || saving}
                  sx={{
                    background: 'linear-gradient(135deg, #34d399, #22d3ee)',
                    '&:hover': { background: 'linear-gradient(135deg, #2cc48a, #1ec1d6)' },
                  }}
                >
                  {downloading ? 'Generating…' : 'PDF'}
                </Button>
              </Stack>
            </Box>

            {missing.length > 0 && (
              <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>Still missing:</Typography>
                {missing.map((item) => (
                  <Chip key={item} label={item} size="small" variant="outlined"
                    sx={{ height: 22, fontSize: '0.72rem', borderColor: 'var(--glass-border)', color: 'text.secondary' }} />
                ))}
              </Box>
            )}
          </Paper>

          {/* Saved designs from the Custom Designer */}
          {customTemplates.length > 0 && (
            <Box sx={{ mb: 2.5 }}>
              <Typography sx={{ fontWeight: 600, mb: 1, fontSize: '0.85rem', color: 'text.secondary' }}>
                My designs
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1 }}>
                {customTemplates.map((t) => {
                  const active = selectedTemplate?.custom && selectedTemplate.id === t.id;
                  return (
                    <Card
                      key={`user-${t.id}`}
                      onClick={() => setSelectedTemplate(t)}
                      sx={{
                        flex: '0 0 auto', width: 150, cursor: 'pointer',
                        border: active ? '2px solid #667eea' : '1px solid var(--glass-border)',
                        background: active ? 'rgba(102,126,234,0.08)' : 'var(--bg-glass)',
                        transition: 'all 0.3s',
                        '&:hover': { borderColor: '#667eea', transform: 'translateY(-2px)' },
                      }}
                    >
                      <CardActionArea>
                        <Box sx={{ height: 110, overflow: 'hidden', borderBottom: '1px solid var(--glass-border)', background: '#fff' }}>
                          <HtmlFrame
                            html={`<style>${t.stylesheet}</style>${renderSample(t.html_template)}`}
                            title={`${t.name} preview`}
                          />
                        </Box>
                        <CardContent sx={{ p: 1.25, '&:last-child': { pb: 1.25 } }}>
                          <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, textAlign: 'center' }} noWrap>
                            {t.name}
                          </Typography>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  );
                })}
              </Box>
            </Box>
          )}

          {/* Template strip */}
          <Box sx={{ mb: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 1 }}>
              <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: 'text.secondary' }}>
                Templates
              </Typography>
              <Button component={RouterLink} to="/custom-design" size="small" sx={{ py: 0, fontSize: '0.75rem' }}>
                Design your own
              </Button>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1 }}>
              {templates.map((t) => {
                const active = !selectedTemplate?.custom && selectedTemplate?.id === t.id;
                return (
                  <Card
                    key={t.id}
                    onClick={() => setSelectedTemplate(t)}
                    sx={{
                      flex: '0 0 auto', width: 150, cursor: 'pointer',
                      border: active ? '2px solid #667eea' : '1px solid var(--glass-border)',
                      background: active ? 'rgba(102,126,234,0.08)' : 'var(--bg-glass)',
                      transition: 'all 0.3s',
                      '&:hover': { borderColor: '#667eea', transform: 'translateY(-2px)' },
                    }}
                  >
                    <CardActionArea>
                      <Box sx={{ height: 110, overflow: 'hidden', borderBottom: '1px solid var(--glass-border)' }}>
                        {templatePreviews[t.id]
                          ? <HtmlFrame html={templatePreviews[t.id]} title={`${t.name} preview`} />
                          : <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <CircularProgress size={16} sx={{ color: 'text.secondary' }} />
                            </Box>}
                      </Box>
                      <CardContent sx={{ p: 1.25, '&:last-child': { pb: 1.25 } }}>
                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, textAlign: 'center' }} noWrap>
                          {t.name}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                );
              })}
            </Box>
          </Box>

          {/* Editor + live preview */}
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={showPreview ? 7 : 12}>
              <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, fontFamily: "'Space Grotesk'" }}>
                  Edit your CV
                </Typography>
                <CvBuilder data={formData} setData={setFormData} />
              </Paper>
            </Grid>

            {showPreview && (
              <Grid item xs={12} md={5}>
                <Paper sx={{ p: 2, borderRadius: 3, position: 'sticky', top: 160 }}>
                  <Typography sx={{ fontWeight: 600, mb: 1, fontSize: '0.9rem', color: 'text.secondary' }}>
                    Live preview — {selectedTemplate?.name || 'no template'}
                  </Typography>
                  <CvPreview html={previewHtml} />
                </Paper>
              </Grid>
            )}
          </Grid>
        </Container>
      </Box>
    </Layout>
  );
}
