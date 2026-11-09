/* ÚNICO lugar donde cambiás la versión de Mi Recibo.
   Para publicar algo nuevo: cambiá APP_VERSION (por ejemplo "2.3.1") y escribí en APP_NOVEDADES una línea de qué cambió.
   Subí este archivo junto con index.html y sw.js. Lo leen la página y el service worker, y el aviso de actualización muestra las novedades. */
self.APP_VERSION = "2.3.1";
self.APP_NOVEDADES = "Ahora, después de actualizar, se muestra un cartel con las novedades de la versión (una sola vez).";
