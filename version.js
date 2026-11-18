/* ÚNICO lugar donde cambiás la versión de Mi Recibo.
   Para publicar algo nuevo: cambiá APP_VERSION (por ejemplo "2.3.1") y escribí en APP_NOVEDADES una línea de qué cambió.
   Subí este archivo junto con index.html y sw.js. Lo leen la página y el service worker, y el aviso de actualización muestra las novedades. */
self.APP_VERSION = "2.3.9";
self.APP_NOVEDADES = "Mi Recibo y Second Brain ahora se pueden instalar y usar a la vez desde el mismo sitio sin pisarse: cada una tiene su propia identidad, su copia sin conexión y sus datos. Si ya la tenías instalada, desinstalala y volvé a instalarla una vez para que quede separada de la otra.";
/* Lista de novedades, de la más nueva a la más vieja: [versión, qué cambió]. Al publicar algo nuevo, agregá arriba una línea con la nueva versión. */
self.APP_HISTORIAL = [
  ["2.3.9", "Mi Recibo y Second Brain ahora se pueden instalar y usar a la vez desde el mismo sitio sin pisarse: cada una tiene su propia identidad, su copia sin conexión y sus datos. Si ya la tenías instalada, desinstalala y volvé a instalarla una vez para que quede separada de la otra."],
  ["2.3.8", "El aviso de feriado ahora dice cuánto sumás de neto si trabajás ese día. El recordatorio de copia de seguridad salta a los 15 días y solo si hay datos nuevos sin guardar. Se sumaron pruebas automáticas del cálculo y de los avisos."],
  ["2.3.7", "La pantalla de carga ya no espera al evento «load» y la app abre con la copia guardada si internet tarda más de 1,5 segundos. Abajo de todo se ve cuánto tardó la última apertura."],
  ["2.3.6", "Arranque más firme en el celu: si la señal es mala y la app tarda más de 4 segundos en conseguir lo último, abre con la copia guardada, y si algo se traba te avisa en la pantalla de carga."],
  ["2.3.5", "Los avisos de feriado ahora llegan 7, 3 y 1 día antes, con el recordatorio de que ese día se cobra al 100%."],
  ["2.3.4", "Aviso de feriados: en «Cuándo cobrás» sale un mensaje para aprovechar el próximo feriado (se cobra al 100%), y el celu te avisa el día antes y el mismo día."],
  ["2.3.3", "Ahora «Cuándo cobrás» muestra los próximos feriados con los días que faltan (los de la app, los de internet y los que cargaste vos)."],
  ["2.3.2", "Perfil Repicky corregido con los recibos de octubre: el adicional de título va solo en la 2da quincena y se sumaron las dos sumas no remunerativas de octubre 2026, también solo en la 2da. Los perfiles Repicky que ya tenías se arreglan solos."],
  ["2.3.1", "Ahora, después de actualizar, se muestra un cartel con las novedades de la versión (una sola vez)."],
  ["2.3.0", "Aviso de actualización con el botón «Actualizar», y antes de cada actualización se guarda una copia de tus datos por si algo sale mal."],
  ["2.2.0", "Perfil Repicky (convenio UOM) listo para usar: Hs feriado, Hs al 100% y Hs Adic Noc, con presentismo, premio y antigüedad armados como en el recibo."],
  ["2.1.0", "Paritarias: cargás un aumento y se aplica a los conceptos de tu perfil, con proyección de lo que vas a cobrar los próximos meses."],
  ["2.0.0", "La app pasa a llamarse Mi Recibo. Ahora podés tener un perfil por cada empresa o convenio, con sus propios conceptos y descuentos, y cambiar de uno a otro cuando quieras."],
  ["1.8.0", "Avisos de cierre de quincena y de día de cobro, para acordarte de cargar tus horas."],
  ["1.7.0", "Subís una foto o un PDF del recibo y la app carga los datos sola, tomando solo la parte del empleado."],
  ["1.6.0", "Copia de tus datos en Google Drive y OneDrive, y también en un archivo, para no perder nada si cambiás de celu."],
  ["1.5.0", "Se puede instalar como app en la PC, la notebook y Android, y funciona sin conexión."],
  ["1.4.0", "Gráfica de líneas para ver si cobrás más o menos que la quincena anterior."],
  ["1.3.0", "Historial: queda guardado lo que cobraste cada mes."],
  ["1.2.0", "Aguinaldo (SAC): se calcula con el mejor sueldo del semestre."],
  ["1.1.0", "Quincena y mes completo, con los descuentos que van solo en una quincena, como el seguro de vida."],
  ["1.0.0", "Primera versión: ponés el valor de la hora y tus horas y te dice cuánto te queda en mano, con los descuentos de ley."]
];
