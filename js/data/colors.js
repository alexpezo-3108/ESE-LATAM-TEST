/* Orden y muestras de color — ÚNICA fuente para todo el sitio (fichas, grilla, filtros, puntos).
   En WordPress: exponer este mismo array (p. ej. como opción del tema) y ordenar siempre con él. */
window.ESE_COLORS = (() => {
  const ORDER = ['Gris oscuro', 'Gris claro', 'Negro', 'Verde', 'Amarillo', 'Azul', 'Marrón', 'Rojo', 'Naranja', 'Morado'];
  const HEX = { 'Gris oscuro': '#3F4146', 'Gris claro': '#CACBCC', 'Negro': '#1F1F1F', 'Verde': '#4E9A3E', 'Amarillo': '#E8C33A', 'Azul': '#2E7BD1', 'Marrón': '#7A4A2A', 'Rojo': '#C8312B', 'Naranja': '#E8782A', 'Morado': '#6B3FA0' };
  const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const KEY = Object.fromEntries(ORDER.map((c) => [norm(c), c]));
  // "Gris oscuro con clips marrón" → { base: 'Gris oscuro', accent: 'Marrón', combo: true }
  const parse = (name) => {
    const m = String(name || '').match(/^(.+?)\s+con\s+(?:clips|tapa)(?:\s+(.+))?$/i);
    if (!m) return { base: KEY[norm(name)] || name, accent: null, combo: false };
    return { base: KEY[norm(m[1])] || m[1], accent: m[2] ? (KEY[norm(m[2])] || m[2]) : null, combo: true };
  };
  const rank = (c) => { const i = ORDER.indexOf(c); return i < 0 ? ORDER.length : i; };
  // Lisos primero; luego combinados ("sin color" primero, después el orden del clip/tapa)
  const compare = (a, b) => {
    const A = parse(a), B = parse(b);
    if (A.combo !== B.combo) return A.combo ? 1 : -1;
    if (A.combo) return (A.accent ? rank(A.accent) + 1 : 0) - (B.accent ? rank(B.accent) + 1 : 0) || rank(A.base) - rank(B.base);
    return rank(A.base) - rank(B.base);
  };
  const sort = (list, get = (x) => x.name) => [...list].sort((x, y) => compare(get(x), get(y)));
  const swatch = (name, fallback) => {
    const { base, accent } = parse(name);
    const b = HEX[base] || fallback || '#A7A8AA';
    return accent && HEX[accent] ? `linear-gradient(135deg, ${HEX[accent]} 0 50%, ${b} 50% 100%)` : b;
  };
  // Colores que se confunden con el fondo de cada tema (no pueden ser "color destacado")
  const THEME_CLASH = { azul: ['Azul'], naranja: ['Naranja'], petroleo: ['Azul'], verde: ['Verde'], navy: ['Azul'], morado: ['Morado'] };
  const clashes = (name, theme) => { const p = parse(name); return (THEME_CLASH[theme] || []).some((c) => c === p.base || c === p.accent); };
  return { ORDER, HEX, THEME_CLASH, clashes, parse, compare, sort, swatch, isCombo: (n) => parse(n).combo, family: (n) => parse(n).base };
})();
