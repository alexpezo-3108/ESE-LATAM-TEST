/* Aliados: duplica cada fila para un loop sin cortes y ajusta la velocidad al ancho */
(() => {
  document.querySelectorAll('[data-marquee]').forEach((m) => {
    const track = m.querySelector('.marquee__track');
    const items = [...track.children];
    // Rellena hasta cubrir al menos 2 pantallas, luego duplica el set completo
    let guard = 0;
    while (track.scrollWidth < innerWidth * 1.2 && guard++ < 6) items.forEach((li) => track.appendChild(li.cloneNode(true)));
    [...track.children].forEach((li) => { const c = li.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.appendChild(c); });
    const pxPerSec = m.classList.contains('brand-band') ? 70 : 45;
    track.style.setProperty('--marquee-dur', (track.scrollWidth / 2 / pxPerSec).toFixed(1) + 's');
    // Clientes: el loop arranca recién al entrar en pantalla, así se ven primero las marcas más conocidas
    if (m.closest('.s-allies--clients') && 'IntersectionObserver' in window) {
      track.style.animationPlayState = 'paused';
      const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { track.style.animationPlayState = ''; io.disconnect(); } }, { threshold: 0.4 });
      io.observe(m);
    }
  });
})();
