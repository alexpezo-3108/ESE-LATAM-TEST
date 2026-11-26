/* ==========================================================================
   Pruebas de rigurosidad — selector de videos [data-tests]
   ========================================================================== */
/* Pruebas de rigurosidad */
(() => {
  const box = document.querySelector('[data-tests]');
  if (!box) return;
  const tabs = [...box.querySelectorAll('[data-test]')], count = box.querySelector('[data-tests-count]'), video = box.querySelector('[data-tests-video]');
  const mobile = matchMedia('(max-width: 47.99em)');
  tabs.forEach((t, i) => t.addEventListener('click', () => {
    if (t.classList.contains('is-active')) { if (mobile.matches) box.classList.toggle('is-open'); return; }
    tabs.forEach((x) => { x.classList.toggle('is-active', x === t); x.setAttribute('aria-pressed', String(x === t)); });
    box.classList.remove('is-open');
    count.textContent = (i + 1) + ' de ' + tabs.length + ' pruebas';
    video.setAttribute('aria-label', 'Video: ' + t.querySelector('.pd-test__title').textContent);
    video.classList.add('is-swapping'); setTimeout(() => video.classList.remove('is-swapping'), 250);
  }));
})();
