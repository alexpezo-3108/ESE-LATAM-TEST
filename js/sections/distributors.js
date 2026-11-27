/* ==========================================================================
   Distribuidores — globo (js/vendor/globe.js) + marcadores HTML + acordeón
   [data-distributors] · [data-globe] · [data-globe-markers]
   [data-country] (ítem) · [data-dist][data-lat][data-lon] (distribuidor)
   ========================================================================== */
(() => {
  const root = document.querySelector('[data-distributors]');
  if (!root) return;

  const stage = root.querySelector('[data-globe]');
  const layer = root.querySelector('[data-globe-markers]');
  const list = root.querySelector('.s-dist__list');
  const items = [...root.querySelectorAll('[data-country]')];
  const D2R = Math.PI / 180;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let globe = null;
  let vec = null;
  let tmp = null;

  /* ---------- Marcadores ---------- */
  const points = [];
  items.forEach((item) => {
    const name = item.querySelector('.dist-country__name').textContent.trim();
    item.querySelectorAll('[data-dist]').forEach((card, k) => {
      const lat = parseFloat(card.dataset.lat);
      const lon = parseFloat(card.dataset.lon);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'globe-marker';
      b.setAttribute('aria-label', `${name}: ver distribuidores`);
      b.innerHTML = `<span class="tooltip tooltip--light" aria-hidden="true">${name}</span>`;
      b.addEventListener('click', () => open(item, { scroll: true }));
      layer.append(b);
      points.push({ item, el: b, lat, lon, first: k === 0, local: null });
    });
  });

  // Lat/lon → punto sobre la esfera (mismo mapeo UV de SphereGeometry)
  const toLocal = (THREE, lat, lon) => {
    const phi = (lon + 180) * D2R;
    const theta = (90 - lat) * D2R;
    return new THREE.Vector3(-Math.cos(phi) * Math.sin(theta), Math.cos(theta), Math.sin(phi) * Math.sin(theta)).multiplyScalar(1.003);
  };

  const place = () => {
    if (!globe || !vec) return;
    const { camera, spin } = globe.three;
    spin.updateMatrixWorld();
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    points.forEach((p) => {
      vec.copy(p.local).applyMatrix4(spin.matrixWorld);
      const facing = vec.dot(tmp.copy(camera.position).sub(vec)) > 0.02;
      vec.project(camera);
      p.el.style.transform = `translate3d(${((vec.x + 1) / 2) * w}px, ${((1 - vec.y) / 2) * h}px, 0)`;
      p.el.classList.toggle('is-hidden', !facing);
    });
  };

  /* ---------- Acordeón ---------- */
  const syncMarkers = () => {
    const active = items.find((i) => i.classList.contains('is-open'));
    points.forEach((p) => {
      p.el.classList.toggle('is-active', p.item === active);
      p.el.classList.toggle('is-label', p.item === active && p.first);
    });
  };

  function open(item, { scroll = false, focus = true } = {}) {
    const wasOpen = item.classList.contains('is-open');
    items.forEach((i) => {
      const on = i === item && !wasOpen;
      i.classList.toggle('is-open', on);
      i.querySelector('.dist-country__head').setAttribute('aria-expanded', String(on));
    });
    syncMarkers();
    if (wasOpen) return;

    // Entrada de las cards: máscara + desplazamiento
    if (!reduced) {
      item.querySelectorAll('.dist-card').forEach((c, i) => c.animate?.(
        [{ transform: 'translateY(1rem)', clipPath: 'inset(0 0 100% 0 round 12px)' }, { transform: 'none', clipPath: 'inset(0 0 0% 0 round 12px)' }],
        { duration: 700, delay: 80 + i * 70, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'backwards' }
      ));
    }
    if (scroll) list.scrollTo({ top: item.offsetTop - list.offsetTop, behavior: reduced ? 'auto' : 'smooth' });
    const p = points.find((x) => x.item === item);
    if (focus && globe && p) globe.focus(p.lat, p.lon);
  }

  items.forEach((item) => item.querySelector('.dist-country__head').addEventListener('click', () => open(item)));
  syncMarkers();

  /* ---------- Globo (carga diferida) ---------- */
  const init = async () => {
    if (!window.PlanetaGlobe) return;
    const p = points.find((x) => x.item.classList.contains('is-open')) || points[0];
    try {
      globe = await window.PlanetaGlobe.create(stage, {
        lat: p ? p.lat : -12,
        lon: p ? p.lon : -74,
        colorMap: 'assets/globe/earth-color.jpg',
        roughnessMap: 'assets/globe/earth-roughness.jpg',
        rotMin: -125,
        rotMax: -40,
        onRender: place,
      });
      const { THREE } = globe.three;
      vec = new THREE.Vector3();
      tmp = new THREE.Vector3();
      points.forEach((pt) => { pt.local = toLocal(THREE, pt.lat, pt.lon); });
      place();
    } catch (err) {
      console.error(err);
    }
  };

  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    init();
  }, { rootMargin: '400px 0px' });
  io.observe(stage);
})();

/* Desvanecido superior de la lista de países solo cuando hay scroll */
document.querySelectorAll('.s-dist__list').forEach((list) => {
  const sync = () => list.style.setProperty('--fade-top', list.scrollTop > 4 ? '3rem' : '0rem');
  list.addEventListener('scroll', sync, { passive: true });
  sync();
});

/* Select de país (mobile): sincronizado con el acordeón y los marcadores del globo */
(() => {
  const sel = document.querySelector('[data-dist-select]');
  if (!sel) return;
  const items = [...document.querySelectorAll('.s-dist__list [data-country]')];
  items.forEach((it) => {
    const o = document.createElement('option');
    o.value = it.dataset.country;
    o.textContent = it.querySelector('.dist-country__name').textContent.trim();
    sel.append(o);
  });
  const sync = () => { const a = items.find((i) => i.classList.contains('is-open')); if (a) sel.value = a.dataset.country; };
  sel.addEventListener('change', () => {
    const it = items.find((i) => i.dataset.country === sel.value);
    if (it && !it.classList.contains('is-open')) it.querySelector('.dist-country__head').click();
  });
  const mo = new MutationObserver(sync);
  items.forEach((i) => mo.observe(i, { attributes: true, attributeFilter: ['class'] }));
  sync();
})();

/* Fotos de países: se descargan todas al acercarse a la sección, así al elegir un país ya está lista (sin esperar) */
(() => {
  const sec = document.querySelector('[data-distributors]');
  if (!sec) return;
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    sec.querySelectorAll('img[data-preload]').forEach((img) => { img.loading = 'eager'; img.decode?.().catch(() => {}); });
  }, { rootMargin: '800px 0px' });
  io.observe(sec);
})();
