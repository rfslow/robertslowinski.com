#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Photo Admin — robert slowinski.com
// Run with: npm run admin
// Opens a local web UI at http://localhost:3333 for managing pinned photos.
// Never deployed — runs only on your Mac.
// ─────────────────────────────────────────────────────────────────────────────

import http     from 'http';
import fs       from 'fs';
import path     from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT        = 3333;
const ROOT        = __dirname;
const PINNED_FILE = path.join(ROOT, 'src/data/pinned.json');
const HIDDEN_FILE = path.join(ROOT, 'src/data/hidden.json');
const PUBLIC_DIR  = path.join(ROOT, 'public');
const MAX_PINS    = 6;

// ── Helpers ───────────────────────────────────────────────────────────────────

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}

function getCategoryPhotos(category) {
  const thumbDir = path.join(PUBLIC_DIR, 'images', category, 'thumbs');
  return fs.readdirSync(thumbDir)
    .filter(f => f.endsWith('.jpg') && !f.includes('cover'))
    .sort((a, b) => {
      const na = parseInt(a.match(/\d+/)?.[0] ?? '0');
      const nb = parseInt(b.match(/\d+/)?.[0] ?? '0');
      return na - nb;
    })
    .map(f => ({ filename: f, thumb: `/images/${category}/thumbs/${f}`, full: `/images/${category}/${f}` }));
}

function serveFile(res, filepath, contentType) {
  try {
    const data = fs.readFileSync(filepath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch {
    res.writeHead(404); res.end('Not found');
  }
}

function parseBody(req) {
  return new Promise(resolve => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => resolve(JSON.parse(body || '{}')));
  });
}

// ── Server ────────────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // API: get all data
  if (url.pathname === '/api/data') {
    const pinned   = readJson(PINNED_FILE);
    const hidden   = readJson(HIDDEN_FILE);
    const photos   = {
      travel:    getCategoryPhotos('travel'),
      outdoors:  getCategoryPhotos('outdoors'),
      lifestyle: getCategoryPhotos('lifestyle'),
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ pinned, hidden, photos, maxPins: MAX_PINS }));
  }

  // API: save pinned + hidden
  if (url.pathname === '/api/save' && req.method === 'POST') {
    const body = await parseBody(req);
    if (body.pinned) writeJson(PINNED_FILE, body.pinned);
    if (body.hidden) writeJson(HIDDEN_FILE, body.hidden);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true }));
  }

  // API: deploy
  if (url.pathname === '/api/deploy' && req.method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write('Building...\n');
    exec(
      'npm run build && npx wrangler pages deploy dist --project-name robertslowinski-com && git add src/data/pinned.json src/data/hidden.json && git commit -m "Update pinned/hidden photos" && git push',
      { cwd: ROOT },
      (err, stdout, stderr) => {
        if (err) res.end('ERROR:\n' + stderr);
        else res.end('Done! Site deployed.\n' + stdout.slice(-300));
      }
    );
    return;
  }

  // Serve images from public/
  if (url.pathname.startsWith('/images/')) {
    const ext = path.extname(url.pathname).toLowerCase();
    const type = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
    return serveFile(res, path.join(PUBLIC_DIR, url.pathname), type);
  }

  // Serve admin UI
  if (url.pathname === '/' || url.pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(adminHTML());
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n📸 Photo Admin running at http://localhost:${PORT}\n`);
  exec(`open http://localhost:${PORT}`);
});

// ── Admin HTML ────────────────────────────────────────────────────────────────

function adminHTML() { return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Photo Admin</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,sans-serif;background:#f9f8f6;color:#222;min-height:100vh}

/* Header */
.header{position:sticky;top:0;z-index:100;background:#f9f8f6;border-bottom:1px solid #e0ddd8;
  padding:0 2rem;display:flex;align-items:center;justify-content:space-between;height:56px}
.header h1{font-size:.85rem;letter-spacing:.12em;text-transform:uppercase;font-weight:normal}
.header-right{display:flex;align-items:center;gap:1rem}
.badge{font-size:.7rem;letter-spacing:.08em;color:#999;text-transform:uppercase}

/* Tabs */
.tabs{display:flex;gap:0;border-bottom:1px solid #e0ddd8;background:#fff;padding:0 2rem}
.tab{padding:.85rem 1.2rem;font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;
  cursor:pointer;color:#888;border-bottom:2px solid transparent;transition:all .2s;background:none;border-top:none;border-left:none;border-right:none}
.tab:hover{color:#222}
.tab.active{color:#222;border-bottom-color:#222}

/* Pinned tray */
.pinned-section{padding:1.2rem 2rem;background:#fff;border-bottom:1px solid #e0ddd8}
.pinned-label{font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;color:#999;margin-bottom:.8rem}
.pinned-tray{display:flex;gap:8px;flex-wrap:wrap;min-height:64px;align-items:flex-start}
.pinned-slot{position:relative;width:80px;cursor:pointer}
.pinned-slot img{width:80px;height:54px;object-fit:cover;display:block;border:2px solid #222}
.pinned-slot .pin-num{position:absolute;top:0;left:0;background:#222;color:#fff;
  font-size:.6rem;font-weight:700;padding:2px 5px;letter-spacing:.04em}
.pinned-slot .unpin{position:absolute;top:0;right:0;background:rgba(0,0,0,.6);
  color:#fff;font-size:.65rem;padding:2px 5px;cursor:pointer;opacity:0;transition:opacity .15s}
.pinned-slot:hover .unpin{opacity:1}
.pinned-empty{width:80px;height:54px;border:1.5px dashed #ddd;display:flex;
  align-items:center;justify-content:center;font-size:.6rem;color:#ccc;text-transform:uppercase;letter-spacing:.06em}

/* Gallery grid */
.gallery-wrap{padding:1.5rem 2rem 4rem}
.grid{columns:5;column-gap:5px}
.grid-item{break-inside:avoid;margin-bottom:5px;position:relative;cursor:pointer;overflow:hidden}
.grid-item img{width:100%;height:auto;display:block;transition:opacity .2s}
.grid-item:hover img{opacity:.85}
.pin-badge{position:absolute;top:0;left:0;background:#222;color:#fff;
  font-size:.62rem;font-weight:700;padding:3px 6px;letter-spacing:.04em;pointer-events:none}
.pin-badge.is-pinned{background:#c8a84b}
.grid-item.is-pinned{outline:2px solid #c8a84b;outline-offset:-2px}

/* Hide button (top-right of each photo, appears on hover) */
.hide-btn{position:absolute;top:4px;right:4px;background:rgba(0,0,0,.65);color:#fff;
  font-size:.6rem;letter-spacing:.06em;text-transform:uppercase;padding:3px 7px;cursor:pointer;
  opacity:0;transition:opacity .15s;z-index:2;border-radius:2px}
.grid-item:hover .hide-btn{opacity:1}
.hide-btn:hover{background:#b00}

/* Hidden photos: dimmed with a label */
.grid-item.is-hidden img{opacity:.28;filter:grayscale(.6)}
.grid-item.is-hidden{outline:2px solid #b00;outline-offset:-2px}
.hidden-label{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
  background:#b00;color:#fff;font-size:.62rem;font-weight:700;letter-spacing:.08em;
  text-transform:uppercase;padding:3px 8px;pointer-events:none;z-index:1}
.grid-item.is-hidden .hide-btn{background:#b00;opacity:1}

/* Filter toggle */
.filter-toggle{font-size:.7rem;letter-spacing:.06em;color:#888;cursor:pointer;
  display:flex;align-items:center;gap:.4rem;user-select:none}
.filter-toggle input{cursor:pointer}

/* Buttons */
.btn{padding:.55rem 1.2rem;font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;
  cursor:pointer;transition:all .2s;border:1px solid #222;background:none;color:#222}
.btn:hover{background:#222;color:#fff}
.btn-deploy{background:#222;color:#fff}
.btn-deploy:hover{background:#000}

/* Toast */
.toast{position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);
  background:#222;color:#fff;padding:.6rem 1.4rem;font-size:.72rem;
  letter-spacing:.08em;text-transform:uppercase;opacity:0;transition:opacity .3s;pointer-events:none;z-index:999}
.toast.show{opacity:1}

/* Deploy log */
.deploy-log{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:200;
  display:none;align-items:center;justify-content:center}
.deploy-log.open{display:flex}
.deploy-box{background:#111;color:#0f0;font-family:monospace;font-size:.8rem;
  padding:2rem;width:560px;max-height:70vh;overflow-y:auto;white-space:pre-wrap}
.deploy-close{display:block;margin-top:1rem;color:#888;cursor:pointer;font-size:.75rem;text-transform:uppercase;letter-spacing:.08em}

@media(max-width:900px){.grid{columns:3}}
@media(max-width:600px){.grid{columns:2}}
</style>
</head>
<body>

<div class="header">
  <h1>📸 Photo Admin</h1>
  <div class="header-right">
    <span class="badge" id="status">Loading...</span>
    <button class="btn" id="btn-save" onclick="save()">Save</button>
    <button class="btn btn-deploy" id="btn-deploy" onclick="deploy()">Save &amp; Deploy</button>
  </div>
</div>

<div class="tabs" id="tabs"></div>

<div class="pinned-section">
  <div class="pinned-label">Click a photo to pin it (gold ★, shows first on the page). Hover a photo and click “Hide” to remove it from the live site — hiding never deletes the file.</div>
  <div class="pinned-tray" id="pinned-tray"></div>
</div>

<div class="gallery-wrap">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
    <span class="badge" id="counts"></span>
    <label class="filter-toggle">
      <input type="checkbox" id="show-hidden" checked onchange="renderGrid(currentCat)">
      Show hidden photos in this view
    </label>
  </div>
  <div class="grid" id="grid"></div>
</div>

<div class="toast" id="toast"></div>

<div class="deploy-log" id="deploy-log">
  <div>
    <div class="deploy-box" id="deploy-box">Deploying...</div>
    <span class="deploy-close" onclick="document.getElementById('deploy-log').classList.remove('open')">Close</span>
  </div>
</div>

<script>
const CATEGORIES = ['travel', 'outdoors', 'lifestyle'];
let data = null;  // { pinned, photos, maxPins }
let currentCat = 'travel';
let dirty = false;

async function init() {
  data = await fetch('/api/data').then(r => r.json());
  renderTabs();
  renderCat(currentCat);
  setStatus('Unsaved changes: none');
}

function renderTabs() {
  const el = document.getElementById('tabs');
  el.innerHTML = CATEGORIES.map(c =>
    \`<button class="tab \${c===currentCat?'active':''}" onclick="switchCat('\${c}')">\${c.charAt(0).toUpperCase()+c.slice(1)}</button>\`
  ).join('');
}

function switchCat(cat) {
  currentCat = cat;
  renderTabs();
  renderCat(cat);
}

function renderCat(cat) {
  renderTray(cat);
  renderGrid(cat);
}

function renderTray(cat) {
  const tray = document.getElementById('pinned-tray');
  const pins = data.pinned[cat];
  const slots = [];
  for (let i = 0; i < data.maxPins; i++) {
    if (pins[i]) {
      const photo = data.photos[cat].find(p => p.filename === pins[i]);
      slots.push(\`
        <div class="pinned-slot" title="\${pins[i]}">
          <img src="\${photo ? photo.thumb : ''}" alt="">
          <div class="pin-num">★\${i+1}</div>
          <div class="unpin" onclick="unpin('\${cat}',\${i})">×</div>
        </div>\`);
    } else {
      slots.push(\`<div class="pinned-empty">Slot \${i+1}</div>\`);
    }
  }
  tray.innerHTML = slots.join('');
}

function renderGrid(cat) {
  const grid = document.getElementById('grid');
  const pins = data.pinned[cat];
  const hidden = data.hidden[cat];
  const showHidden = document.getElementById('show-hidden').checked;

  const visible = data.photos[cat].filter(p => showHidden || !hidden.includes(p.filename));

  grid.innerHTML = visible.map(photo => {
    const pinIdx = pins.indexOf(photo.filename);
    const isPinned = pinIdx >= 0;
    const isHidden = hidden.includes(photo.filename);
    return \`
      <div class="grid-item \${isPinned?'is-pinned':''} \${isHidden?'is-hidden':''}" data-file="\${photo.filename}">
        <img src="\${photo.thumb}" alt="\${photo.filename}" loading="lazy"
             onclick="togglePin('\${cat}','\${photo.filename}')">
        \${isPinned ? \`<div class="pin-badge is-pinned">★\${pinIdx+1}</div>\` : ''}
        \${isHidden ? \`<div class="hidden-label">Hidden</div>\` : ''}
        <div class="hide-btn" onclick="toggleHide('\${cat}','\${photo.filename}')">\${isHidden?'Show':'Hide'}</div>
      </div>\`;
  }).join('');

  // Update counts
  const total = data.photos[cat].length;
  const hiddenCount = hidden.length;
  const liveCount = total - hiddenCount;
  document.getElementById('counts').textContent =
    \`\${liveCount} live · \${hiddenCount} hidden · \${total} total\`;
}

function togglePin(cat, filename) {
  // Don't allow pinning a hidden photo
  if (data.hidden[cat].includes(filename)) {
    showToast('Un-hide this photo before pinning it');
    return;
  }
  const pins = data.pinned[cat];
  const idx = pins.indexOf(filename);
  if (idx >= 0) {
    pins.splice(idx, 1);
  } else {
    if (pins.length >= data.maxPins) {
      showToast(\`Max \${data.maxPins} pins per category\`);
      return;
    }
    pins.push(filename);
  }
  dirty = true;
  setStatus('Unsaved changes');
  renderCat(cat);
}

function toggleHide(cat, filename) {
  const hidden = data.hidden[cat];
  const idx = hidden.indexOf(filename);
  if (idx >= 0) {
    hidden.splice(idx, 1);          // un-hide
  } else {
    hidden.push(filename);          // hide
    // If it was pinned, un-pin it (a hidden photo can't be pinned)
    const pinIdx = data.pinned[cat].indexOf(filename);
    if (pinIdx >= 0) data.pinned[cat].splice(pinIdx, 1);
  }
  dirty = true;
  setStatus('Unsaved changes');
  renderCat(cat);
}

function unpin(cat, idx) {
  data.pinned[cat].splice(idx, 1);
  dirty = true;
  setStatus('Unsaved changes');
  renderCat(cat);
}

async function save() {
  await fetch('/api/save', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ pinned: data.pinned, hidden: data.hidden })
  });
  dirty = false;
  setStatus('Saved ✓ (not yet deployed)');
  showToast('Saved!');
}

async function deploy() {
  await save();
  document.getElementById('deploy-log').classList.add('open');
  document.getElementById('deploy-box').textContent = 'Building and deploying...\\n';
  const res = await fetch('/api/deploy', { method: 'POST' });
  const text = await res.text();
  document.getElementById('deploy-box').textContent = text;
  setStatus('Deployed ✓');
}

function setStatus(msg) {
  document.getElementById('status').textContent = msg;
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}

window.addEventListener('beforeunload', e => {
  if (dirty) e.preventDefault();
});

init();
</script>
</body>
</html>`; }
