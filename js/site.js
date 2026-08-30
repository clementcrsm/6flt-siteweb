/* [6flt] Photographie — rendu des données (galerie, formules, témoignage) */

async function loadData() {
  const res = await fetch('data/site-data.json?v=' + Date.now());
  if (!res.ok) throw new Error('Impossible de charger data/site-data.json');
  return res.json();
}

/* ---------- Menu mobile ---------- */
function initNav() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => nav.classList.toggle('open'));
  }
}

/* ---------- Galerie + lightbox ---------- */
function renderGallery(data) {
  const wrap = document.getElementById('gallery');
  if (!wrap) return;

  const urls = data.gallery || [];
  wrap.innerHTML = '';

  urls.forEach((src, i) => {
    const a = document.createElement('a');
    a.href = src;
    a.dataset.index = i;
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.alt = 'Photographie automobile [6flt] ' + (i + 1);
    img.src = src;
    img.addEventListener('load', () => img.classList.add('loaded'));
    img.addEventListener('error', () => a.remove());
    a.appendChild(img);
    a.addEventListener('click', (e) => {
      e.preventDefault();
      openLightbox(urls, i);
    });
    wrap.appendChild(a);
  });
}

let lbState = { urls: [], index: 0 };

function openLightbox(urls, index) {
  lbState = { urls, index };
  const lb = document.getElementById('lightbox');
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
  updateLightbox();
}

function updateLightbox() {
  const img = document.querySelector('#lightbox img');
  img.src = lbState.urls[lbState.index];
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
}

function lbMove(delta) {
  const n = lbState.urls.length;
  lbState.index = (lbState.index + delta + n) % n;
  updateLightbox();
}

function initLightbox() {
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  lb.querySelector('.lb-close').addEventListener('click', closeLightbox);
  lb.querySelector('.lb-prev').addEventListener('click', (e) => { e.stopPropagation(); lbMove(-1); });
  lb.querySelector('.lb-next').addEventListener('click', (e) => { e.stopPropagation(); lbMove(1); });
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') lbMove(-1);
    if (e.key === 'ArrowRight') lbMove(1);
  });
}

/* ---------- Formules ---------- */
function renderPacks(data) {
  const wrap = document.getElementById('packs');
  if (!wrap) return;

  wrap.innerHTML = '';
  (data.packs || []).forEach((p) => {
    const card = document.createElement('article');
    card.className = 'pack-card';

    const img = document.createElement('img');
    img.className = 'pack-img';
    img.loading = 'lazy';
    img.alt = p.title;
    img.src = p.image;

    const body = document.createElement('div');
    body.className = 'pack-body';

    const h3 = document.createElement('h3');
    h3.textContent = p.title;

    const price = document.createElement('div');
    price.className = 'pack-price';
    price.textContent = p.price;

    const tagline = document.createElement('p');
    tagline.className = 'pack-tagline';
    tagline.textContent = p.tagline;

    const ul = document.createElement('ul');
    ul.className = 'pack-features';
    (p.features || []).forEach((f) => {
      const li = document.createElement('li');
      li.textContent = f;
      ul.appendChild(li);
    });

    const btn = document.createElement('a');
    btn.className = 'btn';
    btn.href = 'contact.html';
    btn.textContent = 'Réserver';

    body.append(h3, price, tagline, ul, btn);
    card.append(img, body);
    wrap.appendChild(card);
  });
}

/* ---------- Témoignage ---------- */
function renderTestimonial(data) {
  const wrap = document.getElementById('testimonial');
  if (!wrap || !data.testimonial) return;
  wrap.querySelector('img').src = data.testimonial.image;
  wrap.querySelector('blockquote .quote-text').textContent = '« ' + data.testimonial.quote + ' »';
  wrap.querySelector('cite').textContent = '— ' + data.testimonial.author;
}

/* ---------- Bannière contact ---------- */
function renderContactBanner(data) {
  const el = document.getElementById('contact-banner');
  if (el && data.contactBanner) el.src = data.contactBanner;
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', async () => {
  initNav();
  initLightbox();
  try {
    const data = await loadData();
    renderGallery(data);
    renderPacks(data);
    renderTestimonial(data);
    renderContactBanner(data);
  } catch (err) {
    console.error(err);
  }
});
