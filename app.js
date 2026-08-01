
const STORAGE_KEY = 'bno-mobile-state-v1';

const STAGES = [
  { key: 'planner', label: 'Planner', detail: 'Interpret prompt and define project structure.' },
  { key: 'architect', label: 'Architect', detail: 'Map source files, assets, and runtime flow.' },
  { key: 'builder', label: 'Builder', detail: 'Generate or revise source files.' },
  { key: 'critic', label: 'Critic', detail: 'Inspect for obvious gaps and consistency issues.' },
  { key: 'tester', label: 'Tester', detail: 'Run browser-side checks and preview validation.' },
  { key: 'packager', label: 'Packager', detail: 'Prepare the project bundle and deployment layout.' },
  { key: 'runner', label: 'Runner', detail: 'Launch the final app preview in the virtual device.' },
];

const DEFAULT_STATE = {
  projectName: 'Browser Native Orchestrator',
  projectPrompt: 'Create and package apps with a browser-first compiler workflow, manage source files, and simulate install/run actions in a virtual device lab.',
  files: defaultFiles('Browser Native Orchestrator'),
  selectedFile: 'index.html',
  stageIndex: 0,
  installed: false,
  logs: [],
};

let state = loadState();
let editorDirty = false;

const els = {};
document.addEventListener('DOMContentLoaded', () => {
  bindElements();
  bindEvents();
  renderAll();
  registerServiceWorker();
  log('Ready. Load a sample, generate a draft, or run the compiler.');
});

function bindElements() {
  const ids = [
    'connectionPill','deviceState','stageCount','stageList','fileList','editorTitle','editorMeta',
    'projectName','projectPrompt','generateBtn','runCompilerBtn','saveBtn','installBtn','runBtn',
    'exportZipBtn','resetBtn','clearLogBtn','editor','devicePreview','newFileName','addFileBtn','deleteFileBtn',
    'loadSampleBtn','log'
  ];
  ids.forEach(id => els[id] = document.getElementById(id));
}

function bindEvents() {
  els.projectName.addEventListener('input', () => {
    state.projectName = els.projectName.value.trim() || 'Untitled App';
    editorDirty = true;
  });
  els.projectPrompt.addEventListener('input', () => {
    state.projectPrompt = els.projectPrompt.value;
    editorDirty = true;
  });
  els.editor.addEventListener('input', () => {
    const f = currentFile();
    if (!f) return;
    f.content = els.editor.value;
    editorDirty = true;
    updatePreviewIfSelected();
  });
  els.generateBtn.addEventListener('click', generateDraft);
  els.runCompilerBtn.addEventListener('click', runCompiler);
  els.saveBtn.addEventListener('click', saveState);
  els.installBtn.addEventListener('click', installApp);
  els.runBtn.addEventListener('click', runApp);
  els.exportZipBtn.addEventListener('click', exportZip);
  els.resetBtn.addEventListener('click', resetState);
  els.clearLogBtn.addEventListener('click', () => { state.logs = []; renderLog(); saveState(false); });
  els.addFileBtn.addEventListener('click', addFile);
  els.deleteFileBtn.addEventListener('click', deleteSelectedFile);
  els.loadSampleBtn.addEventListener('click', loadSample);
  els.fileList.addEventListener('click', onFileListClick);
  els.devicePreview.addEventListener('load', () => setDeviceStatus('Preview loaded', 'good'));
  window.addEventListener('beforeunload', persistBeforeLeave);
}

function loadSample() {
  state.projectName = 'Sample Mobile App';
  state.projectPrompt = 'Build a simple mobile-friendly landing page with a hero, feature cards, and a call to action.';
  state.files = defaultFiles(state.projectName);
  state.selectedFile = 'index.html';
  state.installed = false;
  state.stageIndex = 0;
  log('Loaded sample project.');
  renderAll();
}

function generateDraft() {
  const name = cleanProjectName(state.projectName);
  state.files = scaffoldFiles(name, state.projectPrompt);
  state.selectedFile = 'index.html';
  state.stageIndex = 0;
  state.installed = false;
  log(`Generated draft for "${name}".`);
  renderAll();
  saveState();
}

async function runCompiler() {
  const name = cleanProjectName(state.projectName);
  log(`Starting compiler for "${name}".`);
  state.stageIndex = 0;
  renderStages();
  const stages = [...STAGES];
  for (let i = 0; i < stages.length; i++) {
    state.stageIndex = i;
    renderStages();
    const stage = stages[i];
    await pause(350);
    runStage(stage.key);
    log(`✓ ${stage.label}: ${stage.detail}`);
    renderAll(false);
    await pause(80);
  }
  state.installed = true;
  saveState();
  renderAll();
  log('Compiler finished. Preview and ZIP are ready.');
}

function runStage(key) {
  switch (key) {
    case 'planner':
      ensureCoreFiles();
      break;
    case 'architect':
      state.files['README.md'] = buildReadme();
      state.files['manifest.webmanifest'] = buildManifest();
      break;
    case 'builder':
      state.files['index.html'] = buildIndexHtml();
      state.files['styles.css'] = buildStyles();
      state.files['app.js'] = buildRuntimeScript();
      state.files['sw.js'] = buildServiceWorker();
      break;
    case 'critic':
      fixConsistency();
      break;
    case 'tester':
      testAndAnnotate();
      break;
    case 'packager':
      ensureAssets();
      break;
    case 'runner':
      updatePreview();
      break;
  }
}

function ensureCoreFiles() {
  if (!state.files['index.html']) state.files['index.html'] = buildIndexHtml();
  if (!state.files['styles.css']) state.files['styles.css'] = buildStyles();
  if (!state.files['app.js']) state.files['app.js'] = buildRuntimeScript();
  if (!state.files['manifest.webmanifest']) state.files['manifest.webmanifest'] = buildManifest();
  if (!state.files['sw.js']) state.files['sw.js'] = buildServiceWorker();
}

function fixConsistency() {
  const title = escapeHtml(state.projectName || 'Untitled App');
  state.files['index.html'] = state.files['index.html']
    .replace(/<title>.*?<\/title>/i, `<title>${title}</title>`)
    .replace(/<h1>.*?<\/h1>/i, `<h1>${title}</h1>`);
  if (!state.files['README.md'].includes(title)) state.files['README.md'] = buildReadme();
}

function testAndAnnotate() {
  const issues = [];
  ['index.html','styles.css','app.js','manifest.webmanifest','sw.js'].forEach(name => {
    if (!state.files[name]) issues.push(`Missing ${name}`);
  });
  if (issues.length) {
    log('Test warnings: ' + issues.join('; '));
  } else {
    log('Tests passed: core files present.');
  }
}

function ensureAssets() {
  // icons already in repo root; no-op here for the workspace bundle.
}

function installApp() {
  state.installed = true;
  setDeviceStatus('Installed in virtual device', 'good');
  log('Install simulated successfully.');
  updatePreview();
  renderAll();
  saveState();
}

function runApp() {
  updatePreview();
  setDeviceStatus('Running app preview', 'good');
  log('Run launched in the virtual device frame.');
}

function updatePreview() {
  const html = state.files['index.html'] || '<!doctype html><title>Preview</title><body><h1>No index.html</h1></body>';
  const css = state.files['styles.css'] || '';
  const js = state.files['app.js'] || '';
  const srcdoc = injectAssets(html, css, js);
  els.devicePreview.srcdoc = srcdoc;
}

function updatePreviewIfSelected() {
  if (state.selectedFile === 'index.html' || state.selectedFile === 'styles.css' || state.selectedFile === 'app.js') {
    updatePreview();
  }
}

function injectAssets(html, css, js) {
  let out = html;
  if (!/manifest\.webmanifest/.test(out)) {
    out = out.replace('</head>', '  <link rel="manifest" href="manifest.webmanifest" />\n</head>');
  }
  if (!/styles\.css/.test(out)) {
    out = out.replace('</head>', '  <style>\n' + css + '\n  </style>\n</head>');
  }
  if (!/app\.js/.test(out)) {
    out = out.replace('</body>', `  <script>\n${js}\n  </script>\n</body>`);
  }
  return out;
}

function renderAll(scroll = true) {
  els.projectName.value = state.projectName;
  els.projectPrompt.value = state.projectPrompt;
  renderStages();
  renderFiles();
  renderEditor();
  renderLog();
  setDeviceStatus(state.installed ? 'Installed' : 'Not installed', state.installed ? 'good' : 'warn');
  els.connectionPill.textContent = navigator.onLine ? 'Online' : 'Offline-ready';
  if (scroll) updatePreview();
  saveState(false);
}

function renderStages() {
  els.stageList.innerHTML = '';
  STAGES.forEach((stage, idx) => {
    const li = document.createElement('li');
    const done = idx < state.stageIndex;
    const active = idx === state.stageIndex;
    li.innerHTML = `
      <div>
        <div class="stage-name">${idx + 1}. ${stage.label}</div>
        <div class="stage-state">${stage.detail}</div>
      </div>
      <div class="badge">${done ? 'Done' : active ? 'Active' : 'Queued'}</div>
    `;
    if (active) li.style.borderColor = 'rgba(96,165,250,.7)';
    if (done) li.style.background = 'rgba(52,211,153,.08)';
    els.stageList.appendChild(li);
  });
  els.stageCount.textContent = `${Math.min(state.stageIndex, STAGES.length)}/${STAGES.length}`;
}

function renderFiles() {
  els.fileList.innerHTML = '';
  const names = Object.keys(state.files).sort(compareNames);
  names.forEach(name => {
    const li = document.createElement('li');
    li.dataset.file = name;
    li.className = name === state.selectedFile ? 'active' : '';
    li.innerHTML = `
      <div>
        <div>${name}</div>
        <div class="file-kind">${fileKind(name)}</div>
      </div>
      <div class="badge">${state.files[name].length} chars</div>
    `;
    els.fileList.appendChild(li);
  });
}

function renderEditor() {
  const file = currentFile();
  if (!file) {
    els.editor.value = '';
    els.editorTitle.textContent = 'No file selected';
    els.editorMeta.textContent = 'Choose a file from the list to edit it.';
    els.editor.disabled = true;
    els.deleteFileBtn.disabled = true;
    return;
  }
  els.editor.disabled = false;
  els.deleteFileBtn.disabled = false;
  els.editorTitle.textContent = state.selectedFile;
  els.editorMeta.textContent = `${fileKind(state.selectedFile)} file`;
  if (document.activeElement !== els.editor || !editorDirty) {
    els.editor.value = file.content;
  }
  editorDirty = false;
}

function renderLog() {
  els.log.textContent = state.logs.slice(-120).join('\n');
  els.log.scrollTop = els.log.scrollHeight;
}

function onFileListClick(event) {
  const li = event.target.closest('li[data-file]');
  if (!li) return;
  state.selectedFile = li.dataset.file;
  editorDirty = false;
  renderFiles();
  renderEditor();
  updatePreview();
  saveState();
}

function addFile() {
  const raw = (els.newFileName.value || '').trim();
  if (!raw) return log('Enter a filename first.');
  const name = sanitizePath(raw);
  if (state.files[name]) return log(`File already exists: ${name}`);
  state.files[name] = `// ${name}\n`;
  state.selectedFile = name;
  els.newFileName.value = '';
  log(`Added file: ${name}`);
  renderAll();
  saveState();
}

function deleteSelectedFile() {
  const name = state.selectedFile;
  if (!name || !state.files[name]) return;
  if (Object.keys(state.files).length <= 1) return log('Cannot delete the last file.');
  delete state.files[name];
  state.selectedFile = Object.keys(state.files)[0];
  log(`Deleted file: ${name}`);
  renderAll();
  saveState();
}

function currentFile() {
  const name = state.selectedFile;
  if (!name) return null;
  return {
    name,
    get content() { return state.files[name]; },
    set content(value) { state.files[name] = value; },
  };
}

function fileKind(name) {
  const ext = name.split('.').pop().toLowerCase();
  const map = { html: 'Markup', css: 'Stylesheet', js: 'Script', json: 'Data', md: 'Docs', svg: 'Vector', png: 'Image', webmanifest: 'Manifest' };
  return map[ext] || 'File';
}

function compareNames(a, b) {
  const order = { 'index.html': 0, 'styles.css': 1, 'app.js': 2, 'manifest.webmanifest': 3, 'sw.js': 4, 'README.md': 5 };
  const oa = order[a] ?? 99;
  const ob = order[b] ?? 99;
  return oa - ob || a.localeCompare(b);
}

function scaffoldFiles(name, prompt) {
  return {
    'index.html': buildIndexHtml(name, prompt),
    'styles.css': buildStyles(),
    'app.js': buildRuntimeScript(name, prompt),
    'manifest.webmanifest': buildManifest(name),
    'sw.js': buildServiceWorker(),
    'README.md': buildReadme(name, prompt),
  };
}

function defaultFiles(name) {
  return scaffoldFiles(name, 'Create and package apps with a browser-first compiler workflow.');
}

function buildIndexHtml(name = state.projectName, prompt = state.projectPrompt) {
  const t = escapeHtml(name);
  const p = escapeHtml(prompt);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#111827" />
  <title>${t}</title>
  <link rel="manifest" href="manifest.webmanifest" />
  <link rel="icon" href="icon-192.png" />
  <link rel="apple-touch-icon" href="icon-192.png" />
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <main class="page">
    <header class="hero">
      <div>
        <p class="kicker">Browser Native Orchestrator</p>
        <h1>${t}</h1>
        <p class="lede">${p}</p>
      </div>
      <a class="chip" href="#features">Open features</a>
    </header>
    <section id="features" class="cards">
      <article class="panel"><h2>Compile</h2><p>Generate and refine source files in-browser.</p></article>
      <article class="panel"><h2>Package</h2><p>Build a portable ZIP bundle from the workspace.</p></article>
      <article class="panel"><h2>Run</h2><p>Preview the generated app in a virtual device.</p></article>
    </section>
    <footer class="footer">Generated by the browser-native compiler pipeline.</footer>
  </main>
  <script src="app.js"></script>
</body>
</html>`;
}

function buildStyles() {
  return `:root {
  color-scheme: dark;
  --bg: #0b1120;
  --panel: rgba(15, 23, 42, 0.88);
  --text: #e5e7eb;
  --muted: #94a3b8;
  --accent: #60a5fa;
  font-family: Inter, system-ui, sans-serif;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  min-height: 100vh;
  background: linear-gradient(180deg, #020617, #0b1120 50%, #111827);
  color: var(--text);
}
.page { max-width: 960px; margin: 0 auto; padding: 24px; }
.hero { display: flex; justify-content: space-between; gap: 16px; align-items: center; margin-bottom: 24px; }
.kicker { text-transform: uppercase; letter-spacing: .2em; color: var(--accent); font-size: .75rem; }
h1 { margin: 0; font-size: clamp(2rem, 5vw, 4rem); line-height: 1; }
.lede { color: var(--muted); max-width: 60ch; }
.chip { color: #0b1120; background: var(--accent); padding: 10px 14px; border-radius: 999px; text-decoration: none; font-weight: 800; }
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 16px; }
.panel { padding: 18px; border-radius: 20px; background: var(--panel); border: 1px solid rgba(148,163,184,.18); }
.footer { margin-top: 24px; color: var(--muted); }
`;
}

function buildRuntimeScript(name = state.projectName, prompt = state.projectPrompt) {
  return `(() => {
  const projectName = ${JSON.stringify(name)};
  const projectPrompt = ${JSON.stringify(prompt)};
  const el = document.body;
  const box = document.createElement('div');
  box.innerHTML = '<h1>' + projectName + '</h1><p>' + projectPrompt + '</p>';
  el.appendChild(box);
})();`;
}

function buildManifest(name = state.projectName) {
  return JSON.stringify({
    name,
    short_name: name.slice(0, 12),
    start_url: '.',
    scope: '.',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#111827',
    icons: [
      { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }, null, 2);
}

function buildServiceWorker() {
  return `const CACHE_NAME = 'browser-native-orchestrator-v1';
const ASSETS = ['./','./index.html','./styles.css','./app.js','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_NAME ? caches.delete(k) : Promise.resolve()))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).catch(() => caches.match('./index.html'))));
});`;
}

function buildReadme(name = state.projectName, prompt = state.projectPrompt) {
  return `# ${name}

${prompt}

## What it includes
- Browser-native compiler stages
- Local workspace storage
- Virtual device preview
- ZIP export
- Offline-ready PWA shell

## Buttons
- Generate draft
- Run compiler
- Install
- Run
- Export ZIP
- Save
`;
}

function log(message) {
  const line = `[${new Date().toLocaleTimeString()}] ${message}`;
  state.logs.push(line);
  renderLog();
}

function setDeviceStatus(text, kind = 'warn') {
  els.deviceState.textContent = text;
  els.deviceState.style.color = kind === 'good' ? 'var(--good)' : kind === 'bad' ? 'var(--bad)' : 'var(--warn)';
}

function cleanProjectName(name) {
  return (name || 'Untitled App').trim().replace(/\s+/g, ' ');
}

function sanitizePath(name) {
  return name.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\.\.+/g, '.');
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function pause(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function saveState(showLog = true) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    projectName: state.projectName,
    projectPrompt: state.projectPrompt,
    files: state.files,
    selectedFile: state.selectedFile,
    stageIndex: state.stageIndex,
    installed: state.installed,
    logs: state.logs,
  }));
  if (showLog) log('Workspace saved.');
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(DEFAULT_STATE),
      ...parsed,
      files: parsed.files || defaultFiles(parsed.projectName || DEFAULT_STATE.projectName),
      logs: Array.isArray(parsed.logs) ? parsed.logs : [],
    };
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

function resetState() {
  if (!confirm('Reset the workspace to the default starter project?')) return;
  state = structuredClone(DEFAULT_STATE);
  editorDirty = false;
  log('Workspace reset.');
  renderAll();
  saveState();
}

function persistBeforeLeave() {
  try { saveState(false); } catch {}
}

async function exportZip() {
  const files = {
    ...state.files,
    'manifest.webmanifest': state.files['manifest.webmanifest'] || buildManifest(),
    'sw.js': state.files['sw.js'] || buildServiceWorker(),
  };
  const zipBlob = zipStore(files);
  downloadBlob(zipBlob, `${slugify(state.projectName)}.zip`);
  log('ZIP exported.');
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function slugify(text) {
  return cleanProjectName(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'project';
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(err => log('Service worker registration failed: ' + err.message));
  }
}

/* ---- Minimal ZIP writer (store mode, no compression) ---- */
function zipStore(fileMap) {
  const encoder = new TextEncoder();
  const chunks = [];
  const central = [];
  let offset = 0;

  const push = bytes => {
    chunks.push(bytes);
    offset += bytes.length;
  };

  const w16 = n => new Uint8Array([n & 255, (n >> 8) & 255]);
  const w32 = n => new Uint8Array([n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >> 24) & 255]);

  const entries = Object.entries(fileMap);
  entries.forEach(([name, content]) => {
    const nameBytes = encoder.encode(name);
    const data = content instanceof Uint8Array ? content : encoder.encode(String(content));
    const crc = crc32(data);
    const localHeaderOffset = offset;

    // local file header
    push(Uint8Array.from([
      0x50,0x4b,0x03,0x04, 20,0, 0,0, 0,0, 0,0,0,0,
    ]));
    push(w32(crc));
    push(w32(data.length));
    push(w32(data.length));
    push(w16(nameBytes.length));
    push(w16(0));
    push(nameBytes);
    push(data);

    // central directory header
    const centralParts = [
      Uint8Array.from([0x50,0x4b,0x01,0x02, 20,0, 20,0, 0,0, 0,0, 0,0,0,0]),
      w32(crc),
      w32(data.length),
      w32(data.length),
      w16(nameBytes.length),
      w16(0),
      w16(0),
      w16(0),
      w16(0),
      w32(0),
      w32(localHeaderOffset),
      nameBytes,
    ];
    const total = concat(centralParts);
    central.push(total);
  });

  const centralBytes = concat(central);
  const end = concat([
    Uint8Array.from([0x50,0x4b,0x05,0x06, 0,0, 0,0]),
    w16(entries.length),
    w16(entries.length),
    w32(centralBytes.length),
    w32(offset),
    w16(0),
  ]);

  return new Blob([...chunks, centralBytes, end], { type: 'application/zip' });

  function concat(parts) {
    const total = parts.reduce((n, p) => n + p.length, 0);
    const out = new Uint8Array(total);
    let pos = 0;
    for (const p of parts) {
      out.set(p, pos);
      pos += p.length;
    }
    return out;
  }
}

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  return c >>> 0;
});
function crc32(bytes) {
  let crc = 0 ^ -1;
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}
