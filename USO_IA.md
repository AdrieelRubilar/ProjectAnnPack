# Uso de Inteligencia Artificial — AniPack 🤖

## Herramienta utilizada
**Claude (Anthropic)** — Asistente de programación  
Modelo: Claude Sonnet | Interfaz: claude.ai

---

## Resumen ejecutivo

Se utilizó IA de forma estratégica en 6 áreas clave del proyecto, documentando los prompts utilizados y las mejoras concretas aplicadas al código. La IA fue usada como asistente técnico — todo el código fue revisado, adaptado e integrado manualmente.

---

## 1. Arquitectura del módulo JavaScript

**Prompt utilizado:**
> "Necesito organizar el código JavaScript de mi app de colección de personajes anime. Quiero que use funciones reutilizables, que tenga variables privadas y que no contamine el scope global. ¿Qué patrón me recomiendas y cómo lo implemento?"

**Mejora aplicada:**  
La IA sugirió el patrón **Revealing Module Pattern (IIFE)** en lugar de escribir funciones sueltas. Se implementó `const AniPackApp = (() => { ... })()` que encapsula todo el estado privado (`personajes[]`, `nextId`, `filtroActual`) y expone solo la API pública necesaria.

**Código antes (sin IA):**
```javascript
// Variables globales — vulnerable a colisiones
var personajes = [];
var nextId = 1;

function agregarPersonaje(datos) { ... }
function eliminarPersonaje(id) { ... }
```

**Código después (con IA):**
```javascript
const AniPackApp = (() => {
  'use strict';
  let personajes = [];  // privado, inaccesible desde afuera
  let nextId = 1;

  function agregarPersonaje(datos) { ... }  // privada
  function eliminarPersonaje(id) { ... }    // privada

  return { agregarPersonaje, eliminarPersonaje }; // solo lo necesario
})();
```

---

## 2. Expresiones regulares para validación

**Prompt utilizado:**
> "Necesito validar los siguientes campos con regex en JavaScript: (1) nombre de personaje que permita letras en español con tildes y ñ, números, espacios, puntos y guiones entre 2 y 50 caracteres; (2) nombre de serie similar pero hasta 80 caracteres; (3) email con formato estándar. Muéstrame los regex y explica cada parte."

**Mejora aplicada:**  
Los regex generados cubren caracteres especiales del español que son comunes en nombres de anime:

```javascript
const REGEX = {
  // [a-záéíóúñüA-ZÁÉÍÓÚÑÜ] cubre letras españolas con tildes
  // [\s.\-'] cubre espacios, puntos, guiones y apostrofes
  // {2,50} longitud mínima y máxima
  nombre: /^[a-záéíóúñüA-ZÁÉÍÓÚÑÜ0-9\s.\-']{2,50}$/,
  serie:  /^[a-záéíóúñüA-ZÁÉÍÓÚÑÜ0-9\s.\-':!]{2,80}$/,
  // Patrón simplificado RFC 5322 que cubre 99% de emails reales
  email:  /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/
};
```

Sin la IA, se habría usado `/^[a-zA-Z0-9]+$/` que rechazaría nombres válidos como "Tanjiro K.", "Itachi Uchiha" o "Son Goku SSB".

---

## 3. Sanitización y prevención XSS

**Prompt utilizado:**
> "¿Cómo prevengo ataques XSS en una app JavaScript que inserta datos del usuario en el DOM? El usuario ingresa nombre, serie y email. ¿Cuáles son los caracteres peligrosos y cómo los escapo? Dame una función sanitizadora."

**Mejora aplicada:**  
La IA identificó 7 caracteres peligrosos y recomendó usar `textContent` en lugar de `innerHTML`:

```javascript
// Función generada con asistencia de IA
function sanitizar(str) {
  if (typeof str !== 'string') return '';
  const mapa = {
    '&': '&amp;',   // & debe escaparse primero
    '<': '&lt;',    // evita apertura de tags
    '>': '&gt;',    // evita cierre de tags
    '"': '&quot;',  // evita romper atributos
    "'": '&#x27;',  // evita romper atributos con comilla simple
    '`': '&#x60;',  // evita template injection
    '/': '&#x2F;'   // evita cierre prematuro de tags
  };
  return str.replace(/[&<>"'`/]/g, (char) => mapa[char]);
}
```

Además, la IA señaló que había código con `innerHTML` en el simulador gacha que era vulnerable, y se refactorizó a `createElement + textContent`.

---

## 4. Algoritmo de análisis de imagen con Canvas API

**Prompt utilizado:**
> "Quiero detectar si una imagen subida por el usuario es un personaje de anime o cartoon (ilustración) vs una fotografía real, usando solo JavaScript y Canvas API sin librerías externas. ¿Qué características visuales diferencian el arte animado de las fotos y cómo las mido en píxeles?"

**Mejora aplicada:**  
La IA explicó 5 métricas heurísticas aplicables con Canvas:

1. **Saturación** — el anime usa colores más saturados que fotos naturales
2. **Regiones planas** — cel-shading produce áreas de color uniforme
3. **Bordes definidos** — los outlines del anime crean saltos abruptos de color
4. **Bajo ruido** — las ilustraciones son más limpias que fotos
5. **Transparencia** — los PNGs de personajes suelen tener fondo transparente

```javascript
// Sistema de puntuación (0-100) — aprobación con score >= 30
// Saturación: hasta 25pts
if (avgSat > 0.15) score += 10;
if (avgSat > 0.25) score += 5;
// Regiones planas: hasta 30pts
if (flatRatio > 0.40) score += 10;
if (flatRatio > 0.55) score += 10;
if (flatRatio > 0.70) score += 10;
// Bordes nítidos: hasta 20pts
if (edgeRatio > 0.02) score += 10;
if (edgeRatio > 0.05) score += 10;
```

Esta funcionalidad no habría sido posible sin la guía de la IA sobre qué métricas usar.

---

## 5. Manipulación segura del DOM

**Prompt utilizado:**
> "Dame una función JavaScript para crear una card HTML completa de un personaje usando solo createElement y textContent, sin usar innerHTML. La card debe tener: imagen, badge de rareza con color dinámico, nombre, serie, email y botón de eliminar con evento click."

**Mejora aplicada:**  
La función `crearCardPersonaje()` construye ~20 elementos DOM de forma completamente segura:

```javascript
// Nunca se usa innerHTML — todo con createElement + textContent
function crearCardPersonaje(personaje, index) {
  const card = document.createElement('article');
  card.className = `personaje-card personaje-rarity-${personaje.rareza}`;
  
  const nombre = document.createElement('strong');
  nombre.textContent = personaje.nombre; // textContent es seguro por definición
  
  // El color dinámico va en style, no en innerHTML
  badge.style.color = rareza.color;
  badge.style.backgroundColor = `${rareza.color}22`;
  
  // Evento con closure para el ID correcto
  deleteBtn.addEventListener('click', () => eliminarPersonaje(personaje.id));
  ...
}
```

---

## 6. Refactorización del gacha simulator

**Prompt utilizado:**
> "Tengo este código en script.js que usa innerHTML para mostrar historial de cartas gacha. ¿Cómo lo refactorizo para que sea seguro contra XSS y use createElement en su lugar?"

**Código original (vulnerable):**
```javascript
// ANTES — vulnerable a XSS si rareza o emoji contienen HTML
historyList.innerHTML += `<li class="history-item">${emoji} ${rarity}</li>`;
```

**Código refactorizado (seguro):**
```javascript
// DESPUÉS — completamente seguro
const li = document.createElement('li');
li.className = 'history-item';
const emojiSpan = document.createElement('span');
emojiSpan.textContent = emoji;  // textContent no parsea HTML
const raritySpan = document.createElement('span');
raritySpan.textContent = rarity;
li.appendChild(emojiSpan);
li.appendChild(raritySpan);
historyList.prepend(li);
```

---

## Resumen de impacto

| Área | Sin IA | Con IA |
|---|---|---|
| Estructura JS | Variables globales sueltas | IIFE con estado privado |
| Validación | `/^[a-zA-Z]+$/` básico | Regex con soporte español completo |
| Seguridad XSS | `innerHTML` directo | `sanitizar()` + `textContent` |
| Análisis imagen | No existía | Canvas API con 5 métricas heurísticas |
| DOM dinámico | Template strings con innerHTML | `createElement` en 100% del código |
| Historial gacha | innerHTML vulnerable | createElement seguro |

---

## Declaración de autoría

Todo el código fue revisado, adaptado, probado e integrado manualmente. La IA fue utilizada como herramienta de apoyo técnico, no como reemplazo del proceso de aprendizaje. Los conceptos aplicados (IIFE, regex, XSS, Canvas API) fueron comprendidos antes de su implementación.

**Adrieel Rubilar — Ingeniería Informática, INACAP Maipú**
