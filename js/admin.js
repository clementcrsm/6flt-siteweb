/* [6flt] Photographie — mode édition
   Sauvegarde directement dans le dépôt GitHub via l'API (aucun serveur nécessaire).
*/

const API = 'https://api.github.com';
const DATA_PATH = 'data/site-data.json';
const MAX_SIDE = 2000;      // redimensionnement des photos ajoutées
const JPEG_QUALITY = 0.85;

let siteData = null;        // contenu de site-data.json
let dataSha = null;         // sha du fichier pour la mise à jour
let previews = {};          // chemin relatif -> dataURL (aperçu avant publication)
let dirty = false;

/* ---------- Config (localStorage) ---------- */
const cfg = {
  get owner()  { return localStorage.getItem('gh_owner')  || ''; },
  get repo()   { return localStorage.getItem('gh_repo')   || ''; },
  get branch() { return localStorage.getItem('gh_branch') || 'main'; },
  get token()  { return localStorage.getItem('gh_token')  || ''; },
};

function bindCfgInput(id, key) {
  const el = document.getElementById(id);
  el.value = localStorage.getItem(key) || el.value || '';
  el.addEventListener('change', () => localStorage.setItem(key, el.value.trim()));
}

function autoDetectRepo() {
  // Sur GitHub Pages : monuser.github.io/mondepot/ ou monuser.github.io/
  const host = location.hostname;
  const m = host.match(/^([^.]+)\.github\.io$/);
  if (m && !localStorage.getItem('gh_owner')) {
    localStorage.setItem('gh_owner', m[1]);
    const seg = location.pathname.split('/').filter(Boolean)[0];
    const repo = seg && !seg.endsWith('.html') ? seg : host;
    if (!localStorage.getItem('gh_repo')) localStorage.setItem('gh_repo', repo);
  }
}

function cfgOk() { return cfg.owner && cfg.repo && cfg.token; }

/* ---------- Helpers API GitHub ---------- */
function ghHeaders() {
  return {
    'Authorization': 'Bearer ' + cfg.token,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

function b64EncodeUnicode(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function b64DecodeUnicode(str) {
  return decodeURIComponent(escape(atob(str.replace(/\n/g, ''))));
}

async function ghGetFile(path) {
  const res = await fetch(`${API}/repos/${cfg.owner}/${cfg.repo}/contents/${path}?ref=${cfg.branch}&t=${Date.now()}`, {
    headers: ghHeaders(),
  });
  if (!res.ok) throw new Error(`GitHub ${res.status} en lisant ${path}`);
  return res.json();
}

async function ghPutFile(path, base64Content, message, sha) {
  const body = { message, content: base64Content, branch: cfg.branch };
  if (sha) body.sha = sha;
  const res = await fetch(`${API}/repos/${cfg.owner}/${cfg.repo}/contents/${path}`, {
    method: 'PUT',
    headers: ghHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`GitHub ${res.status} : ${err.message || 'échec de l\'envoi de ' + path}`);
  }
  return res.json();
}

/* ---------- Statut ---------- */
function setStatus(msg, cls) {
  const el = document.getElementById('status');
  el.textContent = msg;
  el.className = 'status' + (cls ? ' ' + cls : '');
}

function markDirty() {
  dirty = true;
  setStatus('Modifications non enregistrées — pense à « Enregistrer & publier ».');
}

window.addEventListener('beforeunload', (e) => {
  if (dirty) { e.preventDefault(); e.returnValue = ''; }
});

/* ---------- Chargement des données ---------- */
async function loadSiteData() {
  if (cfgOk()) {
    try {
      const file = await ghGetFile(DATA_PATH);
      dataSha = file.sha;
      siteData = JSON.parse(b64DecodeUnicode(file.content));
      setStatus('Données chargées depuis GitHub. Prêt.', 'ok');
      return;
    } catch (e) {
      console.warn('Lecture GitHub impossible, repli sur le fichier local :', e);
    }
  }
  const res = await fetch(DATA_PATH + '?v=' + Date.now());
  siteData = await res.json();
  setStatus(cfgOk()
    ? 'Données locales chargées (lecture GitHub impossible — vérifie la config).'
    : 'Renseigne la connexion GitHub ci-dessus pour pouvoir publier.');
}

/* ---------- Onglets ---------- */
function initTabs() {
  const tp = document.getElementById('tab-photos');
  const tk = document.getElementById('tab-packs');
  tp.addEventListener('click', () => {
    tp.classList.add('active'); tk.classList.remove('active');
    document.getElementById('panel-photos').hidden = false;
    document.getElementById('panel-packs').hidden = true;
  });
  tk.addEventListener('click', () => {
    tk.classList.add('active'); tp.classList.remove('active');
    document.getElementById('panel-photos').hidden = true;
    document.getElementById('panel-packs').hidden = false;
  });
}

/* ---------- Grille photos : rendu + drag & drop ---------- */
function imgSrcFor(path) {
  return previews[path] || path;
}

function renderPhotoGrid() {
  const grid = document.getElementById('photo-grid');
  grid.innerHTML = '';
  siteData.gallery.forEach((src, i) => {
    const item = document.createElement('div');
    item.className = 'edit-item';
    item.draggable = true;
    item.dataset.index = i;

    const img = document.createElement('img');
    img.src = imgSrcFor(src);
    img.loading = 'lazy';

    const num = document.createElement('span');
    num.className = 'num';
    num.textContent = i + 1;

    const del = document.createElement('button');
    del.className = 'del';
    del.title = 'Retirer cette photo';
    del.textContent = '×';
    del.addEventListener('click', () => {
      if (confirm('Retirer cette photo du portfolio ?')) {
        siteData.gallery.splice(i, 1);
        renderPhotoGrid();
        markDirty();
      }
    });

    const movers = document.createElement('div');
    movers.className = 'movers';
    const up = document.createElement('button');
    up.textContent = '◀';
    up.title = 'Avancer';
    up.addEventListener('click', () => movePhoto(i, i - 1));
    const down = document.createElement('button');
    down.textContent = '▶';
    down.title = 'Reculer';
    down.addEventListener('click', () => movePhoto(i, i + 1));
    movers.append(up, down);

    item.append(img, num, del, movers);
    addDragHandlers(item, grid, (from, to) => {
      const [moved] = siteData.gallery.splice(from, 1);
      siteData.gallery.splice(to, 0, moved);
      renderPhotoGrid();
      markDirty();
    });
    grid.appendChild(item);
  });
}

function movePhoto(from, to) {
  if (to < 0 || to >= siteData.gallery.length) return;
  const [moved] = siteData.gallery.splice(from, 1);
  siteData.gallery.splice(to, 0, moved);
  renderPhotoGrid();
  markDirty();
}

/* drag & drop générique pour réordonner des éléments frères */
let dragIndex = null;

function addDragHandlers(el, container, onMove) {
  el.addEventListener('dragstart', (e) => {
    dragIndex = parseInt(el.dataset.index, 10);
    el.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', String(dragIndex)); } catch (_) {}
  });
  el.addEventListener('dragend', () => {
    el.classList.remove('dragging');
    container.querySelectorAll('.drop-target').forEach(n => n.classList.remove('drop-target'));
    dragIndex = null;
  });
  el.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragIndex !== null && parseInt(el.dataset.index, 10) !== dragIndex) {
      el.classList.add('drop-target');
    }
  });
  el.addEventListener('dragleave', () => el.classList.remove('drop-target'));
  el.addEventListener('drop', (e) => {
    e.preventDefault();
    el.classList.remove('drop-target');
    const to = parseInt(el.dataset.index, 10);
    if (dragIndex !== null && to !== dragIndex) onMove(dragIndex, to);
    dragIndex = null;
  });
}

/* ---------- Ajout de photos (drag & drop de fichiers) ---------- */
function initDropzone() {
  const dz = document.getElementById('dropzone');
  const input = document.getElementById('file-input');

  dz.addEventListener('click', () => input.click());
  input.addEventListener('change', () => handleFiles(input.files));

  ['dragenter', 'dragover'].forEach(ev =>
    dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('dragover'); }));
  ['dragleave', 'drop'].forEach(ev =>
    dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('dragover'); }));
  dz.addEventListener('drop', (e) => handleFiles(e.dataTransfer.files));
}

async function handleFiles(fileList) {
  const files = Array.from(fileList || []).filter(f => f.type.startsWith('image/'));
  if (!files.length) return;
  if (!cfgOk()) {
    setStatus('Renseigne d\'abord la connexion GitHub (utilisateur, dépôt, token) pour ajouter des photos.', 'err');
    return;
  }

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    setStatus(`Envoi de « ${f.name} » (${i + 1}/${files.length})…`);
    try {
      const { dataUrl, base64 } = await resizeImage(f);
      const name = uniqueName(f.name);
      const path = 'images/' + name;
      await ghPutFile(path, base64, 'Ajout photo : ' + name);
      previews[path] = dataUrl;
      siteData.gallery.unshift(path);   // la nouvelle photo arrive en tête
      renderPhotoGrid();
      markDirty();
    } catch (err) {
      console.error(err);
      setStatus(`Échec pour « ${f.name} » : ${err.message}`, 'err');
      return;
    }
  }
  setStatus('Photos envoyées ✔ — clique sur « Enregistrer & publier » pour les afficher sur le site.', 'ok');
}

function uniqueName(original) {
  const base = original.replace(/\.[^.]+$/, '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-_]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'photo';
  return `${base}-${Date.now().toString(36)}.jpg`;
}

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width: w, height: h } = img;
      if (Math.max(w, h) > MAX_SIDE) {
        const k = MAX_SIDE / Math.max(w, h);
        w = Math.round(w * k);
        h = Math.round(h * k);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
      resolve({ dataUrl, base64: dataUrl.split(',')[1] });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image illisible')); };
    img.src = url;
  });
}

/* ---------- Formules ---------- */
function renderPacks() {
  const list = document.getElementById('pack-list');
  list.innerHTML = '';
  siteData.packs.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'pack-edit';
    card.draggable = true;
    card.dataset.index = i;

    const head = document.createElement('div');
    head.className = 'pack-head';
    const label = document.createElement('span');
    label.textContent = `Formule ${i + 1} — fais glisser pour réordonner`;
    const movers = document.createElement('span');
    movers.className = 'movers';
    const up = document.createElement('button');
    up.textContent = '▲';
    up.addEventListener('click', () => movePack(i, i - 1));
    const down = document.createElement('button');
    down.textContent = '▼';
    down.addEventListener('click', () => movePack(i, i + 1));
    movers.append(up, down);
    head.append(label, movers);

    const row1 = document.createElement('div');
    row1.className = 'row';
    const title = mkInput(p.title, 'Titre', v => { p.title = v; });
    const price = mkInput(p.price, 'Prix', v => { p.price = v; });
    row1.append(title, price);

    const tagline = mkInput(p.tagline, 'Phrase d\'accroche', v => { p.tagline = v; });

    const feat = document.createElement('textarea');
    feat.value = (p.features || []).join('\n');
    feat.placeholder = 'Une prestation par ligne';
    feat.addEventListener('input', () => {
      p.features = feat.value.split('\n').map(s => s.trim()).filter(Boolean);
      markDirty();
    });

    const featLabel = document.createElement('label');
    featLabel.className = 'hint';
    featLabel.textContent = 'Contenu de la formule (une ligne par élément) :';

    card.append(head, row1, tagline, featLabel, feat);
    addDragHandlers(card, list, (from, to) => {
      const [moved] = siteData.packs.splice(from, 1);
      siteData.packs.splice(to, 0, moved);
      renderPacks();
      markDirty();
    });
    list.appendChild(card);
  });
}

function mkInput(value, placeholder, onChange) {
  const input = document.createElement('input');
  input.type = 'text';
  input.value = value || '';
  input.placeholder = placeholder;
  input.addEventListener('input', () => { onChange(input.value); markDirty(); });
  // empêche le drag de la carte quand on sélectionne du texte
  input.addEventListener('mousedown', e => e.stopPropagation());
  input.draggable = true;
  input.addEventListener('dragstart', e => { e.preventDefault(); e.stopPropagation(); });
  return input;
}

function movePack(from, to) {
  if (to < 0 || to >= siteData.packs.length) return;
  const [moved] = siteData.packs.splice(from, 1);
  siteData.packs.splice(to, 0, moved);
  renderPacks();
  markDirty();
}

/* ---------- Sauvegarde ---------- */
async function save() {
  if (!cfgOk()) {
    setStatus('Connexion GitHub incomplète : utilisateur, dépôt et token sont requis.', 'err');
    return;
  }
  const btn = document.getElementById('save-btn');
  btn.disabled = true;
  setStatus('Publication en cours…');
  try {
    // récupère le sha le plus récent pour éviter les conflits
    try {
      const file = await ghGetFile(DATA_PATH);
      dataSha = file.sha;
    } catch (_) { /* le fichier peut ne pas exister encore */ }

    const json = JSON.stringify(siteData, null, 2);
    const res = await ghPutFile(DATA_PATH, b64EncodeUnicode(json), 'Mise à jour du site (mode édition)', dataSha);
    dataSha = res.content && res.content.sha;
    dirty = false;
    setStatus('Publié ✔ — le site se met à jour d\'ici 1 à 2 minutes.', 'ok');
  } catch (err) {
    console.error(err);
    setStatus('Échec de la publication : ' + err.message, 'err');
  } finally {
    btn.disabled = false;
  }
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', async () => {
  autoDetectRepo();
  bindCfgInput('cfg-owner', 'gh_owner');
  bindCfgInput('cfg-repo', 'gh_repo');
  bindCfgInput('cfg-branch', 'gh_branch');
  bindCfgInput('cfg-token', 'gh_token');
  initTabs();
  initDropzone();
  document.getElementById('save-btn').addEventListener('click', save);

  try {
    await loadSiteData();
    renderPhotoGrid();
    renderPacks();
  } catch (err) {
    console.error(err);
    setStatus('Impossible de charger les données du site : ' + err.message, 'err');
  }
});
