# Visual Web Studio - Editor de Interfaces

Un editor visual de interfaces web moderno con soporte para drag & drop estilo Figma, editor de código en tiempo real, y terminal integrado.

## 🚀 Características

### Pantalla de Bienvenida
- **Nombre del Proyecto**: Define el nombre de tu proyecto
- **Carpeta de Destino**: Selecciona dónde crear el proyecto
- **Administrador de Paquetes**: Elige entre Bun, npm, pnpm o Yarn
- **Modo de Desarrollo**: Visual (Figma-like) o Código

### Tipos de Proyecto
- **HTML Básico**: Solo HTML, CSS y JavaScript puro
- **Starter Pack**: Bootstrap 5, Font Awesome, Google Fonts, AOS Animations
- **Tailwind CSS**: Tailwind CSS, Alpine.js, Heroicons
- **Pro Stack**: Bootstrap + Tailwind, GSAP, Chart.js, SweetAlert2
- **Personalizado**: Selecciona exactamente los frameworks que necesitas

### Frameworks Disponibles
- **JS Frameworks**: React, Vue.js, Angular, Svelte, Preact, SolidJS, Qwik, Lit, Stencil, Ember.js, Backbone.js, Mithril.js
- **Meta-Frameworks**: Next.js, Nuxt, Astro, Remix, SvelteKit, Gatsby, Eleventy, Hugo, Vite, Parcel, Webpack, Rollup
- **CSS Frameworks**: Bootstrap, Tailwind CSS, Bulma, Foundation, Materialize, Semantic UI
- **Iconos**: Font Awesome, Lucide, Heroicons, Feather Icons, Bootstrap Icons
- **Animaciones**: GSAP, AOS, Anime.js, Motion One, Lottie
- **UI Components**: Swiper, SweetAlert2, Tippy.js, GLightbox
- **Charts**: Chart.js, ApexCharts, D3.js

### Modo Visual (Figma-like)
- **Panel de Componentes**: Arrastra y suelta elementos al canvas
  - Texto: Títulos, Párrafos, Enlaces
  - Contenedores: Div, Sección, Container, Row, Grid
  - Interactivos: Botones, Inputs, Textarea, Select, Checkbox
  - Media: Imágenes, Videos, Iconos
  - Layout: Navbar, Hero Section, Cards, Footer
- **Canvas Visual**: Artboard con cuadrícula estilo Figma
- **Panel de Propiedades**: Edita tamaño, posición, colores, tipografía, bordes
- **Barra de Herramientas**: Seleccionar, Mover, Texto, Zoom

### Modo Código
- **Explorador de Archivos**: Navega por la estructura del proyecto
- **Editor de Código**: Edita HTML, CSS y JavaScript
- **Vista Previa en Tiempo Real**: Ve los cambios al instante
- **Responsive Preview**: Desktop, Tablet, Mobile

### Terminal Integrado
- **Ejecutar comandos**: Escribe cualquier comando
- **Run Dev**: Inicia el servidor de desarrollo con el PM seleccionado
- **Install**: Instala dependencias automáticamente
- **Soporte para**: Bun, npm, pnpm, Yarn

### Sistema de Compatibilidad de Frameworks
- **Dependencias automáticas**: Next.js agrega React automáticamente
- **Detección de conflictos**: React, Vue, Angular, Svelte son mutuamente excluyentes
- **Protección de dependencias**: No puedes desactivar React si tienes Next.js

## 🛠️ Instalación

### Requisitos
- [Node.js](https://nodejs.org/) (v18+) o [Bun](https://bun.sh/)
- [Rust](https://www.rust-lang.org/tools/install)
- [Tauri CLI](https://tauri.app/v1/guides/getting-started/prerequisites)

### Pasos

```bash
# Clonar el repositorio
git clone <repo-url>
cd visual-editor

# Instalar dependencias
bun install
# o
npm install

# Ejecutar en modo desarrollo
bun run dev
# o
npm run dev
```

## 📁 Estructura del Proyecto

```
visual-editor/
├── src/
│   ├── index.html      # UI principal
│   ├── styles.css      # Estilos
│   └── main.js         # Lógica JavaScript
├── src-tauri/
│   ├── src/
│   │   └── lib.rs      # Backend Rust
│   ├── Cargo.toml      # Dependencias Rust
│   └── tauri.conf.json # Configuración Tauri
└── package.json
```

## 🎯 Uso

1. **Crear Proyecto**:
   - Escribe el nombre del proyecto
   - Selecciona la carpeta de destino
   - Elige el administrador de paquetes (Bun/npm/pnpm/Yarn)
   - Selecciona el modo de desarrollo (Visual/Código)
   - Elige el tipo de proyecto y frameworks
   - Haz clic en "Crear Proyecto"

2. **Modo Visual**:
   - Arrastra componentes desde el panel izquierdo al canvas
   - Haz clic en un elemento para seleccionarlo
   - Edita sus propiedades en el panel derecho
   - Usa la barra de herramientas para cambiar de herramienta

3. **Modo Código**:
   - Haz clic en archivos del explorador para editarlos
   - Los cambios se reflejan en la vista previa en tiempo real
   - Usa Ctrl+S para guardar

4. **Terminal**:
   - Haz clic en "Terminal" en la barra de estado
   - Usa "Install" para instalar dependencias
   - Usa "Run Dev" para iniciar el servidor de desarrollo

## 🔧 Configuración IDE Recomendada

- [VS Code](https://code.visualstudio.com/)
- [Tauri Extension](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## 📝 Licencia

Este proyecto está licenciado bajo la **GNU General Public License v2.0 (GPLv2)**.

```
Visual Web Studio - Editor de Interfaces
Copyright (C) 2024

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License along
with this program; if not, write to the Free Software Foundation, Inc.,
51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
```

Ver el archivo [LICENSE](LICENSE) para más detalles.

### ¿Por qué GPLv2?

Siguiendo el espíritu del software libre promovido por Linus Torvalds con Linux:

- **Libertad de usar** el software para cualquier propósito
- **Libertad de estudiar** cómo funciona el programa y modificarlo
- **Libertad de redistribuir** copias para ayudar a otros
- **Libertad de mejorar** el programa y publicar las mejoras

> "Software is like sex: it's better when it's free." - Linus Torvalds

## 🤝 Contribuir

Las contribuciones son bienvenidas bajo los términos de la GPLv2.

### Cómo contribuir:
1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Código de Conducta
- Sé respetuoso con otros contribuidores
- Escribe código limpio y documentado
- Sigue las convenciones del proyecto
- Reporta bugs con información detallada

## 🙏 Agradecimientos

- [Tauri](https://tauri.app/) - Framework para aplicaciones de escritorio
- [Rust](https://www.rust-lang.org/) - Lenguaje de programación del backend
- La comunidad de software libre
