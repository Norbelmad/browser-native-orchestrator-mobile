const STORAGE_KEY = 'browser-native-orchestrator-mobile-v1';
const DEFAULTS = {
  projectName: 'Browser Native Orchestrator',
  goal: 'Create and package apps with a browser-first compiler workflow.',
  prompt: 'Generate a production-ready app factory workflow.',
  packageName: 'com.example.browsernativeorchestrator',
  packageVersion: '1.0.0',
  packageScreen: 'Welcome to Browser Native Orchestrator',
  buildStatus: 'idle',
  deviceState: 'ready',
  deviceScreen: 'Welcome to Browser Native Orchestrator',
  tasks: ['Plan app architecture', 'Generate source files', 'Review for gaps', 'Package handoff bundle'],
  workers: [
    { id: 'planner', name: 'Planner', role: 'Breaks work into steps', status: 'Ready' },
    { id: 'builder', name: 'Builder', role: 'Generates files', status: 'Ready' },
    { id: 'critic', name: 'Critic', role: 'Finds gaps', status: 'Ready' },
    { id: 'runner', name: 'Runner', role: 'Handles device flow', status: 'Ready' },
  ],
  files: [
    { path: 'src/App.tsx', kind: 'code', content: `export default function App() {\n  return <main style={{ padding: 16 }}><h1>Browser Native Orchestrator</h1></main>;\n}` },
    { path: 'src/lib/orchestrator.ts', kind: 'code', content: `export function orchestrate(tasks) {\n  return tasks.map((task, index) => ({ id: index + 1, task }));\n}` },
    { path: 'manifest.json', kind: 'config', content: JSON.stringify({ name: 'Browser Native Orchestrator', version: '1.0.0', entry: 'src/App.tsx' }, null, 2) },
    { path: 'bridge/native-bridge-manifest.json', kind: 'config', content: JSON.stringify({ bridgeUrl: 'browser-only', installEndpoint: '/install', runEndpoint: '/run' }, null, 2) },
    { path: 'README.md', kind: 'doc', content: '# Browser Native Orchestrator\n\nA browser-first app factory for mobile and desktop.' },
  ],
  logs: [
    { id: 1, text: 'Mobile workspace loaded.', time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) },
    { id: 2, text: 'Ready for browser-based app creation.', time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) },
  ],
  installedApps: [],
  exportCount: 0,
  savedAt: '',
  bundleName: '',
  selectedFile: 'src/App.tsx',
  currentTask: 'Build package',
  previewEnabled: true,
  phoneMode: true,
};

const state = { ...DEFAULTS };

const els = {};
let activeTab = 'build';
let selectedWorker = 'planner';
let taskInput = '';
let searchText = '';
let commandValue = 'devices';
let sourceDraft = DEFAULTS.files[0].content;
let manifest = DEFAULTS.files[2].content;
let bridgeManifest = DEFAULTS.files[3].content;
let selectedFile = DEFAULTS.selectedFile;

function qs(id) { return document.getElementById(id); }
function nowTime() { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
function log(text) { state.logs = [{ id: Date.now(), text, time: nowTime() }, ...state.logs].slice(0, 50); save(); render(); }

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    ...state,
    activeTab,
    selectedWorker,
    taskInput,
    searchText,
    commandValue,
    sourceDraft,
    manifest,
    bridgeManifest,
    selectedFile,
  }));
}

function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    Object.assign(state, { ...DEFAULTS, ...parsed });
    activeTab = parsed.activeTab || 'build';
    selectedWorker = parsed.selectedWorker || 'planner';
    taskInput = parsed.taskInput || '';
    searchText = parsed.searchText || '';
    commandValue = parsed.commandValue || 'devices';
    sourceDraft = parsed.sourceDraft || DEFAULTS.files[0].content;
    manifest = parsed.manifest || DEFAULTS.files[2].content;
    bridgeManifest = parsed.bridgeManifest || DEFAULTS.files[3].content;
    selectedFile = parsed.selectedFile || DEFAULTS.selectedFile;
  } catch {}
}

function setTab(tab) {
  activeTab = tab;
  save();
  render();
}

function renderTabs() {
  document.querySelectorAll('.tab').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === activeTab);
  });
}

function renderBuild() {
  const root = qs('content');
  root.innerHTML = document.getElementById('buildTemplate').innerHTML;
  qs('projectName').value = state.projectName;
  qs('goal').value = state.goal;
  qs('prompt').value = state.prompt;
  qs('fileCount').textContent = state.files.length;
  qs('taskCount').textContent = state.tasks.length;
  qs('workerCount').textContent = state.workers.length;
  qs('selectedFileLabel').textContent = selectedFile;
  qs('statusLabel').textContent = state.buildStatus;
  qs('editor').value = sourceDraft;
  qs('logs').innerHTML = state.logs.map((l) => `<div class="log"><span class="muted">${l.time}</span><span>${l.text}</span></div>`).join('');
  qs('taskList').innerHTML = state.tasks.map((t, i) => `<div class="item"><div><strong>${i+1}. ${t}</strong></div><button data-remove-task="${i}" class="mini">✕</button></div>`).join('');
  qs('fileList').innerHTML = (state.files.filter((f) => f.path.toLowerCase().includes(searchText.toLowerCase()))).map((f) => `
    <div class="item">
      <div><strong>${f.path}</strong><div class="muted">${f.kind}</div></div>
      <button data-select-file="${f.path}" class="mini">›</button>
    </div>`).join('');

  ['projectName','goal','prompt','editor','taskInput','searchFiles'].forEach((id) => {
    const el = qs(id);
    if (!el) return;
    if (id === 'editor') el.value = sourceDraft;
    if (id === 'taskInput') el.value = taskInput;
    if (id === 'searchFiles') el.value = searchText;
  });
  ['projectName','goal','prompt'].forEach((id) => {
    qs(id).oninput = () => {
      state[id === 'projectName' ? 'projectName' : id === 'goal' ? 'goal' : 'prompt'] = qs(id).value;
      save();
    };
  });
  qs('editor').oninput = () => { sourceDraft = qs('editor').value; save(); };
  qs('taskInput').oninput = () => { taskInput = qs('taskInput').value; save(); };
  qs('searchFiles').oninput = () => { searchText = qs('searchFiles').value; renderBuild(); save(); };
}

function renderDevice() {
  const root = qs('content');
  root.innerHTML = document.getElementById('deviceTemplate').innerHTML;
  qs('deviceStateLabel').textContent = state.deviceState;
  qs('installedCount').textContent = state.installedApps.length;
  qs('packageName').value = state.packageName;
  qs('packageVersion').value = state.packageVersion;
  qs('packageScreen').value = state.packageScreen;
  qs('packageDescription').value = state.goal;
  qs('commandOutput').textContent = state.commandOutput || 'Run a virtual command here.';
  qs('screen').textContent = state.deviceScreen;
  qs('installedList').innerHTML = state.installedApps.map((app) => `<div class="item"><div><strong>${app.name}</strong><div class="muted">${app.packageName}</div></div><span class="pill">${app.running ? 'running' : 'installed'}</span></div>`).join('');
  qs('deviceLogs').innerHTML = state.logs.map((l) => `<div class="log"><span class="muted">${l.time}</span><span>${l.text}</span></div>`).join('');

  qs('command').value = commandValue;
  qs('packageName').oninput = () => { state.packageName = qs('packageName').value; save(); };
  qs('packageVersion').oninput = () => { state.packageVersion = qs('packageVersion').value; save(); };
  qs('packageScreen').oninput = () => { state.packageScreen = qs('packageScreen').value; save(); };
  qs('packageDescription').oninput = () => { state.goal = qs('packageDescription').value; save(); };
  qs('command').oninput = () => { commandValue = qs('command').value; save(); };
}

function renderExport() {
  const root = qs('content');
  root.innerHTML = document.getElementById('exportTemplate').innerHTML;
  qs('exportCount').textContent = state.exportCount;
  qs('bundleLabel').textContent = state.bundleName || 'none';
  qs('savedLabel').textContent = state.savedAt ? 'yes' : 'no';
}

function renderSettings() {
  const root = qs('content');
  root.innerHTML = document.getElementById('settingsTemplate').innerHTML;
  qs('phoneMode').checked = state.phoneMode;
  qs('previewMode').checked = state.previewEnabled;
}

function renderHome() {
  const root = qs('content');
  root.innerHTML = `
    <section class="card stack">
      <div class="gridTwo">
        <div class="panel"><div class="muted">Project</div><strong>${state.projectName}</strong></div>
        <div class="panel"><div class="muted">Device</div><strong>${state.deviceState}</strong></div>
      </div>
      <div class="panel">
        <div class="panelHeader"><strong>Quick actions</strong></div>
        <div class="row">
          <button id="quickCompile" class="primary">Compile</button>
          <button id="quickInstall" class="secondary">Install</button>
          <button id="quickRun" class="secondary">Run</button>
          <button id="quickExport" class="secondary">Export</button>
        </div>
      </div>
      <div class="panel">
        <strong>What this mobile version does</strong>
        <div class="muted">Build projects, export bundles, and run them in the virtual device lab from Brave Mobile.</div>
      </div>
    </section>`;
  qs('quickCompile').onclick = runCompiler;
  qs('quickInstall').onclick = installPackage;
  qs('quickRun').onclick = runApp;
  qs('quickExport').onclick = buildZip;
}

function render() {
  if (activeTab === 'build') renderBuild();
  else if (activeTab === 'device') renderDevice();
  else if (activeTab === 'export') renderExport();
  else if (activeTab === 'settings') renderSettings();
  else renderHome();

  renderTabs();
  bindCommon();
  save();
}

function bindCommon() {
  qs('installBtn').hidden = !('BeforeInstallPromptEvent' in window) && !('onbeforeinstallprompt' in window);
  qs('installBtn').onclick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      qs('installBtn').hidden = true;
    }
  };
  qs('saveBtn').onclick = () => { state.savedAt = new Date().toISOString(); log('Project saved locally.'); };
  qs('exportBtn').onclick = buildZip;

  document.querySelectorAll('[data-tab]').forEach((btn) => {
    btn.onclick = () => setTab(btn.dataset.tab);
  });

  const addTaskBtn = qs('addTaskBtn'); if (addTaskBtn) addTaskBtn.onclick = () => {
    const t = taskInput.trim();
    if (!t) return;
    state.tasks.push(t);
    taskInput = '';
    log(`Task added: ${t}`);
    render();
  };

  const addFileBtn = qs('addFileBtn'); if (addFileBtn) addFileBtn.onclick = () => {
    const n = state.files.length + 1;
    const file = { path: `src/generated/file-${n}.ts`, kind: 'code', content: `export const value${n} = ${n};` };
    state.files.push(file);
    selectedFile = file.path;
    sourceDraft = file.content;
    log(`Created ${file.path}.`);
    render();
  };

  const draftBtn = qs('draftBtn'); if (draftBtn) draftBtn.onclick = () => {
    sourceDraft = `export default function App() {\n  return (\n    <main style={{ padding: 16 }}>\n      <h1>${state.projectName}</h1>\n      <p>${state.goal}</p>\n      <pre>${state.prompt.replace(/</g, '&lt;')}</pre>\n    </main>\n  );\n}`;
    log('Prompt converted into source draft.');
    render();
  };

  const compileBtn = qs('compileBtn'); if (compileBtn) compileBtn.onclick = runCompiler;

  const installDeviceBtn = qs('installDeviceBtn'); if (installDeviceBtn) installDeviceBtn.onclick = installPackage;
  const runDeviceBtn = qs('runDeviceBtn'); if (runDeviceBtn) runDeviceBtn.onclick = runApp;
  const resetDeviceBtn = qs('resetDeviceBtn'); if (resetDeviceBtn) resetDeviceBtn.onclick = resetDevice;
  const runCmdBtn = qs('runCmdBtn'); if (runCmdBtn) runCmdBtn.onclick = runCommand;

  const buildZipBtn = qs('buildZipBtn'); if (buildZipBtn) buildZipBtn.onclick = buildZip;
  const snapshotBtn = qs('snapshotBtn'); if (snapshotBtn) snapshotBtn.onclick = () => { state.savedAt = new Date().toISOString(); state.exportCount += 1; log('Snapshot captured.'); render(); };
  const importBtn = qs('importBtn'); if (importBtn) importBtn.onclick = () => qs('importFile').click();
  const importFile = qs('importFile'); if (importFile) importFile.onchange = async (e) => {
    const file = e.target.files[0];
    if (file) await importState(file);
    e.target.value = '';
  };

  const resetAllBtn = qs('resetAllBtn'); if (resetAllBtn) resetAllBtn.onclick = resetAll;

  const phoneModeEl = qs('phoneMode'); if (phoneModeEl) phoneModeEl.onchange = () => { state.phoneMode = phoneModeEl.checked; render(); };
  const previewModeEl = qs('previewMode'); if (previewModeEl) previewModeEl.onchange = () => { state.previewEnabled = previewModeEl.checked; render(); };

  document.querySelectorAll('[data-select-file]').forEach((btn) => {
    btn.onclick = () => {
      selectedFile = btn.dataset.selectFile;
      const file = state.files.find((f) => f.path === selectedFile);
      if (file) sourceDraft = file.content;
      render();
    };
  });
  document.querySelectorAll('[data-remove-task]').forEach((btn) => {
    btn.onclick = () => {
      const i = Number(btn.dataset.removeTask);
      state.tasks.splice(i, 1);
      log('Task removed.');
      render();
    };
  });
}

function runCompiler() {
  state.buildStatus = 'building';
  log('Planner created the task flow.');
  log('Builder generated source and manifest files.');
  log('Critic reviewed the output.');
  log('Packager prepared the export bundle.');
  manifest = JSON.stringify({ name: state.projectName, version: state.packageVersion, entry: 'src/App.tsx', packageName: state.packageName }, null, 2);
  bridgeManifest = JSON.stringify({ bridgeUrl: 'browser-only', installEndpoint: '/install', runEndpoint: '/run' }, null, 2);
  state.buildStatus = 'ready';
  log('Compiler run completed.');
  render();
}

function installPackage() {
  state.installedApps = [{ name: state.projectName, packageName: state.packageName, running: false }];
  state.deviceState = 'installed';
  state.commandOutput = `Installed ${state.packageName} into the mobile browser emulator.`;
  log(`Installed ${state.projectName}.`);
  state.deviceScreen = state.packageScreen;
  render();
}

function runApp() {
  if (!state.installedApps.length) {
    state.commandOutput = 'No installed app found.';
    log('Run failed: install first.');
    render();
    return;
  }
  state.deviceState = 'running';
  state.installedApps = state.installedApps.map((a) => ({ ...a, running: true }));
  state.deviceScreen = sourceDraft;
  state.commandOutput = `Launching ${state.packageName}...`;
  log(`Running ${state.projectName} on the mobile emulator.`);
  render();
}

function resetDevice() {
  state.deviceState = 'ready';
  state.installedApps = [];
  state.deviceScreen = DEFAULTS.packageScreen;
  state.commandOutput = 'Device reset to ready state.';
  log('Virtual device reset.');
  render();
}

function runCommand() {
  const c = commandValue.trim().toLowerCase();
  if (!c) return;
  if (c.includes('devices')) {
    state.commandOutput = `List of devices attached\nmobile-lab-001\tdevice`;
    log('devices command handled.');
  } else if (c.includes('install')) {
    installPackage();
  } else if (c.includes('shell am start')) {
    runApp();
  } else if (c.includes('logcat')) {
    state.commandOutput = state.logs.slice(0, 8).map((l) => `[${l.time}] ${l.text}`).join('\n');
    log('logcat captured.');
  } else if (c.includes('reboot')) {
    resetDevice();
    state.commandOutput = 'Rebooting virtual device...';
  } else {
    state.commandOutput = `Command accepted: ${commandValue}`;
    log(`Command handled: ${commandValue}`);
  }
  render();
}

async function buildZip() {
  const blob = await zipFiles(state.files, {
    'manifest.json': manifest,
    'bridge/native-bridge-manifest.json': bridgeManifest,
    'device-lab/state.json': JSON.stringify({ deviceState: state.deviceState, installedApps: state.installedApps, selectedFile, packageName: state.packageName, packageVersion: state.packageVersion }, null, 2),
    'README.txt': 'Browser-native mobile workflow bundle.',
  });
  const filename = `${state.projectName.replace(/[^a-z0-9-_]+/gi, '_').toLowerCase() || 'browser_native_orchestrator'}.zip`;
  downloadBlob(blob, filename);
  state.bundleName = filename;
  state.exportCount += 1;
  state.savedAt = new Date().toISOString();
  log(`Exported bundle: ${filename}`);
  render();
}

async function importState(file) {
  const text = await file.text();
  const parsed = safeParseJson(text);
  if (!parsed) {
    const err = qs('importError');
    if (err) err.textContent = 'Invalid JSON file.';
    return;
  }
  Object.assign(state, parsed);
  if (parsed.selectedFile) selectedFile = parsed.selectedFile;
  if (parsed.sourceDraft) sourceDraft = parsed.sourceDraft;
  if (parsed.manifest) manifest = parsed.manifest;
  if (parsed.bridgeManifest) bridgeManifest = parsed.bridgeManifest;
  if (parsed.prompt) state.prompt = parsed.prompt;
  if (parsed.commandValue) commandValue = parsed.commandValue;
  log('State imported from JSON.');
  render();
}

function resetAll() {
  Object.assign(state, DEFAULTS);
  activeTab = 'home';
  selectedWorker = 'planner';
  taskInput = '';
  searchText = '';
  commandValue = 'devices';
  sourceDraft = DEFAULTS.files[0].content;
  manifest = DEFAULTS.files[2].content;
  bridgeManifest = DEFAULTS.files[3].content;
  selectedFile = DEFAULTS.selectedFile;
  log('Project reset to defaults.');
  render();
}

let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  qs('installBtn').hidden = false;
});

window.addEventListener('load', () => {
  load();
  // ensure current file/content are aligned
  const file = state.files.find((f) => f.path === selectedFile);
  if (file) sourceDraft = file.content;
  render();
});