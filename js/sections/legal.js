/* Páginas legales: índice activo según scroll + selector de documento en mobile */
(() => {
  const sel = document.querySelector('[data-legal-select]');
  sel?.addEventListener('change', () => { if (sel.value && sel.value !== '#') location.href = sel.value; });
  const links = [...document.querySelectorAll('.legal-toc__link')];
  const secs = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if (!secs.length) return;
  const set = (id) => links.forEach((a) => {
    const on = a.getAttribute('href') === '#' + id;
    a.classList.toggle('is-active', on);
    on ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current');
  });
  const update = () => {
    const line = window.innerHeight * 0.3;
    let cur = secs[0];
    for (const s of secs) if (s.getBoundingClientRect().top <= line) cur = s;
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) cur = secs[secs.length - 1];
    set(cur.id);
  };
  let raf = 0;
  window.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); }, { passive: true });
  update();
})();
