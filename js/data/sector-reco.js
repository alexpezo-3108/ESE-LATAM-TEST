/* Soluciones recomendadas por sector — una lista de 5 por sector (en WordPress: relación
   "productos recomendados" en cada página de sector).
   Formato de cada ítem: "id" (modelo completo) · "id:cap" (litraje fijo, ej. "cl:240")
   · "id:cap:clips" (versión gris con clips/tapa de color).
   material: valor que pidió la clienta para estas fichas recomendadas (no se muestra en la tarjeta). */
window.SECTOR_RECO = {
  municipalidades: { material: 'HDPE', items: ['dinova-clasica:50', 'cl:240', '4r-1100-flat', 'bagio-smart', '4r-1100-split'] },
  'empresas-de-recoleccion': { material: 'HDPE', items: ['4r-1100-flat', '4r-660-770:770', '4r-660-770:660', 'cl:120', 'minimax-filter:10'] },
  inmobiliarias: { material: 'HDPE', items: ['pl:240', 'pl:370', 'sl:360', '4r-660-770:660', '4r-1100-flat'] },
  hospitalarios: { material: 'HDPE', items: ['cl:120', '4r-400:400', '4r-660-770:660', '4r-1100-flat', 'cl:120:clips'] },
  'instituciones-educativas': { material: 'HDPE', items: ['cl:120', 'cl:240', '4r-1100-flat', 'dinova-clasica:50', 'cl:120:clips'] },
  'supermercados-y-aeropuertos': { material: 'HDPE', items: ['4r-660-770:660', '4r-660-770:770', '4r-1100-flat', '4r-1100-split', 'cl:240'] },
  'restaurantes-y-hosteleria': { material: 'HDPE', items: ['cl:120', 'cl:240', '4r-660-770:660', 'minimax-filter:10', '4r-1100-flat'] },
  'uso-domestico': { material: 'HDPE', items: ['minimax-filter:10', 'easymax', 'olimax:3', 'batterymax:3', 'composter'] },
};
