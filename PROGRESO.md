# Progreso del mapa

## Fase actual
Fase 2: Puntos (implementada el 18 de octubre de 2026; falta tu revisión en Chrome y verificar coordenadas)

## Hecho
- Fase 1 (12 de octubre de 2026):
  - Página con encabezado, mapa 3D, ayuda de navegación, introducción provisional y pie de página.
  - CesiumJS 1.146 desde el CDN oficial, con Cesium World Terrain (relieve) y Sentinel-2 (imagen).
    No se carga Bing Maps.
  - Vista inicial regional (Carazo, Granada y Rivas), inclinada, ajustable en `js/config.js`.
  - Botones + (acercar), − (alejar), N (norte arriba) y ⌂ (vista inicial), más pantalla completa.
  - Límites de distancia: mínimo 250 m, máximo 2000 km. Moverse a otros lugares sigue permitido.
  - Avisos en español: falta token, token inválido, falla de relieve o imagen, sin WebGL,
    CesiumJS no descargado y página abierta con doble clic.
  - Sin token se muestra un mapa básico de baja resolución, sin relieve.
  - README.md con instrucciones para abrir el proyecto y crear el token.

- Fase 2 (18 de octubre de 2026):
  - `data/puntos.json` con 9 puntos de historia, con textos sacados solo de `docs/`:
    llegada (golfo de Nicoya), encuentro con Nicarao (Rivas), lago Cocibolca, visita de Diriangén
    (Nochari), las 4 versiones del lugar de la batalla y la retirada.
  - `js/capas.js` (nuevo): lee el archivo, revisa que cada punto tenga id, título y coordenadas,
    y dibuja los marcadores pegados al relieve: azul con número (recorrido) y anaranjado con "?" (batalla).
    El nombre aparece debajo del marcador al acercarse (menos de 120 km).
  - Panel de información a la derecha (abajo en celular): fecha, título, etiqueta de certeza con color,
    texto, fuente e imagen con crédito (la imagen solo aparece si tiene crédito). Se cierra con × o Esc.
  - El marcador elegido se agranda. Al pasar el ratón por un marcador aparece la "manita".
  - La ayuda debajo del mapa explica qué significa cada marcador.
  - Probado en un Chrome de pruebas (sin token, con el mapa básico): 9 marcadores, el panel abre y cierra,
    sin errores en la consola, en pantalla de computadora y de celular.

- Vista 3D de cada lugar (18 de octubre de 2026, pedido por el equipo; adelanta parte de la Fase 8):
  - Botón "Ver el lugar en 3D" en el panel: la cámara vuela al lugar, baja cerca del suelo,
    mira de lado con el relieve y da vueltas lentas alrededor. "Detener el giro", tocar el mapa,
    cerrar el panel o ⌂ lo detienen. Ajustes en `js/config.js` → `vista3D`.
  - Campo opcional nuevo en `data/puntos.json`: `distancia_3d` (metros), usado en el golfo de Nicoya
    y en el lago, que se ven mejor desde más lejos.
  - Probado en http://localhost:8000 con el token real (Coatega / Mombacho): vuela, gira y se detiene.

  - Modelo 3D realista de Google (Google Photorealistic 3D Tiles, asset 2275207), aprobado por el equipo:
    el código ya está listo (`js/config.js` → `modelo3DRealista`, `js/mapa.js`). Cuando carga, esconde el
    globo de Cesium para que no se encimen y aparece el botón "3D" para cambiar entre Google y el relieve.
    Ya está incluido en el token (ver Publicación). Ojo: en Cesium ion, cambiar los assets o las
    direcciones de un token lo REGENERA y hay que volver a pegarlo en `js/config.js`.

- Publicación (18 de octubre de 2026, adelanta parte de la Fase 7):
  - Repositorio público: https://github.com/MariMBS/tras-los-pasos-de-diriangen
  - GitHub Pages activado (rama main, carpeta raíz):
    https://marimbs.github.io/tras-los-pasos-de-diriangen/
  - Token mapa-diriangen-web actualizado en Cesium ion: ahora incluye Google Photorealistic 3D Tiles
    y permite http://localhost:8000 y la dirección de GitHub Pages. Al guardarlo, Cesium generó un
    token nuevo: hay que pegarlo en `js/config.js` y subir ese archivo a la carpeta js/ del repositorio.
  - `js/config.ejemplo.js`: copia de config.js sin el token, por si se necesita una plantilla.
  - Falta: código QR para la feria y probar en celular.

## Pendiente de decidir
- "Cómo era el lugar en 1523": no existen fotos ni modelos 3D de esa época. Solo se podría con
  ilustraciones o modelos hechos por el equipo, rotulados como "representación artística".
- Si el mapa lleva animaciones de cámara o es una vista fija (se decide al final).
- Token de Cesium ion: ya está pegado en `js/config.js`; falta confirmar en Chrome que cargan el relieve y Sentinel-2.
- Texto definitivo de la introducción (el actual es provisional).
- Qué haría el botón "3D" del boceto (quedó fuera de la Fase 1).
- Fuente del nombre «Mar Dulce»: en `docs/` aparece en la Etapa 3 pero sin cita.
  El punto dice "Por confirmar". ¿Qué fuente usamos (por ejemplo Incer Barquero, 1990)?
- Fecha exacta de la visita de Diriangén: los documentos solo dicen que prometió volver en tres días
  y que atacó el 17 de abril. Se dejó "tres días antes del ataque".
- Los números de los marcadores azules van 1, 2, 3, 4 y 6, porque el paso 5 es el ataque
  (las 4 versiones con "?"). Revisar si se entiende o si se prefiere otra numeración.

## Coordenadas por verificar en Google Earth
Todas van como [longitud, latitud]. Se cambian en `data/puntos.json`.

- Centro de la vista inicial: [-86.03, 11.67]. No es un lugar histórico: es solo
  el centro del encuadre de la cámara. Ajustar viendo el mapa con el token puesto.
  Con este encuadre, Rivas (2) y la retirada (6) quedan fuera de la vista inicial.
- `nicoya-llegada` [-84.98, 9.92]: centro aproximado del golfo de Nicoya (Costa Rica).
- `rivas-nicarao` [-85.826, 11.437]: ciudad de Rivas.
- `cocibolca-mar-dulce` [-85.72, 11.5]: punto en el agua del lago, frente a Rivas.
- `nochari-visita` [-86.05, 11.7]: ILUSTRATIVO. No se sabe dónde quedaba Nochari.
- `batalla-diriamba` [-86.239, 11.858]: centro de Diriamba. Falta ubicar la Quebrada del Perro.
- `batalla-ochomogo` [-85.92, 11.62]: aproximado, sobre el río Ochomogo. Verificar el cauce.
- `batalla-nochari` [-85.99, 11.66]: ILUSTRATIVO, separado unos km de la visita para que no se tapen.
- `batalla-coatega` [-85.99, 11.79]: aproximado, al pie del Mombacho. Falta ubicar Coatega.
- `retirada` [-85.72, 11.3]: ILUSTRATIVO, en el istmo de Rivas, camino al sur.

## Problemas conocidos
- 18 de octubre de 2026: Cesium ion respondía "401 INVALID_TOKEN". El token de `js/config.js` era una copia
  vieja: en ion.cesium.com el token mapa-diriangen-web fue regenerado después de copiarlo.
  Solución: copiar el token actual y pegarlo en `js/config.js`. Ahora la página muestra un solo aviso claro
  cuando Cesium ion rechaza el token (antes salían dos avisos, uno del relieve y otro de la imagen).
- Chrome guarda copias de los archivos: después de cambiar código, recargar con Ctrl + F5.
- Sin token, el mapa básico se ve borroso a escala regional (una mancha verde y azul).
  Solo sirve para que la página no quede vacía.
- Al alejar mucho con el botón −, la vista se vuelve casi vertical. El botón ⌂ la restaura.
- Git no está instalado en la computadora (hace falta en la Fase 7).
- Los marcadores de la visita (4) y de la versión Nochari (?) están cerca; al alejar mucho se juntan.
- Python instalado es una versión de prueba (3.15 alfa); el servidor local funcionó en las pruebas.
