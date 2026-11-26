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
  });
})();
