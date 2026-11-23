/** Shared option lists and empty-entry factories for the CV editor. */

export const SKILL_LEVELS = [
  { value: 20, label: 'Beginner' },
  { value: 40, label: 'Elementary' },
  { value: 60, label: 'Intermediate' },
  { value: 80, label: 'Advanced' },
  { value: 100, label: 'Expert' },
];

export const LANGUAGE_LEVELS = [
  { value: 1, label: 'Basic' },
  { value: 2, label: 'Conversational' },
  { value: 3, label: 'Proficient' },
  { value: 4, label: 'Fluent' },
  { value: 5, label: 'Native' },
];

export const THEME_SWATCHES = [
  { a: '#667eea', b: '#764ba2', label: 'Indigo Purple' },
  { a: '#f093fb', b: '#f5576c', label: 'Pink Red' },
  { a: '#4facfe', b: '#00f2fe', label: 'Blue Cyan' },
  { a: '#43e97b', b: '#38f9d7', label: 'Green Mint' },
  { a: '#fa709a', b: '#fee140', label: 'Pink Gold' },
  { a: '#2c3e50', b: '#4ca1af', label: 'Teal Dark' },
  { a: '#e96c4c', b: '#f7b733', label: 'Orange Warm' },
  { a: '#1a1a2e', b: '#16213e', label: 'Midnight' },
  { a: '#ffffff', b: '#f0f0f0', label: 'White Clean' },
  { a: '#b8860b', b: '#d4a843', label: 'Rose Gold' },
  { a: '#059669', b: '#10b981', label: 'Emerald' },
  { a: '#0284c7', b: '#38bdf8', label: 'Ocean' },
  { a: '#dc2626', b: '#f97316', label: 'Sunset' },
  { a: '#374151', b: '#6b7280', label: 'Charcoal' },
  { a: '#7c3aed', b: '#a78bfa', label: 'Lavender' },
  { a: '#e11d48', b: '#fb7185', label: 'Coral' },
  { a: '#0d9488', b: '#5eead4', label: 'Teal' },
  { a: '#92400e', b: '#d97706', label: 'Amber' },
  { a: '#4338ca', b: '#818cf8', label: 'Violet' },
];

export const DEFAULT_THEME = { a: '#667eea', b: '#764ba2' };

/** Array-backed sections of the CV and the shape of a fresh row in each. */
export const EMPTY_ENTRY = {
  experience: { title: '', company: '', start: '', end: '', description: '' },
  education: { degree: '', school: '', startDate: '', endDate: '', grade: '' },
  skills: { name: '', level: 60 },
  languages: { name: '', level: 3 },
  certifications: { name: '', issuer: '', year: '', link: '' },
};

export const ARRAY_SECTIONS = Object.keys(EMPTY_ENTRY);

/**
 * Checks that drive the completeness meter. Each one that passes is worth an
 * equal share, and the labels double as the "what's missing" hints.
 */
export const COMPLETENESS_CHECKS = [
  { key: 'name', label: 'Full name', test: (d) => !!(str(d.firstName) && str(d.lastName)) },
  { key: 'jobTitle', label: 'Job title', test: (d) => !!str(d.jobTitle) },
  { key: 'email', label: 'Email', test: (d) => !!str(d.email) },
  { key: 'phone', label: 'Phone', test: (d) => !!str(d.phone) },
  { key: 'location', label: 'Location', test: (d) => !!str(d.location) },
  { key: 'summary', label: 'Professional summary', test: (d) => str(d.summary).length >= 40 },
  { key: 'experience', label: 'Work experience', test: (d) => (d.experience || []).some((e) => str(e.title) && str(e.company)) },
  { key: 'education', label: 'Education', test: (d) => (d.education || []).some((e) => str(e.degree) || str(e.school)) },
  { key: 'skills', label: 'Skills', test: (d) => (d.skills || []).some((s) => str(s.name)) },
];

function str(value) {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();
}
