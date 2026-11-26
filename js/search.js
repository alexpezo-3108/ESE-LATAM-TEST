/* Buscador del sitio: índice local con productos, sectores, páginas, blog y distribuidores.
   main.js lo carga recién al abrir el buscador (window.ESE_SEARCH.query(q) → Promise<resultados>).
   En WordPress: reemplazar por un fetch a la REST API que devuelva el mismo formato
   { group, title, meta, thumb, url }. */
(() => {
  const DATA = ['js/data/colors.js', 'js/data/products.js', 'js/data/blog-posts.js', 'js/data/distributors.js'];
  const GLOBAL = { 'js/data/colors.js': 'ESE_COLORS', 'js/data/products.js': 'PRODUCTS', 'js/data/blog-posts.js': 'BLOG_POSTS', 'js/data/distributors.js': 'DISTRIBUTORS' };
  const loadScript = (src) => new Promise((res) => {
    if (window[GLOBAL[src]]) return res();
    const s = document.createElement('script'); s.src = src; s.onload = s.onerror = () => res(); document.head.appendChild(s);
  });

  const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/(\d)[.,](?=\d{3}\b)/g, '$1')          // 1.100 → 1100
    .replace(/(\d)\s*(l|lt|lts|litros?)\b/g, '$1 l') // 240L / 240 litros → 240 l
    .replace(/m³|m3/g, 'm3');
  const SYN = { contenedores: 'contenedor', papeleras: 'papelera', tachos: 'contenedor', tacho: 'contenedor', basurero: 'contenedor', basureros: 'contenedor', distribuidor: 'distribuidores', certificacion: 'certificaciones', certificado: 'certificaciones', ruedas: 'ruedas' };
  const words = (q) => norm(q).split(/[^a-z0-9]+/).filter((w) => w && !['de', 'del', 'la', 'el', 'en', 'y', 'para', 'con', 'los', 'las', 'l'].includes(w)).map((w) => SYN[w] || w);

  const SECTORS = [
    ['Municipalidades', 'Gobiernos locales y gestión urbana', 'sector-municipalidades.html'],
    ['Empresas de recolección', 'Flotas y rutas de recolección', 'soluciones.html'],
    ['Inmobiliarias', 'Condominios y edificios residenciales', 'soluciones.html'],
    ['Hospitalarios', 'Residuos biocontaminados y segregación', 'soluciones.html'],
    ['Instituciones educativas', 'Colegios, universidades y campus', 'soluciones.html'],
    ['Supermercados y aeropuertos', 'Espacios de alto tránsito', 'soluciones.html'],
    ['Restaurantes y hostelería', 'Cocinas y residuos orgánicos', 'soluciones.html'],
    ['Uso doméstico', 'Hogar, reciclaje y compostaje', 'soluciones.html'],
  ];
  const PAGES = [
    ['Catálogo de productos', 'Contenedores, papeleras y soluciones para el hogar', 'productos.html', 'catalogo productos contenedores'],
    ['Certificaciones', 'Blue Angel, DIN EN 840, RAL, ISO', 'certificaciones.html', 'blue angel din en 840 ral iso dekra lloyds normas calidad certificaciones'],
    ['Nosotros', 'Misión, visión e historia de ESE', 'nosotros.html', 'nosotros empresa mision vision historia alemania'],
    ['Impacto', 'Sostenibilidad, economía circular y comunidad', 'impacto.html', 'impacto sostenibilidad economia circular reciclaje comunidad medio ambiente'],
    ['Distribuidores', 'Red de distribuidores autorizados en 13 países', 'distribuidores.html', 'distribuidores donde comprar paises red'],
    ['Soluciones por sector', 'Todos los sectores que atendemos', 'soluciones.html', 'soluciones sectores'],
    ['Blog', 'Noticias, casos y guías', 'blog.html', 'blog noticias casos articulos'],
    ['Contacto', 'Cotizaciones y asesoría', 'contacto.html', 'contacto cotizar cotizacion asesoria telefono correo whatsapp'],
  ];

  let INDEX = null;
  const build = () => {
    const CO = window.ESE_COLORS, out = [];
    (window.PRODUCTS || []).forEach((p) => {
      const caps = p.variants.map((v) => v.label).filter(Boolean);
      const colors = [...new Set(p.variants.flatMap((v) => v.colors.map((c) => c.name)).filter(Boolean))];
      const fv = window.featuredVariant ? window.featuredVariant(p) : null;
      const img = (fv && fv.c && fv.c.img) || (p.variants.flatMap((v) => v.colors).find((c) => c.img) || {}).img;
      const range = caps.length > 1 ? caps[0].replace(/\s*\D+$/, '') + ' – ' + caps[caps.length - 1] : caps[0] || '';
      out.push({
        group: 'Productos', title: p.name, meta: [range, p.destacado].filter(Boolean).join(' · '),
        thumb: img ? img + '-400.webp' : '', url: 'producto.html?id=' + p.id,
        t: norm(p.name), k: norm([p.line, p.destacado, p.titulo1, p.titulo2, p.desc, caps.join(' '), colors.join(' '), (p.sectors || []).join(' '), p.material, 'contenedor'].join(' ')),
      });
    });
    SECTORS.forEach(([t, m, u]) => out.push({ group: 'Sectores', title: t, meta: m, url: u, t: norm(t), k: norm(m + ' sector sectores soluciones') }));
    (window.BLOG_POSTS || []).forEach((b) => out.push({
      group: 'Blog', title: b.title, meta: [b.cat, b.sector].filter(Boolean).join(' · '),
      url: b.href && b.href !== '#' ? b.href : 'blog.html', t: norm(b.title), k: norm([b.cat, b.sector, b.tag, b.country, b.desc].join(' ')),
    }));
    // Cada distribuidor con su logo → abre su card en Distribuidores (?d=id)
    (window.DISTRIBUTORS || []).forEach((d) => out.push({
      group: 'Distribuidores', title: d.name, meta: [d.city, d.country].filter(Boolean).join(', '),
      thumb: d.logo || '', url: 'distribuidores.html?d=' + d.id,
      t: norm(d.name), k: norm([d.city, d.country, d.rep, (d.sectors || []).join(' '), 'distribuidor distribuidores donde comprar'].join(' ')),
    }));
    PAGES.forEach(([t, m, u, k]) => out.push({ group: 'Páginas', title: t, meta: m, url: u, t: norm(t), k: norm(k + ' ' + m) }));
    return out;
  };

  const ORDER = ['Productos', 'Sectores', 'Distribuidores', 'Páginas', 'Blog'];
  const query = async (q) => {
    if (!INDEX) { for (const s of DATA) await loadScript(s); INDEX = build(); }
    const ws = words(q);
    if (!ws.length) return [];
    return INDEX.map((r) => {
      let score = 0;
      for (const w of ws) {
        const re = new RegExp('(^|[^a-z0-9])' + w);           // coincide al inicio de palabra («lima» no encuentra «Olimax»)
        const inT = re.test(r.t), inK = re.test(r.k);
        if (!inT && !inK) return null;                     // todas las palabras deben aparecer
        score += inT ? 3 : 1;
      }
      if (r.t.startsWith(ws[0])) score += 1;
      const tier = ws.every((w) => new RegExp('(^|[^a-z0-9])' + w).test(r.t)) ? 0 : 1;   // primero lo que coincide en el título
      return { ...r, score, tier };
    }).filter(Boolean).sort((a, b) => a.tier - b.tier || ORDER.indexOf(a.group) - ORDER.indexOf(b.group) || b.score - a.score);
  };
  window.ESE_SEARCH = { query, norm, words };
})();
