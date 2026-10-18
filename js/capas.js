// =============================================================
// capas.js — Puntos del mapa (marcadores).
//
// Funciones principales:
//   cargarPuntos()        lee data/puntos.json y dibuja los marcadores
//   seleccionarMarcador() resalta el marcador del punto elegido
//
// En la Fase 3 aquí se agregarán la ruta, los territorios y las capas.
// =============================================================

// Colores de los marcadores (los mismos del boceto de la Etapa 3).
const COLORES_CATEGORIA = {
  recorrido: "#2e86c1",   // azul con número
  batalla: "#e67e22",     // anaranjado con "?"
  tradiciones: "#8e44ad", // morado        (Fase 5)
  musica: "#16a085",      // verde azulado (Fase 5)
  gastronomia: "#d4ac0d", // amarillo      (Fase 5)
  patrimonio: "#7f8c8d",  // gris          (Fase 5)
  pueblos: "#7f8c8d",     // gris          (Fase 5)
};

// Todos los puntos leídos del archivo, guardados por su "id".
const puntosPorId = {};

// Marcadores dibujados en el mapa, también por "id".
const marcadoresPorId = {};

// Id del marcador resaltado en este momento (o null).
let idMarcadorSeleccionado = null;

// Lee data/puntos.json y dibuja un marcador por cada punto válido.
// alTocar(punto) se ejecuta cuando la persona toca un marcador.
async function cargarPuntos(alTocar) {
  let puntos;
  try {
    const respuesta = await fetch("data/puntos.json", { cache: "no-cache" });
    if (!respuesta.ok) {
      throw new Error("Respuesta " + respuesta.status);
    }
    puntos = await respuesta.json();
  } catch (error) {
    console.error(error);
    mostrarAviso(
      "No se pudieron cargar los puntos del mapa (data/puntos.json). " +
        "Revisa que la página esté abierta con el servidor local y que el archivo no tenga errores.",
      "error"
    );
    return;
  }

  for (const punto of puntos) {
    if (!puntoEsValido(punto)) {
      continue;
    }
    puntosPorId[punto.id] = punto;
    marcadoresPorId[punto.id] = crearMarcador(punto);
  }

  conectarToquesEnMarcadores(alTocar);
  visor.scene.requestRender();
}

// Revisa que el punto tenga lo mínimo para dibujarse.
// Si algo falta, lo dice en la consola (F12) y no lo dibuja.
function puntoEsValido(punto) {
  const c = punto.coordenadas;
  const coordenadasBien =
    Array.isArray(c) &&
    c.length === 2 &&
    typeof c[0] === "number" &&
    typeof c[1] === "number" &&
    Math.abs(c[0]) <= 180 &&
    Math.abs(c[1]) <= 90;

  if (!punto.id || !punto.titulo || !coordenadasBien) {
    console.warn("Punto con datos incompletos, no se dibuja:", punto);
    return false;
  }
  if (puntosPorId[punto.id]) {
    console.warn("Hay dos puntos con el mismo id, se dibuja solo el primero:", punto.id);
    return false;
  }
  return true;
}

// Dibuja un marcador (círculo con número o "?") y su nombre debajo.
function crearMarcador(punto) {
  const color = COLORES_CATEGORIA[punto.categoria] || "#1f2a37";
  let simbolo = "";
  if (punto.categoria === "batalla") {
    simbolo = "?";
  } else if (punto.categoria === "recorrido" && punto.orden) {
    simbolo = String(punto.orden);
  }

  return visor.entities.add({
    id: punto.id,
    position: Cesium.Cartesian3.fromDegrees(punto.coordenadas[0], punto.coordenadas[1]),
    billboard: {
      image: dibujarIconoMarcador(color, simbolo),
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // pegado al relieve
      disableDepthTestDistance: Number.POSITIVE_INFINITY,      // que una montaña no lo tape
      scale: 1,
    },
    label: {
      text: nombreCorto(punto),
      font: "600 14px system-ui, 'Segoe UI', Arial, sans-serif",
      fillColor: Cesium.Color.WHITE,
      outlineColor: Cesium.Color.fromCssColorString("#1f2a37"),
      outlineWidth: 4,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      pixelOffset: new Cesium.Cartesian2(0, 26),
      verticalOrigin: Cesium.VerticalOrigin.TOP,
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      // El nombre solo aparece al acercarse, para no llenar la pantalla de letras.
      distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 120000),
    },
  });
}

// Nombre corto que se escribe debajo del marcador.
// Para las versiones de la batalla se usa solo el lugar (lo que va después de ":").
function nombreCorto(punto) {
  const partes = punto.titulo.split(":");
  return partes.length > 1 ? partes[1].trim() : punto.titulo;
}

// Dibuja el ícono del marcador en una imagen pequeña:
// círculo de color con borde blanco y un número o "?" en el centro.
function dibujarIconoMarcador(color, simbolo) {
  const tamano = 44;
  const lienzo = document.createElement("canvas");
  lienzo.width = tamano;
  lienzo.height = tamano;
  const dibujo = lienzo.getContext("2d");
  const centro = tamano / 2;

  // Sombra suave para que se distinga sobre el satélite
  dibujo.beginPath();
  dibujo.arc(centro, centro + 1, 19, 0, Math.PI * 2);
  dibujo.fillStyle = "rgba(0, 0, 0, 0.35)";
  dibujo.fill();

  // Borde blanco y círculo de color
  dibujo.beginPath();
  dibujo.arc(centro, centro, 18, 0, Math.PI * 2);
  dibujo.fillStyle = "#ffffff";
  dibujo.fill();

  dibujo.beginPath();
  dibujo.arc(centro, centro, 15, 0, Math.PI * 2);
  dibujo.fillStyle = color;
  dibujo.fill();

  if (simbolo) {
    dibujo.fillStyle = "#ffffff";
    dibujo.font = "bold 17px system-ui, 'Segoe UI', Arial, sans-serif";
    dibujo.textAlign = "center";
    dibujo.textBaseline = "middle";
    dibujo.fillText(simbolo, centro, centro + 1);
  }
  return lienzo;
}

// Al tocar un marcador se abre su información.
// Al pasar el ratón por encima, la flecha cambia a "manita".
function conectarToquesEnMarcadores(alTocar) {
  const escena = visor.scene;
  const manejador = new Cesium.ScreenSpaceEventHandler(escena.canvas);

  manejador.setInputAction(function (clic) {
    const punto = puntoEnPantalla(clic.position);
    if (punto) {
      alTocar(punto);
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  manejador.setInputAction(function (movimiento) {
    escena.canvas.style.cursor = puntoEnPantalla(movimiento.endPosition) ? "pointer" : "";
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
}

// Devuelve el punto cuyo marcador está en esa posición de la pantalla, o null.
function puntoEnPantalla(posicion) {
  const elegido = visor.scene.pick(posicion);
  if (elegido && elegido.id && puntosPorId[elegido.id.id]) {
    return puntosPorId[elegido.id.id];
  }
  return null;
}

// Agranda el marcador del punto elegido y devuelve los demás a su tamaño.
// Con id = null no queda ninguno resaltado.
function seleccionarMarcador(id) {
  if (idMarcadorSeleccionado && marcadoresPorId[idMarcadorSeleccionado]) {
    marcadoresPorId[idMarcadorSeleccionado].billboard.scale = 1;
  }
  idMarcadorSeleccionado = id;
  if (id && marcadoresPorId[id]) {
    marcadoresPorId[id].billboard.scale = 1.35;
  }
  visor.scene.requestRender();
}
