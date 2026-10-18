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

  // La imagen solo se muestra si tiene su crédito (regla del proyecto).
  const figura = document.getElementById("panel-figura");
  if (punto.imagen && punto.credito_imagen) {
    const imagen = document.getElementById("panel-imagen");
    imagen.src = punto.imagen;
    imagen.alt = punto.titulo;
    document.getElementById("panel-credito").textContent = "Imagen: " + punto.credito_imagen;
    figura.hidden = false;
  } else {
    figura.hidden = true;
  }

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

function cerrarPanel() {
  puntoAbierto = null;
  detenerGiro();
  document.getElementById("panel-info").hidden = true;
  document.querySelector(".zona-mapa").classList.remove("con-panel");
  seleccionarMarcador(null);
}

function conectarPanel() {
  document.getElementById("panel-cerrar").addEventListener("click", cerrarPanel);
  document.getElementById("btn-ver-3d").addEventListener("click", alPulsarBoton3D);
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
