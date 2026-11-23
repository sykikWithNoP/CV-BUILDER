-- USERS --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  role VARCHAR(20) DEFAULT 'user',
  failed_attempts INTEGER DEFAULT 0,
  lock_until TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- EMAIL VERIFICATION -------------------------------------------------
CREATE TABLE IF NOT EXISTS email_verifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(64) NOT NULL,
  expires_at TIMESTAMP NOT NULL
);

-- REFRESH TOKENS (single per user) ----------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL
);

-- TEMPLATE DEFINITIONS -----------------------------------------------
CREATE TABLE IF NOT EXISTS cv_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  preview_img VARCHAR(255) NOT NULL,
  stylesheet TEXT NOT NULL,
  html_template TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

-- USER CV STORAGE ----------------------------------------------------
CREATE TABLE IF NOT EXISTS cvs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  template_id INTEGER REFERENCES cv_templates(id),
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- LOGIN / SIGN-UP AUDIT LOGS -----------------------------------------
CREATE TABLE IF NOT EXISTS login_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  success BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS signup_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  success BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
);

-- SAMPLE TEMPLATE ----------------------------------------------------
INSERT INTO cv_templates (name, description, preview_img, stylesheet, html_template, is_active)
VALUES (
  'Modern Slate',
  'A dark, polished layout with a strong personal header and clean sections.',
  '/templates/modern-slate.png',
  $$
  body { margin: 0; font-family: Inter, system-ui, sans-serif; color: #e5e7eb; background: #101225; }
  .cv-root { max-width: 900px; margin: auto; padding: 28px; background: #11142f; border-radius: 18px; box-shadow: 0 20px 45px rgba(0,0,0,0.35); }
  .cv-header { display: flex; justify-content: space-between; align-items: center; gap: 24px; padding: 24px; border-bottom: 1px solid rgba(255,255,255,0.08); background: linear-gradient(135deg, var(--cv-primary), var(--cv-secondary)); border-radius: 18px 18px 0 0; }
  .cv-name { margin: 0; font-size: 2.5rem; color: #fff; }
  .cv-subtitle { margin: 4px 0 0; color: rgba(255,255,255,0.8); }
  .cv-section { padding: 24px; }
  .cv-section:not(:first-of-type) { border-top: 1px solid rgba(255,255,255,0.08); }
  .cv-title { margin: 0 0 18px; font-size: 1.2rem; letter-spacing: 0.08em; text-transform: uppercase; color: #a5b4fc; }
  .cv-list { margin: 0; padding: 0; list-style: none; }
  .cv-list li { margin-bottom: 12px; }
  .cv-label { color: rgba(255,255,255,0.7); }
  .cv-skill { display: inline-flex; align-items: center; margin: 0 8px 8px 0; padding: 8px 12px; background: rgba(255,255,255,0.08); border-radius: 999px; }
  $$,
  $$
  <div class="cv-root">
    <section class="cv-header">
      <div>
        <h1 class="cv-name">{{firstName}} {{lastName}}</h1>
        <p class="cv-subtitle">{{jobTitle}}</p>
      </div>
      <div>
        {{#avatar}}<img src="{{avatar}}" alt="Avatar" style="width:100px;height:100px;border-radius:50%;object-fit:cover;border:3px solid rgba(255,255,255,0.85);" />{{/avatar}}
      </div>
    </section>
    <section class="cv-section">
      <h2 class="cv-title">Contact</h2>
      <ul class="cv-list">
        {{#email}}<li><span class="cv-label">Email:</span> {{email}}</li>{{/email}}
        {{#phone}}<li><span class="cv-label">Phone:</span> {{phone}}</li>{{/phone}}
        {{#location}}<li><span class="cv-label">Location:</span> {{location}}</li>{{/location}}
        {{#linkedin}}<li><span class="cv-label">LinkedIn:</span> {{linkedin}}</li>{{/linkedin}}
        {{#github}}<li><span class="cv-label">GitHub:</span> {{github}}</li>{{/github}}
      </ul>
    </section>
    {{#summary}}
    <section class="cv-section">
      <h2 class="cv-title">Summary</h2>
      <p>{{summary}}</p>
    </section>
    {{/summary}}
    {{#experience}}
    <section class="cv-section">
      <h2 class="cv-title">Experience</h2>
      <ul class="cv-list">
        {{#experience}}
        <li>
          <strong>{{title}}</strong> — {{company}}<br />
          <small class="cv-label">{{start}} — {{end}}</small><br />
          {{description}}
        </li>
        {{/experience}}
      </ul>
    </section>
    {{/experience}}
    {{#education}}
    <section class="cv-section">
      <h2 class="cv-title">Education</h2>
      <ul class="cv-list">
        {{#education}}
        <li><strong>{{degree}}</strong>, {{school}} <span class="cv-label">({{year}})</span></li>
        {{/education}}
      </ul>
    </section>
    {{/education}}
    {{#skills}}
    <section class="cv-section">
      <h2 class="cv-title">Skills</h2>
      <div>
        {{#skills}}
        <span class="cv-skill">{{name}}</span>
        {{/skills}}
      </div>
    </section>
    {{/skills}}
    {{#languages}}
    <section class="cv-section">
      <h2 class="cv-title">Languages</h2>
      <ul class="cv-list">
        {{#languages}}
        <li>{{name}} — {{level}}</li>
        {{/languages}}
      </ul>
    </section>
    {{/languages}}
  </div>
  $$,
  TRUE
);
