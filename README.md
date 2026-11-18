# calculadora-sueldo

## Pruebas

Las pruebas comprueban el cálculo contra los recibos reales de octubre 2026, los avisos (cierre, cobro y feriados), el service worker, el arranque y que la versión y las novedades estén parejas.

```
npm install --no-save jsdom
npm test
```

También corren solas en GitHub cada vez que subís cambios (pestaña Actions). Si alguna falla, no subas esa versión.
Para sumar un recibo nuevo como prueba, agregá sus montos en `tests/recibos-repicky.test.js`.
