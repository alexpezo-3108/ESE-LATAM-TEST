/* ==========================================================================
   Cursor — círculo que acompaña al puntero en toda la web.
   Azul sobre fondos claros; blanco sobre [data-cursor="light"] (fondos oscuros)
   y sobre botones navy. Solo con mouse; respeta reduced-motion (sin inercia).
   ========================================================================== */
(() => {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('.site-header');

  const dot = document.createElement('div');
  dot.className = 'cursor-dot';
  dot.setAttribute('aria-hidden', 'true');
  dot.innerHTML = '<span class="cursor-dot__inner"></span>';
  document.body.append(dot);

  const target = { x: -100, y: -100 };
  const pos = { x: -100, y: -100 };
  let raf = 0;

  const DARK_UI = '.btn--primary, .btn--secondary, .btn--whatsapp, .icon-btn--navy, .tabs__tab[aria-selected="true"], .avatar--navy';
  const INTERACTIVE = 'a, button, [role="tab"], label, summary, .globe-marker, [data-cursor="hover"]';

  // Superficies claras dentro de bloques oscuros
  const LIGHT_UI = '.s-products__slide.is-active .product-card__body, .s-products__tabs, .select, .btn--light, .stat-card, .nav__sub, .search, .social--light .social__link, .icon-btn:not(.icon-btn--navy), .chip, .dist-card__logo, .tabs__tab:not([aria-selected="true"])';

  const isLight = (el) => {
    if (!el) return false;
    if (el.closest(DARK_UI)) return true;
    if (el.closest(LIGHT_UI)) return false;
    if (header && header.contains(el)) {
      const lightHeader = header.classList.contains('is-pill') || header.classList.contains('is-nav-open') || header.classList.contains('is-search-open');
      if (el.closest('.nav__sub, .search')) return false;
      return !lightHeader;
    }
    return !!el.closest('[data-cursor="light"]');
  };

  const tick = () => {
    const k = reduced ? 1 : 0.18;
    pos.x += (target.x - pos.x) * k;
    pos.y += (target.y - pos.y) * k;
    dot.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
    raf = Math.abs(target.x - pos.x) > 0.1 || Math.abs(target.y - pos.y) > 0.1 ? requestAnimationFrame(tick) : 0;
  };

  let probe = 0;
  const sample = () => {
    probe = 0;
    const el = document.elementFromPoint(target.x, target.y);
    dot.classList.toggle('is-light', isLight(el));
    dot.classList.toggle('is-hover', !!el?.closest(INTERACTIVE));
  };

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    target.x = e.clientX;
    target.y = e.clientY;
    if (!dot.classList.contains('is-visible')) { pos.x = target.x; pos.y = target.y; dot.classList.add('is-visible'); }
    if (!probe) probe = requestAnimationFrame(sample);
    if (!raf) raf = requestAnimationFrame(tick);
  }, { passive: true });

  // Al hacer scroll el fondo cambia bajo el cursor
  window.addEventListener('scroll', () => { if (!probe) probe = requestAnimationFrame(sample); }, { passive: true });
  document.addEventListener('pointerdown', () => dot.classList.add('is-down'));
  document.addEventListener('pointerup', () => dot.classList.remove('is-down'));
  document.documentElement.addEventListener('pointerleave', () => dot.classList.remove('is-visible'));
})();
