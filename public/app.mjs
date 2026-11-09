/**
 * ==========================================================================
 * HabitTracker (Fase 2) - Orquestador Principal de la Aplicación (public/app.mjs)
 * Integración Cliente-Servidor (Fetch + API REST), Persistencia Web (localStorage
 * y sessionStorage), Tema Claro/Oscuro (Bootstrap 5.3.8), Closures, Event
 * Delegation, Prevención de XSS y Web Notifications API.
 * ==========================================================================
 */

import {
  obtenerHabitos,
  guardarHabitos,
  obtenerNombreUsuario,
  guardarNombreUsuario,
  obtenerModoTema,
  guardarModoTema,
  registrarVisitaSesion,
  obtenerFiltroSesion,
  guardarFiltroSesion,
  olvidarTodosLosDatos,
} from "./storage.mjs";

import {
  solicitarPermisoNotificaciones,
  dispararNotificacion,
  obtenerEstadoNotificaciones,
  mostrarToast,
} from "./notifications.mjs";

import {
  obtenerConsejosAPI,
  obtenerHabitosAPI,
  crearHabitoAPI,
  toggleHabitoAPI,
  eliminarHabitoAPI,
} from "./api.mjs";

// ==========================================================================
// 1. Selección de Elementos del DOM (document.querySelector y querySelectorAll)
// ==========================================================================
const form = document.querySelector("#form-habito");
const inputNombre = document.querySelector("#nombre-habito");
const selectCategoria = document.querySelector("#categoria-habito");
const inputHora = document.querySelector("#hora-recordatorio");
const btnSubmitHabito = document.querySelector("#btn-submit-habito");
const txtSubmitHabito = document.querySelector("#txt-submit-habito");
const alertaFormulario = document.querySelector("#alerta-formulario");
const alertaApi = document.querySelector("#alerta-api");

const contenedorHabitos = document.querySelector("#contenedor-habitos");
const estadoVacio = document.querySelector("#estado-vacio");
const mensajeVacio = document.querySelector("#mensaje-vacio");
const textoConsejo = document.querySelector("#texto-consejo");
const btnNuevoConsejo = document.querySelector("#btn-nuevo-consejo");

// Controles de Tema y Notificaciones en Cabecera
const btnTema = document.querySelector("#btn-tema");
const iconoTema = document.querySelector("#icono-tema");
const txtTemaBtn = document.querySelector("#txt-tema-btn");
const btnNotif = document.querySelector("#btn-notificaciones");
const txtNotifBtn = document.querySelector("#txt-notif-btn");

// Elementos de "Tu Perfil Diario" (Usuario, Visitas y Privacidad)
const formUsuario = document.querySelector("#form-usuario");
const inputNombreUsuario = document.querySelector("#input-nombre-usuario");
const saludoUsuario = document.querySelector("#saludo-usuario");
const contadorVisitas = document.querySelector("#contador-visitas");
const btnOlvidar = document.querySelector("#btn-olvidar");
const alertaPrivacidad = document.querySelector("#alerta-privacidad");

// Filtros
const botonesFiltro = document.querySelectorAll(".filtro-btn");
const badgeTodos = document.querySelector("#badge-todos");
const badgePendientes = document.querySelector("#badge-pendientes");
const badgeCompletados = document.querySelector("#badge-completados");

// Métricas del Dashboard
const porcentajeProgreso = document.querySelector("#porcentaje-progreso");
const progresoDetalle = document.querySelector("#progreso-detalle");
const progressFill = document.querySelector("#progress-fill");
const progressBarAria = document.querySelector("#progress-bar-aria");
const rachaTotal = document.querySelector("#racha-total");
const totalHabitosCount = document.querySelector("#total-habitos-count");
const pendientesDetalle = document.querySelector("#pendientes-detalle");

// ==========================================================================
// 2. Estado de la Aplicación (Declaración con let y const, cero var)
// ==========================================================================
let habitos = obtenerHabitos();
let filtroActual = obtenerFiltroSesion();
let esperandoConfirmacionOlvido = false;
const recordatoriosDisparadosHoy = new Set();

// ==========================================================================
// 3. Demostración de Closure en JavaScript Moderno (Ámbito léxico y estado privado)
// ==========================================================================
function crearGestorRacha() {
  let rachaMaximaPrivada = 0; // Variable encapsulada en el closure

  return {
    calcularMayorRacha: (listaHabitos) => {
      rachaMaximaPrivada = listaHabitos.reduce(
        (max, h) => Math.max(max, h.racha || 0),
        0,
      );
      return rachaMaximaPrivada;
    },
    obtenerRachaActual: () => rachaMaximaPrivada,
  };
}

const gestorRacha = crearGestorRacha();

// ==========================================================================
// 4. Tema Claro/Oscuro (Bootstrap 5.3.8 data-bs-theme + localStorage)
// ==========================================================================
function aplicarTemaVisual(modo) {
  const esOscuro = modo === "oscuro";
  document.documentElement.dataset.bsTheme = esOscuro ? "dark" : "light";

  if (btnTema) {
    btnTema.setAttribute("aria-pressed", esOscuro ? "true" : "false");
  }
  if (iconoTema) {
    iconoTema.textContent = esOscuro ? "☀️" : "🌙";
  }
  if (txtTemaBtn) {
    txtTemaBtn.textContent = esOscuro ? "Modo claro" : "Modo oscuro";
  }
}

btnTema.addEventListener("click", () => {
  const temaActual =
    document.documentElement.dataset.bsTheme === "dark" ? "oscuro" : "claro";
  const nuevoModo = temaActual === "oscuro" ? "claro" : "oscuro";
  aplicarTemaVisual(nuevoModo);
  guardarModoTema(nuevoModo);
});

// ==========================================================================
// 5. Perfil de Usuario, Contador de Sesión y Confirmación de Borrado en 2 Clics
// ==========================================================================
function actualizarSaludoUsuario() {
  const nombreGuardado = obtenerNombreUsuario();
  if (nombreGuardado !== "") {
    saludoUsuario.textContent = `¡Hola de nuevo, ${nombreGuardado}! 👋`;
    inputNombreUsuario.value = nombreGuardado;
  } else {
    saludoUsuario.textContent =
      "¡Hola! Personaliza tu perfil para comenzar. 👋";
    inputNombreUsuario.value = "";
  }
}

function inicializarContadorVisitas() {
  const totalVisitas = registrarVisitaSesion();
  contadorVisitas.textContent = `Sesión activa • Vista #${totalVisitas}`;
}

formUsuario.addEventListener("submit", (e) => {
  e.preventDefault();
  const nombre = inputNombreUsuario.value.trim();

  if (nombre === "") {
    inputNombreUsuario.focus();
    mostrarToast("Escribe tu nombre antes de guardar.", "warning");
    return;
  }

  guardarNombreUsuario(nombre);
  actualizarSaludoUsuario();
  mostrarToast(`Perfil actualizado. ¡Hola, ${nombre}!`, "success");
});

// Confirmación en dos clics para el botón #btn-olvidar
btnOlvidar.addEventListener("click", () => {
  if (esperandoConfirmacionOlvido === false) {
    esperandoConfirmacionOlvido = true;
    btnOlvidar.textContent = "Confirmar borrado";
    alertaPrivacidad.className = "alert alert-warning py-2 px-3 small mb-2";
    alertaPrivacidad.textContent =
      "Haz clic una vez más en el botón rojo para restablecer tu perfil y preferencias en este navegador.";
    alertaPrivacidad.hidden = false;
    return;
  }

  // Segundo clic confirmado: limpiar localStorage y sessionStorage
  olvidarTodosLosDatos();
  esperandoConfirmacionOlvido = false;

  // Restaurar tema claro ("light"), limpiar saludo y reiniciar contador
  aplicarTemaVisual("claro");
  saludoUsuario.textContent = "¡Hola! Personaliza tu perfil para comenzar. 👋";
  inputNombreUsuario.value = "";
  contadorVisitas.textContent = "Sesión activa • Vista #1";

  // Restaurar filtro por defecto a "todos"
  filtroActual = "todos";
  sincronizarBotonesFiltro();
  renderizarHabitos();

  btnOlvidar.textContent = "Olvidar mis datos";
  alertaPrivacidad.className = "alert alert-success py-2 px-3 small mb-2";
  alertaPrivacidad.textContent =
    "Tus preferencias locales han sido restablecidas correctamente.";
  alertaPrivacidad.hidden = false;

  mostrarToast("Preferencias restablecidas con éxito.", "info");
});

// ==========================================================================
// 6. Peticiones Asíncronas al Backend con Fetch API (async/await y try/catch)
// ==========================================================================
function mostrarAlertaFormulario(mensaje, tipo = "warning") {
  alertaFormulario.className = `alert alert-${tipo} py-2 px-3 small mb-3`;
  alertaFormulario.textContent = mensaje;
  alertaFormulario.hidden = false;
}

function ocultarAlertaFormulario() {
  alertaFormulario.hidden = true;
  alertaFormulario.textContent = "";
}

async function cargarConsejoDelDia() {
  try {
    const datos = await obtenerConsejosAPI();
    if (datos && typeof datos.consejoAleatorio === "string") {
      textoConsejo.textContent = `"${datos.consejoAleatorio}"`;
      return;
    }
    if (
      datos &&
      Array.isArray(datos.consejos) &&
      datos.consejos.length > 0
    ) {
      const indice = Math.floor(Math.random() * datos.consejos.length);
      textoConsejo.textContent = `"${datos.consejos[indice]}"`;
    }
  } catch (error) {
    console.warn(
      "No se pudo obtener el consejo desde el servidor, usando respaldo local:",
      error.message,
    );
    textoConsejo.textContent =
      '"La constancia de 5 minutos al día supera a la intensidad esporádica."';
  }
}

btnNuevoConsejo.addEventListener("click", () => {
  cargarConsejoDelDia();
});

async function sincronizarHabitosDesdeServidor() {
  try {
    const habitosRemotos = await obtenerHabitosAPI();
    if (Array.isArray(habitosRemotos)) {
      habitos = habitosRemotos;
      guardarHabitos(habitos);
      alertaApi.hidden = true;
      renderizarHabitos();
    }
  } catch (error) {
    console.warn(
      "Modo sin conexión activo, operando con respaldo local:",
      error.message,
    );
    habitos = obtenerHabitos();
    alertaApi.textContent =
      "Trabajando en modo local: tus hábitos se muestran desde este navegador.";
    alertaApi.hidden = false;
    renderizarHabitos();
  }
}

// ==========================================================================
// 7. Gestión de Permisos y Accesibilidad en Notificaciones (aria-expanded)
// ==========================================================================
function actualizarEstadoBotonNotificaciones() {
  const estado = obtenerEstadoNotificaciones();

  btnNotif.classList.remove("activas", "bloqueadas");

  if (estado === "granted") {
    btnNotif.classList.add("activas");
    txtNotifBtn.textContent = "Notificaciones Activas";
    btnNotif.setAttribute("aria-expanded", "true");
  } else if (estado === "denied") {
    btnNotif.classList.add("bloqueadas");
    txtNotifBtn.textContent = "Notificaciones Bloqueadas";
    btnNotif.setAttribute("aria-expanded", "false");
  } else {
    txtNotifBtn.textContent = "Activar Notificaciones";
    btnNotif.setAttribute("aria-expanded", "false");
  }
}

btnNotif.addEventListener("click", async () => {
  const estadoActual = obtenerEstadoNotificaciones();

  // Comparación estricta (===)
  if (estadoActual === "granted") {
    dispararNotificacion(
      "Recordatorio de prueba",
      "Las notificaciones están funcionando correctamente.",
    );
    return;
  }

  if (estadoActual === "denied") {
    mostrarToast(
      "Debes habilitar los permisos en la configuración de tu navegador para este sitio.",
      "warning",
    );
    return;
  }

  const concedido = await solicitarPermisoNotificaciones();
  actualizarEstadoBotonNotificaciones();

  if (concedido === true) {
    dispararNotificacion(
      "¡Excelente!",
      "Te recordaremos tus hábitos en sus horarios programados.",
    );
  }
});

// ==========================================================================
// 8. Helpers Visuales y Renderizado Seguro (Prevención de XSS con createElement y textContent)
// ==========================================================================
const ICONOS_CATEGORIA = {
  salud: "💧",
  mente: "🧠",
  productividad: "⚡",
  deporte: "🏃",
  finanzas: "💰",
  general: "⭐",
};

function crearIconoSvgCheck() {
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "3");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");

  const polyline = document.createElementNS(svgNS, "polyline");
  polyline.setAttribute("points", "20 6 9 17 4 12");
  svg.appendChild(polyline);
  return svg;
}

function crearIconoSvgPapelera() {
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");

  const polyline = document.createElementNS(svgNS, "polyline");
  polyline.setAttribute("points", "3 6 5 6 21 6");

  const path = document.createElementNS(svgNS, "path");
  path.setAttribute(
    "d",
    "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
  );

  svg.appendChild(polyline);
  svg.appendChild(path);
  return svg;
}

function actualizarMetricas() {
  const total = habitos.length;
  const completados = habitos.filter((h) => h.completado === true).length;
  const pendientes = total - completados;
  const porcentaje = total > 0 ? Math.round((completados / total) * 100) : 0;

  porcentajeProgreso.textContent = `${porcentaje}%`;
  progresoDetalle.textContent = `${completados} de ${total} completados`;
  progressFill.style.width = `${porcentaje}%`;
  progressBarAria.setAttribute("aria-valuenow", String(porcentaje));

  totalHabitosCount.textContent = String(total);
  pendientesDetalle.textContent = `${pendientes} pendiente${pendientes === 1 ? "" : "s"} hoy`;

  // Uso del Closure para calcular la mayor racha
  const maxRacha = gestorRacha.calcularMayorRacha(habitos);
  rachaTotal.textContent = `${maxRacha} día${maxRacha === 1 ? "" : "s"}`;

  badgeTodos.textContent = String(total);
  badgePendientes.textContent = String(pendientes);
  badgeCompletados.textContent = String(completados);
}

function renderizarHabitos() {
  contenedorHabitos.textContent = "";

  // Filtrado con comparaciones estrictas (===)
  const habitosFiltrados = habitos.filter((habito) => {
    if (filtroActual === "pendientes") return habito.completado === false;
    if (filtroActual === "completados") return habito.completado === true;
    return true;
  });

  // Control del Estado Vacío mediante el atributo nativo hidden
  if (habitosFiltrados.length === 0) {
    estadoVacio.hidden = false;
    if (habitos.length === 0) {
      mensajeVacio.textContent =
        "No tienes hábitos registrados aún. Agrega tu primer objetivo con el formulario.";
    } else if (filtroActual === "pendientes") {
      mensajeVacio.textContent =
        "¡Felicidades! Has completado todos tus hábitos pendientes de hoy. 🎉";
    } else if (filtroActual === "completados") {
      mensajeVacio.textContent =
        "Aún no has completado hábitos hoy. ¡Da el primer paso!";
    }
  } else {
    estadoVacio.hidden = true;
  }

  // Construcción del árbol DOM elemento por elemento (100% seguro contra XSS)
  habitosFiltrados.forEach((habito) => {
    const colLi = document.createElement("li");
    colLi.className = "col-12 col-md-6 col-lg-4";

    const cardArticle = document.createElement("article");
    cardArticle.className = `card shadow-sm h-100 card-habito ${habito.completado === true ? "completado" : ""}`;
    cardArticle.dataset.id = habito.id;

    const cardBody = document.createElement("div");
    cardBody.className =
      "card-body d-flex align-items-center justify-content-between gap-3";

    const habitoLeft = document.createElement("div");
    habitoLeft.className = "habito-left d-flex align-items-center gap-3 min-w-0";

    // Botón de check circular (.btn-toggle-check)
    const btnToggle = document.createElement("button");
    btnToggle.type = "button";
    btnToggle.className = "btn-toggle-check";
    btnToggle.setAttribute(
      "aria-label",
      habito.completado === true
        ? `Marcar ${habito.nombre} como pendiente`
        : `Completar hábito ${habito.nombre}`,
    );
    btnToggle.appendChild(crearIconoSvgCheck());

    const infoDiv = document.createElement("div");
    infoDiv.className = "habito-info d-flex flex-column gap-1";

    // Asignación segura con textContent (Previene XSS)
    const tituloSpan = document.createElement("span");
    tituloSpan.className = "habito-titulo";
    tituloSpan.textContent = habito.nombre;

    const metaDiv = document.createElement("div");
    metaDiv.className = "habito-meta d-flex flex-wrap align-items-center gap-1";

    const categoria = habito.categoria || "general";
    const catBadge = document.createElement("span");
    catBadge.className = `badge-categoria badge-${categoria}`;
    catBadge.textContent = `${ICONOS_CATEGORIA[categoria] || "⭐"} ${categoria}`;
    metaDiv.appendChild(catBadge);

    if (habito.hora) {
      const horaBadge = document.createElement("span");
      horaBadge.className = "badge-hora";
      horaBadge.textContent = `⏰ ${habito.hora}`;
      metaDiv.appendChild(horaBadge);
    }

    const rachaBadge = document.createElement("span");
    rachaBadge.className = "badge-racha";
    rachaBadge.textContent = `🔥 ${habito.racha || 0}d`;
    rachaBadge.title = `Racha de ${habito.racha || 0} días consecutivos`;
    metaDiv.appendChild(rachaBadge);

    infoDiv.appendChild(tituloSpan);
    infoDiv.appendChild(metaDiv);

    habitoLeft.appendChild(btnToggle);
    habitoLeft.appendChild(infoDiv);

    // Botón de eliminar discreto que resalta en peligro al pasar el mouse
    const btnEliminar = document.createElement("button");
    btnEliminar.type = "button";
    btnEliminar.className = "btn-eliminar-habito";
    btnEliminar.setAttribute("aria-label", `Eliminar hábito ${habito.nombre}`);
    btnEliminar.title = "Eliminar hábito";
    btnEliminar.appendChild(crearIconoSvgPapelera());

    cardBody.appendChild(habitoLeft);
    cardBody.appendChild(btnEliminar);
    cardArticle.appendChild(cardBody);
    colLi.appendChild(cardArticle);
    contenedorHabitos.appendChild(colLi);
  });

  actualizarMetricas();
}

// ==========================================================================
// 9. Delegación de Eventos y Propagación (Event Bubbling y e.target.closest)
// ==========================================================================
contenedorHabitos.addEventListener("click", (e) => {
  // Inspección del origen del evento con e.target y closest
  const btnToggle = e.target.closest(".btn-toggle-check");
  const btnEliminar = e.target.closest(".btn-eliminar-habito");
  const card = e.target.closest(".card-habito");

  if (!card) return;
  const id = card.dataset.id;

  if (btnToggle) {
    toggleCompletado(id);
  } else if (btnEliminar) {
    eliminarHabito(id);
  }
});

// ==========================================================================
// 10. Operaciones CRUD Conectadas a la API REST (con respaldo en localStorage)
// ==========================================================================
async function toggleCompletado(id) {
  try {
    const habitoActualizado = await toggleHabitoAPI(id);
    habitos = habitos.map((h) => (h.id === id ? habitoActualizado : h));
    guardarHabitos(habitos);
    renderizarHabitos();

    if (habitoActualizado.completado === true) {
      mostrarToast(
        `¡Bien hecho! Completaste "${habitoActualizado.nombre}".`,
        "success",
      );
    }
  } catch (error) {
    console.warn(
      "Error al alternar hábito en el servidor, aplicando respaldo local:",
      error.message,
    );
    const indice = habitos.findIndex((h) => h.id === id);
    if (indice === -1) return;

    const habito = habitos[indice];
    habito.completado = !habito.completado;
    if (habito.completado === true) {
      habito.racha = (habito.racha || 0) + 1;
    } else {
      habito.racha = Math.max(0, (habito.racha || 1) - 1);
    }

    guardarHabitos(habitos);
    renderizarHabitos();
    mostrarToast("Progreso actualizado en este dispositivo.", "info");
  }

  // Notificación nativa si se completó el 100% de los hábitos del día
  const pendientes = habitos.filter((h) => h.completado === false).length;
  const habitoReciente = habitos.find((h) => h.id === id);
  if (
    pendientes === 0 &&
    habitos.length > 0 &&
    habitoReciente &&
    habitoReciente.completado === true
  ) {
    dispararNotificacion(
      "🎉 ¡Objetivo del día superado!",
      "¡Completaste el 100% de tus hábitos programados hoy!",
    );
  }
}

async function eliminarHabito(id) {
  const habitoAEliminar = habitos.find((h) => h.id === id);
  const nombre = habitoAEliminar ? habitoAEliminar.nombre : "Hábito";

  try {
    await eliminarHabitoAPI(id);
    habitos = habitos.filter((h) => h.id !== id);
    guardarHabitos(habitos);
    renderizarHabitos();
    mostrarToast(`Se eliminó el hábito "${nombre}".`, "info");
  } catch (error) {
    console.warn(
      "Error al eliminar en el servidor, aplicando respaldo local:",
      error.message,
    );
    habitos = habitos.filter((h) => h.id !== id);
    guardarHabitos(habitos);
    renderizarHabitos();
    mostrarToast(`Se eliminó "${nombre}".`, "info");
  }
}

// ==========================================================================
// 11. Envío del Formulario con Estado de Carga ("Guardando...") y Validación
// ==========================================================================
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  ocultarAlertaFormulario();

  const nombre = inputNombre.value.trim();
  const categoria = selectCategoria.value || "general";
  const hora = inputHora.value || "08:00";

  if (nombre.length < 3 || nombre.length > 80) {
    inputNombre.focus();
    mostrarAlertaFormulario(
      "Por favor ingresa un nombre descriptivo para tu hábito (mínimo 3 caracteres).",
      "warning",
    );
    mostrarToast(
      "Ingresa un nombre de al menos 3 caracteres.",
      "warning",
    );
    return;
  }

  // Activar estado de carga mientras termina el fetch
  btnSubmitHabito.disabled = true;
  txtSubmitHabito.textContent = "Guardando...";

  try {
    const habitoCreado = await crearHabitoAPI({
      nombre,
      categoria,
      hora,
    });

    habitos.unshift(habitoCreado);
    guardarHabitos(habitos);
    renderizarHabitos();

    inputNombre.value = "";
    inputNombre.focus();
    mostrarAlertaFormulario(
      `¡"${habitoCreado.nombre}" se agregó a tu rutina diaria!`,
      "success",
    );

    dispararNotificacion(
      "Hábito Registrado",
      `"${habitoCreado.nombre}" ha sido añadido a tu lista diaria.`,
    );
  } catch (error) {
    mostrarAlertaFormulario(
      `No se pudo registrar el hábito: ${error.message}`,
      "warning",
    );
    mostrarToast(error.message, "warning");
  } finally {
    // Restaurar estado del botón submit
    btnSubmitHabito.disabled = false;
    txtSubmitHabito.textContent = "Agregar Hábito";
  }
});

// ==========================================================================
// 12. Manejo de Filtros Tipo Píldora y Persistencia en sessionStorage
// ==========================================================================
function sincronizarBotonesFiltro() {
  botonesFiltro.forEach((boton) => {
    const esActivo = boton.dataset.filtro === filtroActual;
    boton.classList.toggle("activo", esActivo);
    boton.setAttribute("aria-selected", esActivo ? "true" : "false");
  });
}

botonesFiltro.forEach((boton) => {
  boton.addEventListener("click", () => {
    filtroActual = boton.dataset.filtro;
    guardarFiltroSesion(filtroActual);
    sincronizarBotonesFiltro();
    renderizarHabitos();
  });
});

// ==========================================================================
// 13. Verificación Periódica de Recordatorios Horarios (Web Notifications API)
// ==========================================================================
function verificarRecordatoriosHorarios() {
  const ahora = new Date();
  const horas = String(ahora.getHours()).padStart(2, "0");
  const minutos = String(ahora.getMinutes()).padStart(2, "0");
  const horaActual = `${horas}:${minutos}`;

  habitos.forEach((habito) => {
    if (habito.completado === false && habito.hora === horaActual) {
      const claveRecordatorio = `${habito.id}-${horaActual}`;
      if (!recordatoriosDisparadosHoy.has(claveRecordatorio)) {
        recordatoriosDisparadosHoy.add(claveRecordatorio);
        dispararNotificacion(
          "⏰ Recordatorio de Hábito",
          `Es momento de realizar: "${habito.nombre}"`,
        );
      }
    }
  });
}

setInterval(verificarRecordatoriosHorarios, 30000);

// ==========================================================================
// 14. Inicialización de la Aplicación
// ==========================================================================
aplicarTemaVisual(obtenerModoTema());
actualizarSaludoUsuario();
inicializarContadorVisitas();
sincronizarBotonesFiltro();
actualizarEstadoBotonNotificaciones();
renderizarHabitos();
cargarConsejoDelDia();
sincronizarHabitosDesdeServidor();
