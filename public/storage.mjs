/**
 * ==========================================================================
 * HabitTracker - Módulo de Persistencia en el Navegador (public/storage.mjs)
 * Implementación justificada de localStorage (permanente) y sessionStorage (sesión/pestaña)
 * Sin almacenamiento de datos sensibles (contraseñas, tokens ni claves).
 * ==========================================================================
 */

// Claves de localStorage (Persistencia permanente entre cierres del navegador)
const CLAVE_HABITOS_LOCAL = "habittracker_habitos_v2";
const CLAVE_NOMBRE_USUARIO = "nombreUsuario";
const CLAVE_MODO_TEMA = "modo"; // Valores: "claro" | "oscuro"

// Claves de sessionStorage (Persistencia temporal exclusiva de la pestaña actual)
const CLAVE_VISITAS_SESION = "visitasSesion";
const CLAVE_FILTRO_ACTUAL = "filtroActual"; // Valores: "todos" | "pendientes" | "completados"

export const HABITOS_POR_DEFECTO = [
  {
    id: "habito-1",
    nombre: "Beber 2 litros de agua",
    categoria: "salud",
    hora: "08:30",
    completado: true,
    racha: 5,
    fechaCreacion: "2026-09-01T08:00:00.000Z",
  },
  {
    id: "habito-2",
    nombre: "Leer 20 páginas de un libro",
    categoria: "mente",
    hora: "21:00",
    completado: false,
    racha: 3,
    fechaCreacion: "2026-09-02T12:00:00.000Z",
  },
  {
    id: "habito-3",
    nombre: "Caminar o trotar 30 minutos",
    categoria: "deporte",
    hora: "07:00",
    completado: false,
    racha: 2,
    fechaCreacion: "2026-09-03T07:00:00.000Z",
  },
];

// ==========================================================================
// 1. GESTIÓN DE LOCALSTORAGE (Permanente: nombreUsuario, modo, habittracker_habitos_v2)
// ==========================================================================

/**
 * Obtiene la lista de hábitos de respaldo en localStorage usando JSON.parse y try/catch.
 * Maneja el valor null en la primera visita devolviendo los hábitos por defecto.
 * @returns {Array} Lista de objetos de hábito
 */
export function obtenerHabitos() {
  try {
    const datos = localStorage.getItem(CLAVE_HABITOS_LOCAL);
    if (datos === null) {
      guardarHabitos(HABITOS_POR_DEFECTO);
      return [...HABITOS_POR_DEFECTO];
    }
    const parseados = JSON.parse(datos);
    return Array.isArray(parseados) ? parseados : [...HABITOS_POR_DEFECTO];
  } catch (error) {
    console.error("Error al leer hábitos de localStorage:", error);
    return [...HABITOS_POR_DEFECTO];
  }
}

/**
 * Guarda la lista de hábitos como respaldo en localStorage usando JSON.stringify y try/catch.
 * @param {Array} habitos - Lista de hábitos a persistir
 */
export function guardarHabitos(habitos) {
  try {
    localStorage.setItem(CLAVE_HABITOS_LOCAL, JSON.stringify(habitos));
  } catch (error) {
    console.error("Error al guardar hábitos en localStorage:", error);
  }
}

/**
 * Obtiene el nombre del usuario guardado en localStorage.
 * @returns {string} Nombre guardado o cadena vacía si es la primera visita (null)
 */
export function obtenerNombreUsuario() {
  try {
    const nombre = localStorage.getItem(CLAVE_NOMBRE_USUARIO);
    return nombre !== null ? nombre.trim() : "";
  } catch (error) {
    console.error("Error al leer nombreUsuario de localStorage:", error);
    return "";
  }
}

/**
 * Guarda el nombre del usuario en localStorage para personalizar su saludo.
 * @param {string} nombre
 */
export function guardarNombreUsuario(nombre) {
  try {
    localStorage.setItem(CLAVE_NOMBRE_USUARIO, nombre.trim());
  } catch (error) {
    console.error("Error al guardar nombreUsuario en localStorage:", error);
  }
}

/**
 * Obtiene el modo de tema visual ("claro" u "oscuro") desde localStorage.
 * @returns {'claro' | 'oscuro'}
 */
export function obtenerModoTema() {
  try {
    const modo = localStorage.getItem(CLAVE_MODO_TEMA);
    return modo === "oscuro" ? "oscuro" : "claro";
  } catch (error) {
    console.error("Error al leer el modo de tema en localStorage:", error);
    return "claro";
  }
}

/**
 * Guarda la preferencia de tema visual ("claro" u "oscuro") en localStorage.
 * @param {'claro' | 'oscuro'} modo
 */
export function guardarModoTema(modo) {
  try {
    const valor = modo === "oscuro" ? "oscuro" : "claro";
    localStorage.setItem(CLAVE_MODO_TEMA, valor);
  } catch (error) {
    console.error("Error al guardar el modo de tema en localStorage:", error);
  }
}

// ==========================================================================
// 2. GESTIÓN DE SESSIONSTORAGE (Temporal de la pestaña: visitasSesion, filtroActual)
// ==========================================================================

/**
 * Incrementa y devuelve el contador numérico de cargas de página en la pestaña actual.
 * @returns {number} Número de visitas en esta pestaña
 */
export function registrarVisitaSesion() {
  try {
    const actualRaw = sessionStorage.getItem(CLAVE_VISITAS_SESION);
    const actual = actualRaw !== null ? Number.parseInt(actualRaw, 10) : 0;
    const nuevoTotal = Number.isNaN(actual) ? 1 : actual + 1;
    sessionStorage.setItem(CLAVE_VISITAS_SESION, String(nuevoTotal));
    return nuevoTotal;
  } catch (error) {
    console.error("Error al actualizar visitasSesion en sessionStorage:", error);
    return 1;
  }
}

/**
 * Obtiene el filtro activo conservado en la sesión/pestaña actual al recargar con F5.
 * @returns {'todos' | 'pendientes' | 'completados'}
 */
export function obtenerFiltroSesion() {
  try {
    const filtro = sessionStorage.getItem(CLAVE_FILTRO_ACTUAL);
    if (
      filtro === "todos" ||
      filtro === "pendientes" ||
      filtro === "completados"
    ) {
      return filtro;
    }
    return "todos";
  } catch (error) {
    console.error("Error al leer filtroActual de sessionStorage:", error);
    return "todos";
  }
}

/**
 * Guarda el filtro activo en sessionStorage para conservarlo ante recargas (F5).
 * @param {'todos' | 'pendientes' | 'completados'} filtro
 */
export function guardarFiltroSesion(filtro) {
  try {
    sessionStorage.setItem(CLAVE_FILTRO_ACTUAL, filtro);
  } catch (error) {
    console.error("Error al guardar filtroActual en sessionStorage:", error);
  }
}

// ==========================================================================
// 3. PRIVACIDAD Y BORRADO TOTAL ("Olvidar mis datos")
// ==========================================================================

/**
 * Limpia por completo tanto localStorage como sessionStorage.
 */
export function olvidarTodosLosDatos() {
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (error) {
    console.error("Error al limpiar el almacenamiento del navegador:", error);
  }
}
