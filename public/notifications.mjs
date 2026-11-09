/**
 * ==========================================================================
 * Módulo de Notificaciones Nativas (Web Notifications API) y Toasts Accesibles
 * ==========================================================================
 */

/**
 * Consulta el estado actual de soporte y permisos de notificaciones del navegador.
 * @returns {'unsupported' | 'granted' | 'denied' | 'default'}
 */
export function obtenerEstadoNotificaciones() {
  if (!("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

/**
 * Solicita permisos de notificación al usuario de manera asíncrona.
 * @returns {Promise<boolean>} True si fueron concedidos
 */
export async function solicitarPermisoNotificaciones() {
  if (!("Notification" in window)) {
    mostrarToast(
      "Tu navegador no soporta notificaciones nativas de escritorio.",
      "warning",
    );
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission === "denied") {
    mostrarToast(
      "Las notificaciones están bloqueadas en la configuración de tu navegador.",
      "warning",
    );
    return false;
  }

  try {
    const permiso = await Notification.requestPermission();
    if (permiso === "granted") {
      mostrarToast("¡Notificaciones nativas activadas con éxito!", "success");
      return true;
    } else {
      mostrarToast("Permiso de notificaciones no concedido.", "warning");
      return false;
    }
  } catch (error) {
    console.error("Error al solicitar permiso de notificación:", error);
    return false;
  }
}

/**
 * Dispara una notificación nativa del sistema operativo.
 * Siempre muestra un aviso Toast en la interfaz como retroalimentación inmediata.
 * @param {string} titulo - Título de la notificación
 * @param {string} cuerpo - Mensaje o descripción
 * @param {Object} [opciones={}] - Opciones adicionales (icon, tag, etc.)
 */
export function dispararNotificacion(titulo, cuerpo, opciones = {}) {
  mostrarToast(`${titulo}: ${cuerpo}`, "info");

  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(titulo, {
        body: cuerpo,
        icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%234f46e5'><path d='M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z'/></svg>",
        ...opciones,
      });
    } catch (err) {
      console.warn("No se pudo emitir la notificación nativa:", err);
    }
  }
}

/**
 * Muestra una alerta toast flotante animada en la interfaz web usando createElement y textContent (Seguro contra XSS).
 * @param {string} mensaje
 * @param {'info' | 'success' | 'warning'} tipo
 * @param {number} duracion
 */
export function mostrarToast(mensaje, tipo = "info", duracion = 3500) {
  let contenedor = document.querySelector("#contenedor-toasts");
  if (!contenedor) {
    contenedor = document.createElement("div");
    contenedor.id = "contenedor-toasts";
    contenedor.className = "contenedor-toasts";
    contenedor.setAttribute("aria-live", "polite");
    contenedor.setAttribute("role", "status");
    document.body.appendChild(contenedor);
  }

  const toast = document.createElement("div");
  toast.className = `toast-custom toast-${tipo}`;

  const SIMBOLOS_TIPO = {
    success: "✓",
    warning: "⚠",
    info: "ℹ",
  };

  const iconoSpan = document.createElement("span");
  iconoSpan.className = "toast-icono-wrap";
  iconoSpan.setAttribute("aria-hidden", "true");
  iconoSpan.textContent = SIMBOLOS_TIPO[tipo] || SIMBOLOS_TIPO.info;

  const textoSpan = document.createElement("span");
  textoSpan.className = "toast-texto";
  // Asignación segura con textContent para prevenir XSS
  textoSpan.textContent = mensaje;

  toast.appendChild(iconoSpan);
  toast.appendChild(textoSpan);
  contenedor.appendChild(toast);

  // Animación de entrada
  requestAnimationFrame(() => {
    toast.classList.add("toast-visible");
  });

  // Remoción automática
  setTimeout(() => {
    toast.classList.remove("toast-visible");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, duracion);
}
