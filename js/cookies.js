/* ==========================================================================
   Aviso de cookies — tarjeta compacta, poco invasiva (abajo a la izquierda en
   desktop, franja inferior en mobile). Guarda la elección en localStorage
   ('ese-cookies' = 'all' | 'necessary'). Reabre con [data-cookie-settings].
   Para activar analítica solo con consentimiento: window.eseCookies.allowed()
   ========================================================================== */
(() => {
  const KEY = 'ese-cookies';
  const get = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const save = (v) => { try { localStorage.setItem(KEY, v); } catch (e) {} };
  window.eseCookies = { allowed: () => get() === 'all' };

  let el = null;
  const build = () => {
    el = document.createElement('div');
    el.className = 'cookie-note';
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', 'Aviso de cookies');
    el.innerHTML = `
      <p class="cookie-note__title"><i class="ph-light ph-cookie" aria-hidden="true"></i>Usamos cookies</p>
      <p class="cookie-note__text">Usamos cookies propias y de terceros para analizar el uso del sitio y mejorar tu experiencia. <a href="politica-de-cookies.html">Política de cookies</a></p>
      <div class="cookie-note__actions">
        <button class="btn btn--ghost btn--sm" type="button" data-c="necessary">Rechazar</button>
        <button class="btn btn--secondary btn--sm" type="button" data-c="all">Aceptar todas</button>
      </div>`;
    el.addEventListener('click', (e) => {
      const v = e.target.closest('[data-c]')?.dataset.c;
      if (!v) return;
      save(v);
      document.dispatchEvent(new CustomEvent('ese:cookies', { detail: v }));
      hide();
    });
    document.body.appendChild(el);
  };
  const show = (delay = 0) => {
    if (!el) build();
    setTimeout(() => requestAnimationFrame(() => el.classList.add('is-in')), delay);
  };
  const hide = () => {
    el.classList.remove('is-in');
    el.classList.add('is-out');
    setTimeout(() => { el.remove(); el = null; }, 450);
  };

  document.addEventListener('click', (e) => { if (e.target.closest('[data-cookie-settings]')) { e.preventDefault(); show(); } });
  if (!get()) {
    // nunca durante el preloader: 4 s desde la carga, y al menos 1,5 s después de que termine la intro
    const t0 = performance.now();
    const go = () => show(Math.max(1500, 4000 - (performance.now() - t0)));
    if (document.documentElement.classList.contains('is-intro') && !window.__preEnd) addEventListener('preloader:end', go, { once: true });
    else show(4000);
  }

  // Solo demo: botón para volver a ver el aviso. Poner DEMO = false en producción.
  const DEMO = true;
  if (DEMO) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'cookie-demo';
    b.innerHTML = '<i class="ph-light ph-cookie" aria-hidden="true"></i>Ver aviso de cookies';
    b.addEventListener('click', () => { try { localStorage.removeItem(KEY); } catch (e) {} if (el) { el.remove(); el = null; } show(); });
    document.body.appendChild(b);
  }
})();
