/** Option lists and defaults for the custom CV designer. */

export const FONT_OPTIONS = [
  { value: "Inter, system-ui, sans-serif", label: 'Inter' },
  { value: "Arial, Helvetica, sans-serif", label: 'Arial' },
  { value: "'Helvetica Neue', Helvetica, sans-serif", label: 'Helvetica' },
  { value: "Georgia, serif", label: 'Georgia' },
  { value: "'Times New Roman', Times, serif", label: 'Times New Roman' },
  { value: "Cambria, Georgia, serif", label: 'Cambria' },
  { value: "'Courier New', monospace", label: 'Courier New' },
  { value: "'Space Grotesk', Inter, sans-serif", label: 'Space Grotesk' },
  { value: "'Playfair Display', Georgia, serif", label: 'Playfair Display' },
];

export const PAGE_SIZES = {
  a4: { label: 'A4', width: 210, height: 297 },
  letter: { label: 'US Letter', width: 215.9, height: 279.4 },
};

/** Every section the generated template can draw, in a stable catalogue. */
export const SECTION_CATALOGUE = {
  contact: { label: 'Contact', defaultColumn: 'sidebar' },
  summary: { label: 'Summary', defaultColumn: 'main' },
  experience: { label: 'Experience', defaultColumn: 'main' },
  education: { label: 'Education', defaultColumn: 'main' },
  skills: { label: 'Skills', defaultColumn: 'sidebar' },
  languages: { label: 'Languages', defaultColumn: 'sidebar' },
  certifications: { label: 'Certifications', defaultColumn: 'main' },
  hobbies: { label: 'Hobbies', defaultColumn: 'sidebar' },
};

export const DEFAULT_SECTIONS = [
  { key: 'contact', label: 'Contact', enabled: true, column: 'sidebar' },
  { key: 'summary', label: 'Summary', enabled: true, column: 'main' },
  { key: 'experience', label: 'Experience', enabled: true, column: 'main' },
  { key: 'education', label: 'Education', enabled: true, column: 'main' },
  { key: 'skills', label: 'Skills', enabled: true, column: 'sidebar' },
  { key: 'languages', label: 'Languages', enabled: true, column: 'sidebar' },
  { key: 'certifications', label: 'Certifications', enabled: true, column: 'main' },
  { key: 'hobbies', label: 'Hobbies', enabled: true, column: 'sidebar' },
];

export const DEFAULT_DESIGN = {
  name: 'My design',

  sections: DEFAULT_SECTIONS,

  layout: 'single',            // single | sidebar
  sidebarSide: 'left',
  sidebarWidth: 32,            // % of the page
  columnGap: 24,               // px
  columnRule: { style: 'none', width: 1, color: '#dddddd' },

  page: { size: 'a4', margin: 14 },   // margin in mm

  font: {
    body: "Inter, system-ui, sans-serif",
    heading: "Inter, system-ui, sans-serif",
    size: 10.5,                // pt
    lineHeight: 1.35,
  },

  // Everything the user asked to be able to tighten up, in px unless noted.
  spacing: {
    paragraph: 4,              // gap between paragraphs
    section: 14,               // gap between sections
    entry: 9,                  // gap between jobs / degrees
    item: 3,                   // gap between list rows (contact, languages)
    heading: 6,                // gap under a section title
  },

  colors: {
    mode: 'color',             // color | mono  ("no colour" printing)
    background: '#ffffff',
    text: '#1f2937',           // primary text
    heading: '#111827',        // section titles
    name: '#111827',
    muted: '#6b7280',          // dates, labels
    accent: '#667eea',
    accent2: '#764ba2',
    link: '#2563eb',
    sidebarBg: '#f3f4f6',
    sidebarText: '#1f2937',
    rule: '#e5e7eb',           // section divider lines
  },

  header: {
    style: 'line',             // gradient | solid | line | none
    align: 'left',
    showPhoto: true,
    photoSize: 84,
    nameSize: 26,              // px
    titleSize: 12,             // px
  },

  headings: {
    size: 10,                  // px
    transform: 'uppercase',
    letterSpacing: 1.2,
    weight: 700,
    underline: 'line',         // line | bar | none
  },

  sectionDivider: 'none',      // none | line | double
  skillStyle: 'pill',          // pill | tag | plain | bar
  entryDateStyle: 'inline',    // inline | right
};

export const STORAGE_KEY = 'cv-custom-design';

/** Fill in anything a stored design predates, without losing what it set. */
export function mergeDesign(stored) {
  if (!stored || typeof stored !== 'object') return DEFAULT_DESIGN;
  const sections = Array.isArray(stored.sections) && stored.sections.length
    ? DEFAULT_SECTIONS.map((fallback) => {
        const found = stored.sections.find((s) => s.key === fallback.key);
        return found ? { ...fallback, ...found } : fallback;
      }).sort((a, b) => {
        const order = stored.sections.map((s) => s.key);
        return order.indexOf(a.key) - order.indexOf(b.key);
      })
    : DEFAULT_SECTIONS;

  return {
    ...DEFAULT_DESIGN,
    ...stored,
    page: { ...DEFAULT_DESIGN.page, ...stored.page },
    font: { ...DEFAULT_DESIGN.font, ...stored.font },
    spacing: { ...DEFAULT_DESIGN.spacing, ...stored.spacing },
    colors: { ...DEFAULT_DESIGN.colors, ...stored.colors },
    header: { ...DEFAULT_DESIGN.header, ...stored.header },
    headings: { ...DEFAULT_DESIGN.headings, ...stored.headings },
    columnRule: { ...DEFAULT_DESIGN.columnRule, ...stored.columnRule },
    sections,
  };
}
