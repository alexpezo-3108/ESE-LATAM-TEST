/* ==========================================================================
   Residuos inteligentes — pasos (tabs) + flechas + dots + play
   [data-smart] · [data-step] (panel/video con data-step="n")
   ========================================================================== */
(() => {
  document.querySelectorAll('[data-smart]').forEach((root) => {
    const tabs = root.querySelector('[data-tabs]');
    const values = [...tabs.querySelectorAll('[role="tab"]')].map((t) => t.dataset.value);
    const dots = [...root.querySelectorAll('.dots__item')];
    let current = values[0];

    const set = (v, fromTabs = false) => {
      current = v;
      root.querySelectorAll('[data-step]').forEach((el) => {
        const on = el.dataset.step === v;
        el.classList.toggle('is-active', on);
        el.inert = !on;
        if (!on) { el.querySelector('video')?.pause(); el.classList.remove('is-playing'); }
      });
      dots.forEach((d, i) => d.setAttribute('aria-current', String(values[i] === v)));
      if (!fromTabs) tabs.tabsSelect?.(v);
    };
    const step = (dir) => set(values[(values.indexOf(current) + dir + values.length) % values.length]);

    root.addEventListener('tabs:change', (e) => set(e.detail.value, true));
    root.querySelector('[data-smart-prev]')?.addEventListener('click', () => step(-1));
    root.querySelector('[data-smart-next]')?.addEventListener('click', () => step(1));
    dots.forEach((d, i) => d.addEventListener('click', () => set(values[i])));

    root.querySelectorAll('.s-smart__video .play-btn').forEach((btn) => btn.addEventListener('click', () => {
      const box = btn.closest('.s-smart__video');
      const video = box.querySelector('video');
      if (!video) return;
      video.controls = true;
      video.play();
      box.classList.add('is-playing');
    }));

    set(current);
  });
})();
