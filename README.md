# AniPack 🎴
### La experiencia gacha definitiva de personajes animados

Landing page interactiva con sistema de gestión de colección de personajes animados, inspirada en el bot Mudae de Discord y las aperturas de sobres Pokémon.

---

## 🚀 Demo

Abre `index.html` directamente en tu navegador — no requiere servidor.

---

## 📋 Descripción del proyecto

AniPack permite a los usuarios gestionar una colección de personajes animados mediante un formulario interactivo. Los personajes se almacenan en un arreglo de objetos en memoria, se muestran en cards dinámicas renderizadas con JavaScript puro, y pueden filtrarse por rareza o eliminarse de la colección.

---

## ✨ Funcionalidades principales

- **Hero section** con cartas flotantes animadas y estadísticas
- **Sobre interactivo** que se abre con CSS puro revelando 5 cartas
- **Sección de gestión** con formulario completo (CRUD de personajes)
  - Validación en tiempo real con expresiones regulares
  - Sanitización de inputs (prevención XSS)
  - Asignación de rareza automática (sistema gacha) o manual
  - Carga de imagen con drag & drop y análisis de arte animado
  - Filtros por rareza con pills interactivos
  - Contador dinámico de personajes por rareza
- **Simulador gacha** para revelar cartas al azar
- **Galería de colección** con 6 personajes iniciales
- **Sistema de 6 niveles de rareza** (Común → Mítico)
- **Testimonios** y **CTA** con formulario de registro
- **Diseño responsivo** para móvil y escritorio

---

## 🛠️ Tecnologías utilizadas

| Tecnología | Uso |
|---|---|
| HTML5 semántico | Estructura, roles ARIA, accesibilidad |
| CSS3 | Flexbox, variables CSS, animaciones, media queries |
| JavaScript ES6+ | Lógica CRUD, validación, DOM, módulo IIFE |
| Google Fonts | Bangers (display) + Nunito (cuerpo) |
| Git + GitHub | Control de versiones |

---

## 📁 Estructura del proyecto

```
ProjectAnnPack/
├── index.html        ← Estructura semántica y secciones
├── styles.css        ← Estilos CSS3 con variables y animaciones
├── app.js            ← Módulo principal CRUD, validación, DOM
├── script.js         ← Animaciones, parallax, gacha simulator
├── README.md         ← Documentación del proyecto
├── USO_IA.md         ← Evidencia del uso de IA
└── img/
    ├── goku.png
    ├── naruto.png
    ├── tanjiro.png
    ├── luffy.png
    ├── eren.png
    ├── itachi.png
    └── sailor moon.png
```

---

## 🧩 Arquitectura JavaScript

El módulo principal (`app.js`) usa el patrón **Revealing Module Pattern (IIFE)**:

```
AniPackApp (IIFE)
├── CONSTANTES        → RAREZAS, REGEX, PROBABILIDADES_RAREZA
├── ESTADO PRIVADO    → personajes[], nextId, filtroActual
├── SEGURIDAD         → sanitizar(), limpiarEspacios()
├── VALIDACIÓN        → validarEntrada() con regex avanzados
├── GACHA             → generarRarezaAutomatica() ponderado
├── ANÁLISIS IMAGEN   → analizarImagen() con Canvas API
├── CRUD              → agregarPersonaje(), eliminarPersonaje()
├── DOM               → renderizarLista(), crearCardPersonaje()
├── UI                → mostrarErrores(), mostrarNotificacion()
└── API PÚBLICA       → init, agregarPersonaje, filtrarPorRareza...
```

---

## 🔒 Seguridad implementada

- **Prevención XSS**: función `sanitizar()` escapa 7 caracteres HTML peligrosos (`& < > " ' \` /`)
- **Sin innerHTML peligroso**: todo el DOM se construye con `createElement` + `textContent`
- **Validación dual**: en tiempo real (evento `input`) + al enviar el formulario
- **Sanitización antes de almacenar**: los datos se limpian antes de entrar al arreglo
- **Validación de archivos**: tipo MIME y tamaño máximo (2MB) para imágenes

---

## 🎲 Sistema de rareza gacha

Las probabilidades de rareza están ponderadas y son consistentes en toda la app:

| Rareza | Probabilidad |
|---|---|
| ◯ Común | 45% |
| ◐ Infrecuente | 28% |
| ● Raro | 15% |
| ◆ Épico | 8% |
| ★ Legendario | 3.5% |
| ⬡ Mítico | 0.5% |

---

## 🤖 Uso de Inteligencia Artificial

Este proyecto fue desarrollado con asistencia de **Claude (Anthropic)**. Ver `USO_IA.md` para el detalle completo de prompts utilizados y mejoras aplicadas.

Áreas donde se usó IA:
- Arquitectura del módulo IIFE y funciones reutilizables
- Expresiones regulares para validación (nombres con tildes, email RFC)
- Algoritmo de análisis de imagen con Canvas API
- Sanitización y prevención de vulnerabilidades XSS
- Estructura HTML semántica con roles ARIA

---

## 👨‍💻 Autores

**Adrieel Rubilar** — Ingeniería Informática, INACAP Maipú  
Asignatura: Fundamentos HTML5, CSS3, IA y Control de Versiones  
Semana 12 — Evaluación Sumativa 2

---

## 📄 Licencia

MIT — Ver archivo `LICENSE` para más detalles.
