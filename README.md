# Cachalot · Contactos

Interfaz web para manejar los contactos de clientes de un CRM: buscarlos, ver su información, registrar el historial de llamadas, reuniones y correos, **agendar el próximo paso con cada cliente** y ver cada día qué toca hacer, además de crear, editar o eliminar contactos.

Hecha con **React 19 + TypeScript + Vite**. No necesita backend: los datos salen de un archivo JSON y se guardan en `localStorage` a través de una API simulada con latencia.

## Cómo ejecutarlo

Requiere Node 20 o superior.

```bash
npm install
npm run dev        # abre http://localhost:5173
```

Otros comandos:

| Comando         | Qué hace                                  |
| --------------- | ----------------------------------------- |
| `npm test`      | Corre las pruebas (Vitest + Testing Library) |
| `npm run lint`  | Revisa el código con oxlint               |
| `npm run build` | Verifica tipos y genera `dist/`           |
| `npm run preview` | Sirve el build de producción            |

### Probar los estados de la interfaz

La API simulada tarda medio segundo en responder, así que el estado de **carga** se ve al abrir la app. Para los demás estados:

- **Error:** abre `http://localhost:5173/?simular=error`. Todas las peticiones fallan y aparece el botón "Reintentar".
- **Lista vacía:** abre `http://localhost:5173/?simular=vacio`. Trabaja en memoria, así que no borra tus datos.
- **Sin resultados:** busca algo que no exista, por ejemplo `zzz`.
- **Volver a los datos de ejemplo:** borra la clave `cachalot.contactos.v3` de `localStorage` (DevTools → Application) y recarga.

## Funcionalidades

- **Lista de contactos** con nombre, correo, teléfono, empresa, estado (nuevo, activo, en seguimiento) y fecha del próximo paso. Un punto de color en el avatar indica qué tan reciente fue el último contacto (verde, ámbar o rojo). En escritorio es una tabla que se ordena con los encabezados; en celular y tableta, tarjetas. Se puede filtrar por estado y ordenar por nombre, empresa, contacto más reciente o próximo paso.
- **Búsqueda por nombre o empresa**, siempre visible arriba, que ignora tildes y mayúsculas ("logistica" encuentra "Andina Logística") y resalta la coincidencia. Desde cualquier vista lleva a la lista filtrada. Atajo: tecla `/` para ir al buscador, `Esc` para limpiarlo. **La búsqueda, el filtro y el orden viven en la URL** (`#/contactos?q=cafetera&estado=activo`): sobreviven a una recarga, el botón atrás funciona y al volver de una ficha la lista sigue como estaba.
- **Próximo paso:** cada contacto puede tener una fecha y una tarea pendiente ("Enviar la cotización", el jueves). Se agenda desde la ficha o al registrar una nota, con atajos (mañana, en 3 días, en 1 o 2 semanas u otra fecha), y se marca como hecho con un clic.
- **Inicio** (`#/`): panel con 4 indicadores (pendientes hoy, esta semana, contactos, notas en 30 días), gráfico de actividad por semana, dona de la cartera por estado, próximos pasos con un círculo para marcarlos como hechos y los contactos sin seguimiento. El menú lateral muestra cuántos pendientes hay hoy y qué porcentaje de la cartera está al día.
- **Ficha del contacto** con el próximo paso y el historial como contenido principal, y los datos en una columna lateral. Botones de **Llamar** (`tel:`) y **Escribir** (`mailto:`), **copiar** correo y teléfono, cambio de estado en un clic.
- **Notas de seguimiento** con tipo (llamada, reunión, correo o nota): se agregan desde la ficha (también con `Ctrl + Enter`) y se muestran como una línea de tiempo. Al eliminar una nota o marcar un paso como hecho aparece **"Deshacer"**.
- **Formulario de creación** con validación: nombre obligatorio, correo obligatorio con formato válido y sin repetir, teléfono opcional con formato. Cada error aparece junto a su campo y el foco salta al primero que haya que corregir.
- **Estados** de carga (esqueletos), lista vacía, sin resultados, error con reintento y contacto inexistente.
- **Extras:** editar y eliminar contactos (con confirmación), modo oscuro que recuerda tu preferencia, título de la pestaña por vista, pruebas de componentes y CI en GitHub Actions.

## Estructura

```
src/
  api/contactsApi.ts       API simulada (localStorage, latencia, modos de simulación)
  data/contacts.json       Contactos de ejemplo
  state/                   Contexto de contactos y notificaciones (toasts)
  components/              Lista, notas, formulario, diálogo, avatar, iconos…
  pages/                   Vistas por ruta: inicio, contactos, ficha, nuevo, editar, 404
  lib/                     Lógica pura: búsqueda, validación, seguimiento y agenda, fechas, tema
  styles/                  Tokens de diseño y estilos base
```

Rutas (con `HashRouter`, para que funcione en cualquier hosting estático):

- `#/` inicio (`#/agenda` y `#/resumen` redirigen aquí)
- `#/contactos` lista de contactos (acepta `?q=`, `?estado=` y `?orden=`)
- `#/contactos/nuevo` crear contacto
- `#/contactos/:id` detalle y notas
- `#/contactos/:id/editar` editar contacto

## Decisiones

- **Que no parezca un chat.** La primera versión tenía una lista de tarjetas con avatar redondo a la izquierda y un panel a la derecha, sobre fondo azul verdoso: se leía como WhatsApp Web. Ahora la lista es una tabla a pantalla completa, la ficha es su propia página, los avatares son cuadrados con degradados de color por empresa y la paleta es azul marino con acentos de latón.
- **Panel con números que sirven.** El inicio tiene la riqueza visual de un dashboard (barra lateral de color, tarjetas, gráficos), pero cada número sale de los datos y lleva a una acción: los pendientes, la actividad real por semana y la cartera por estado (cada estado abre la lista filtrada).
- **El próximo paso como dato central.** Un CRM sirve para no olvidar a nadie: el inicio responde primero "¿qué hago hoy?". El próximo paso se guarda como un día local (`AAAA-MM-DD`), no como fecha y hora, para que "hoy" no cambie con la zona horaria.
- **Estado global con Context, sin librerías extra.** `ContactsProvider` carga los datos una vez y expone las acciones (crear, editar, eliminar, cambiar estado, agregar y eliminar notas). La API se inyecta, así las pruebas usan una versión en memoria sin latencia.
- **El "último contacto" se calcula, no se guarda.** Sale de la nota más reciente (o de la fecha de creación), así nunca queda desactualizado. La regla de seguimiento (más de 21 días) vive en `lib/crm.ts` y tiene sus propias pruebas.
- **Validación como función pura** (`lib/validation.ts`), independiente del formulario, para probarla aparte y reutilizarla al editar.
- **Accesibilidad:** etiquetas en todos los campos, errores conectados con `aria-describedby` y `aria-invalid`, regiones `aria-live` para resultados de búsqueda y notificaciones, enlace "Saltar al contenido", foco visible, diálogo nativo `<dialog>` (atrapa el foco y se cierra con `Esc`) y `prefers-reduced-motion` respetado. Los colores cumplen contraste AA en modo claro y oscuro.
- **Diseño:** paleta náutica (azul abismo, azul real y latón), Bricolage Grotesque para títulos, Instrument Sans para el texto y JetBrains Mono para correos, teléfonos y fechas. Las fuentes van empaquetadas con `@fontsource`, sin depender de CDNs.

## Publicar (opcional)

El build usa rutas relativas (`base: './'`), así que funciona en GitHub Pages, Netlify o Vercel sin configuración extra:

```bash
npm run build
npx gh-pages -d dist   # GitHub Pages, rama gh-pages
```

## Uso de IA

Este proyecto se construyó con ayuda de IA, como ejercicio de práctica: primero con el agente de Cursor y después con Claude Code para una revisión de diseño y experiencia de uso.

- **Qué hizo la IA:** propuso la estructura del proyecto, escribió la mayor parte del código, los estilos y las pruebas, y revisó la interfaz en el navegador (escritorio, tableta, celular y modo oscuro). En la revisión de diseño cambió la lista a tabla, separó la ficha en dos columnas, agregó el próximo paso, el panel de inicio con gráficos y "Deshacer", y movió los filtros a la URL.
- **Qué se revisó a mano:** el flujo de cada funcionalidad, los mensajes de error, el contraste y la navegación con teclado.
- **Errores encontrados en la revisión y corregidos:** el encabezado de la lista se desbordaba en escritorio y escondía "Resumen" y el orden (un SVG decorativo ensanchaba la columna del grid); "Limpiar búsqueda" no limpiaba el filtro porque dos cambios seguidos de la URL se pisaban; la tabla se desbordaba entre 900 y 1000 px de ancho; el diálogo de eliminar seguía abierto al pasar a otro contacto (se resolvió reiniciando el estado del detalle con `key`); `Esc` no siempre cerraba el diálogo; el campo de teléfono se estiraba cuando el de correo mostraba un error; dos botones tenían el mismo nombre accesible ("Limpiar búsqueda"); y el aviso al guardar un correo decía "Correo registrada".
- **Criterio propio:** cada decisión de la sección anterior se puede explicar y cambiar; si algo no se entiende, la regla es no dejarlo en el código.
