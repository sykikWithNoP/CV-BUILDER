// Seed script: node db/seed_templates.js
// Run from server/ directory to add 20 new templates + update existing ones
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(__dirname, '..', 'cv_builder.db');
const db = new sqlite3.Database(dbPath);

const run = (sql, params = []) => new Promise((res, rej) => db.run(sql, params, function(e) { e ? rej(e) : res(this); }));

// Shared HTML builder
function buildHTML(opts = {}) {
  const wrap = opts.wrap || 'div';
  const hdrTag = opts.sidebar ? 'aside' : 'section';
  const mainTag = opts.sidebar ? 'main' : 'div';
  const certLink = '{{#link}} <a class="cv-cert-link" href="{{link}}" target="_blank">View</a>{{/link}}';
  const avatar = '{{#avatar}}<img src="{{avatar}}" alt="" style="width:' + (opts.avatarSize||100) + 'px;height:' + (opts.avatarSize||100) + 'px;border-radius:50%;object-fit:cover;' + (opts.avatarStyle||'') + '"/>{{/avatar}}';

  const contactBlock = '<ul class="cv-list">{{#email}}<li>{{email}}</li>{{/email}}{{#phone}}<li>{{phone}}</li>{{/phone}}{{#location}}<li>{{location}}</li>{{/location}}{{#linkedin}}<li>{{linkedin}}</li>{{/linkedin}}{{#github}}<li>{{github}}</li>{{/github}}</ul>';
  const summaryBlock = '{{#summary}}<section class="cv-section"><h2 class="cv-title">Summary</h2><p>{{summary}}</p></section>{{/summary}}';
  const expBlock = '{{#experience}}<section class="cv-section"><h2 class="cv-title">Experience</h2><ul class="cv-list">{{#experience}}<li><strong>{{title}}</strong> — {{company}}<br/><span class="cv-label">{{start}} – {{end}}</span><br/>{{description}}</li>{{/experience}}</ul></section>{{/experience}}';
  const eduBlock = '{{#education}}<section class="cv-section"><h2 class="cv-title">Education</h2><ul class="cv-list">{{#education}}<li><strong>{{degree}}</strong>, {{school}} ({{year}})</li>{{/education}}</ul></section>{{/education}}';
  const skillBlock = '{{#skills}}<section class="cv-section"><h2 class="cv-title">Skills</h2><div>{{#skills}}<span class="cv-skill">{{name}}</span>{{/skills}}</div></section>{{/skills}}';
  const langBlock = '{{#languages}}<section class="cv-section"><h2 class="cv-title">Languages</h2><ul class="cv-list">{{#languages}}<li>{{name}} — {{level}}</li>{{/languages}}</ul></section>{{/languages}}';
  const certBlock = '{{#certifications}}<section class="cv-section"><h2 class="cv-title">Certifications</h2><ul class="cv-list">{{#certifications}}<li>{{name}} — {{issuer}} ({{year}})' + certLink + '</li>{{/certifications}}</ul></section>{{/certifications}}';
  const hobbyBlock = '{{#hasHobbies}}<section class="cv-section"><h2 class="cv-title">Hobbies</h2><div>{{#hobbiesList}}<span class="cv-hobby">{{name}}</span>{{/hobbiesList}}</div></section>{{/hasHobbies}}';

  if (opts.sidebar) {
    return `<div class="cv-root"><aside class="cv-sidebar">${avatar}<h1 class="cv-name">{{firstName}} {{lastName}}</h1><p class="cv-subtitle">{{jobTitle}}</p><h2 class="cv-title">Contact</h2>${contactBlock}${skillBlock}${langBlock}</aside><main class="cv-main">${summaryBlock}${expBlock}${eduBlock}${certBlock}${hobbyBlock}</main></div>`;
  }

  const header = `<section class="cv-header"><div>${opts.avatarInHeader ? '' : ''}<h1 class="cv-name">{{firstName}} {{lastName}}</h1><p class="cv-subtitle">{{jobTitle}}</p></div>${opts.avatarInHeader ? avatar : ''}</section>`;
  return `<div class="cv-root">${header}<section class="cv-section"><h2 class="cv-title">Contact</h2>${contactBlock}</section>${summaryBlock}${expBlock}${eduBlock}${skillBlock}${langBlock}${certBlock}${hobbyBlock}</div>`;
}

// Base CSS builder
function buildCSS(o) {
  const bg = o.bg||'#fff'; const fg = o.fg||'#333'; const accent = 'var(--cv-c1,'+( o.accent||'#667eea')+')'; const accent2 = 'var(--cv-c2,'+(o.accent2||o.accent||'#764ba2')+')';
  const ff = o.ff||'Inter,system-ui,sans-serif'; const hdrBg = o.hdrBg||accent;
  let css = `body{margin:0;font-family:${ff};color:${fg};background:${o.pageBg||'#fff'}}.cv-root{max-width:${o.maxW||'850px'};margin:auto;padding:${o.pad||'36px'};background:${bg}}`;
  if (o.sidebar) {
    css = `body{margin:0;font-family:${ff};color:${fg};background:#f5f5f5}.cv-root{max-width:900px;margin:auto;display:grid;grid-template-columns:${o.sideW||'260px'} 1fr;min-height:100vh}.cv-sidebar{background:${o.sideBg||'#1a1a2e'};color:${o.sideFg||'#e2e8f0'};padding:32px 20px}.cv-sidebar .cv-name{font-size:1.5rem;color:#fff;margin:16px 0 4px}.cv-sidebar .cv-subtitle{color:#94a3b8;font-size:.9rem;margin:0 0 20px}.cv-sidebar .cv-title{font-size:.7rem;letter-spacing:.15em;text-transform:uppercase;color:${accent};margin:18px 0 8px;font-weight:700}.cv-sidebar .cv-list{margin:0;padding:0;list-style:none}.cv-sidebar .cv-list li{margin-bottom:6px;font-size:.85rem;color:#cbd5e1}.cv-sidebar .cv-skill{display:inline-block;margin:0 5px 5px 0;padding:3px 10px;background:rgba(255,255,255,.1);border-radius:10px;font-size:.8rem;color:#e2e8f0}.cv-main{padding:32px}`;
    css += `.cv-main .cv-title{font-size:.8rem;letter-spacing:.1em;text-transform:uppercase;color:${accent};border-bottom:2px solid ${accent};padding-bottom:4px;margin:20px 0 12px;font-weight:700}.cv-main .cv-list{margin:0;padding:0;list-style:none}.cv-main .cv-list li{margin-bottom:12px;line-height:1.6}.cv-main .cv-label{color:#64748b;font-size:.85rem}`;
  } else {
    css += `.cv-header{${o.hdrStyle||'padding:24px;border-bottom:2px solid '+accent+';display:flex;justify-content:space-between;align-items:center'}}.cv-name{margin:0;font-size:${o.nameSize||'2rem'};color:${o.nameFg||fg};font-weight:${o.nameWeight||700}}.cv-subtitle{margin:4px 0 0;font-size:1rem;color:${o.subFg||'#666'}}.cv-section{padding:16px 0}.cv-section+.cv-section{border-top:1px solid ${o.divider||'#eee'}}.cv-title{margin:0 0 12px;font-size:.8rem;letter-spacing:.15em;text-transform:uppercase;color:${accent};font-weight:700}.cv-list{margin:0;padding:0;list-style:none}.cv-list li{margin-bottom:8px;line-height:1.7}.cv-label{color:#888;font-size:.85rem}`;
  }
  css += `.cv-skill{display:inline-block;margin:0 6px 6px 0;padding:5px 12px;background:${o.skillBg||'#f0f0f0'};border-radius:${o.skillRad||'4px'};font-size:.85rem;color:${o.skillFg||fg}}.cv-cert-link{color:${accent};text-decoration:none}.cv-cert-link:hover{text-decoration:underline}.cv-hobby{display:inline-block;margin:0 6px 6px 0;padding:4px 10px;background:${o.hobbyBg||o.skillBg||'#f0f0f0'};border-radius:${o.skillRad||'4px'};font-size:.85rem}`;
  return css;
}

const templates = [
  { name:'Professional Gray',desc:'Clean gray-toned professional layout.',css:{accent:'#4b5563',accent2:'#6b7280',ff:"'Inter',sans-serif",bg:'#fff',fg:'#1f2937',divider:'#e5e7eb',skillBg:'#f3f4f6'},html:{avatarInHeader:true,avatarSize:80,avatarStyle:'border:2px solid #4b5563;'}},
  { name:'Creative Coral',desc:'Vibrant coral accents for creative roles.',css:{accent:'#ef4444',accent2:'#f97316',bg:'#fff',fg:'#1e1e1e',skillBg:'#fef2f2',skillRad:'20px'},html:{avatarInHeader:true,avatarSize:90,avatarStyle:'border:3px solid #ef4444;'}},
  { name:'Tech Matrix',desc:'Developer-focused dark tech layout.',css:{accent:'#22c55e',accent2:'#16a34a',bg:'#0f172a',fg:'#e2e8f0',pageBg:'#0f172a',divider:'rgba(255,255,255,.08)',skillBg:'rgba(34,197,94,.1)',skillFg:'#22c55e',nameWeight:800},html:{avatarInHeader:true,avatarSize:80,avatarStyle:'border:2px solid #22c55e;'}},
  { name:'Bold Burgundy',desc:'Rich burgundy tones for executive presence.',css:{accent:'#881337',accent2:'#be123c',ff:"Georgia,serif",bg:'#fff',fg:'#1c1917',skillBg:'#fdf2f8',divider:'#fce7f3'},html:{avatarInHeader:true,avatarSize:90,avatarStyle:'border:3px solid #881337;'}},
  { name:'Clean Lines',desc:'Minimalist design with sharp lines.',css:{accent:'#0ea5e9',accent2:'#0284c7',bg:'#fff',fg:'#334155',skillBg:'#f0f9ff',skillRad:'2px'},html:{avatarInHeader:false,avatarSize:80}},
  { name:'Academic CV',desc:'Formal academic curriculum vitae style.',css:{accent:'#1e3a5f',accent2:'#2563eb',ff:"'Times New Roman',serif",bg:'#fff',fg:'#111',nameSize:'1.8rem',divider:'#ccc'},html:{avatarInHeader:false}},
  { name:'Nordic Frost',desc:'Cool Nordic-inspired clean layout.',css:{accent:'#6366f1',accent2:'#818cf8',bg:'#fafbff',fg:'#312e81',pageBg:'#eef2ff',skillBg:'#e0e7ff',skillRad:'8px'},html:{avatarInHeader:true,avatarSize:85,avatarStyle:'border:3px solid #6366f1;'}},
  { name:'Sunset Gradient',desc:'Warm sunset colors for a standout CV.',css:{accent:'#ea580c',accent2:'#f59e0b',bg:'#fff',fg:'#292524',skillBg:'#fff7ed',skillRad:'20px'},html:{avatarInHeader:true,avatarSize:90,avatarStyle:'border:3px solid #ea580c;'}},
  { name:'Dark Elegance',desc:'Sophisticated dark layout.',css:{accent:'#a78bfa',accent2:'#7c3aed',bg:'#1e1b4b',fg:'#e0e7ff',pageBg:'#0f0a2a',divider:'rgba(167,139,250,.2)',skillBg:'rgba(167,139,250,.12)',skillFg:'#c4b5fd'},html:{avatarInHeader:true,avatarSize:90,avatarStyle:'border:3px solid #a78bfa;'}},
  { name:'Green Professional',desc:'Fresh green professional theme.',css:{accent:'#059669',accent2:'#10b981',bg:'#fff',fg:'#1a1a1a',skillBg:'#ecfdf5',skillRad:'6px'},html:{avatarInHeader:true,avatarSize:85,avatarStyle:'border:2px solid #059669;'}},
  { name:'Two Column Classic',desc:'Traditional two-column sidebar layout.',sidebar:true,css:{accent:'#3b82f6',accent2:'#1d4ed8',sideBg:'#1e293b',sideW:'260px'},html:{sidebar:true,avatarSize:110,avatarStyle:'border:3px solid #3b82f6;display:block;margin:0 auto;'}},
  { name:'Corporate Blue',desc:'Corporate blue sidebar layout.',sidebar:true,css:{accent:'#2563eb',accent2:'#1e40af',sideBg:'linear-gradient(180deg,#1e3a5f,#172554)'},html:{sidebar:true,avatarSize:110,avatarStyle:'border:3px solid #60a5fa;display:block;margin:0 auto;'}},
  { name:'Designer Portfolio',desc:'Creative portfolio-style layout.',css:{accent:'#ec4899',accent2:'#db2777',bg:'#fff',fg:'#18181b',skillBg:'#fdf2f8',skillRad:'999px',nameSize:'2.5rem',nameWeight:300},html:{avatarInHeader:true,avatarSize:100,avatarStyle:'border:3px solid #ec4899;'}},
  { name:'Simple Modern',desc:'Simple and modern — nothing fancy.',css:{accent:'#3b82f6',accent2:'#2563eb',bg:'#fff',fg:'#374151',skillBg:'#eff6ff',skillRad:'6px'},html:{avatarInHeader:false}},
  { name:'Compact Professional',desc:'Dense compact layout fitting more on one page.',css:{accent:'#0d9488',accent2:'#14b8a6',bg:'#fff',fg:'#1f2937',pad:'24px 32px',maxW:'800px',nameSize:'1.6rem',skillRad:'4px',skillBg:'#f0fdfa'},html:{avatarInHeader:true,avatarSize:60,avatarStyle:'border:2px solid #0d9488;'}},
  { name:'Elegant Serif',desc:'Elegant serif typography for distinguished roles.',css:{accent:'#92400e',accent2:'#b45309',ff:"Georgia,'Times New Roman',serif",bg:'#fffbf0',fg:'#1c1917',pageBg:'#fef3c7',skillBg:'#fef3c7',divider:'#d4a373'},html:{avatarInHeader:true,avatarSize:90,avatarStyle:'border:3px solid #92400e;'}},
  { name:'Monochrome',desc:'Pure black and white minimal design.',css:{accent:'#000',accent2:'#333',bg:'#fff',fg:'#000',divider:'#000',skillBg:'#f5f5f5',skillFg:'#000'},html:{avatarInHeader:false}},
  { name:'Fresh Mint',desc:'Light mint green refreshing design.',css:{accent:'#10b981',accent2:'#34d399',bg:'#f0fdf4',fg:'#064e3b',pageBg:'#ecfdf5',skillBg:'#d1fae5',skillRad:'12px'},html:{avatarInHeader:true,avatarSize:85,avatarStyle:'border:3px solid #10b981;'}},
  { name:'Executive Dark',desc:'Premium dark executive layout.',sidebar:true,css:{accent:'#f59e0b',accent2:'#d97706',sideBg:'linear-gradient(180deg,#111827,#1f2937)'},html:{sidebar:true,avatarSize:110,avatarStyle:'border:3px solid #f59e0b;display:block;margin:0 auto;'}},
  { name:'Ocean Breeze',desc:'Calming ocean blue tones.',css:{accent:'#0284c7',accent2:'#0ea5e9',bg:'#f0f9ff',fg:'#0c4a6e',pageBg:'#e0f2fe',skillBg:'#bae6fd',skillRad:'8px',divider:'#7dd3fc'},html:{avatarInHeader:true,avatarSize:90,avatarStyle:'border:3px solid #0284c7;'}},
];

async function seed() {
  // Run update SQL first
  const updateSQL = fs.readFileSync(path.join(__dirname, 'update_templates.sql'), 'utf8');
  const stmts = updateSQL.split(/;\s*\n/).filter(s => s.trim());
  for (const stmt of stmts) {
    if (stmt.trim()) await run(stmt);
  }
  console.log('✅ Updated existing 5 templates + added Classic Word');

  for (const t of templates) {
    const cssOpts = t.css || {};
    if (t.sidebar) cssOpts.sidebar = true;
    const htmlOpts = t.html || {};
    if (t.sidebar) htmlOpts.sidebar = true;
    const css = buildCSS(cssOpts);
    const html = buildHTML(htmlOpts);
    await run(
      `INSERT OR IGNORE INTO cv_templates (name,description,preview_img,stylesheet,html_template,is_active) VALUES (?,?,?,?,?,1)`,
      [t.name, t.desc, `/templates/${t.name.toLowerCase().replace(/\s+/g,'-')}.png`, css, html]
    );
  }
  console.log(`✅ Seeded ${templates.length} new templates`);
  db.close();
}

seed().catch(e => { console.error(e); process.exit(1); });
