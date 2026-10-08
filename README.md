# Cachalot · Contactos

Interfaz web para manejar los contactos de clientes de un CRM: buscarlos, ver su información, registrar notas de seguimiento y crear, editar o eliminar contactos.

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
- **Volver a los datos de ejemplo:** borra la clave `cachalot.contactos.v1` de `localStorage` (DevTools → Application) y recarga.

## Funcionalidades

- **Lista de contactos** con nombre, correo, teléfono y empresa, ordenada y agrupada por inicial.
- **Búsqueda por nombre o empresa** que ignora tildes y mayúsculas ("logistica" encuentra "Andina Logística") y resalta la coincidencia. Atajo: tecla `/` para ir al buscador, `Esc` para limpiarlo.
- **Detalle del contacto** con enlaces directos para escribir (`mailto:`) o llamar (`tel:`).
- **Notas de seguimiento**: se agregan desde el detalle (también con `Ctrl + Enter`) y se muestran como una línea de tiempo, de la más reciente a la más antigua.
- **Formulario de creación** con validación: nombre obligatorio, correo obligatorio con formato válido y sin repetir, teléfono opcional con formato. Cada error aparece junto a su campo y el foco salta al primero que haya que corregir.
- **Estados** de carga (esqueletos), lista vacía, sin resultados, error con reintento y contacto inexistente.
- **Extras:** editar y eliminar contactos (con confirmación), modo oscuro que recuerda tu preferencia, pruebas de componentes y CI en GitHub Actions.

## Estructura

```
src/
  api/contactsApi.ts       API simulada (localStorage, latencia, modos de simulación)
  data/contacts.json       Contactos de ejemplo
  state/                   Contexto de contactos y notificaciones (toasts)
  components/              Lista, notas, formulario, diálogo, avatar, iconos…
  pages/                   Vistas por ruta: bienvenida, detalle, nuevo, editar, 404
  lib/                     Lógica pura: búsqueda, validación, fechas, tema
  styles/                  Tokens de diseño y estilos base
```

Rutas (con `HashRouter`, para que funcione en cualquier hosting estático):

- `#/` lista (en escritorio, con un panel de bienvenida a la derecha)
- `#/contactos/nuevo` crear contacto
- `#/contactos/:id` detalle y notas
- `#/contactos/:id/editar` editar contacto

## Decisiones

- **Lista y detalle lado a lado en escritorio, una vista a la vez en celular.** El layout es el mismo componente; CSS decide qué mostrar según la ruta.
- **Estado global con Context, sin librerías extra.** `ContactsProvider` carga los datos una vez y expone las acciones (crear, editar, eliminar, agregar nota). La API se inyecta, así las pruebas usan una versión en memoria sin latencia.
- **Validación como función pura** (`lib/validation.ts`), independiente del formulario, para probarla aparte y reutilizarla al editar.
- **Accesibilidad:** etiquetas en todos los campos, errores conectados con `aria-describedby` y `aria-invalid`, regiones `aria-live` para resultados de búsqueda y notificaciones, enlace "Saltar al contenido", foco visible, diálogo nativo `<dialog>` (atrapa el foco y se cierra con `Esc`) y `prefers-reduced-motion` respetado. Los colores cumplen contraste AA en modo claro y oscuro.
- **Diseño:** paleta náutica (azul abismo, marfil y verde azulado), Bricolage Grotesque para títulos, Instrument Sans para el texto y JetBrains Mono para correos, teléfonos y fechas. Las fuentes van empaquetadas con `@fontsource`, sin depender de CDNs.

## Publicar (opcional)

El build usa rutas relativas (`base: './'`), así que funciona en GitHub Pages, Netlify o Vercel sin configuración extra:

```bash
npm run build
npx gh-pages -d dist   # GitHub Pages, rama gh-pages
```

## Uso de IA

Este proyecto se construyó con ayuda del agente de Cursor (modelo Claude), como ejercicio de práctica.

- **Qué hizo la IA:** propuso la estructura del proyecto, escribió la mayor parte del código, los estilos y las pruebas, y revisó la interfaz en el navegador (escritorio, celular y modo oscuro).
- **Qué se revisó a mano:** el flujo de cada funcionalidad, los mensajes de error, el contraste y la navegación con teclado.
- **Errores encontrados en la revisión y corregidos:** el diálogo de eliminar seguía abierto al pasar a otro contacto (se resolvió reiniciando el estado del detalle con `key`); `Esc` no siempre cerraba el diálogo; el campo de teléfono se estiraba cuando el de correo mostraba un error; y dos botones tenían el mismo nombre accesible ("Limpiar búsqueda").
- **Criterio propio:** cada decisión de la sección anterior se puede explicar y cambiar; si algo no se entiende, la regla es no dejarlo en el código.
