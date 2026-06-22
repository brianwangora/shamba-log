import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import fetch from "node-fetch";
import FormData from "form-data";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const API_BASE = "https://api.weather-ai.co";
const API_KEY = process.env.WEATHER_AI_API_KEY;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

app.use(cors());
app.use(express.json());

function requireApiKey(req, res, next) {
  if (!API_KEY) {
    return res.status(500).json({
      error: "Server misconfigured",
      message:
        "WEATHER_AI_API_KEY is not set. Copy .env.example to .env and add your key.",
    });
  }
  next();
}

app.use(requireApiKey);

/**
 * GET /api/weather?lat=&lon=&days=&units=
 * Proxies WeatherAI's /v1/weather endpoint.
 */
app.get("/api/weather", async (req, res) => {
  try {
    const { lat, lon, days = 7, units = "metric" } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: "lat and lon are required" });
    }

    const params = new URLSearchParams({ lat, lon, days, units });
    const response = await fetch(`${API_BASE}/v1/weather?${params}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (err) {
    console.error("Weather fetch failed:", err);
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
});

/**
 * GET /api/geo?ip=auto
 * Proxies WeatherAI's /v1/weather-geo for IP-based auto-detection.
 */
app.get("/api/geo", async (req, res) => {
  try {
    const response = await fetch(`${API_BASE}/v1/weather-geo?ip=auto&days=7`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json({
      ...data,
      geo: {
        country: response.headers.get("x-country"),
        region: response.headers.get("x-region"),
        city: response.headers.get("x-city"),
      },
    });
  } catch (err) {
    console.error("Geo lookup failed:", err);
    res.status(500).json({ error: "Failed to detect location" });
  }
});

/**
 * POST /api/trees/analyze
 * Accepts a multipart image upload from the client, forwards it to
 * WeatherAI's /v1/trees/analyze endpoint.
 */
app.post("/api/trees/analyze", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "An image file is required" });
    }

    const form = new FormData();
    form.append("image", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const { farmerId, county, landAcres, location, notes } = req.body;
    if (farmerId) form.append("farmerId", farmerId);
    if (county) form.append("county", county);
    if (landAcres) form.append("landAcres", landAcres);
    if (location) form.append("location", location);
    if (notes) form.append("notes", notes);

    const response = await fetch(`${API_BASE}/v1/trees/analyze`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        ...form.getHeaders(),
      },
      body: form,
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (err) {
    console.error("Tree analysis failed:", err);
    res.status(500).json({ error: "Failed to analyze image" });
  }
});

/**
 * GET /api/trees/quota
 * Proxies WeatherAI's /v1/trees/quota — shows remaining monthly analyses.
 */
app.get("/api/trees/quota", async (req, res) => {
  try {
    const response = await fetch(`${API_BASE}/v1/trees/quota`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error("Quota fetch failed:", err);
    res.status(500).json({ error: "Failed to fetch quota" });
  }
});

/**
 * GET /api/usage
 * Proxies WeatherAI's /v1/usage — shows overall API quota for the billing period.
 */
app.get("/api/usage", async (req, res) => {
  try {
    const response = await fetch(`${API_BASE}/v1/usage`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error("Usage fetch failed:", err);
    res.status(500).json({ error: "Failed to fetch usage" });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", hasApiKey: Boolean(API_KEY) });
});

app.listen(PORT, () => {
  console.log(`Farm Advisory server running on http://localhost:${PORT}`);
});
