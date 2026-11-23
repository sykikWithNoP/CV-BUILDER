import { PAGE_SIZES } from '../constants/customDesign';

/**
 * Turns a design config into a real template: a Mustache HTML string plus a
 * stylesheet, in exactly the shape the built-in templates use.
 *
 * That is what makes a saved design usable — the same output drives the
 * designer preview, the dashboard live preview and the server-rendered PDF,
 * instead of the designer painting a picture nothing else can reproduce.
 */

const MM_TO_PX = 96 / 25.4;

/** In mono mode every accent collapses to the text colour: printable, no colour. */
function palette(config) {
  const c = config.colors;
  if (c.mode === 'mono') {
    return {
      ...c,
      background: '#ffffff',
      accent: c.text,
      accent2: c.text,
      link: c.text,
      heading: c.text,
      name: c.text,
      sidebarBg: 'transparent',
      sidebarText: c.text,
      rule: '#000000',
    };
  }
  return c;
}

function headerCss(config, p) {
  const { style, align } = config.header;
  const common = `display:flex;gap:16px;align-items:center;justify-content:${
    align === 'center' ? 'center' : 'space-between'
  };text-align:${align};`;

  if (style === 'gradient') {
    return `${common}background:linear-gradient(135deg,${p.accent},${p.accent2});color:#fff;padding:18px 20px;`;
  }
  if (style === 'solid') {
    return `${common}background:${p.accent};color:#fff;padding:18px 20px;`;
  }
  if (style === 'line') {
    return `${common}border-bottom:2px solid ${p.accent};padding-bottom:10px;`;
  }
  return common;
}

function headingUnderline(config, p) {
  if (config.headings.underline === 'line') return `border-bottom:1px solid ${p.rule};padding-bottom:3px;`;
  if (config.headings.underline === 'bar') return `border-left:3px solid ${p.accent};padding-left:8px;`;
  return '';
}

function skillCss(config, p) {
  switch (config.skillStyle) {
    case 'tag':
      return `display:inline-block;margin:0 5px 5px 0;padding:2px 8px;background:${p.rule};border-radius:3px;`;
    case 'plain':
      return 'display:inline;margin-right:6px;';
    case 'bar':
      return 'display:block;margin-bottom:5px;';
    case 'pill':
    default:
      return `display:inline-block;margin:0 5px 5px 0;padding:2px 10px;border:1px solid ${p.accent};border-radius:999px;`;
  }
}

function buildCss(config) {
  const p = palette(config);
  const s = config.spacing;
  const page = PAGE_SIZES[config.page.size] || PAGE_SIZES.a4;
  const sidebar = config.layout === 'sidebar';
  const headerOnTop = !sidebar || config.header.style !== 'none';

  const columnRule = config.columnRule.style === 'none'
    ? ''
    : `border-${config.sidebarSide === 'left' ? 'right' : 'left'}:${config.columnRule.width}px ${config.columnRule.style} ${
        config.colors.mode === 'mono' ? '#000' : config.columnRule.color
      };`;

  const sectionDivider = config.sectionDivider === 'line'
    ? `border-top:1px solid ${p.rule};padding-top:${s.section}px;`
    : config.sectionDivider === 'double'
      ? `border-top:3px double ${p.accent};padding-top:${s.section}px;`
      : '';

  return `
@page{size:${page.label === 'A4' ? 'A4' : 'letter'};margin:${config.page.margin}mm;}
*{box-sizing:border-box;}
html,body{margin:0;padding:0;background:${p.background};}
body{font-family:${config.font.body};font-size:${config.font.size}pt;line-height:${config.font.lineHeight};color:${p.text};-webkit-print-color-adjust:exact;print-color-adjust:exact;}
p{margin:0 0 ${s.paragraph}px;}
p:last-child{margin-bottom:0;}
a{color:${p.link};text-decoration:none;}

.cv-root{background:${p.background};${sidebar ? '' : `padding:0;`}}
.cv-header{${headerCss(config, p)}}
.cv-name{margin:0;font-family:${config.font.heading};font-size:${config.header.nameSize}px;font-weight:700;color:${
    ['gradient', 'solid'].includes(config.header.style) ? '#ffffff' : p.name
  };line-height:1.15;}
.cv-subtitle{margin:2px 0 0;font-size:${config.header.titleSize}px;color:${
    ['gradient', 'solid'].includes(config.header.style) ? 'rgba(255,255,255,.85)' : p.muted
  };}
.cv-photo{width:${config.header.photoSize}px;height:${config.header.photoSize}px;border-radius:50%;object-fit:cover;flex:0 0 auto;}

${sidebar
  ? `.cv-body{display:flex;align-items:stretch;gap:${config.columnGap}px;${headerOnTop ? `margin-top:${s.section}px;` : ''}}
.cv-col-sidebar{flex:0 0 ${config.sidebarWidth}%;max-width:${config.sidebarWidth}%;background:${p.sidebarBg};color:${p.sidebarText};padding:${p.sidebarBg === 'transparent' ? '0' : '14px'};${columnRule}${
      config.sidebarSide === 'left' ? '' : 'order:2;'
    }}
.cv-col-main{flex:1 1 auto;min-width:0;${config.sidebarSide === 'left' ? '' : 'order:1;'}}
.cv-col-sidebar .cv-title{color:${p.sidebarText};}
.cv-col-sidebar .cv-label,.cv-col-sidebar .cv-entry-meta{color:${p.sidebarText};opacity:.75;}`
  : `.cv-body{display:block;${headerOnTop ? `margin-top:${s.section}px;` : ''}}
.cv-col-sidebar,.cv-col-main{display:block;}`}

.cv-section{margin-bottom:${s.section}px;}
.cv-section:last-child{margin-bottom:0;}
.cv-section + .cv-section{${sectionDivider}}
.cv-title{margin:0 0 ${s.heading}px;font-family:${config.font.heading};font-size:${config.headings.size}px;font-weight:${config.headings.weight};letter-spacing:${config.headings.letterSpacing}px;text-transform:${config.headings.transform};color:${p.heading === p.text && config.colors.mode !== 'mono' ? p.accent : p.heading};${headingUnderline(config, p)}}

.cv-entry{margin-bottom:${s.entry}px;}
.cv-entry:last-child{margin-bottom:0;}
.cv-entry-head{${config.entryDateStyle === 'right' ? 'display:flex;justify-content:space-between;gap:10px;align-items:baseline;' : ''}}
.cv-entry-title{font-weight:700;}
.cv-entry-sub{color:${p.muted};}
.cv-entry-meta{color:${p.muted};font-size:.9em;white-space:nowrap;}
.cv-text{margin:${s.paragraph}px 0 0;}

.cv-list{margin:0;padding:0;list-style:none;}
.cv-list li{margin-bottom:${s.item}px;}
.cv-list li:last-child{margin-bottom:0;}
.cv-label{color:${p.muted};}

.cv-skill{${skillCss(config, p)}}
.cv-skill-bar{height:4px;border-radius:2px;background:${p.rule};margin-top:2px;}
.cv-skill-bar span{display:block;height:100%;border-radius:2px;background:${p.accent};}
.cv-hobby{display:inline-block;margin:0 5px 5px 0;padding:1px 8px;border:1px solid ${p.rule};border-radius:999px;}

/* Keep a job, degree or certificate whole: when it no longer fits, the whole
   block moves to the next page instead of being cut in half or dropped. */
.cv-entry,.cv-list li,.cv-hobby,.cv-skill{break-inside:avoid;page-break-inside:avoid;}
.cv-title{break-after:avoid;page-break-after:avoid;}
.cv-section{break-inside:auto;page-break-inside:auto;}
.cv-header{break-after:avoid;page-break-after:avoid;}
`.trim();
}

/* ---------- HTML (Mustache) ---------- */

const SECTION_HTML = {
  contact: (label) => `{{#hasContact}}<section class="cv-section"><h2 class="cv-title">${label}</h2><ul class="cv-list">` +
    '{{#email}}<li><span class="cv-label">Email:</span> {{email}}</li>{{/email}}' +
    '{{#phone}}<li><span class="cv-label">Phone:</span> {{phone}}</li>{{/phone}}' +
    '{{#location}}<li><span class="cv-label">Location:</span> {{location}}</li>{{/location}}' +
    '{{#linkedin}}<li><span class="cv-label">LinkedIn:</span> {{linkedin}}</li>{{/linkedin}}' +
    '{{#github}}<li><span class="cv-label">GitHub:</span> {{github}}</li>{{/github}}' +
    '{{#website}}<li><span class="cv-label">Web:</span> {{website}}</li>{{/website}}' +
    '</ul></section>{{/hasContact}}',

  summary: (label) => `{{#summary}}<section class="cv-section"><h2 class="cv-title">${label}</h2><p>{{summary}}</p></section>{{/summary}}`,

  experience: (label, config) => `{{#hasExperience}}<section class="cv-section"><h2 class="cv-title">${label}</h2>` +
    '{{#experience}}<article class="cv-entry"><div class="cv-entry-head">' +
    '<span class="cv-entry-title">{{title}}</span>' +
    (config.entryDateStyle === 'right'
      ? '<span class="cv-entry-meta">{{start}}{{#end}} – {{end}}{{/end}}{{^end}} – Present{{/end}}</span></div>'
      : '</div>') +
    '<div class="cv-entry-sub">{{company}}' +
    (config.entryDateStyle === 'right'
      ? ''
      : ' <span class="cv-entry-meta">· {{start}}{{#end}} – {{end}}{{/end}}{{^end}} – Present{{/end}}</span>') +
    '</div>{{#description}}<p class="cv-text">{{description}}</p>{{/description}}</article>{{/experience}}' +
    '</section>{{/hasExperience}}',

  education: (label) => '{{#hasEducation}}<section class="cv-section"><h2 class="cv-title">' + label + '</h2>' +
    '{{#education}}<article class="cv-entry"><div class="cv-entry-head"><span class="cv-entry-title">{{degree}}</span></div>' +
    '<div class="cv-entry-sub">{{school}}{{#year}} <span class="cv-entry-meta">· {{year}}</span>{{/year}}</div>' +
    '{{#grade}}<div class="cv-entry-meta">{{grade}}</div>{{/grade}}</article>{{/education}}' +
    '</section>{{/hasEducation}}',

  skills: (label, config) => '{{#hasSkills}}<section class="cv-section"><h2 class="cv-title">' + label + '</h2><div>' +
    (config.skillStyle === 'bar'
      ? '{{#skills}}<div class="cv-skill">{{name}}<div class="cv-skill-bar"><span style="width:{{levelPercent}}%"></span></div></div>{{/skills}}'
      : '{{#skills}}<span class="cv-skill">{{name}}</span>{{/skills}}') +
    '</div></section>{{/hasSkills}}',

  languages: (label) => '{{#hasLanguages}}<section class="cv-section"><h2 class="cv-title">' + label + '</h2><ul class="cv-list">' +
    '{{#languages}}<li>{{name}}{{#level}} <span class="cv-label">— {{level}}</span>{{/level}}</li>{{/languages}}' +
    '</ul></section>{{/hasLanguages}}',

  certifications: (label) => '{{#hasCertifications}}<section class="cv-section"><h2 class="cv-title">' + label + '</h2><ul class="cv-list">' +
    '{{#certifications}}<li class="cv-entry"><span class="cv-entry-title">{{name}}</span>{{#issuer}} — {{issuer}}{{/issuer}}' +
    '{{#year}} <span class="cv-entry-meta">({{year}})</span>{{/year}}{{#link}} <a href="{{link}}">View</a>{{/link}}</li>{{/certifications}}' +
    '</ul></section>{{/hasCertifications}}',

  hobbies: (label) => '{{#hasHobbies}}<section class="cv-section"><h2 class="cv-title">' + label + '</h2><div>' +
    '{{#hobbiesList}}<span class="cv-hobby">{{name}}</span>{{/hobbiesList}}' +
    '</div></section>{{/hasHobbies}}',
};

function buildHtml(config) {
  const enabled = config.sections.filter((s) => s.enabled && SECTION_HTML[s.key]);
  const render = (section) => SECTION_HTML[section.key](section.label || section.key, config);

  const inColumn = (column) =>
    enabled
      .filter((s) => (config.layout === 'sidebar' ? s.column === column : column === 'main'))
      .map(render)
      .join('');

  const photo = config.header.showPhoto
    ? '{{#avatar}}<img class="cv-photo" src="{{avatar}}" alt="" />{{/avatar}}'
    : '';

  const header = config.header.style === 'none'
    ? ''
    : `<header class="cv-header"><div><h1 class="cv-name">{{firstName}} {{lastName}}</h1>` +
      `{{#jobTitle}}<p class="cv-subtitle">{{jobTitle}}</p>{{/jobTitle}}</div>${photo}</header>`;

  if (config.layout === 'sidebar') {
    return `<div class="cv-root">${header}<div class="cv-body">` +
      `<aside class="cv-col-sidebar">${inColumn('sidebar')}</aside>` +
      `<main class="cv-col-main">${inColumn('main')}</main>` +
      '</div></div>';
  }

  return `<div class="cv-root">${header}<div class="cv-body"><main class="cv-col-main">${inColumn('main')}</main></div></div>`;
}

/**
 * @returns {{ html: string, css: string, print: { margin: number, size: string } }}
 */
export function buildCustomTemplate(config) {
  return {
    html: buildHtml(config),
    css: buildCss(config),
    print: { margin: config.page.margin, size: config.page.size },
  };
}

/** Height of one printable page in CSS pixels — used to draw page guides. */
export function pageContentHeightPx(config) {
  const page = PAGE_SIZES[config.page.size] || PAGE_SIZES.a4;
  return Math.round((page.height - config.page.margin * 2) * MM_TO_PX);
}

/** Width of the printable area in CSS pixels. */
export function pageContentWidthPx(config) {
  const page = PAGE_SIZES[config.page.size] || PAGE_SIZES.a4;
  return Math.round((page.width - config.page.margin * 2) * MM_TO_PX);
}
