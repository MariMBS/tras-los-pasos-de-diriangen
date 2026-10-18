// =============================================================
// config.js — Ajustes generales del mapa "Tras los pasos de Diriangén"
//
// Aquí están todos los valores que se pueden cambiar sin tocar
// el resto del código. Después de cambiar algo, guarda el archivo
// y recarga la página en el navegador (F5).
// =============================================================

const CONFIG = {
  // -----------------------------------------------------------
  // Token PÚBLICO de Cesium ion (ver README.md para crearlo).
  // Debe estar restringido: solo "assets:read", solo Cesium World
  // Terrain, Sentinel-2 y Google Photorealistic 3D Tiles, y solo
  // tus direcciones permitidas (localhost y la de GitHub Pages).
  // Pega tu token entre las comillas, en lugar del texto de ejemplo.
  // No pongas aquí el "Default Token" ni un token con más permisos.
  // -----------------------------------------------------------
  tokenCesiumIon: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IkJveDJSVjUwU2pZMkdVOTMiLCJqdGkiOiIxNjc0ZWEyOS05YWMzLTQ5ODEtYWE2Mi1jOTZkMjQwNWMwODUiLCJpZCI6NTIyMzE0LCJzdWIiOiJzcnR1bGFsYXJnYSIsImlzcyI6Imh0dHBzOi8vYXBpLmNlc2l1bS5jb20iLCJhdWQiOiJtYXBhLWRpcmlhbmdlbi13ZWIiLCJpYXQiOjE3OTIzNjY0NjR9.1YPVLaDZubeXCsPzPby9UdQJ3ySx6m1fmWFHZD4bcOI",

  // Imagen satelital de Cesium ion. El número es el "asset ID".
  // El relieve (Cesium World Terrain) no necesita número: Cesium lo conoce.
  imagenSatelital: {
    nombre: "Sentinel-2",
    assetId: 3954,
  },

  // Modelo 3D realista de Google (edificios, árboles, volcanes), desde Cesium ion.
  // Para que funcione, el asset 2275207 debe estar incluido en el token.
  // Si el token no lo tiene, el mapa sigue usando el relieve y Sentinel-2.
  // usar: false lo apaga del todo.
  modelo3DRealista: {
    nombre: "Google Photorealistic 3D Tiles",
    assetId: 2275207,
    usar: true,
  },

  // Exageración del relieve. 1 = altura real.
  // 1.5 haría las montañas 50 % más altas. Si se cambia,
  // hay que decirlo en la página para no confundir a nadie.
  exageracionRelieve: 1.0,

  // -----------------------------------------------------------
  // Vista inicial de la cámara.
  // El punto central NO es un lugar histórico: es solo el centro
  // del encuadre entre Carazo, Granada y Rivas.
  // -----------------------------------------------------------
  vistaInicial: {
    longitud: -86.03,  // Oeste es negativo
    latitud: 11.67,    // Norte es positivo
    distancia: 85000,  // metros entre la cámara y el punto central
    inclinacion: -50,  // grados: -90 = mirar desde arriba, -30 = muy inclinada
    rumbo: 0,          // grados: 0 = el norte queda arriba
  },

  // Límites al acercar y alejar la cámara (en metros).
  // Moverse hacia otros lugares siempre está permitido.
  // Escribe null para quitar un límite.
  limites: {
    acercamientoMinimo: 250,
    alejamientoMaximo: 2000000, // 2000 km: se ve Centroamérica, no el planeta entero
  },

  // Segundos que tarda la cámara en volver a la vista inicial (botón ⌂).
  duracionVueloInicio: 1.5,

  // -----------------------------------------------------------
  // Botón "Ver el lugar en 3D" del panel de información.
  // La cámara baja cerca del suelo, mira el lugar de lado y da
  // vueltas lentas a su alrededor. Un punto puede tener su propia
  // distancia en data/puntos.json con "distancia_3d" (metros).
  // -----------------------------------------------------------
  vista3D: {
    distancia: 3500,        // metros entre la cámara y el lugar
    inclinacion: -18,       // grados: cerca de 0 = mirar casi de lado, como una persona
    duracionVuelo: 3,       // segundos que tarda en llegar
    gradosPorSegundo: 6,    // rapidez del giro alrededor del lugar (0 = sin giro)
  },
};
