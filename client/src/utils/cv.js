import {
  ARRAY_SECTIONS, COMPLETENESS_CHECKS, DEFAULT_THEME, LANGUAGE_LEVELS, SKILL_LEVELS,
} from '../constants/cv';

/** Collision-free row id. Date.now() gave duplicates on fast clicks. */
export function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * CVs saved by older versions have rows without ids (or with colliding numeric
 * ones), which breaks React keys and id-based updates. Give every row an id once,
 * on load.
 */
export function withStableIds(data = {}) {
  const next = { ...data };
  const seen = new Set();
  for (const section of ARRAY_SECTIONS) {
    if (!Array.isArray(next[section])) continue;
    next[section] = next[section].map((entry) => {
      const id = entry?.id;
      if (id == null || seen.has(id)) return { ...entry, id: createId() };
      seen.add(id);
      return entry;
    });
  }
  return next;
}

export function completeness(data = {}) {
  const results = COMPLETENESS_CHECKS.map((check) => ({
    key: check.key,
    label: check.label,
    done: (() => {
      try { return !!check.test(data); } catch { return false; }
    })(),
  }));
  const done = results.filter((r) => r.done).length;
  return {
    percent: Math.round((done / results.length) * 100),
    missing: results.filter((r) => !r.done).map((r) => r.label),
  };
}

export function hobbiesToList(hobbies) {
  return String(hobbies || '')
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean)
    .map((name) => ({ name }));
}

/**
 * Shape the form state the way the Mustache templates expect it.
 * The server does the same thing before rendering the PDF — keep both in step so
 * the live preview and the download match.
 */
export function buildTemplateData(data = {}, { origin = '' } = {}) {
  const color1 = data.theme?.a || DEFAULT_THEME.a;
  const color2 = data.theme?.b || DEFAULT_THEME.b;

  let avatar = data.avatar || '';
  if (avatar && !avatar.startsWith('data:') && !avatar.startsWith('http')) {
    avatar = `${origin}${avatar}`;
  }

  const hobbiesList = hobbiesToList(data.hobbies);

  return {
    ...data,
    avatar,
    education: (data.education || []).map((ed) => ({
      ...ed,
      year: ed.endDate || ed.startDate || ed.year || '',
    })),
    skills: (data.skills || []).map((skill) => withLevelLabel(skill, SKILL_LEVELS)),
    languages: (data.languages || []).map((lang) => withLevelLabel(lang, LANGUAGE_LEVELS)),
    color1,
    color2,
    hobbiesList,
    hasHobbies: hobbiesList.length > 0,
    hasContact: !!(data.email || data.phone || data.location || data.linkedin || data.github || data.website),
    hasExperience: (data.experience || []).length > 0,
    hasEducation: (data.education || []).length > 0,
    hasSkills: (data.skills || []).length > 0,
    hasLanguages: (data.languages || []).length > 0,
    hasCertifications: (data.certifications || []).length > 0,
  };
}

const WRAPPER_SECTIONS = {
  experience: 'hasExperience',
  education: 'hasEducation',
  skills: 'hasSkills',
  languages: 'hasLanguages',
  certifications: 'hasCertifications',
};

/**
 * Templates wrap a list section in `{{#experience}} … {{#experience}} … {{/experience}} … {{/experience}}`.
 * Mustache treats the outer tag as a loop too, so a CV with two jobs rendered the
 * whole Experience block twice, each copy listing both jobs. Rewriting the outer
 * pair to a boolean flag fixes every template — built-in or saved — without
 * having to edit them by hand.
 */
export function normalizeTemplate(template) {
  let out = String(template || '');
  for (const [key, flag] of Object.entries(WRAPPER_SECTIONS)) {
    out = rewriteOuterSection(out, key, flag);
  }
  return out;
}

function positionsOf(text, token) {
  const found = [];
  let index = text.indexOf(token);
  while (index !== -1) {
    found.push(index);
    index = text.indexOf(token, index + token.length);
  }
  return found;
}

function rewriteOuterSection(text, key, flag) {
  const open = `{{#${key}}}`;
  const close = `{{/${key}}}`;
  const opens = positionsOf(text, open);
  if (opens.length < 2) return text;

  const events = [
    ...opens.map((i) => ({ i, type: 'open' })),
    ...positionsOf(text, close).map((i) => ({ i, type: 'close' })),
  ].sort((a, b) => a.i - b.i);

  const stack = [];
  const pairs = [];
  for (const event of events) {
    if (event.type === 'open') stack.push(event.i);
    else {
      const start = stack.pop();
      if (start !== undefined) pairs.push({ start, end: event.i, depth: stack.length });
    }
  }

  const wrappers = pairs.filter(
    (pair) => pair.depth === 0 && opens.some((i) => i > pair.start && i < pair.end)
  );
  if (!wrappers.length) return text;

  // Replace from the back so earlier offsets stay valid.
  const edits = wrappers
    .flatMap((pair) => [
      { at: pair.start, length: open.length, text: `{{#${flag}}}` },
      { at: pair.end, length: close.length, text: `{{/${flag}}}` },
    ])
    .sort((a, b) => b.at - a.at);

  let result = text;
  for (const edit of edits) {
    result = result.slice(0, edit.at) + edit.text + result.slice(edit.at + edit.length);
  }
  return result;
}

/**
 * Templates print `{{level}}` verbatim, but the editor stores levels as numbers,
 * which is how CVs ended up saying "English — 5". Hand the templates the label
 * and keep the raw number under levelPercent for anything that wants a bar.
 */
function withLevelLabel(entry, levels) {
  const match = levels.find((l) => l.value === entry.level);
  if (!match) return entry;
  return { ...entry, level: match.label, levelPercent: entry.level };
}

/** Month input value ("2024-03") to something a reader wants to see. */
export function formatMonth(value) {
  if (!value) return '';
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return value;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, 1);
  return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

/** Dates are stored as "YYYY-MM"; flag ranges that run backwards. */
export function isRangeInvalid(start, end) {
  return !!(start && end && end < start);
}

export function cvFileName(data = {}) {
  const parts = [data.firstName, data.lastName].map((p) => String(p || '').trim()).filter(Boolean);
  const name = parts.length ? parts.join('_') : 'My';
  const safe = name.replace(/[^a-zA-Z0-9_-]/g, '');
  return `CV_${safe || 'My'}_${new Date().toISOString().slice(0, 10)}.pdf`;
}
