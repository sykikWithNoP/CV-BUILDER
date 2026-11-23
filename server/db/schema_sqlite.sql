-- USERS --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  verified BOOLEAN DEFAULT 0,
  college_affiliation TEXT DEFAULT NULL,
  role TEXT DEFAULT 'user',
  failed_attempts INTEGER DEFAULT 0,
  lock_until DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- EMAIL VERIFICATION -------------------------------------------------
CREATE TABLE IF NOT EXISTS email_verifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at DATETIME NOT NULL
);

-- REFRESH TOKENS (single per user) ----------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at DATETIME NOT NULL
);

-- TEMPLATE DEFINITIONS -----------------------------------------------
CREATE TABLE IF NOT EXISTS cv_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  preview_img TEXT NOT NULL,
  stylesheet TEXT NOT NULL,
  html_template TEXT NOT NULL,
  is_active BOOLEAN DEFAULT 1
);

-- USER CV STORAGE ----------------------------------------------------
CREATE TABLE IF NOT EXISTS cvs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  template_id INTEGER REFERENCES cv_templates(id),
  data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- LOGIN / SIGN-UP AUDIT LOGS -----------------------------------------
CREATE TABLE IF NOT EXISTS login_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS signup_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- PASSWORD RESET TOKENS (Issue 1) ------------------------------------
CREATE TABLE IF NOT EXISTS password_resets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  otp_code TEXT,
  expires_at DATETIME NOT NULL,
  used BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- USER SAVED CUSTOM TEMPLATES (Issue 2) ------------------------------
CREATE TABLE IF NOT EXISTS user_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  config TEXT NOT NULL,
  stylesheet TEXT NOT NULL,
  html_template TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ORGANIZATIONS / PARTNERED INSTITUTIONS (Issues 3, 5, 9) -----------
CREATE TABLE IF NOT EXISTS organizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  domain TEXT,
  contact_email TEXT NOT NULL,
  verified BOOLEAN DEFAULT 0,
  payment_verified BOOLEAN DEFAULT 0,
  payment_reference TEXT,
  plan TEXT DEFAULT 'free',
  features TEXT,
  verification_token TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  verified_at DATETIME
);

-- AFFILIATION REQUESTS (Issue 9) ------------------------------------
CREATE TABLE IF NOT EXISTS affiliation_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME
);

-- COOKIE CONSENTS (Issue 7) -----------------------------------------
CREATE TABLE IF NOT EXISTS cookie_consents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  consent_given BOOLEAN DEFAULT 0,
  consent_type TEXT DEFAULT 'essential',
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AI GENERATION LOGS (Issue 11) -------------------------------------
CREATE TABLE IF NOT EXISTS ai_generation_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  prompt_summary TEXT,
  tokens_used INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- SEED TEMPLATES (OR IGNORE prevents duplicates on restart) -----------

INSERT OR IGNORE INTO cv_templates (name, description, preview_img, stylesheet, html_template, is_active)
VALUES (
  'Modern Slate',
  'A dark, polished layout with a strong personal header and clean sections.',
  '/templates/modern-slate.png',
  'body{margin:0;font-family:Inter,system-ui,sans-serif;color:#e5e7eb;background:#101225}.cv-root{max-width:900px;margin:auto;padding:28px;background:#11142f;border-radius:18px;box-shadow:0 20px 45px rgba(0,0,0,.35)}.cv-header{display:flex;justify-content:space-between;align-items:center;gap:24px;padding:24px;border-bottom:1px solid rgba(255,255,255,.08);background:linear-gradient(135deg,var(--cv-primary,#667eea),var(--cv-secondary,#764ba2));border-radius:18px 18px 0 0}.cv-name{margin:0;font-size:2.5rem;color:#fff}.cv-subtitle{margin:4px 0 0;color:rgba(255,255,255,.8)}.cv-section{padding:24px}.cv-section:not(:first-of-type){border-top:1px solid rgba(255,255,255,.08)}.cv-title{margin:0 0 18px;font-size:1.2rem;letter-spacing:.08em;text-transform:uppercase;color:#a5b4fc}.cv-list{margin:0;padding:0;list-style:none}.cv-list li{margin-bottom:12px}.cv-label{color:rgba(255,255,255,.7)}.cv-skill{display:inline-flex;align-items:center;margin:0 8px 8px 0;padding:8px 12px;background:rgba(255,255,255,.08);border-radius:999px}',
  '<div class="cv-root"><section class="cv-header"><div><h1 class="cv-name">{{firstName}} {{lastName}}</h1><p class="cv-subtitle">{{jobTitle}}</p></div><div>{{#avatar}}<img src="{{avatar}}" alt="Avatar" style="width:100px;height:100px;border-radius:50%;object-fit:cover;border:3px solid rgba(255,255,255,.85)"/>{{/avatar}}</div></section><section class="cv-section"><h2 class="cv-title">Contact</h2><ul class="cv-list">{{#email}}<li><span class="cv-label">Email:</span> {{email}}</li>{{/email}}{{#phone}}<li><span class="cv-label">Phone:</span> {{phone}}</li>{{/phone}}{{#location}}<li><span class="cv-label">Location:</span> {{location}}</li>{{/location}}{{#linkedin}}<li><span class="cv-label">LinkedIn:</span> {{linkedin}}</li>{{/linkedin}}{{#github}}<li><span class="cv-label">GitHub:</span> {{github}}</li>{{/github}}</ul></section>{{#summary}}<section class="cv-section"><h2 class="cv-title">Summary</h2><p>{{summary}}</p></section>{{/summary}}{{#experience}}<section class="cv-section"><h2 class="cv-title">Experience</h2><ul class="cv-list">{{#experience}}<li><strong>{{title}}</strong> — {{company}}<br/><small class="cv-label">{{start}} — {{end}}</small><br/>{{description}}</li>{{/experience}}</ul></section>{{/experience}}{{#education}}<section class="cv-section"><h2 class="cv-title">Education</h2><ul class="cv-list">{{#education}}<li><strong>{{degree}}</strong>, {{school}} <span class="cv-label">({{year}})</span></li>{{/education}}</ul></section>{{/education}}{{#skills}}<section class="cv-section"><h2 class="cv-title">Skills</h2><div>{{#skills}}<span class="cv-skill">{{name}}</span>{{/skills}}</div></section>{{/skills}}{{#languages}}<section class="cv-section"><h2 class="cv-title">Languages</h2><ul class="cv-list">{{#languages}}<li>{{name}} — {{level}}</li>{{/languages}}</ul></section>{{/languages}}</div>',
  1
);

INSERT OR IGNORE INTO cv_templates (name, description, preview_img, stylesheet, html_template, is_active)
VALUES (
  'Executive Ivory',
  'A clean, light professional layout perfect for senior roles and corporate positions.',
  '/templates/executive-ivory.png',
  'body{margin:0;font-family:Georgia,serif;color:#1a1a1a;background:#f8f6f0}.cv-root{max-width:850px;margin:auto;padding:40px;background:#fff;box-shadow:0 4px 30px rgba(0,0,0,.08)}.cv-header{text-align:center;padding-bottom:24px;border-bottom:3px double #bfa76a}.cv-name{margin:0;font-size:2.4rem;color:#2c3e50;letter-spacing:.05em}.cv-subtitle{margin:8px 0 0;font-size:1.1rem;color:#7f8c8d;font-style:italic}.cv-section{padding:20px 0}.cv-section+.cv-section{border-top:1px solid #e8e8e8}.cv-title{margin:0 0 14px;font-size:1rem;letter-spacing:.12em;text-transform:uppercase;color:#bfa76a;font-weight:700}.cv-list{margin:0;padding:0;list-style:none}.cv-list li{margin-bottom:10px;line-height:1.6}.cv-label{font-weight:600;color:#555}.cv-skill{display:inline-block;margin:0 8px 8px 0;padding:6px 14px;background:#f0ebe0;border:1px solid #d4c9a8;border-radius:4px;font-size:.9rem}',
  '<div class="cv-root"><section class="cv-header"><h1 class="cv-name">{{firstName}} {{lastName}}</h1><p class="cv-subtitle">{{jobTitle}}</p></section><section class="cv-section"><h2 class="cv-title">Contact</h2><ul class="cv-list">{{#email}}<li><span class="cv-label">Email:</span> {{email}}</li>{{/email}}{{#phone}}<li><span class="cv-label">Phone:</span> {{phone}}</li>{{/phone}}{{#location}}<li><span class="cv-label">Location:</span> {{location}}</li>{{/location}}{{#linkedin}}<li><span class="cv-label">LinkedIn:</span> {{linkedin}}</li>{{/linkedin}}{{#github}}<li><span class="cv-label">GitHub:</span> {{github}}</li>{{/github}}</ul></section>{{#summary}}<section class="cv-section"><h2 class="cv-title">Profile</h2><p>{{summary}}</p></section>{{/summary}}{{#experience}}<section class="cv-section"><h2 class="cv-title">Professional Experience</h2><ul class="cv-list">{{#experience}}<li><strong>{{title}}</strong> — {{company}}<br/><small class="cv-label">{{start}} – {{end}}</small><br/>{{description}}</li>{{/experience}}</ul></section>{{/experience}}{{#education}}<section class="cv-section"><h2 class="cv-title">Education</h2><ul class="cv-list">{{#education}}<li><strong>{{degree}}</strong>, {{school}} <span class="cv-label">({{year}})</span></li>{{/education}}</ul></section>{{/education}}{{#skills}}<section class="cv-section"><h2 class="cv-title">Skills</h2><div>{{#skills}}<span class="cv-skill">{{name}}</span>{{/skills}}</div></section>{{/skills}}</div>',
  1
);

INSERT OR IGNORE INTO cv_templates (name, description, preview_img, stylesheet, html_template, is_active)
VALUES (
  'Neon Pulse',
  'Bold cyberpunk-inspired design with neon accents for creative tech professionals.',
  '/templates/neon-pulse.png',
  'body{margin:0;font-family:''Courier New'',monospace;color:#e0e0e0;background:#0d0d0d}.cv-root{max-width:880px;margin:auto;padding:32px;background:linear-gradient(145deg,#0d0d0d,#1a1a2e);border:1px solid #00fff5;border-radius:12px;box-shadow:0 0 40px rgba(0,255,245,.08)}.cv-header{padding:24px;border-bottom:2px solid #00fff5;display:flex;justify-content:space-between;align-items:center}.cv-name{margin:0;font-size:2.2rem;color:#00fff5;text-shadow:0 0 20px rgba(0,255,245,.5)}.cv-subtitle{margin:6px 0 0;color:#ff00aa;font-size:1rem}.cv-section{padding:20px 0}.cv-section+.cv-section{border-top:1px solid rgba(0,255,245,.15)}.cv-title{margin:0 0 14px;font-size:.95rem;letter-spacing:.15em;text-transform:uppercase;color:#ff00aa;text-shadow:0 0 10px rgba(255,0,170,.4)}.cv-list{margin:0;padding:0;list-style:none}.cv-list li{margin-bottom:10px;padding-left:16px;border-left:2px solid #00fff5}.cv-label{color:#888}.cv-skill{display:inline-block;margin:0 8px 8px 0;padding:6px 14px;background:rgba(0,255,245,.08);border:1px solid rgba(0,255,245,.3);border-radius:20px;font-size:.85rem;color:#00fff5}',
  '<div class="cv-root"><section class="cv-header"><div><h1 class="cv-name">{{firstName}} {{lastName}}</h1><p class="cv-subtitle">{{jobTitle}}</p></div><div>{{#avatar}}<img src="{{avatar}}" alt="" style="width:90px;height:90px;border-radius:50%;object-fit:cover;border:2px solid #00fff5;box-shadow:0 0 20px rgba(0,255,245,.3)"/>{{/avatar}}</div></section><section class="cv-section"><h2 class="cv-title">// Contact</h2><ul class="cv-list">{{#email}}<li><span class="cv-label">Email:</span> {{email}}</li>{{/email}}{{#phone}}<li><span class="cv-label">Phone:</span> {{phone}}</li>{{/phone}}{{#location}}<li><span class="cv-label">Location:</span> {{location}}</li>{{/location}}</ul></section>{{#summary}}<section class="cv-section"><h2 class="cv-title">// About</h2><p>{{summary}}</p></section>{{/summary}}{{#experience}}<section class="cv-section"><h2 class="cv-title">// Experience</h2><ul class="cv-list">{{#experience}}<li><strong>{{title}}</strong> @ {{company}}<br/><small class="cv-label">{{start}} → {{end}}</small><br/>{{description}}</li>{{/experience}}</ul></section>{{/experience}}{{#education}}<section class="cv-section"><h2 class="cv-title">// Education</h2><ul class="cv-list">{{#education}}<li><strong>{{degree}}</strong> — {{school}} <span class="cv-label">({{year}})</span></li>{{/education}}</ul></section>{{/education}}{{#skills}}<section class="cv-section"><h2 class="cv-title">// Tech Stack</h2><div>{{#skills}}<span class="cv-skill">{{name}}</span>{{/skills}}</div></section>{{/skills}}</div>',
  1
);

INSERT OR IGNORE INTO cv_templates (name, description, preview_img, stylesheet, html_template, is_active)
VALUES (
  'Minimal Breeze',
  'Ultra-clean minimalist layout with generous whitespace and subtle typography.',
  '/templates/minimal-breeze.png',
  'body{margin:0;font-family:Inter,Helvetica,Arial,sans-serif;color:#333;background:#fafafa}.cv-root{max-width:800px;margin:auto;padding:48px;background:#fff}.cv-header{margin-bottom:32px}.cv-name{margin:0;font-size:2rem;font-weight:300;color:#111;letter-spacing:.02em}.cv-subtitle{margin:4px 0 0;font-size:1rem;color:#888;font-weight:400}.cv-section{padding:16px 0}.cv-section+.cv-section{border-top:1px solid #eee}.cv-title{margin:0 0 12px;font-size:.75rem;letter-spacing:.2em;text-transform:uppercase;color:#aaa;font-weight:600}.cv-list{margin:0;padding:0;list-style:none}.cv-list li{margin-bottom:8px;font-size:.95rem;line-height:1.7}.cv-label{color:#999}.cv-skill{display:inline-block;margin:0 6px 6px 0;padding:4px 12px;background:#f5f5f5;border-radius:3px;font-size:.85rem;color:#555}',
  '<div class="cv-root"><header class="cv-header"><h1 class="cv-name">{{firstName}} {{lastName}}</h1><p class="cv-subtitle">{{jobTitle}}</p></header><section class="cv-section"><h2 class="cv-title">Contact</h2><ul class="cv-list">{{#email}}<li>{{email}}</li>{{/email}}{{#phone}}<li>{{phone}}</li>{{/phone}}{{#location}}<li>{{location}}</li>{{/location}}{{#linkedin}}<li>{{linkedin}}</li>{{/linkedin}}</ul></section>{{#summary}}<section class="cv-section"><h2 class="cv-title">Summary</h2><p>{{summary}}</p></section>{{/summary}}{{#experience}}<section class="cv-section"><h2 class="cv-title">Experience</h2><ul class="cv-list">{{#experience}}<li><strong>{{title}}</strong> — {{company}}<br/><span class="cv-label">{{start}} – {{end}}</span><br/>{{description}}</li>{{/experience}}</ul></section>{{/experience}}{{#education}}<section class="cv-section"><h2 class="cv-title">Education</h2><ul class="cv-list">{{#education}}<li><strong>{{degree}}</strong>, {{school}} ({{year}})</li>{{/education}}</ul></section>{{/education}}{{#skills}}<section class="cv-section"><h2 class="cv-title">Skills</h2><div>{{#skills}}<span class="cv-skill">{{name}}</span>{{/skills}}</div></section>{{/skills}}</div>',
  1
);

INSERT OR IGNORE INTO cv_templates (name, description, preview_img, stylesheet, html_template, is_active)
VALUES (
  'Royal Azure',
  'Elegant two-tone blue design with sidebar layout for a distinguished professional look.',
  '/templates/royal-azure.png',
  'body{margin:0;font-family:Inter,system-ui,sans-serif;color:#1e293b;background:#f1f5f9}.cv-root{max-width:900px;margin:auto;display:grid;grid-template-columns:280px 1fr;min-height:100vh}.cv-sidebar{background:linear-gradient(180deg,#1e3a5f,#0f2744);color:#e2e8f0;padding:32px 24px}.cv-sidebar .cv-name{font-size:1.6rem;color:#fff;margin:16px 0 4px}.cv-sidebar .cv-subtitle{color:#94a3b8;font-size:.9rem;margin:0 0 24px}.cv-sidebar .cv-title{font-size:.75rem;letter-spacing:.15em;text-transform:uppercase;color:#60a5fa;margin:20px 0 10px;font-weight:700}.cv-sidebar .cv-list{margin:0;padding:0;list-style:none}.cv-sidebar .cv-list li{margin-bottom:8px;font-size:.9rem;color:#cbd5e1}.cv-sidebar .cv-skill{display:inline-block;margin:0 6px 6px 0;padding:4px 10px;background:rgba(96,165,250,.15);border:1px solid rgba(96,165,250,.3);border-radius:12px;font-size:.8rem;color:#93c5fd}.cv-main{padding:32px}.cv-main .cv-title{font-size:.8rem;letter-spacing:.12em;text-transform:uppercase;color:#1e3a5f;border-bottom:2px solid #60a5fa;padding-bottom:6px;margin:24px 0 14px;font-weight:700}.cv-main .cv-list{margin:0;padding:0;list-style:none}.cv-main .cv-list li{margin-bottom:14px;line-height:1.6}.cv-main .cv-label{color:#64748b;font-size:.85rem}',
  '<div class="cv-root"><aside class="cv-sidebar">{{#avatar}}<img src="{{avatar}}" alt="" style="width:120px;height:120px;border-radius:50%;object-fit:cover;border:3px solid #60a5fa;display:block;margin:0 auto"/>{{/avatar}}<h1 class="cv-name">{{firstName}} {{lastName}}</h1><p class="cv-subtitle">{{jobTitle}}</p><h2 class="cv-title">Contact</h2><ul class="cv-list">{{#email}}<li>{{email}}</li>{{/email}}{{#phone}}<li>{{phone}}</li>{{/phone}}{{#location}}<li>{{location}}</li>{{/location}}{{#linkedin}}<li>{{linkedin}}</li>{{/linkedin}}</ul>{{#skills}}<h2 class="cv-title">Skills</h2><div>{{#skills}}<span class="cv-skill">{{name}}</span>{{/skills}}</div>{{/skills}}{{#languages}}<h2 class="cv-title">Languages</h2><ul class="cv-list">{{#languages}}<li>{{name}} — {{level}}</li>{{/languages}}</ul>{{/languages}}</aside><main class="cv-main">{{#summary}}<h2 class="cv-title">Profile</h2><p>{{summary}}</p>{{/summary}}{{#experience}}<h2 class="cv-title">Experience</h2><ul class="cv-list">{{#experience}}<li><strong>{{title}}</strong> — {{company}}<br/><span class="cv-label">{{start}} – {{end}}</span><br/>{{description}}</li>{{/experience}}</ul>{{/experience}}{{#education}}<h2 class="cv-title">Education</h2><ul class="cv-list">{{#education}}<li><strong>{{degree}}</strong>, {{school}} <span class="cv-label">({{year}})</span></li>{{/education}}</ul>{{/education}}</main></div>',
  1
);