/* ============================================================
   AniPack — app.js  (Módulo de Gestión de Personajes)
   ────────────────────────────────────────────────────
   Arquitectura: Revealing Module Pattern (IIFE)
   Responsabilidades:
     • CRUD de personajes (agregar, eliminar, editar)
     • Validación avanzada con expresiones regulares
     • Sanitización de inputs (prevención XSS)
     • Manipulación segura del DOM (createElement + textContent)
     • Filtrado por rareza y conteo dinámico
   ============================================================ */

const AniPackApp = (() => {
  'use strict';

  /* ─────────────────────────────────────────────
     CONSTANTES Y CONFIGURACIÓN
     ───────────────────────────────────────────── */

  /** Mapa de rarezas con sus metadatos visuales */
  const RAREZAS = {
    common:    { label: '◯ Común',       color: '#a0aec0', icon: '◯', emoji: '⚪' },
    uncommon:  { label: '◐ Infrecuente', color: '#68d391', icon: '◐', emoji: '🟢' },
    rare:      { label: '● Raro',        color: '#63b3ed', icon: '●', emoji: '🔵' },
    epic:      { label: '◆ Épico',       color: '#b794f4', icon: '◆', emoji: '🟣' },
    legendary: { label: '★ Legendario',  color: '#f6ad55', icon: '★', emoji: '🟠' },
    mythic:    { label: '⬡ Mítico',      color: '#00e5c8', icon: '⬡', emoji: '🔷' }
  };

  /** Expresiones regulares para validación */
  const REGEX = {
    nombre: /^[a-záéíóúñüA-ZÁÉÍÓÚÑÜ0-9\s.\-']{2,50}$/,
    serie:  /^[a-záéíóúñüA-ZÁÉÍÓÚÑÜ0-9\s.\-':!]{2,80}$/,
    email:  /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/
  };

  /** Datos iniciales — personajes que ya existen en la landing */
  const DATOS_INICIALES = [
    { id: 1, nombre: 'Son Goku SSB',    serie: 'Dragon Ball Super', rareza: 'legendary', imagen: 'img/goku.png',        email: 'goku@dbz.com' },
    { id: 2, nombre: 'Sailor Moon',      serie: 'Bishoujo Senshi',   rareza: 'mythic',    imagen: 'img/sailor moon.png', email: 'usagi@moon.jp' },
    { id: 3, nombre: 'Tanjiro K.',       serie: 'Demon Slayer',      rareza: 'epic',      imagen: 'img/tanjiro.png',     email: 'tanjiro@ds.com' },
    { id: 4, nombre: 'Naruto U.',        serie: 'Naruto Shippuden',  rareza: 'rare',      imagen: 'img/naruto.png',      email: 'naruto@konoha.jp' },
    { id: 5, nombre: 'Itachi Uchiha',    serie: 'Naruto',            rareza: 'legendary', imagen: 'img/itachi.png',      email: 'itachi@akatsuki.jp' },
    { id: 6, nombre: 'Eren Yeager',      serie: 'Attack on Titan',   rareza: 'mythic',    imagen: 'img/eren.png',        email: 'eren@aot.com' },
    { id: 7, nombre: 'Monkey D. Luffy',  serie: 'One Piece',         rareza: 'rare',      imagen: 'img/luffy.png',       email: 'luffy@op.com' }
  ];

  /* ─────────────────────────────────────────────
     ESTADO PRIVADO
     ───────────────────────────────────────────── */

  let personajes = [];
  let nextId = 8;

  /* ─────────────────────────────────────────────
     LOCALSTORAGE — PERSISTENCIA DE DATOS
     ───────────────────────────────────────────── */

  /** Claves de almacenamiento local */
  const LS_KEY_PERSONAJES = 'anipack_personajes';
  const LS_KEY_NEXTID     = 'anipack_nextid';

  /**
   * Guarda el arreglo de personajes en localStorage.
   * Serializa a JSON. Las imágenes en base64 también se persisten.
   * Asistido por IA: estructura de persistencia sugerida por Claude.
   */
  function guardarEnStorage() {
    try {
      localStorage.setItem(LS_KEY_PERSONAJES, JSON.stringify(personajes));
      localStorage.setItem(LS_KEY_NEXTID, String(nextId));
    } catch (e) {
      // localStorage puede estar deshabilitado (modo privado) o lleno
      console.warn('AniPack: No se pudo guardar en localStorage:', e.message);
    }
  }

  /**
   * Carga personajes desde localStorage.
   * Si no hay datos guardados, usa DATOS_INICIALES.
   * @returns {{ personajes: Array, nextId: number }}
   */
  function cargarDesdeStorage() {
    try {
      const raw = localStorage.getItem(LS_KEY_PERSONAJES);
      const rawId = localStorage.getItem(LS_KEY_NEXTID);
      if (raw) {
        const datos = JSON.parse(raw);
        // Validar que sea un arreglo de objetos válidos
        if (Array.isArray(datos) && datos.every(p => p.id && p.nombre)) {
          return {
            personajes: datos,
            nextId: rawId ? parseInt(rawId, 10) : datos.length + 1
          };
        }
      }
    } catch (e) {
      console.warn('AniPack: No se pudo leer localStorage:', e.message);
    }
    // Fallback: datos iniciales
    return { personajes: null, nextId: 8 };
  }

  /**
   * Limpia todos los datos guardados en localStorage.
   * Se expone en la API pública para permitir reset desde consola.
   */
  function limpiarStorage() {
    try {
      localStorage.removeItem(LS_KEY_PERSONAJES);
      localStorage.removeItem(LS_KEY_NEXTID);
    } catch (e) {
      console.warn('AniPack: No se pudo limpiar localStorage:', e.message);
    }
  }
  let filtroActual = 'all';
  let imagenSeleccionada = '';  // Base64 data URL de la imagen subida
  let rarezaModo = 'auto';     // 'auto' = gacha probability, 'manual' = select
  let imagenValidada = false;  // true si la imagen pasó el análisis

  /** Límite de tamaño de imagen: 2MB */
  const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
  /** Tipos de imagen permitidos */
  const TIPOS_IMAGEN = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

  /**
   * Probabilidades de rareza estilo gacha (suman 100).
   * Basadas en las probabilidades ya definidas en la landing.
   */
  const PROBABILIDADES_RAREZA = [
    { rareza: 'common',    peso: 45   },
    { rareza: 'uncommon',  peso: 28   },
    { rareza: 'rare',      peso: 15   },
    { rareza: 'epic',      peso: 8    },
    { rareza: 'legendary', peso: 3.5  },
    { rareza: 'mythic',    peso: 0.5  }
  ];

  /* ─────────────────────────────────────────────
     UTILIDADES DE SEGURIDAD
     ───────────────────────────────────────────── */

  /**
   * Sanitiza un string para prevenir inyección XSS.
   * Escapa caracteres HTML peligrosos: < > " ' & `
   * @param {string} str - Texto a sanitizar
   * @returns {string} Texto seguro para insertar en el DOM
   */
  function sanitizar(str) {
    if (typeof str !== 'string') return '';
    const mapa = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '`': '&#x60;',
      '/': '&#x2F;'
    };
    return str.replace(/[&<>"'`/]/g, (char) => mapa[char]);
  }

  /**
   * Limpia espacios extra de un string.
   * @param {string} str - Texto a limpiar
   * @returns {string} Texto sin espacios duplicados
   */
  function limpiarEspacios(str) {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/\s+/g, ' ');
  }

  /* ─────────────────────────────────────────────
     VALIDACIÓN
     ───────────────────────────────────────────── */

  /**
   * Valida los datos de entrada de un personaje.
   * Soporta modo auto (sin rareza) y modo manual (rareza requerida).
   * @param {Object} datos - { nombre, serie, email, rareza }
   * @returns {Object} { valido: boolean, errores: { campo: mensaje } }
   */
  function validarEntrada(datos) {
    const errores = {};

    // Nombre: obligatorio, 2-50 caracteres alfanuméricos
    if (!datos.nombre || !datos.nombre.trim()) {
      errores.nombre = 'El nombre del personaje es obligatorio.';
    } else if (!REGEX.nombre.test(datos.nombre.trim())) {
      errores.nombre = 'Nombre inválido. Solo letras, números, espacios, puntos y guiones (2-50 caracteres).';
    }

    // Serie: obligatorio, 2-80 caracteres
    if (!datos.serie || !datos.serie.trim()) {
      errores.serie = 'La serie o anime es obligatorio.';
    } else if (!REGEX.serie.test(datos.serie.trim())) {
      errores.serie = 'Serie inválida. Solo letras, números y puntuación básica (2-80 caracteres).';
    }

    // Email: obligatorio, formato válido
    if (!datos.email || !datos.email.trim()) {
      errores.email = 'El email del coleccionista es obligatorio.';
    } else if (!REGEX.email.test(datos.email.trim())) {
      errores.email = 'Formato de email inválido. Ejemplo: usuario@dominio.com';
    }

    // Rareza: solo requerida en modo manual
    if (rarezaModo === 'manual') {
      if (!datos.rareza) {
        errores.rareza = 'Debes seleccionar una rareza.';
      } else if (!RAREZAS[datos.rareza]) {
        errores.rareza = 'Rareza no válida. Selecciona una del listado.';
      }
    }

    // Imagen: si se subió, debe haber pasado la validación de contenido animado
    if (imagenSeleccionada && !imagenValidada) {
      errores.imagen = 'La imagen no parece ser de un personaje animado. Sube otra imagen.';
    }

    return {
      valido: Object.keys(errores).length === 0,
      errores
    };
  }

  /* ─────────────────────────────────────────────
     ALGORITMO DE RAREZA AUTOMÁTICA (GACHA)
     ───────────────────────────────────────────── */

  /**
   * Asigna una rareza de forma aleatoria ponderada.
   * Usa las probabilidades oficiales del sistema gacha de AniPack:
   *   Común 45% | Infrecuente 28% | Raro 15% | Épico 8% | Legendario 3.5% | Mítico 0.5%
   * @returns {string} Clave de rareza asignada
   */
  function generarRarezaAutomatica() {
    const roll = Math.random() * 100;
    let acumulado = 0;

    for (const { rareza, peso } of PROBABILIDADES_RAREZA) {
      acumulado += peso;
      if (roll < acumulado) return rareza;
    }

    // Fallback (nunca debería llegar aquí)
    return 'common';
  }

  /* ─────────────────────────────────────────────
     ANÁLISIS DE IMAGEN — DETECCIÓN DE ARTE ANIMADO (v2)
     ───────────────────────────────────────────── */

  /**
   * Analiza una imagen usando Canvas para determinar si es arte animado/ilustración.
   * 
   * Evalúa 5 métricas heurísticas optimizadas para distinguir anime/cartoon de fotografías:
   *   1. Saturación — anime usa colores más saturados que fotos naturales
   *   2. Regiones planas — las ilustraciones tienen áreas grandes de color uniforme
   *   3. Bordes definidos — el anime tiene contornos nítidos (líneas de dibujo)
   *   4. Transparencia — bonus para PNGs con fondo transparente (común en character art)
   *   5. Bajo ruido — ilustraciones tienen transiciones más limpias que fotos
   *
   * @param {string} dataUrl - Base64 data URL de la imagen
   * @returns {Promise<{esAnimado: boolean, confianza: number, detalles: Object}>}
   */
  function analizarImagen(dataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.addEventListener('load', () => {
        // Canvas reducido para rendimiento (200px max)
        const canvas = document.createElement('canvas');
        const MAX_DIM = 200;
        const scale = Math.min(MAX_DIM / img.width, MAX_DIM / img.height, 1);
        canvas.width = Math.max(Math.floor(img.width * scale), 10);
        canvas.height = Math.max(Math.floor(img.height * scale), 10);
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        const totalPixels = canvas.width * canvas.height;
        const W = canvas.width;

        // ── Variables de acumulación ──
        let totalSat = 0;
        let anySatCount = 0;    // pixeles con saturación > 0.15
        let transparentPx = 0;
        let flatPairCount = 0;  // pares de píxeles adyacentes con color casi idéntico
        let sharpEdgeCount = 0; // bordes con diferencia luminosa > umbral
        let noiseCount = 0;     // variaciones mínimas (ruido de foto)
        let opaqueCount = 0;
        let totalComparisons = 0;

        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < W; x++) {
            const i = (y * W + x) * 4;
            const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2], a = pixels[i + 3];

            // Transparencia
            if (a < 128) { transparentPx++; continue; }
            opaqueCount++;

            // Saturación HSL
            const rn = r / 255, gn = g / 255, bn = b / 255;
            const cMax = Math.max(rn, gn, bn), cMin = Math.min(rn, gn, bn);
            const delta = cMax - cMin;
            const l = (cMax + cMin) / 2;
            let s = 0;
            if (delta > 0.001) {
              s = l > 0.5 ? delta / (2 - cMax - cMin) : delta / (cMax + cMin);
            }
            totalSat += s;
            if (s > 0.15) anySatCount++;

            // Comparar con píxel de la derecha para regiones planas y bordes
            if (x < W - 1) {
              const j = i + 4;
              if (pixels[j + 3] >= 128) {
                const dr = Math.abs(r - pixels[j]);
                const dg = Math.abs(g - pixels[j + 1]);
                const db = Math.abs(b - pixels[j + 2]);
                const diff = dr + dg + db;
                totalComparisons++;

                if (diff < 15) flatPairCount++;       // color casi igual → región plana
                if (diff > 80) sharpEdgeCount++;       // salto grande → borde definido
                if (diff > 2 && diff < 12) noiseCount++; // ruido sutil típico de fotos
              }
            }

            // Comparar con píxel de abajo
            if (y < canvas.height - 1) {
              const j = ((y + 1) * W + x) * 4;
              if (pixels[j + 3] >= 128) {
                const dr = Math.abs(r - pixels[j]);
                const dg = Math.abs(g - pixels[j + 1]);
                const db = Math.abs(b - pixels[j + 2]);
                const diff = dr + dg + db;
                totalComparisons++;

                if (diff < 15) flatPairCount++;
                if (diff > 80) sharpEdgeCount++;
                if (diff > 2 && diff < 12) noiseCount++;
              }
            }
          }
        }

        // ── Calcular ratios ──
        const avgSat = opaqueCount > 0 ? totalSat / opaqueCount : 0;
        const satRatio = opaqueCount > 0 ? anySatCount / opaqueCount : 0;
        const transparencyRatio = totalPixels > 0 ? transparentPx / totalPixels : 0;
        const flatRatio = totalComparisons > 0 ? flatPairCount / totalComparisons : 0;
        const edgeRatio = totalComparisons > 0 ? sharpEdgeCount / totalComparisons : 0;
        const noiseRatio = totalComparisons > 0 ? noiseCount / totalComparisons : 0;

        // ── Evaluación: Sistema de puntos (máx 100) ──
        let score = 0;
        const detalles = {};

        // 1. Saturación (máx 25pts)
        //    Anime/cartoon tiende a tener colores más saturados que fotos naturales
        detalles.saturacion = +(avgSat * 100).toFixed(1);
        detalles.pixelesSaturados = +(satRatio * 100).toFixed(1);
        if (avgSat > 0.15) score += 10;       // saturación moderada
        if (avgSat > 0.25) score += 5;        // saturación alta
        if (satRatio > 0.25) score += 10;     // muchos píxeles con color

        // 2. Regiones planas (máx 30pts)
        //    Ilustraciones tienen grandes áreas de color uniforme (cel-shading, flat color)
        //    Fotos tienen gradientes suaves continuos
        detalles.regionesPlanas = +(flatRatio * 100).toFixed(1);
        if (flatRatio > 0.40) score += 10;    // algo de color plano
        if (flatRatio > 0.55) score += 10;    // bastante plano → ilustración
        if (flatRatio > 0.70) score += 10;    // muy plano → definitivamente ilustración

        // 3. Bordes definidos (máx 20pts)
        //    Anime tiene contornos nítidos (outlines), fotos tienen transiciones suaves
        detalles.bordesNitidos = +(edgeRatio * 100).toFixed(1);
        if (edgeRatio > 0.02) score += 10;    // tiene algunos bordes definidos
        if (edgeRatio > 0.05) score += 10;    // muchos bordes → estilo dibujo

        // 4. Bajo ruido (máx 15pts)
        //    Las fotos tienen mucho "ruido" (variaciones minúsculas entre píxeles)
        //    Las ilustraciones son más limpias
        detalles.ruido = +(noiseRatio * 100).toFixed(1);
        if (noiseRatio < 0.35) score += 8;    // poco ruido
        if (noiseRatio < 0.20) score += 7;    // muy poco ruido → limpio como ilustración

        // 5. Transparencia — bonus (máx 10pts)
        //    Muchas imágenes de personajes animados vienen en PNG con fondo transparente
        detalles.transparencia = +(transparencyRatio * 100).toFixed(1);
        if (transparencyRatio > 0.03) score += 5;
        if (transparencyRatio > 0.15) score += 5;

        detalles.score = score;

        // Umbral de aprobación: 30/100 (permisivo pero filtra fotos reales)
        const esAnimado = score >= 30;
        const confianza = Math.min(score, 100);

        resolve({ esAnimado, confianza, detalles });
      });

      img.addEventListener('error', () => {
        resolve({ esAnimado: false, confianza: 0, detalles: { error: 'No se pudo cargar' } });
      });

      img.src = dataUrl;
    });
  }

  /**
   * Muestra el resultado del análisis de imagen en la UI.
   * @param {Object} resultado - { esAnimado, confianza, detalles }
   */
  function mostrarResultadoAnalisis(resultado) {
    const container = document.getElementById('image-analysis');
    const iconEl = document.getElementById('image-analysis-icon');
    const textEl = document.getElementById('image-analysis-text');
    if (!container) return;

    container.style.display = 'flex';

    if (resultado.esAnimado) {
      imagenValidada = true;
      iconEl.textContent = '✅';
      textEl.textContent = `Personaje animado detectado (confianza: ${resultado.confianza}%)`;
      container.className = 'image-analysis analysis-pass';
    } else {
      imagenValidada = false;
      iconEl.textContent = '⚠️';
      textEl.textContent = `No parece un personaje animado (score: ${resultado.confianza}%). Intenta con otra imagen.`;
      container.className = 'image-analysis analysis-fail';
    }
  }

  /* ─────────────────────────────────────────────
     CRUD — OPERACIONES DE DATOS
     ───────────────────────────────────────────── */

  /**
   * Agrega un nuevo personaje al arreglo.
   * Valida, sanitiza, asigna ID y renderiza.
   * @param {Object} datos - Datos del formulario
   * @returns {Object} { exito: boolean, mensaje: string, personaje?: Object }
   */
  function agregarPersonaje(datos) {
    // Validar
    const validacion = validarEntrada(datos);
    if (!validacion.valido) {
      mostrarErrores(validacion.errores);
      return { exito: false, mensaje: 'Errores de validación', errores: validacion.errores };
    }

    // Determinar rareza (auto o manual)
    const rarezaFinal = rarezaModo === 'auto'
      ? generarRarezaAutomatica()
      : datos.rareza;

    // Sanitizar cada campo antes de almacenar
    const nuevoPersonaje = {
      id: nextId++,
      nombre: sanitizar(limpiarEspacios(datos.nombre)),
      serie: sanitizar(limpiarEspacios(datos.serie)),
      email: sanitizar(datos.email.trim().toLowerCase()),
      rareza: rarezaFinal,
      imagen: imagenSeleccionada || '',
      fechaCreacion: Date.now()
    };

    personajes.push(nuevoPersonaje);
    guardarEnStorage(); // Persistir en localStorage
    renderizarLista();
    actualizarContador();
    limpiarFormulario();

    // Notificación con revelación de rareza en modo auto
    const rarezaMeta = RAREZAS[rarezaFinal];
    const msgRareza = rarezaModo === 'auto'
      ? `¡${nuevoPersonaje.nombre} es ${rarezaMeta.label}!`
      : `¡${nuevoPersonaje.nombre} añadido a la colección!`;
    mostrarNotificacion(msgRareza, rarezaFinal);

    return { exito: true, mensaje: 'Personaje agregado', personaje: nuevoPersonaje };
  }

  /**
   * Elimina un personaje del arreglo por su ID.
   * Ejecuta animación de salida antes de remover.
   * @param {number} id - ID del personaje a eliminar
   */
  function eliminarPersonaje(id) {
    const index = personajes.findIndex(p => p.id === id);
    if (index === -1) return;

    const card = document.querySelector(`[data-personaje-id="${id}"]`);
    if (card) {
      card.classList.add('personaje-card-exit');
      card.addEventListener('animationend', () => {
        personajes.splice(index, 1);
        guardarEnStorage(); // Persistir cambio en localStorage
        renderizarLista();
        actualizarContador();
      }, { once: true });
    } else {
      personajes.splice(index, 1);
      guardarEnStorage(); // Persistir cambio en localStorage
      renderizarLista();
      actualizarContador();
    }
  }

  /**
   * Obtiene los personajes filtrados según el filtro actual.
   * @param {string} filtro - Clave de rareza o 'all'
   * @returns {Array} Personajes filtrados
   */
  function obtenerPersonajes(filtro) {
    if (!filtro || filtro === 'all') return [...personajes];
    return personajes.filter(p => p.rareza === filtro);
  }

  /* ─────────────────────────────────────────────
     MANIPULACIÓN DEL DOM — RENDERIZADO SEGURO
     ───────────────────────────────────────────── */

  /**
   * Renderiza la lista de personajes en el DOM.
   * Usa exclusivamente createElement y textContent (NO innerHTML).
   * Aplica filtro actual si existe.
   */
  function renderizarLista() {
    const contenedor = document.getElementById('personajes-grid');
    if (!contenedor) return;

    // Limpiar contenedor de forma segura
    while (contenedor.firstChild) {
      contenedor.removeChild(contenedor.firstChild);
    }

    const lista = obtenerPersonajes(filtroActual);

    if (lista.length === 0) {
      const vacio = document.createElement('p');
      vacio.className = 'personajes-empty';
      vacio.textContent = filtroActual === 'all'
        ? 'No hay personajes en la colección. ¡Agrega el primero!'
        : `No hay personajes con rareza "${RAREZAS[filtroActual]?.label || filtroActual}".`;
      contenedor.appendChild(vacio);
      return;
    }

    lista.forEach((personaje, i) => {
      const card = crearCardPersonaje(personaje, i);
      contenedor.appendChild(card);
    });
  }

  /**
   * Crea un elemento DOM de carta para un personaje.
   * Toda la construcción es con createElement/textContent.
   * @param {Object} personaje - Datos del personaje
   * @param {number} index - Índice para stagger de animación
   * @returns {HTMLElement} Elemento article listo para insertar
   */
  function crearCardPersonaje(personaje, index) {
    const rareza = RAREZAS[personaje.rareza] || RAREZAS.common;

    // Card container
    const card = document.createElement('article');
    card.className = `personaje-card personaje-rarity-${personaje.rareza}`;
    card.dataset.personajeId = personaje.id;
    card.style.animationDelay = `${index * 0.08}s`;

    // Card top (imagen o placeholder)
    const top = document.createElement('div');
    top.className = 'personaje-card-top';

    // Badge de rareza
    const badge = document.createElement('span');
    badge.className = `personaje-badge`;
    badge.style.color = rareza.color;
    badge.style.backgroundColor = `${rareza.color}22`;
    badge.style.border = `1px solid ${rareza.color}55`;
    badge.textContent = rareza.label;
    top.appendChild(badge);

    // Imagen o emoji placeholder
    if (personaje.imagen) {
      const img = document.createElement('img');
      img.src = personaje.imagen;
      img.alt = personaje.nombre;
      img.className = 'personaje-card-img';
      img.addEventListener('error', () => {
        img.style.display = 'none';
        const fallback = document.createElement('div');
        fallback.className = 'personaje-fallback';
        fallback.textContent = rareza.emoji;
        top.appendChild(fallback);
      });
      top.appendChild(img);
    } else {
      const fallback = document.createElement('div');
      fallback.className = 'personaje-fallback';
      fallback.textContent = rareza.emoji;
      top.appendChild(fallback);
    }

    card.appendChild(top);

    // Card bottom (info)
    const bottom = document.createElement('div');
    bottom.className = 'personaje-card-bottom';

    const nombre = document.createElement('strong');
    nombre.textContent = personaje.nombre;
    bottom.appendChild(nombre);

    const serie = document.createElement('span');
    serie.className = 'personaje-serie';
    serie.textContent = personaje.serie;
    bottom.appendChild(serie);

    const email = document.createElement('span');
    email.className = 'personaje-email';
    email.textContent = personaje.email;
    bottom.appendChild(email);

    card.appendChild(bottom);

    // Botón eliminar
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'personaje-delete-btn';
    deleteBtn.setAttribute('aria-label', `Eliminar ${personaje.nombre}`);
    deleteBtn.title = 'Eliminar personaje';
    deleteBtn.textContent = '✕';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      eliminarPersonaje(personaje.id);
    });
    card.appendChild(deleteBtn);

    return card;
  }

  /* ─────────────────────────────────────────────
     UI — FORMULARIO Y FEEDBACK
     ───────────────────────────────────────────── */

  /**
   * Muestra errores de validación en la UI.
   * Cada error se asocia a su campo específico.
   * @param {Object} errores - { campo: mensajeError }
   */
  function mostrarErrores(errores) {
    // Limpiar errores previos
    limpiarErrores();

    Object.entries(errores).forEach(([campo, mensaje]) => {
      const input = document.getElementById(`input-${campo}`);
      const errorEl = document.getElementById(`error-${campo}`);

      if (input) {
        input.classList.add('form-invalid');
        input.classList.remove('form-valid');
        // Shake animation
        input.classList.add('input-shake');
        input.addEventListener('animationend', () => {
          input.classList.remove('input-shake');
        }, { once: true });
      }

      if (errorEl) {
        errorEl.textContent = mensaje;
        errorEl.classList.add('visible');
      }
    });
  }

  /**
   * Limpia todos los mensajes de error de la UI.
   */
  function limpiarErrores() {
    document.querySelectorAll('.form-error').forEach(el => {
      el.textContent = '';
      el.classList.remove('visible');
    });
    document.querySelectorAll('.form-invalid').forEach(el => {
      el.classList.remove('form-invalid');
    });
  }

  /**
   * Limpia el formulario después de agregar un personaje.
   */
  function limpiarFormulario() {
    const form = document.getElementById('form-personaje');
    if (form) form.reset();
    limpiarErrores();
    // Quitar clases de validación
    form?.querySelectorAll('.form-valid').forEach(el => el.classList.remove('form-valid'));
    // Resetear imagen
    resetearImagenPreview();
    // Resetear análisis de imagen
    const analysisEl = document.getElementById('image-analysis');
    if (analysisEl) analysisEl.style.display = 'none';
    imagenValidada = false;
  }

  /**
   * Muestra una notificación flotante con feedback visual.
   * @param {string} mensaje - Texto de la notificación
   * @param {string} rareza - Clave de rareza para el color
   */
  function mostrarNotificacion(mensaje, rareza) {
    // Remover notificación previa si existe
    const prev = document.querySelector('.anipack-notif');
    if (prev) prev.remove();

    const color = RAREZAS[rareza]?.color || '#a0aec0';

    const notif = document.createElement('div');
    notif.className = 'anipack-notif';
    notif.style.borderColor = color;
    notif.style.boxShadow = `0 0 30px ${color}44`;

    const icon = document.createElement('span');
    icon.className = 'notif-icon';
    icon.textContent = '✦';
    icon.style.color = color;

    const text = document.createElement('span');
    text.textContent = mensaje;

    notif.appendChild(icon);
    notif.appendChild(text);
    document.body.appendChild(notif);

    // Trigger animation
    requestAnimationFrame(() => notif.classList.add('notif-show'));

    // Auto-remove
    setTimeout(() => {
      notif.classList.remove('notif-show');
      notif.addEventListener('transitionend', () => notif.remove(), { once: true });
    }, 3000);
  }

  /* ─────────────────────────────────────────────
     MODO DE RAREZA (AUTO / MANUAL)
     ───────────────────────────────────────────── */

  /**
   * Configura el toggle entre modo auto (gacha) y manual (select).
   * En modo auto, la rareza se asigna con probabilidades ponderadas.
   * En modo manual, el usuario selecciona la rareza del dropdown.
   */
  function configurarModoRareza() {
    const btnAuto = document.getElementById('rareza-mode-auto');
    const btnManual = document.getElementById('rareza-mode-manual');
    const autoInfo = document.getElementById('rareza-auto-info');
    const selectRareza = document.getElementById('input-rareza');

    if (!btnAuto || !btnManual) return;

    function setModo(modo) {
      rarezaModo = modo;

      // Toggle active class
      btnAuto.classList.toggle('active', modo === 'auto');
      btnManual.classList.toggle('active', modo === 'manual');

      // Toggle visibility
      if (autoInfo) autoInfo.style.display = modo === 'auto' ? 'flex' : 'none';
      if (selectRareza) selectRareza.style.display = modo === 'manual' ? 'block' : 'none';

      // Limpiar error de rareza al cambiar modo
      const errorEl = document.getElementById('error-rareza');
      if (errorEl) { errorEl.textContent = ''; errorEl.classList.remove('visible'); }
    }

    btnAuto.addEventListener('click', () => setModo('auto'));
    btnManual.addEventListener('click', () => setModo('manual'));
  }

  /* ─────────────────────────────────────────────
     FILTROS Y CONTADOR
     ───────────────────────────────────────────── */

  /**
   * Aplica un filtro de rareza y re-renderiza la lista.
   * @param {string} rareza - Clave de rareza o 'all'
   */
  function filtrarPorRareza(rareza) {
    filtroActual = rareza;

    // Actualizar UI de pills
    document.querySelectorAll('.rarity-pill').forEach(pill => {
      pill.classList.toggle('active', pill.dataset.rareza === rareza);
    });

    renderizarLista();
  }

  /**
   * Actualiza el contador de personajes en la UI.
   * Muestra total y desglose por rareza.
   */
  function actualizarContador() {
    const totalEl = document.getElementById('contador-total');
    const detalleEl = document.getElementById('contador-detalle');
    if (!totalEl) return;

    totalEl.textContent = personajes.length;

    if (detalleEl) {
      // Limpiar
      while (detalleEl.firstChild) {
        detalleEl.removeChild(detalleEl.firstChild);
      }

      Object.entries(RAREZAS).forEach(([key, meta]) => {
        const count = personajes.filter(p => p.rareza === key).length;
        if (count === 0) return;

        const badge = document.createElement('span');
        badge.className = 'counter-mini-badge';
        badge.style.color = meta.color;
        badge.style.backgroundColor = `${meta.color}18`;
        badge.style.border = `1px solid ${meta.color}33`;
        badge.textContent = `${meta.icon} ${count}`;
        detalleEl.appendChild(badge);
      });
    }
  }

  /* ─────────────────────────────────────────────
     VALIDACIÓN EN TIEMPO REAL
     ───────────────────────────────────────────── */

  /**
   * Configura validación en tiempo real para los campos del formulario.
   */
  function configurarValidacionEnVivo() {
    const campos = [
      { id: 'input-nombre', regex: REGEX.nombre },
      { id: 'input-serie',  regex: REGEX.serie },
      { id: 'input-email',  regex: REGEX.email }
    ];

    campos.forEach(({ id, regex }) => {
      const input = document.getElementById(id);
      if (!input) return;

      input.addEventListener('input', () => {
        const valor = input.value.trim();
        const errorEl = document.getElementById(id.replace('input-', 'error-'));

        if (valor.length === 0) {
          input.classList.remove('form-valid', 'form-invalid');
          if (errorEl) { errorEl.textContent = ''; errorEl.classList.remove('visible'); }
          return;
        }

        if (regex.test(valor)) {
          input.classList.add('form-valid');
          input.classList.remove('form-invalid');
          if (errorEl) { errorEl.textContent = ''; errorEl.classList.remove('visible'); }
        } else {
          input.classList.add('form-invalid');
          input.classList.remove('form-valid');
        }
      });
    });

    // Select de rareza
    const selectRareza = document.getElementById('input-rareza');
    if (selectRareza) {
      selectRareza.addEventListener('change', () => {
        const errorEl = document.getElementById('error-rareza');
        if (selectRareza.value && RAREZAS[selectRareza.value]) {
          selectRareza.classList.add('form-valid');
          selectRareza.classList.remove('form-invalid');
          if (errorEl) { errorEl.textContent = ''; errorEl.classList.remove('visible'); }
        }
      });
    }
  }

  /* ─────────────────────────────────────────────
     SISTEMA DE CARGA DE IMAGEN
     ───────────────────────────────────────────── */

  /**
   * Procesa un archivo de imagen: valida tipo/tamaño y genera preview.
   * @param {File} file - Archivo seleccionado
   */
  function procesarImagen(file) {
    const errorEl = document.getElementById('error-imagen');

    // Validar tipo
    if (!TIPOS_IMAGEN.includes(file.type)) {
      if (errorEl) {
        errorEl.textContent = 'Formato no soportado. Usa PNG, JPG, WebP o GIF.';
        errorEl.classList.add('visible');
      }
      return;
    }

    // Validar tamaño
    if (file.size > MAX_IMAGE_SIZE) {
      if (errorEl) {
        errorEl.textContent = `La imagen es muy grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo: 2MB.`;
        errorEl.classList.add('visible');
      }
      return;
    }

    // Limpiar error previo
    if (errorEl) { errorEl.textContent = ''; errorEl.classList.remove('visible'); }

    // Leer como base64
    const reader = new FileReader();
    reader.addEventListener('load', async () => {
      imagenSeleccionada = reader.result;
      mostrarImagenPreview(reader.result);

      // Ejecutar análisis de imagen animada
      const analysisContainer = document.getElementById('image-analysis');
      const analysisIcon = document.getElementById('image-analysis-icon');
      const analysisText = document.getElementById('image-analysis-text');
      if (analysisContainer) {
        analysisContainer.style.display = 'flex';
        analysisContainer.className = 'image-analysis analysis-loading';
        if (analysisIcon) analysisIcon.textContent = '⏳';
        if (analysisText) analysisText.textContent = 'Analizando imagen...';
      }

      const resultado = await analizarImagen(reader.result);
      mostrarResultadoAnalisis(resultado);
    });
    reader.readAsDataURL(file);
  }

  /**
   * Muestra la imagen seleccionada en el preview del formulario.
   * @param {string} dataUrl - Base64 data URL de la imagen
   */
  function mostrarImagenPreview(dataUrl) {
    const placeholder = document.getElementById('image-upload-placeholder');
    const previewWrap = document.getElementById('image-upload-preview');
    const previewImg = document.getElementById('image-preview-img');
    const uploadArea = document.getElementById('image-upload-area');

    if (previewImg) previewImg.src = dataUrl;
    if (placeholder) placeholder.style.display = 'none';
    if (previewWrap) previewWrap.style.display = 'flex';
    if (uploadArea) uploadArea.classList.add('has-image');
  }

  /**
   * Resetea el preview de imagen al estado inicial.
   */
  function resetearImagenPreview() {
    imagenSeleccionada = '';
    const placeholder = document.getElementById('image-upload-placeholder');
    const previewWrap = document.getElementById('image-upload-preview');
    const previewImg = document.getElementById('image-preview-img');
    const fileInput = document.getElementById('input-imagen');
    const uploadArea = document.getElementById('image-upload-area');
    const errorEl = document.getElementById('error-imagen');

    if (previewImg) previewImg.src = '';
    if (placeholder) placeholder.style.display = 'flex';
    if (previewWrap) previewWrap.style.display = 'none';
    if (fileInput) fileInput.value = '';
    if (uploadArea) uploadArea.classList.remove('has-image');
    imagenValidada = false;
    const analysisEl = document.getElementById('image-analysis');
    if (analysisEl) analysisEl.style.display = 'none';
    if (errorEl) { errorEl.textContent = ''; errorEl.classList.remove('visible'); }
  }

  /**
   * Configura todos los eventos del sistema de carga de imagen:
   * click-to-upload, drag & drop, y botón de remover.
   */
  function configurarImageUpload() {
    const uploadArea = document.getElementById('image-upload-area');
    const fileInput = document.getElementById('input-imagen');
    const removeBtn = document.getElementById('image-preview-remove');

    if (!uploadArea || !fileInput) return;

    // Click en el área abre el file picker
    uploadArea.addEventListener('click', (e) => {
      if (e.target.closest('.image-preview-remove')) return;
      fileInput.click();
    });

    // Cambio en el input file
    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) {
        procesarImagen(fileInput.files[0]);
      }
    });

    // Drag & Drop
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('drag-over');
    });
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('drag-over');
    });
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('drag-over');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        procesarImagen(e.dataTransfer.files[0]);
      }
    });

    // Botón de remover imagen
    if (removeBtn) {
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        resetearImagenPreview();
      });
    }
  }

  /* ─────────────────────────────────────────────
     INICIALIZACIÓN
     ───────────────────────────────────────────── */

  /**
   * Inicializa la aplicación.
   * Carga datos iniciales, configura eventos y renderiza.
   */
  function init() {
    // Cargar desde localStorage o usar datos iniciales
    const almacenado = cargarDesdeStorage();
    if (almacenado.personajes) {
      // Hay datos guardados — restaurar sesión anterior
      personajes = almacenado.personajes;
      nextId = almacenado.nextId;
      mostrarNotificacion(`Colección restaurada: ${personajes.length} personajes`, 'rare');
    } else {
      // Primera vez — cargar datos iniciales y guardarlos
      personajes = DATOS_INICIALES.map(p => ({ ...p, fechaCreacion: Date.now() }));
      guardarEnStorage();
    }

    // Bind del formulario
    const form = document.getElementById('form-personaje');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const datos = {
          nombre: document.getElementById('input-nombre')?.value || '',
          serie:  document.getElementById('input-serie')?.value || '',
          email:  document.getElementById('input-email')?.value || '',
          rareza: rarezaModo === 'manual'
            ? (document.getElementById('input-rareza')?.value || '')
            : 'auto'
        };
        agregarPersonaje(datos);
      });
    }

    // Bind de filtros
    document.querySelectorAll('.rarity-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        filtrarPorRareza(pill.dataset.rareza);
      });
    });

    // Bind de modo rareza (auto/manual toggle)
    configurarModoRareza();

    // Validación en tiempo real
    configurarValidacionEnVivo();

    // Sistema de carga de imagen
    configurarImageUpload();

    // Render inicial
    renderizarLista();
    actualizarContador();
  }

  /* ─────────────────────────────────────────────
     API PÚBLICA
     ───────────────────────────────────────────── */

  return {
    init,
    agregarPersonaje,
    eliminarPersonaje,
    renderizarLista,
    validarEntrada,
    sanitizar,
    obtenerPersonajes,
    filtrarPorRareza,
    limpiarStorage,
    RAREZAS
  };

})();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  AniPackApp.init();
});