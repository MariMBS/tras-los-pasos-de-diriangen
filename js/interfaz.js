// =============================================================
// interfaz.js — Avisos, botones del mapa, panel de información
//                y arranque de la página.
// Es el último archivo que se carga, por eso aquí empieza todo.
// =============================================================

// Muestra un aviso sobre el mapa.
// tipo: "error" (rojo); si no se indica, es una advertencia (amarilla).
function mostrarAviso(mensaje, tipo) {
  const lista = document.getElementById("avisos");

  // No repetir un aviso que ya está en pantalla
  for (const parrafo of lista.querySelectorAll("p")) {
    if (parrafo.textContent === mensaje) {
      return;
    }
  }

  const aviso = document.createElement("div");
  aviso.className = tipo === "error" ? "aviso aviso-error" : "aviso";

  const texto = document.createElement("p");
  texto.textContent = mensaje;

  const cerrar = document.createElement("button");
  cerrar.type = "button";
  cerrar.className = "aviso-cerrar";
  cerrar.textContent = "×";
  cerrar.setAttribute("aria-label", "Cerrar aviso");
  cerrar.addEventListener("click", function () {
    aviso.remove();
  });

  aviso.append(texto, cerrar);
  lista.append(aviso);
}

// Conecta cada botón del mapa con su función de mapa.js
function conectarBotones() {
  document.getElementById("btn-acercar").addEventListener("click", acercar);
  document.getElementById("btn-alejar").addEventListener("click", alejar);
  document.getElementById("btn-norte").addEventListener("click", orientarAlNorte);
  document.getElementById("btn-inicio").addEventListener("click", function () {
    irAVistaInicial(true);
  });

  // Botón 3D: cambia entre el modelo realista de Google y el relieve con Sentinel-2.
  // Solo aparece si el modelo se pudo cargar con el token.
  const boton3D = document.getElementById("btn-modelo-3d");
  document.addEventListener("modelo3d-listo", function () {
    boton3D.hidden = false;
  });
  boton3D.addEventListener("click", function () {
    const mostrar = !modelo3DVisible();
    mostrarModelo3D(mostrar);
    boton3D.setAttribute("aria-pressed", String(mostrar));
    boton3D.title = mostrar
      ? "Ver edificios y árboles en 3D (Google)"
      : "Volver al modelo 3D de Google";
  });
}

// -------------------------------------------------------------
// Panel de información (a la derecha del mapa; abajo en celular)
// -------------------------------------------------------------

// Texto y estilo de cada nivel de certeza.
const ETIQUETAS_CERTEZA = {
  confirmado: "Hecho confirmado",
  estimado: "Estimación",
  en_discusion: "En discusión",
};

// Llena el panel con los datos de un punto y lo muestra.
function abrirPanel(punto) {
  document.getElementById("panel-fecha").textContent = punto.fecha || "";
  document.getElementById("panel-titulo").textContent = punto.titulo;
  document.getElementById("panel-texto").textContent = punto.texto || "";
  document.getElementById("panel-fuente").textContent = punto.fuente || "Sin fuente indicada";

  const etiqueta = document.getElementById("panel-certeza");
  const certeza = ETIQUETAS_CERTEZA[punto.certeza] ? punto.certeza : null;
  etiqueta.textContent = certeza ? ETIQUETAS_CERTEZA[certeza] : "Certeza sin indicar";
  etiqueta.className = "etiqueta-certeza" + (certeza ? " certeza-" + certeza : "");

  // Imágenes: solo las que tienen su crédito (regla del proyecto).
  let imagenes = Array.isArray(punto.imagenes) ? punto.imagenes : [];
  if (!imagenes.length && punto.imagen) {
    imagenes = [{ src: punto.imagen, credito: punto.credito_imagen, descripcion: "" }];
  }
  mostrarCarrusel(imagenes.filter(function (img) {
    return img && img.src && img.credito;
  }));

  // "Cómo era antes"
  const antes = document.getElementById("panel-antes");
  document.getElementById("panel-antes-texto").textContent = punto.antes || "";
  antes.hidden = !punto.antes;

  // Línea de tiempo del lugar
  const linea = document.getElementById("panel-linea");
  const lista = document.getElementById("panel-linea-lista");
  lista.replaceChildren();
  for (const momento of punto.linea_tiempo || []) {
    const item = document.createElement("li");
    const cuando = document.createElement("strong");
    cuando.textContent = momento.cuando;
    const que = document.createElement("span");
    que.textContent = momento.que;
    item.append(cuando, que);
    if (momento.fuente) {
      const fuente = document.createElement("small");
      fuente.textContent = momento.fuente;
      item.append(fuente);
    }
    lista.append(item);
  }
  linea.hidden = !lista.children.length;

  puntoAbierto = punto;
  actualizarBoton3D("normal");

  const panel = document.getElementById("panel-info");
  panel.hidden = false;
  panel.scrollTop = 0;
  document.querySelector(".zona-mapa").classList.add("con-panel");
  document.getElementById("panel-titulo").focus({ preventScroll: true });
  seleccionarMarcador(punto.id);
}

// -------------------------------------------------------------
// Botón "Ver el lugar en 3D"
// -------------------------------------------------------------

// Punto que está abierto en el panel.
let puntoAbierto = null;

// estado: "normal" (listo), "volando" (en camino) o "girando" (dando vueltas)
function actualizarBoton3D(estado) {
  const boton = document.getElementById("btn-ver-3d");
  boton.dataset.estado = estado;
  boton.disabled = estado === "volando";
  boton.textContent =
    estado === "girando" ? "Detener el giro" :
    estado === "volando" ? "Llegando al lugar…" :
    "Ver el lugar en 3D";
}

function alPulsarBoton3D() {
  const boton = document.getElementById("btn-ver-3d");
  if (boton.dataset.estado === "girando") {
    detenerGiro();
    return;
  }
  if (!puntoAbierto) {
    return;
  }
  actualizarBoton3D("volando");
  verLugarEn3D(puntoAbierto, function (girando) {
    actualizarBoton3D(girando ? "girando" : "normal");
  });
}

// -------------------------------------------------------------
// Carrusel de imágenes: pasan solas cada pocos segundos y también
// se pueden pasar con las flechas, los puntitos o deslizando el dedo.
// -------------------------------------------------------------

const SEGUNDOS_POR_IMAGEN = 6;

// Sello que se pone sobre cada imagen según lo que es.
const SELLOS_IMAGEN = {
  foto: "Fotografía actual",
  dibujo: "Dibujo de la época",
  mapa: "Mapa antiguo",
  objeto: "Pieza arqueológica",
  representacion: "Representación artística",
};
const carrusel = { imagenes: [], actual: 0, temporizador: null, pausado: false };

function mostrarCarrusel(imagenes) {
  detenerCarrusel();
  carrusel.imagenes = imagenes;
  carrusel.actual = 0;
  const caja = document.getElementById("carrusel");
  caja.hidden = imagenes.length === 0;
  if (!imagenes.length) {
    return;
  }

  // Un puntito por imagen
  const puntos = document.getElementById("carrusel-puntos");
  puntos.replaceChildren();
  imagenes.forEach(function (imagen, indice) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.setAttribute("aria-label", "Ver imagen " + (indice + 1) + " de " + imagenes.length);
    boton.addEventListener("click", function () {
      irAImagen(indice);
    });
    puntos.append(boton);
  });

  const variasImagenes = imagenes.length > 1;
  document.getElementById("carrusel-anterior").hidden = !variasImagenes;
  document.getElementById("carrusel-siguiente").hidden = !variasImagenes;
  puntos.hidden = !variasImagenes;

  irAImagen(0);
  iniciarCarrusel();
}

function irAImagen(indice) {
  const total = carrusel.imagenes.length;
  if (!total) {
    return;
  }
  carrusel.actual = (indice + total) % total;
  const imagen = carrusel.imagenes[carrusel.actual];

  const foto = document.getElementById("carrusel-imagen");
  foto.classList.remove("carrusel-aparece");
  void foto.offsetWidth; // reinicia la animación de aparecer
  foto.src = imagen.src;
  foto.alt = imagen.descripcion || "Imagen ilustrativa";
  foto.classList.add("carrusel-aparece");

  document.getElementById("carrusel-descripcion").textContent = imagen.descripcion || "";
  document.getElementById("carrusel-sello").textContent =
    SELLOS_IMAGEN[imagen.tipo] || SELLOS_IMAGEN.representacion;

  // Crédito, con enlace a la página original de la imagen si lo tiene
  const credito = document.getElementById("carrusel-credito");
  credito.replaceChildren("Imagen: ");
  if (imagen.enlace) {
    const enlace = document.createElement("a");
    enlace.href = imagen.enlace;
    enlace.target = "_blank";
    enlace.rel = "noopener";
    enlace.textContent = imagen.credito;
    credito.append(enlace);
  } else {
    credito.append(imagen.credito);
  }

  document.querySelectorAll("#carrusel-puntos button").forEach(function (boton, i) {
    boton.setAttribute("aria-current", i === carrusel.actual ? "true" : "false");
  });

  // Precarga la siguiente para que el cambio sea suave
  if (total > 1) {
    new Image().src = carrusel.imagenes[(carrusel.actual + 1) % total].src;
  }
}

function iniciarCarrusel() {
  detenerCarrusel();
  const sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (carrusel.imagenes.length < 2 || sinMovimiento) {
    return;
  }
  carrusel.temporizador = setInterval(function () {
    if (!carrusel.pausado) {
      irAImagen(carrusel.actual + 1);
    }
  }, SEGUNDOS_POR_IMAGEN * 1000);
}

function detenerCarrusel() {
  clearInterval(carrusel.temporizador);
  carrusel.temporizador = null;
}

function conectarCarrusel() {
  const caja = document.getElementById("carrusel");

  // Si una imagen todavía no está en la carpeta img/, se quita del carrusel
  // en vez de mostrar un cuadro roto.
  document.getElementById("carrusel-imagen").addEventListener("error", function () {
    console.warn("Imagen no encontrada:", this.getAttribute("src"));
    carrusel.imagenes.splice(carrusel.actual, 1);
    if (!carrusel.imagenes.length) {
      detenerCarrusel();
      caja.hidden = true;
      return;
    }
    mostrarCarrusel(carrusel.imagenes);
  });
  document.getElementById("carrusel-anterior").addEventListener("click", function () {
    irAImagen(carrusel.actual - 1);
    iniciarCarrusel(); // vuelve a contar desde cero
  });
  document.getElementById("carrusel-siguiente").addEventListener("click", function () {
    irAImagen(carrusel.actual + 1);
    iniciarCarrusel();
  });

  // Se detiene mientras el ratón está encima o se está tocando
  caja.addEventListener("mouseenter", function () { carrusel.pausado = true; });
  caja.addEventListener("mouseleave", function () { carrusel.pausado = false; });

  // Deslizar con el dedo
  let inicioX = null;
  caja.addEventListener("pointerdown", function (evento) {
    inicioX = evento.clientX;
    carrusel.pausado = true;
  });
  caja.addEventListener("pointerup", function (evento) {
    if (inicioX !== null) {
      const distancia = evento.clientX - inicioX;
      if (Math.abs(distancia) > 40) {
        irAImagen(carrusel.actual + (distancia < 0 ? 1 : -1));
        iniciarCarrusel();
      }
    }
    inicioX = null;
    carrusel.pausado = false;
  });

  // Flechas del teclado cuando el carrusel tiene el foco
  caja.addEventListener("keydown", function (evento) {
    if (evento.key === "ArrowLeft") {
      irAImagen(carrusel.actual - 1);
    } else if (evento.key === "ArrowRight") {
      irAImagen(carrusel.actual + 1);
    }
  });
}

function cerrarPanel() {
  puntoAbierto = null;
  detenerCarrusel();
  detenerGiro();
  document.getElementById("panel-info").hidden = true;
  document.querySelector(".zona-mapa").classList.remove("con-panel");
  seleccionarMarcador(null);
}

function conectarPanel() {
  document.getElementById("panel-cerrar").addEventListener("click", cerrarPanel);
  document.getElementById("btn-ver-3d").addEventListener("click", alPulsarBoton3D);
  conectarCarrusel();
  // Cuando el giro se detiene (por el botón, por tocar el mapa o por ⌂)
  document.addEventListener("giro-detenido", function () {
    if (puntoAbierto) {
      actualizarBoton3D("normal");
    }
  });
  document.addEventListener("keydown", function (evento) {
    if (evento.key === "Escape" && !document.getElementById("panel-info").hidden) {
      cerrarPanel();
    }
  });
}

// Arranque de la página
function iniciarPagina() {
  if (location.protocol === "file:") {
    mostrarAviso(
      "Abriste la página con doble clic. Para que todo funcione, ábrela con el " +
        "servidor local: http://localhost:8000 (instrucciones en README.md)."
    );
  }

  const mapaCreado = crearMapa();
  if (mapaCreado) {
    conectarBotones();
    conectarPanel();
    cargarPuntos(abrirPanel);
  } else {
    document.getElementById("controles-mapa").hidden = true;
  }
}

iniciarPagina();
