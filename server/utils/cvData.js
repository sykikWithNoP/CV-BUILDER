const sanitizeHtml = require('sanitize-html');

/**
 * Shaping and cleaning of stored CV data, shared by the preview and PDF routes
 * so a downloaded CV always matches what the editor showed.
 */

const SKILL_LEVELS = {
  20: 'Beginner', 40: 'Elementary', 60: 'Intermediate', 80: 'Advanced', 100: 'Expert',
};

const LANGUAGE_LEVELS = {
  1: 'Basic', 2: 'Conversational', 3: 'Proficient', 4: 'Fluent', 5: 'Native',
};

const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&#x27;': "'", '&#x2F;': '/' };

function decodeEntities(value) {
  return String(value).replace(/&(?:amp|lt|gt|quot|#39|#x27|#x2F);/g, (match) => ENTITIES[match] || match);
}

/**
 * Strip any markup from user-supplied strings.
 *
 * The previous version ran sanitize-html over the whole JSON string, which
 * escaped every "&" in the document on each save (R&D -> R&amp;D -> R&amp;amp;D)
 * and risked breaking the JSON itself. This walks the object and cleans the
 * string leaves only, decoding the entities sanitize-html introduces so text
 * survives repeated saves unchanged.
 */
function sanitizeValue(value) {
  if (typeof value === 'string') {
    return decodeEntities(sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }));
  }
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, val]) => [key, sanitizeValue(val)]));
  }
  return value;
}

function levelLabel(entry, table) {
  const label = table[entry?.level];
  if (!label) return entry;
  return { ...entry, level: label, levelPercent: entry.level };
}

function hobbiesToList(hobbies) {
  return String(hobbies || '')
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean)
    .map((name) => ({ name }));
}

/**
 * @param {object} data   stored CV data
 * @param {object} [opts] { avatar } overrides the avatar URL (data URI for PDFs,
 *                        absolute URL for HTML previews)
 */
function buildTemplateData(data = {}, opts = {}) {
  const color1 = data.theme?.a || '#667eea';
  const color2 = data.theme?.b || '#764ba2';
  const hobbiesList = hobbiesToList(data.hobbies);

  return {
    ...data,
    avatar: opts.avatar !== undefined ? opts.avatar : data.avatar,
    education: (data.education || []).map((ed) => ({
      ...ed,
      year: ed.endDate || ed.startDate || ed.year || '',
    })),
    skills: (data.skills || []).map((s) => levelLabel(s, SKILL_LEVELS)),
    languages: (data.languages || []).map((l) => levelLabel(l, LANGUAGE_LEVELS)),
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
 * Mustache loops on the outer tag as well, so a CV with two jobs printed the
 * Experience block twice, each copy listing both jobs. Rewriting the outer pair
 * to a boolean flag repairs every stored template at render time.
 * Mirrors client/src/utils/cv.js.
 */
function normalizeTemplate(template) {
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

module.exports = { buildTemplateData, sanitizeValue, decodeEntities, hobbiesToList, normalizeTemplate };
