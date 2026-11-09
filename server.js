/**
 * ==========================================================================
 * HabitTracker - Servidor Backend y API REST (Fase 2)
 * Arquitectura: Servicio único en Node.js + Express (Opción B de despliegue)
 * Sirve el frontend estático desde /public y expone la API REST en /api
 * ==========================================================================
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import compression from "compression";

// Resolución de ruta absoluta del directorio del proyecto
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Carga de variables de entorno desde .env
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 3000;

// Claves secretas leídas exclusivamente en el servidor (nunca expuestas al cliente)
const APP_SECRET = process.env.APP_SECRET || "secreto_desarrollo_local";
const API_KEY = process.env.API_KEY || "api_key_desarrollo_local";

// 2. Middlewares de seguridad, análisis JSON y compresión HTTP (Gzip/Brotli)
app.use(cors());
app.use(compression());
app.use(express.json());

// Cabecera informativa de seguridad (sin exponer el valor de APP_SECRET ni API_KEY)
app.use((req, res, next) => {
  if (APP_SECRET && API_KEY) {
    res.setHeader("X-Content-Type-Options", "nosniff");
  }
  next();
});

// 3. Servir archivos estáticos del frontend desde la carpeta /public
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static("public"));

// ==========================================================================
// 4. Base de Datos en Memoria del Servidor (Inicializada con datos de Fase 1)
// ==========================================================================
const CATEGORIAS_VALIDAS = [
  "salud",
  "mente",
  "productividad",
  "deporte",
  "finanzas",
  "general",
];

const CONSEJOS_PRODUCTIVIDAD = [
  "La constancia de 5 minutos al día supera a la intensidad esporádica.",
  "Beber un vaso de agua al despertar activa tu metabolismo y mente.",
  "Divide tus metas grandes en micro-hábitos fáciles de cumplir.",
  "El mejor momento para registrar tu progreso es justo después de completar la acción.",
  "Agrupa un hábito nuevo junto a uno que ya realizas automáticamente cada mañana.",
];

let habitosEnMemoria = [
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
// 5. Rutas de la API REST (Respuestas JSON y códigos HTTP: 200, 201, 400, 404)
// ==========================================================================

/**
 * 1) GET /api/consejos
 * Devuelve código 200 con la lista de consejos de productividad y un consejo aleatorio.
 */
app.get("/api/consejos", (req, res) => {
  const indiceAleatorio = Math.floor(
    Math.random() * CONSEJOS_PRODUCTIVIDAD.length,
  );
  const consejoAleatorio = CONSEJOS_PRODUCTIVIDAD[indiceAleatorio];

  return res.status(200).json({
    consejos: CONSEJOS_PRODUCTIVIDAD,
    consejoAleatorio,
  });
});

/**
 * 2) GET /api/habitos
 * Devuelve código 200 con la lista de hábitos en memoria del servidor.
 */
app.get("/api/habitos", (req, res) => {
  return res.status(200).json(habitosEnMemoria);
});

/**
 * 3) POST /api/habitos
 * Recibe { nombre, categoria, hora }.
 * Valida en el servidor que nombre sea string no vacío tras .trim(), tenga entre 3 y 80 caracteres
 * y que la categoría sea válida. Devuelve 400 si falla o 201 con el objeto creado.
 */
app.post("/api/habitos", (req, res) => {
  const { nombre, categoria, hora } = req.body || {};

  if (typeof nombre !== "string" || nombre.trim() === "") {
    return res.status(400).json({
      error: "El nombre del hábito es obligatorio y no puede estar vacío.",
    });
  }

  const nombreLimpio = nombre.trim();

  if (nombreLimpio.length < 3 || nombreLimpio.length > 80) {
    return res.status(400).json({
      error:
        "El nombre del hábito debe tener entre 3 y 80 caracteres válidos.",
    });
  }

  if (
    typeof categoria !== "string" ||
    !CATEGORIAS_VALIDAS.includes(categoria)
  ) {
    return res.status(400).json({
      error: `La categoría seleccionada no es válida. Categorías permitidas: ${CATEGORIAS_VALIDAS.join(", ")}.`,
    });
  }

  const horaValida =
    typeof hora === "string" && /^\d{2}:\d{2}$/.test(hora.trim())
      ? hora.trim()
      : "08:00";

  const nuevoHabito = {
    id: `habito-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    nombre: nombreLimpio,
    categoria,
    hora: horaValida,
    completado: false,
    racha: 0,
    fechaCreacion: new Date().toISOString(),
  };

  habitosEnMemoria.unshift(nuevoHabito);

  return res.status(201).json(nuevoHabito);
});

/**
 * 4) PATCH /api/habitos/:id/toggle
 * Alterna completado y actualiza la racha.
 * Si el :id no existe, devuelve 404. Si existe, devuelve 200 con el hábito actualizado.
 */
app.patch("/api/habitos/:id/toggle", (req, res) => {
  const { id } = req.params;
  const indice = habitosEnMemoria.findIndex((h) => h.id === id);

  if (indice === -1) {
    return res.status(404).json({
      error: "Hábito no encontrado",
    });
  }

  const habito = habitosEnMemoria[indice];
  habito.completado = !habito.completado;

  if (habito.completado === true) {
    habito.racha = (habito.racha || 0) + 1;
  } else {
    habito.racha = Math.max(0, (habito.racha || 1) - 1);
  }

  return res.status(200).json(habito);
});

/**
 * 5) DELETE /api/habitos/:id
 * Elimina un hábito por ID.
 * Si no existe, devuelve 404. Si existe, devuelve 200 con { mensaje: "Hábito eliminado", id }.
 */
app.delete("/api/habitos/:id", (req, res) => {
  const { id } = req.params;
  const indice = habitosEnMemoria.findIndex((h) => h.id === id);

  if (indice === -1) {
    return res.status(404).json({
      error: "Hábito no encontrado",
    });
  }

  habitosEnMemoria.splice(indice, 1);

  return res.status(200).json({
    mensaje: "Hábito eliminado",
    id,
  });
});

// Middleware 404 para rutas de API no existentes
app.use("/api/*", (req, res) => {
  return res.status(404).json({
    error: `Ruta de API no encontrada: ${req.method} ${req.originalUrl}`,
  });
});

// ==========================================================================
// 6. Inicio del Servidor HTTP
// ==========================================================================
app.listen(PORT, () => {
  console.log(
    `Servidor HabitTracker ejecutándose en http://localhost:${PORT} (Entorno configurado con APP_SECRET: ${APP_SECRET ? "Activo" : "Inactivo"})`,
  );
});
