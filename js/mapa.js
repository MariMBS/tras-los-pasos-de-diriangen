// =============================================================
// mapa.js — Crea el mapa 3D con CesiumJS y mueve la cámara.
//
// Funciones principales:
//   crearMapa()         crea el visor con relieve e imagen satelital
//   irAVistaInicial()   lleva la cámara a la vista regional de config.js
//   acercar(), alejar() botones + y −
//   orientarAlNorte()   botón N
// =============================================================

// Texto de ejemplo que trae config.js antes de pegar el token real.
const TEXTO_TOKEN_EJEMPLO = "PEGA_AQUI_TU_TOKEN";

// El visor de Cesium. Se guarda aquí para que las demás funciones lo usen.
let visor = null;

// ¿Se pegó un token en config.js?
function hayToken() {
  const token = (CONFIG.tokenCesiumIon || "").trim();
  return token !== "" && token !== TEXTO_TOKEN_EJEMPLO;
}

// Crea el mapa dentro de <div id="mapa">.
// Devuelve true si se pudo crear y false si no.
function crearMapa() {
  // 1. ¿Se descargó CesiumJS desde internet?
  if (typeof Cesium === "undefined") {
    mostrarAviso(
      "No se pudo descargar CesiumJS, la herramienta que dibuja el mapa. " +
        "Revisa tu conexión a internet y recarga la página.",
      "error"
    );
    return false;
  }

  // 2. ¿Hay token? Sin token no se usa Cesium ion para nada.
  const usarCesiumIon = hayToken();
  if (usarCesiumIon) {
    Cesium.Ion.defaultAccessToken = CONFIG.tokenCesiumIon.trim();
  } else {
    mostrarAviso(
      "Falta el token de Cesium ion en js/config.js (ver README.md). " +
        "Mientras tanto se muestra un mapa básico de baja resolución y sin relieve."
    );
  }

  // 3. Opciones del visor
  const opciones = {
    // Imagen de fondo elegida por nosotros. Como la indicamos aquí
    // y el selector de mapas está apagado, Cesium NO carga Bing Maps.
    baseLayer: usarCesiumIon ? crearCapaSatelital() : crearCapaBasica(),
    baseLayerPicker: false,      // selector de mapas: elegiría Bing por defecto
    geocoder: false,             // buscador de lugares: gasta cuota y no lo necesitamos
    animation: false,            // reloj de animación de Cesium
    timeline: false,             // barra de tiempo de Cesium (no es nuestra línea del tiempo)
    homeButton: false,           // el de Cesium va al planeta entero; usamos nuestro botón ⌂
    sceneModePicker: false,      // cambio a vista 2D
    navigationHelpButton: false, // la ayuda está en español debajo del mapa
    infoBox: false,              // ventana de información (la nuestra llegará en la Fase 2)
    selectionIndicator: false,
    fullscreenButton: true,      // pantalla completa: útil en la feria
    requestRenderMode: true,     // dibuja solo cuando algo cambia: ahorra batería
    showRenderLoopErrors: false, // en vez del panel de error en inglés, mostramos avisos en español
  };
  if (usarCesiumIon) {
    opciones.terrain = crearRelieve();
  }

  // 4. Crear el visor. Falla si el navegador no puede dibujar en 3D (WebGL).
  try {
    visor = new Cesium.Viewer("mapa", opciones);
  } catch (error) {
    console.error(error);
    mostrarAviso(
      "Este navegador o este equipo no pudo mostrar el mapa 3D (WebGL). " +
        "Prueba con Chrome o Edge actualizados.",
      "error"
    );
    return false;
  }

  // 5. Ajustes de la escena
  const escena = visor.scene;
  escena.verticalExaggeration = CONFIG.exageracionRelieve;

  const controlCamara = escena.screenSpaceCameraController;
  if (CONFIG.limites.acercamientoMinimo) {
    controlCamara.minimumZoomDistance = CONFIG.limites.acercamientoMinimo;
  }
  if (CONFIG.limites.alejamientoMaximo) {
    controlCamara.maximumZoomDistance = CONFIG.limites.alejamientoMaximo;
  }

  escena.renderError.addEventListener(function (escenaConError, error) {
    console.error(error);
    mostrarAviso("El mapa dejó de dibujarse por un error. Recarga la página (F5).", "error");
  });

  // 6. Modelo 3D realista de Google (si el token lo permite)
  if (usarCesiumIon && CONFIG.modelo3DRealista && CONFIG.modelo3DRealista.usar) {
    cargarModelo3DRealista();
  }

  // 7. Vista inicial, sin animación
  irAVistaInicial(false);
  return true;
}

// -------------------------------------------------------------
// Modelo 3D realista (Google Photorealistic 3D Tiles)
// Es como Google Earth: el terreno, los edificios y los árboles en 3D.
// Ya trae su propio suelo, así que mientras se ve, el globo de Cesium
// (relieve + Sentinel-2) se esconde para que no se encimen.
// -------------------------------------------------------------

let modelo3D = null;

async function cargarModelo3DRealista() {
  try {
    modelo3D = await Cesium.Cesium3DTileset.fromIonAssetId(CONFIG.modelo3DRealista.assetId, {
      showCreditsOnScreen: true, // Google exige que se vea su logo y sus créditos
    });
  } catch (error) {
    // Lo normal si el token todavía no incluye este asset: seguimos con el relieve.
    console.info(
      "Modelo 3D realista no disponible con este token; se usa el relieve y Sentinel-2.",
      error
    );
    modelo3D = null;
    return;
  }
  visor.scene.primitives.add(modelo3D);
  mostrarModelo3D(true);
  document.dispatchEvent(new Event("modelo3d-listo"));
}

function hayModelo3D() {
  return Boolean(modelo3D);
}

function modelo3DVisible() {
  return Boolean(modelo3D && modelo3D.show);
}

// true: se ve el modelo de Google; false: se ve el relieve con Sentinel-2.
function mostrarModelo3D(mostrar) {
  if (!modelo3D) {
    return;
  }
  modelo3D.show = mostrar;
  visor.scene.globe.show = !mostrar;
  visor.scene.requestRender();
}

// -------------------------------------------------------------
// Capas: imagen de fondo y relieve
// -------------------------------------------------------------

// Mensaje único para cuando Cesium ion rechaza el token.
// El relieve y la imagen fallan a la vez por la misma causa; como el texto
// es idéntico, mostrarAviso() lo enseña una sola vez.
const AVISO_TOKEN_RECHAZADO =
  "Cesium ion rechazó el token de js/config.js: no es válido, se regeneró o no " +
  "permite esta dirección. Copia el token actual desde ion.cesium.com → Access Tokens → " +
  "mapa-diriangen-web, pégalo en js/config.js y recarga. Mientras tanto se ve el mapa básico.";

// ¿El error dice que el token fue rechazado (respuesta 401 de Cesium ion)?
function esTokenRechazado(error) {
  if (!error) {
    return false;
  }
  return error.statusCode === 401 || /INVALID_TOKEN/.test(String(error.response || error.message || ""));
}

// Imagen satelital Sentinel-2 desde Cesium ion.
function crearCapaSatelital() {
  const capa = Cesium.ImageryLayer.fromProviderAsync(
    Cesium.IonImageryProvider.fromAssetId(CONFIG.imagenSatelital.assetId)
  );
  capa.errorEvent.addEventListener(function (error) {
    console.error(error);
    if (esTokenRechazado(error)) {
      mostrarAviso(AVISO_TOKEN_RECHAZADO);
    } else {
      mostrarAviso(
        "No se pudo cargar la imagen satelital " + CONFIG.imagenSatelital.nombre + ". " +
          "Revisa que el token sea correcto, que Sentinel-2 esté en \"My Assets\" " +
          "y que esta dirección esté permitida en el token. Se muestra el mapa básico."
      );
    }
    if (visor) {
      visor.imageryLayers.add(crearCapaBasica());
    }
  });
  return capa;
}

// Mapa básico que viene dentro de CesiumJS (Natural Earth II).
// No usa Cesium ion ni token, pero tiene poca resolución y no tiene relieve.
function crearCapaBasica() {
  return Cesium.ImageryLayer.fromProviderAsync(
    Cesium.TileMapServiceImageryProvider.fromUrl(
      Cesium.buildModuleUrl("Assets/Textures/NaturalEarthII")
    )
  );
}

// Relieve Cesium World Terrain desde Cesium ion.
function crearRelieve() {
  const relieve = Cesium.Terrain.fromWorldTerrain();
  relieve.errorEvent.addEventListener(function (error) {
    console.error(error);
    // Mientras el relieve carga, Cesium deja el globo sin superficie.
    // Si falla, ponemos una superficie plana para que el mapa se siga viendo.
    if (visor) {
      visor.scene.terrainProvider = new Cesium.EllipsoidTerrainProvider();
    }
    if (esTokenRechazado(error)) {
      mostrarAviso(AVISO_TOKEN_RECHAZADO);
    } else {
      mostrarAviso(
        "No se pudo cargar el relieve (Cesium World Terrain) y el mapa se verá plano. " +
          "Revisa el token en js/config.js."
      );
    }
  });
  return relieve;
}

// -------------------------------------------------------------
// Cámara
// -------------------------------------------------------------

// Coloca la cámara mirando hacia "centro" desde una distancia en metros,
// con un rumbo y una inclinación (ángulos en radianes).
// duracion = 0 la coloca de inmediato; si es mayor, la cámara vuela.
function colocarCamara(centro, rumbo, inclinacion, distancia, duracion) {
  visor.camera.flyToBoundingSphere(new Cesium.BoundingSphere(centro, 0), {
    offset: new Cesium.HeadingPitchRange(rumbo, inclinacion, distancia),
    duration: duracion,
  });
}

// Lleva la cámara a la vista regional definida en config.js.
// animar = true: vuelo suave; false: aparece de inmediato.
function irAVistaInicial(animar) {
  detenerGiro();
  const vista = CONFIG.vistaInicial;
  colocarCamara(
    Cesium.Cartesian3.fromDegrees(vista.longitud, vista.latitud),
    Cesium.Math.toRadians(vista.rumbo),
    Cesium.Math.toRadians(vista.inclinacion),
    vista.distancia,
    animar ? CONFIG.duracionVueloInicio : 0
  );
}

// Punto del terreno que se ve en el centro de la pantalla.
// Devuelve undefined si en el centro solo se ve cielo.
function puntoCentralDePantalla() {
  const escena = visor.scene;
  const centroPantalla = new Cesium.Cartesian2(
    escena.canvas.clientWidth / 2,
    escena.canvas.clientHeight / 2
  );
  let puntoEnTerreno;
  if (modelo3DVisible() && escena.pickPositionSupported) {
    // Con el modelo de Google el globo está escondido: se mide sobre el modelo.
    puntoEnTerreno = escena.pickPosition(centroPantalla);
  } else {
    const rayo = visor.camera.getPickRay(centroPantalla);
    puntoEnTerreno = rayo ? escena.globe.pick(rayo, escena) : undefined;
  }
  return puntoEnTerreno || visor.camera.pickEllipsoid(centroPantalla);
}

// Acerca (factor menor que 1) o aleja (factor mayor que 1) la cámara
// hacia el centro de la pantalla, respetando los límites de config.js.
function cambiarDistancia(factor) {
  const camara = visor.camera;
  const limites = CONFIG.limites;
  const centro = puntoCentralDePantalla();

  if (!centro) {
    // En el centro solo hay cielo: avanzamos o retrocedemos en línea recta.
    const altura = camara.positionCartographic.height;
    if (factor < 1) {
      camara.zoomIn(altura * (1 - factor));
    } else {
      let metros = altura * (factor - 1);
      if (limites.alejamientoMaximo) {
        metros = Math.min(metros, limites.alejamientoMaximo - altura);
      }
      if (metros > 0) {
        camara.zoomOut(metros);
      }
    }
    return;
  }

  let distancia = Cesium.Cartesian3.distance(camara.positionWC, centro) * factor;
  if (limites.acercamientoMinimo) {
    distancia = Math.max(distancia, limites.acercamientoMinimo);
  }
  if (limites.alejamientoMaximo) {
    distancia = Math.min(distancia, limites.alejamientoMaximo);
  }
  colocarCamara(centro, camara.heading, camara.pitch, distancia, 0.5);
}

function acercar() {
  cambiarDistancia(0.5);
}

function alejar() {
  cambiarDistancia(2);
}

// Gira la vista para que el norte quede arriba, sin cambiar lo que se mira.
function orientarAlNorte() {
  const camara = visor.camera;
  const centro = puntoCentralDePantalla();
  if (!centro) {
    camara.setView({ orientation: { heading: 0, pitch: camara.pitch, roll: 0 } });
    return;
  }
  const distancia = Cesium.Cartesian3.distance(camara.positionWC, centro);
  colocarCamara(centro, 0, camara.pitch, distancia, 0.8);
}

// -------------------------------------------------------------
// Vista 3D de un lugar: la cámara baja cerca del suelo, mira el
// lugar de lado (con el relieve) y gira despacio a su alrededor.
// -------------------------------------------------------------

// Datos del giro en curso (null si no está girando).
let giro = null;

// Lleva la cámara a ver un punto en 3D y empieza a girar.
// alTerminar(girando) avisa a la interfaz si quedó girando o no.
async function verLugarEn3D(punto, alTerminar) {
  detenerGiro();
  const ajustes = CONFIG.vista3D;
  const distancia = punto.distancia_3d || ajustes.distancia;
  const inclinacion = Cesium.Math.toRadians(ajustes.inclinacion);
  const centro = await posicionSobreElRelieve(punto.coordenadas);
  const rumboInicial = visor.camera.heading;

  visor.camera.flyToBoundingSphere(new Cesium.BoundingSphere(centro, 0), {
    offset: new Cesium.HeadingPitchRange(rumboInicial, inclinacion, distancia),
    duration: ajustes.duracionVuelo,
    complete: function () {
      if (ajustes.gradosPorSegundo > 0) {
        empezarGiro(centro, rumboInicial, inclinacion, distancia);
      }
      alTerminar(Boolean(giro));
    },
    cancel: function () {
      alTerminar(false);
    },
  });
}

// Altura real del suelo en ese lugar (con el relieve), para que la
// cámara mire al terreno y no a un punto escondido debajo de la montaña.
async function posicionSobreElRelieve(coordenadas) {
  const lugar = Cesium.Cartographic.fromDegrees(coordenadas[0], coordenadas[1]);
  if (modelo3DVisible()) {
    try {
      const [sobreModelo] = await visor.scene.sampleHeightMostDetailed([lugar.clone()]);
      if (sobreModelo && sobreModelo.height !== undefined) {
        return Cesium.Cartographic.toCartesian(sobreModelo);
      }
    } catch (error) {
      console.warn("No se pudo medir la altura sobre el modelo 3D.", error);
    }
  }
  try {
    const relieve = visor.scene.terrainProvider;
    if (relieve && relieve.availability) {
      const [conAltura] = await Cesium.sampleTerrainMostDetailed(relieve, [lugar]);
      lugar.height = conAltura.height || 0;
    }
  } catch (error) {
    console.warn("No se pudo saber la altura del suelo; se usa 0 m.", error);
    lugar.height = 0;
  }
  return Cesium.Cartographic.toCartesian(lugar);
}

function empezarGiro(centro, rumbo, inclinacion, distancia) {
  const camara = visor.camera;
  giro = { centro, rumbo, inclinacion, distancia, ultimo: performance.now() };

  // Cada cuadro de animación, avanza un poquito el rumbo.
  giro.paso = function () {
    if (!giro) {
      return;
    }
    const ahora = performance.now();
    const segundos = (ahora - giro.ultimo) / 1000;
    giro.ultimo = ahora;
    giro.rumbo += Cesium.Math.toRadians(CONFIG.vista3D.gradosPorSegundo * segundos);
    camara.lookAt(
      giro.centro,
      new Cesium.HeadingPitchRange(giro.rumbo, giro.inclinacion, giro.distancia)
    );
    visor.scene.requestRender();
    giro.cuadro = requestAnimationFrame(giro.paso);
  };
  giro.cuadro = requestAnimationFrame(giro.paso);

  // Si la persona toca o mueve el mapa, el giro se detiene y ella toma el control.
  giro.alTocar = function () {
    detenerGiro();
  };
  const lienzo = visor.scene.canvas;
  lienzo.addEventListener("pointerdown", giro.alTocar);
  lienzo.addEventListener("wheel", giro.alTocar, { passive: true });
}

// Detiene el giro y devuelve los controles normales de la cámara.
function detenerGiro() {
  if (!giro) {
    return;
  }
  cancelAnimationFrame(giro.cuadro);
  const lienzo = visor.scene.canvas;
  lienzo.removeEventListener("pointerdown", giro.alTocar);
  lienzo.removeEventListener("wheel", giro.alTocar);
  giro = null;
  // lookAt "amarra" la cámara al lugar; esto la suelta sin moverla.
  visor.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
  visor.scene.requestRender();
  document.dispatchEvent(new Event("giro-detenido"));
}

function estaGirando() {
  return Boolean(giro);
}
