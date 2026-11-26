/* Detalle de entrada: compartir, copiar enlace y video bajo demanda */
(() => {
  const url = encodeURIComponent(location.href);
  const shares = { linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=' + url, facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + url };
  document.querySelectorAll('[data-share]').forEach((a) => { a.href = shares[a.dataset.share] || a.href; });

  const copy = document.querySelector('[data-copy-link]');
  copy?.addEventListener('click', async () => {
    const toast = copy.querySelector('.post-share__toast');
    try { await navigator.clipboard.writeText(location.href); toast.textContent = 'Enlace copiado'; }
    catch { toast.textContent = 'No se pudo copiar'; }
    toast.classList.add('is-visible');
    clearTimeout(copy._t); copy._t = setTimeout(() => toast.classList.remove('is-visible'), 1800);
  });

  // Carga el iframe de YouTube solo al hacer clic (data-youtube="ID")
  document.querySelectorAll('[data-video]').forEach((f) => {
    f.querySelector('.post-video__play')?.addEventListener('click', () => {
      const id = f.dataset.youtube;
      if (!id) return;
      f.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0" title="Video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
    });
  });
})();
