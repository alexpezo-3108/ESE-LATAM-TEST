/* ==========================================================================
   Motion — Lenis (smooth scroll) + Motion (reveals, parallax, contadores)
   Controlado por data-attributes:
     data-reveal="up | mask | mask-x | scale"   data-reveal-delay="0.1"
     data-stagger="0.08"  (contenedor; escalona a sus hijos)
     data-parallax="0.15" (negativo = dirección inversa; solo desktop)
     data-reveal-inner    (hijo de un mask que hace scale 1.1 → 1)
     data-count="100" data-count-suffix="%"
   ========================================================================== */
import Lenis from 'https://cdn.jsdelivr.net/npm/lenis@1.1.20/+esm';
import { animate, scroll } from 'https://cdn.jsdelivr.net/npm/motion@11.18.2/+esm';

const root = document.documentElement;
// Vuelta al Home en la misma sesión: se captura al cargar (hero.js quita la clase luego del load)
const returning = root.classList.contains('is-return');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const desktop = matchMedia('(min-width: 64em)');

const EASE_MAIN = [0.65, 0, 0.15, 1];
const EASE_OUT = [0.16, 1, 0.3, 1];
const DUR = { fast: 0.4, base: 0.9, slow: 1.3 };
const TEXT_TAGS = /^(H[1-6]|P|BLOCKQUOTE)$/;

/* ---------- Lenis ---------- */
function initLenis() {
  // prevent: la rueda/trackpad dentro de un panel con scroll propio (dropdowns, menú, buscador, hojas) no mueve la página
  const scrollsOwn = (n) => n instanceof Element && n !== document.body && n !== document.documentElement &&
    (n.hasAttribute('data-lenis-prevent') || (/(auto|scroll)/.test(getComputedStyle(n).overflowY) && n.scrollHeight > n.clientHeight + 1));
  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, anchors: true, prevent: scrollsOwn });
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  window.lenis = lenis; // main.js lo usa para pausar con el menú abierto
}

/* ---------- Split por líneas (títulos) ----------
   Usa hijos [data-line] si existen; si no, agrupa palabras por línea.
   Nota: el split automático aplana el marcado inline del texto. */
function splitLines(el) {
  let lines = [...el.querySelectorAll('[data-line]')];

  if (!lines.length) {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    const spans = words.map((w) => {
      const s = document.createElement('span');
      s.textContent = w;
      el.append(s, ' ');
      return s;
    });
    const groups = [];
    let top = null;
    spans.forEach((s) => {
      if (s.offsetTop !== top) { groups.push([]); top = s.offsetTop; }
      groups[groups.length - 1].push(s.textContent);
    });
    el.textContent = '';
    lines = groups.map((g) => {
      const l = document.createElement('span');
      l.textContent = g.join(' ');
      el.append(l, ' ');
      return l;
    });
  }

  return lines.map((line) => {
    const inner = document.createElement('span');
    inner.className = 'line__inner';
    inner.append(...line.childNodes);
    line.classList.add('line');
    line.append(inner);
    return inner;
  });
}

/* ---------- Reveals ---------- */
const distance = () => getComputedStyle(root).getPropertyValue('--reveal-distance').trim() || '2.5rem';

/* Al terminar se cancelan las animaciones (su fill retiene clip-path y
   recortaría sombras) y el estado final queda en CSS vía .is-revealed. */
function done(el) {
  el.classList.add('is-revealed');
  [el, ...el.querySelectorAll('.line__inner, [data-reveal-inner]')].forEach((n) => n.getAnimations?.().forEach((a) => a.cancel()));
  el.style.removeProperty('transform');
  el.style.removeProperty('clip-path');
  el.querySelectorAll('.line__inner, [data-reveal-inner]').forEach((n) => n.style.removeProperty('transform'));
}

function reveal(el, extraDelay = 0) {
  const type = el.dataset.reveal || 'up';
  const delay = (parseFloat(el.dataset.revealDelay) || 0) + extraDelay;
  const anims = [];

  if (type === 'mask' && el._lines) {
    el._lines.forEach((line, i) => {
      anims.push(animate(line,
        { transform: ['translate3d(0,105%,0)', 'translate3d(0,0,0)'] },
        { duration: 1, ease: EASE_OUT, delay: delay + i * 0.08 }));
    });
  } else if (type === 'mask' || type === 'mask-x') {
    const from = type === 'mask' ? 'inset(100% 0% 0% 0%)' : 'inset(0% 100% 0% 0%)';
    anims.push(animate(el,
      { clipPath: [from, 'inset(0% 0% 0% 0%)'] },
      { duration: DUR.base, ease: EASE_MAIN, delay }));
    const inner = el.querySelector('[data-reveal-inner]');
    if (inner) {
      anims.push(animate(inner,
        { transform: ['scale(1.1)', 'scale(1)'] },
        { duration: DUR.slow, ease: EASE_OUT, delay }));
    }
  } else if (type === 'rise') {
    anims.push(animate(el,
      { transform: ['translate3d(0,100%,0)', 'translate3d(0,0,0)'] },
      { duration: DUR.slow, ease: EASE_OUT, delay }));
  } else if (type === 'scale') {
    anims.push(animate(el,
      { transform: ['scale(0.94)', 'scale(1)'] },
      { duration: 0.8, ease: EASE_OUT, delay }));
  } else {
    // data-reveal-fade: además entra con fade (no se ve antes de su animación)
    const kf = { transform: [`translate3d(0,${distance()},0)`, 'translate3d(0,0,0)'] };
    if (el.hasAttribute('data-reveal-fade')) kf.opacity = [0, 1];
    anims.push(animate(el, kf, { duration: 0.8, ease: EASE_OUT, delay }));
  }
  // marca el inicio real de la animación (tras su delay) → p. ej. para arrancar contadores
  setTimeout(() => el.classList.add('is-revealing'), delay * 1000);

  Promise.all(anims).then(() => done(el));
}

/* Dispara una sola vez al entrar al viewport (IntersectionObserver nativo) */
/* Elementos con máscara (clip-path al 100%) no son detectables por sí mismos:
   se observa su contenedor. */
function once(el, cb) {
  if (root.classList.contains('is-intro') && !window.__preDone && el.closest('.s-hero')) { addEventListener('preloader:done', () => once(el, cb), { once: true }); return; }
  let target = /^(mask|rise)/.test(el.dataset.reveal || '') ? el.parentElement : el;
  // Un contenedor con display: contents no tiene caja: se sube al primer ancestro observable
  while (target && target !== document.body && getComputedStyle(target).display === 'contents') target = target.parentElement;
  // Dentro de otro reveal aún recortado (clip-path) el observer no lo ve: se observa por fuera de ese padre
  let outer = target && target.closest('[data-reveal]:not(.is-revealed)');
  while (outer && outer !== el) { target = outer.parentElement; outer = target && target.closest('[data-reveal]:not(.is-revealed)'); }
  const r = target.getBoundingClientRect();
  if (r.top < window.innerHeight * 0.9 && r.bottom > 0) { cb(); return; }
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { io.disconnect(); cb(); }
  }, { rootMargin: '0px 0px -10% 0px' });
  io.observe(target);
}

/* Red de seguridad: si algo no terminó, todo queda visible */
function failsafe() {
  // Red de seguridad continua: lo que entra en pantalla y no se reveló en 1.5 s, se muestra
  let t = null;
  const sweep = () => {
    t = null;
    if (root.classList.contains('is-intro') && !window.__preDone) return;
    document.querySelectorAll('[data-reveal]:not(.is-revealed)').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.85 && r.bottom > 0) {
        if (!el._seen) el._seen = performance.now();
        else if (performance.now() - el._seen > 1500) done(el);
      }
    });
  };
  window.addEventListener('scroll', () => { if (!t) t = setTimeout(sweep, 250); }, { passive: true });
  setInterval(sweep, 1000);
  const late = () => setTimeout(() => {
    document.querySelectorAll('[data-reveal], [data-stagger] > *').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && !el.classList.contains('is-revealed')) done(el);
    });
    // Si el observer nunca disparó, los contadores muestran su valor final
    document.querySelectorAll('[data-count]:not([data-counted])').forEach((el) => {
      el.textContent = `${el.dataset.countPrefix || ''}${fmtCount(parseFloat(el.dataset.count) || 0)}${el.dataset.countSuffix || ''}`;
    });
  }, 4000);
  if (root.classList.contains('is-intro') && !window.__preDone) addEventListener('preloader:done', late, { once: true }); else late();
}

function initReveals() {
  // Split de títulos antes de observar, para evitar saltos
  document.querySelectorAll('[data-reveal="mask"]').forEach((el) => {
    if (TEXT_TAGS.test(el.tagName)) {
      el._lines = splitLines(el);
      el.classList.add('is-split');
    }
  });

  const staggered = new Set();
  document.querySelectorAll('[data-stagger]').forEach((box) => {
    const step = parseFloat(box.dataset.stagger) || 0.08;
    const kids = [...box.children];
    kids.forEach((k) => staggered.add(k));
    once(box, () => kids.forEach((k, i) => reveal(k, i * step)));
  });

  document.querySelectorAll('[data-reveal]').forEach((el) => {
    if (returning && el.closest('.s-hero')) { done(el); return; }   // ya en su lugar, sin entrada
    if (!staggered.has(el)) once(el, () => reveal(el));
  });
}

/* ---------- Parallax (solo desktop) ---------- */
let parallaxStops = [];

function initParallax() {
  parallaxStops.forEach((stop) => stop());
  parallaxStops = [];
  document.querySelectorAll('[data-parallax]').forEach((el) => el.style.removeProperty('transform'));
  if (!desktop.matches) return;

  document.querySelectorAll('[data-parallax]').forEach((el) => {
    const speed = parseFloat(el.dataset.parallax) || 0;
    const target = el.parentElement;
    const range = speed * target.offsetHeight;
    const atTop = target.getBoundingClientRect().top + window.scrollY < window.innerHeight * 0.5;
    const from = atTop ? 0 : -range;
    parallaxStops.push(scroll(
      animate(el, { transform: [`translate3d(0,${from}px,0)`, `translate3d(0,${range}px,0)`] }, { ease: 'linear' }),
      { target, offset: atTop ? ['start start', 'end start'] : ['start end', 'end start'] }
    ));
  });
}

/* ---------- Contadores ---------- */
function initCounters() {
  document.querySelectorAll('[data-count]').forEach((el) => {
    const to = parseFloat(el.dataset.count) || 0;
    const suffix = el.dataset.countSuffix || '', prefix = el.dataset.countPrefix || '';
    el.textContent = `${prefix}0${suffix}`;
    once(el, () => {
      el.dataset.counted = '';
      animate(0, to, {
        duration: DUR.slow * 1.4,
        ease: EASE_OUT,
        delay: parseFloat(el.dataset.revealDelay) || 0,
        onUpdate: (v) => { el.textContent = `${prefix}${fmtCount(Math.round(v))}${suffix}`; },
      });
    });
  });
}

/* Miles con punto (es): 1100 → 1.100 */
function fmtCount(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }

/* ---------- Init ---------- */
async function init() {
  if (reduced || !root.classList.contains('js-motion')) return;
  root.classList.add('motion-ready');
  try {
    await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 800))]);
    initLenis();
    initReveals();
    initCounters();
    initParallax();
    failsafe();
    desktop.addEventListener('change', initParallax);
  } catch (err) {
    root.classList.remove('js-motion'); // si algo falla, todo visible
    console.error(err);
  }
}

init();
