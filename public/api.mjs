/**
 * ==========================================================================
 * HabitTracker - Cliente HTTP y Centralización de Llamadas Fetch (api.mjs)
 * ==========================================================================
 */

/**
 * URL base única para todas las peticiones a la API REST.
 * - Cuando se accede desde el servidor Express (http://localhost:3000 o Render en producción),
 *   utiliza "/api".
 * - Si el usuario abre el HTML con la extensión Live Server de VS Code (ej. puerto 5500),
 *   redirige automáticamente las peticiones hacia "http://localhost:3000/api".
 * - Si se despliega el backend en un dominio separado en producción, cambia "/api" por
 *   la URL pública de tu servidor (ej. "https://mi-backend.onrender.com/api").
 */
export const API_BASE_URL =
  typeof window !== "undefined" &&
  (window.location.protocol === "file:" ||
    ((window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "localhost") &&
      window.location.port !== "" &&
      window.location.port !== "3000"))
    ? "http://localhost:3000/api"
    : "/api";

/**
 * Función auxiliar privada para procesar la respuesta HTTP y verificar response.ok.
 * @param {Response} response - Objeto de respuesta de fetch()
 * @returns {Promise<any>} Datos parseados en JSON
 */
async function procesarRespuestaHTTP(response) {
  let datos = null;
  try {
    datos = await response.json();
  } catch {
    datos = null;
  }

  if (!response.ok) {
    const mensajeServidor =
      datos && typeof datos.error === "string"
        ? datos.error
        : `Error HTTP ${response.status}: ${response.statusText}`;
    throw new Error(mensajeServidor);
  }

  return datos;
}

/**
 * 1) GET /api/consejos
 * Obtiene la lista de consejos de productividad y un consejo aleatorio desde el servidor.
 */
export async function obtenerConsejosAPI() {
  const response = await fetch(`${API_BASE_URL}/consejos`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });
  return procesarRespuestaHTTP(response);
}

/**
 * 2) GET /api/habitos
 * Obtiene la lista actual de hábitos almacenados en el servidor.
 */
export async function obtenerHabitosAPI() {
  const response = await fetch(`${API_BASE_URL}/habitos`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });
  return procesarRespuestaHTTP(response);
}

/**
 * 3) POST /api/habitos
 * Envía un nuevo hábito al servidor para su validación y creación.
 * @param {{ nombre: string, categoria: string, hora: string }} nuevoHabito
 */
export async function crearHabitoAPI(nuevoHabito) {
  const response = await fetch(`${API_BASE_URL}/habitos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(nuevoHabito),
  });
  return procesarRespuestaHTTP(response);
}

/**
 * 4) PATCH /api/habitos/:id/toggle
 * Alterna el estado completado de un hábito y actualiza su racha en el servidor.
 * @param {string} id - Identificador del hábito
 */
export async function toggleHabitoAPI(id) {
  const response = await fetch(
    `${API_BASE_URL}/habitos/${encodeURIComponent(id)}/toggle`,
    {
      method: "PATCH",
      headers: {
        Accept: "application/json",
      },
    },
  );
  return procesarRespuestaHTTP(response);
}

/**
 * 5) DELETE /api/habitos/:id
 * Elimina un hábito por su identificador en el servidor.
 * @param {string} id - Identificador del hábito
 */
export async function eliminarHabitoAPI(id) {
  const response = await fetch(
    `${API_BASE_URL}/habitos/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
    },
  );
  return procesarRespuestaHTTP(response);
}
