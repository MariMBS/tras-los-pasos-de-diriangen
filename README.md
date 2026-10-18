# Tras los pasos de Diriangén

Mapa interactivo en 3D de la resistencia indígena de 1523 y la herencia de su pueblo.

Proyecto educativo de la Universidad Nacional de Ingeniería (UNI), asignatura Historia, Memoria,
Identidad y Patrimonio Nacional, grupo 1M1-ELK-S.

**Estado:** prototipo, Fase 2 (mapa 3D con los puntos de la historia de 1523). El avance está en [PROGRESO.md](PROGRESO.md).

## Cómo abrir el proyecto en tu computadora (Windows)

Abrir `index.html` con doble clic no sirve: hay que usar un servidor local.

1. Abre la carpeta del proyecto en el Explorador de archivos.
2. Haz clic en la barra de dirección, escribe `powershell` y presiona Enter.
3. En la ventana que se abre, escribe:

   ```
   python -m http.server 8000
   ```

4. Abre Chrome y entra a **http://localhost:8000**
5. Para apagar el servidor, vuelve a la ventana de PowerShell y presiona `Ctrl + C`.

Se necesita conexión a internet: CesiumJS, el relieve y la imagen satelital se descargan mientras se usa.

## Cómo configurar el token de Cesium ion

El relieve y la imagen satelital vienen de Cesium ion (plan gratuito Community).
Sin token, la página muestra un mapa básico de baja resolución y sin relieve.

1. Crea una cuenta gratis en https://ion.cesium.com
2. Arriba, entra a **Asset Depot**, busca **Sentinel-2** y pulsa **+** para agregarlo a *My Assets*.
3. Entra a **My Assets** y revisa que estén **Cesium World Terrain** y **Sentinel-2**.
   Si falta Cesium World Terrain, agrégalo igual desde Asset Depot.
4. Entra a **Access Tokens** y pulsa **Create token**:
   - **Name:** `mapa-diriangen-web`
   - **Scopes:** deja marcado solo `assets:read` (desmarca `geocode` y todo lo demás).
   - **Resources:** elige solo **Cesium World Terrain** y **Sentinel-2**.
   - **Allowed URLs:** agrega `http://localhost:8000`.
     La dirección de GitHub Pages se agrega en la Fase 7.
5. Copia el token y pégalo en `js/config.js`, en lugar de `PEGA_AQUI_TU_TOKEN`
   (deja las comillas).
6. Guarda el archivo y recarga la página.

No uses el "Default Token": Cesium indica que no es para páginas publicadas y no se puede restringir.
El token se podrá ver en la página publicada; eso es normal en mapas web, y las restricciones
del paso 4 hacen que solo sirva para leer esos dos recursos desde tus direcciones.

Si Cesium rechaza `http://localhost:8000` en Allowed URLs, deja esa lista vacía solo mientras
pruebas y vuelve a restringirla antes de publicar.

## Estructura

```
index.html        página principal
css/estilos.css   colores y distribución
js/config.js      token y ajustes del mapa (vista inicial, límites, relieve)
js/mapa.js        crea el mapa 3D y mueve la cámara
js/capas.js       marcadores de los puntos
js/interfaz.js    avisos, botones, panel de información y arranque de la página
data/puntos.json  lugares del mapa con su texto, fuente y nivel de certeza
docs/             documentos de investigación del proyecto
PROGRESO.md       registro de lo hecho y lo pendiente
```

## Herramientas

- HTML, CSS y JavaScript, sin frameworks ni compilación.
- [CesiumJS](https://cesium.com/platform/cesiumjs/) 1.146 desde su CDN oficial.
- Cesium ion (plan gratuito Community): Cesium World Terrain (relieve) y Sentinel-2 (imagen satelital).

Los créditos de los datos del mapa aparecen en la parte inferior del mapa.
