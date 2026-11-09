/* ÚNICO lugar donde cambiás la versión de Mi Recibo.
   Para publicar algo nuevo: cambiá APP_VERSION (por ejemplo "2.3.1") y escribí en APP_NOVEDADES una línea de qué cambió.
   Subí este archivo junto con index.html y sw.js. Lo leen la página y el service worker, y el aviso de actualización muestra las novedades. */
self.APP_VERSION = "2.3.0";
self.APP_NOVEDADES = "Aviso de versión nueva con botón, copias de seguridad automáticas antes de actualizar y búsqueda de actualización al entrar.";
