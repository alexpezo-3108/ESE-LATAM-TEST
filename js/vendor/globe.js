/*!
 * Planeta 3D — globo standalone (Three.js)
 * Uso: const g = await PlanetaGlobe.create(elemento, opciones)
 */
(function () {
  'use strict';
  const D2R = Math.PI / 180;
  const DEFAULTS = {
    three: 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js',
    colorMap: './assets/earth-color.jpg',
    roughnessMap: './assets/earth-roughness.jpg',
    lat: -12, lon: -74,      // vista inicial (Latinoamérica)
    drag: true,              // girar con mouse / dedo (solo horizontal)
    rotMin: null, rotMax: null, // límites de longitud visibles en grados, ej. -120 y -30; null = libre
    autoRotate: false,
    autoRotateSpeed: 0.08,   // grados por frame
    atmosphere: true,        // línea sutil alrededor del planeta
    padding: 0.06,           // margen alrededor del planeta (0–0.3)
    maxPixelRatio: 2,
    onRender: null,          // (ESE) callback tras cada render: marcadores HTML
  };

  const loadImage = (src) => new Promise((res, rej) => {
    const im = new Image(); im.decoding = 'async';
    im.onload = () => res(im); im.onerror = () => rej(new Error('No se pudo cargar ' + String(src).slice(0, 60)));
    im.src = src;
  });

  async function create(container, options) {
    if (!container) throw new Error('PlanetaGlobe: falta el contenedor');
    const o = Object.assign({}, DEFAULTS, options || {});
    const emb = window.PLANETA_TEXTURES || {};
    const [THREE, colorImg, roughImg] = await Promise.all([
      import(o.three),
      loadImage(emb.color || o.colorMap),
      loadImage(emb.roughness || o.roughnessMap),
    ]);

    if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    const el = renderer.domElement;
    el.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;transition:opacity 1s ease;touch-action:pan-y;' + (o.drag ? 'cursor:grab;' : '');
    container.appendChild(el);

    const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const tex = (img, srgb) => {
      const t = new THREE.Texture(img); t.anisotropy = aniso;
      if (srgb) t.colorSpace = THREE.SRGBColorSpace;
      t.needsUpdate = true; return t;
    };

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    scene.add(new THREE.HemisphereLight(0xeaf5ff, 0x0a2058, 0.9));
    const sun = new THREE.DirectionalLight(0xfff4dc, 2.4); sun.position.set(-3, 2.2, 4); scene.add(sun);
    const rim = new THREE.DirectionalLight(0x8fd0ff, 0.9); rim.position.set(4, 1, -3); scene.add(rim);

    const tilt = new THREE.Group(), spin = new THREE.Group();
    scene.add(tilt); tilt.add(spin);

    const globeGeo = new THREE.SphereGeometry(1, 128, 96);
    const globeMat = new THREE.MeshStandardMaterial({ map: tex(colorImg, true), roughnessMap: tex(roughImg, false), roughness: 1, metalness: 0 });
    spin.add(new THREE.Mesh(globeGeo, globeMat));

    const blend = { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor };
    const vs = 'varying vec3 vN; varying vec3 vV; void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.0); vV = -mv.xyz; gl_Position = projectionMatrix*mv; }';
    // brillo de borde sobre la superficie
    const rimGeo = new THREE.SphereGeometry(1.002, 96, 72);
    const rimMat = new THREE.ShaderMaterial(Object.assign({}, blend, {
      vertexShader: vs,
      fragmentShader: 'varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - max(dot(normalize(vN), normalize(vV)), 0.0), 3.0); vec3 c = clamp(vec3(0.7,0.88,1.0)*f*0.26, 0.0, 1.0); gl_FragColor = vec4(c, max(c.r, max(c.g, c.b))); }',
    }));
    spin.add(new THREE.Mesh(rimGeo, rimMat));
    // línea de atmósfera
    let atmGeo, atmMat;
    if (o.atmosphere) {
      atmGeo = new THREE.SphereGeometry(1.055, 128, 96);
      atmMat = new THREE.ShaderMaterial(Object.assign({}, blend, {
        side: THREE.BackSide, vertexShader: vs,
        fragmentShader: 'varying vec3 vN; varying vec3 vV; void main(){ float d = dot(normalize(vN), normalize(vV)); float a = clamp(exp(-pow((d + 0.02)/0.014, 2.0))*0.42 + pow(clamp(-d/0.32, 0.0, 1.0), 2.2)*0.14, 0.0, 1.0); gl_FragColor = vec4(vec3(0.85,0.94,1.0)*a, a); }',
      }));
      scene.add(new THREE.Mesh(atmGeo, atmMat));
    }

    // Rotación: rotY = -PI/2 - lon
    const lonToRot = (lon) => -Math.PI / 2 - lon * D2R;
    const lim = (o.rotMin != null && o.rotMax != null) ? [lonToRot(o.rotMax), lonToRot(o.rotMin)] : null;
    const clamp = (v) => lim ? Math.min(lim[1], Math.max(lim[0], v)) : v;
    const S = { rotY: lonToRot(o.lon) + 0.5, targetY: clamp(lonToRot(o.lon)), vel: 0, tiltX: o.lat * D2R * 0.85, targetTilt: o.lat * D2R * 0.85, dir: 1 };

    // Tamaño — se aplica y se dibuja en el mismo frame (sin parpadeo)
    let cw = 0, ch = 0, dirty = true;
    const fit = () => {
      const w = Math.max(1, Math.round(container.clientWidth)), h = Math.max(1, Math.round(container.clientHeight));
      if (w === cw && h === ch) return;
      cw = w; ch = h;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, matchMedia('(pointer: coarse)').matches ? 1.5 : o.maxPixelRatio));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      const R = (o.atmosphere ? 1.06 : 1.0) * (1 + o.padding);
      const half = 16 * D2R;
      const hv = Math.min(half, Math.atan(Math.tan(half) * camera.aspect));
      camera.position.set(0, 0, R / Math.sin(hv));
      camera.updateProjectionMatrix();
      dirty = true;
    };
    const ro = new ResizeObserver(() => { fit(); frame(true); });
    ro.observe(container);
    fit();

    // Arrastre horizontal con inercia
    let drag = false, lastX = 0;
    const onDown = (e) => { if (!o.drag) return; drag = true; lastX = e.clientX; S.vel = 0; el.setPointerCapture(e.pointerId); el.style.cursor = 'grabbing'; };
    const onMove = (e) => {
      if (!drag) return;
      let d = (e.clientX - lastX) * 0.0055; lastX = e.clientX;
      if (lim && (S.rotY + d > lim[1] || S.rotY + d < lim[0])) d *= 0.3;
      S.rotY += d; S.targetY = S.rotY; S.vel = d;
    };
    const onUp = () => { if (!drag) return; drag = false; el.style.cursor = 'grab'; };
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);

    // Bucle: solo dibuja si hay movimiento y el planeta está visible
    let visible = true, raf = 0, first = true, dead = false;
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) loop(); });
    io.observe(container);
    const frame = (force) => {
      if (!drag) {
        if (Math.abs(S.vel) > 1e-5) {
          S.rotY += S.vel;
          S.vel *= (lim && (S.rotY > lim[1] || S.rotY < lim[0])) ? 0.6 : 0.94;
          S.targetY = clamp(S.rotY);
        } else {
          if (o.autoRotate) {
            S.targetY += o.autoRotateSpeed * D2R * S.dir;
            if (lim && (S.targetY >= lim[1] || S.targetY <= lim[0])) S.dir *= -1;
          }
          S.targetY = clamp(S.targetY);
          S.rotY += (S.targetY - S.rotY) * 0.055;
        }
      }
      S.tiltX += (S.targetTilt - S.tiltX) * 0.05;
      const moving = drag || Math.abs(S.vel) > 1e-5 || Math.abs(S.targetY - S.rotY) > 1e-4 || Math.abs(S.targetTilt - S.tiltX) > 1e-4 || o.autoRotate;
      if (moving || dirty || force) {
        spin.rotation.y = S.rotY; tilt.rotation.x = S.tiltX;
        renderer.render(scene, camera);
        if (typeof o.onRender === 'function') o.onRender();
        dirty = false;
        if (first) { first = false; el.style.opacity = '1'; }
      }
      return moving;
    };
    function loop() {
      if (dead || raf) return;
      const tick = () => {
        raf = 0;
        if (dead || !visible) return;
        frame(false);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }
    loop();

    return {
      /** Gira suavemente hasta centrar una coordenada */
      focus(lat, lon) { S.vel = 0; S.targetY = clamp(lonToRot(lon)); S.targetTilt = lat * D2R * 0.85; },
      /** Cambia el giro automático */
      setAutoRotate(on) { o.autoRotate = !!on; },
      /** Acceso a Three.js para extender (marcadores, etc.) */
      three: { THREE, scene, camera, renderer, spin, tilt },
      destroy() {
        dead = true; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
        el.removeEventListener('pointerdown', onDown); el.removeEventListener('pointermove', onMove);
        el.removeEventListener('pointerup', onUp); el.removeEventListener('pointercancel', onUp);
        [globeGeo, rimGeo, atmGeo].forEach((g) => g && g.dispose());
        [rimMat, atmMat].forEach((m) => m && m.dispose());
        globeMat.map.dispose(); globeMat.roughnessMap.dispose(); globeMat.dispose();
        renderer.dispose(); el.remove();
      },
    };
  }

  window.PlanetaGlobe = { create };
})();
