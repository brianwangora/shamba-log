# Shamba Log

A field journal for farm weather and canopy health, built on the WeatherAI API.

Built for the WeatherAI Software Developer take-home challenge.

## What it does

Shamba Log is a two-part farm advisory tool aimed at the kind of user WeatherAI's
own Bomet pilot is designed for. A smallholder farmer or agronomist who needs
two things in one place; **what the sky is about to do**, and **what the trees
on the plot actually look like right now**.

1. **Today's conditions** - pick a farm location (a Kenyan preset, manual
   coordinates, or auto-detect by IP) and get current conditions, a 7-day
   forecast, and WeatherAI's Gemini-generated field summary.
2. **Canopy & tree health** - upload a drone or aerial photo of the plot and
   get a tree count, density per acre, canopy coverage, a health breakdown
   (healthy / needs care / needs replacement), and the AI-generated
   observations and recommendations, alongside the annotated overlay image
   WeatherAI returns.

Both views draw on two distinct parts of the WeatherAI API; 
  1. weather forecasting
  2. computer-vision canopy analysis

to reflect how the two together actually support a farm decision, rather than wrapping a single endpoint.

## Why it's built this way

- **The backend exists to protect the API key.** All requests to WeatherAI go
  through a small Express server; the key never reaches the browser. This
  also gave a clean place to normalize WeatherAI's response shapes and
  reduce the surface area the frontend needs to know about.
- **React frontend, Node/Express backend**
- **Two endpoint families, not one.** `/v1/weather` (or `/v1/weather-geo` for
  IP auto-detect) for the almanac view, `/v1/trees/analyze` for the canopy
  report, plus `/v1/trees/quota` to surface remaining monthly analyses in the
  UI. This is a small detail that shows the quota system was actually read.

## Project structure

```
shamba-log/
├── server/              Express API proxy
│   ├── index.js
│   ├── package.json
│   └── .env.example
└── client/               React frontend (Vite)
    ├── src/
    │   ├── App.jsx
    │   ├── App.css
    │   ├── index.css
    │   └── components/
    │       ├── LocationPicker.jsx
    │       ├── WeatherAlmanac.jsx
    │       └── CanopyReport.jsx
    └── package.json
```

## Setup

You'll need a free WeatherAI API key — sign up at
[weather-ai.co](https://weather-ai.co) and generate one from
**Dashboard → API Keys**.

### 1. Backend

```bash
cd server
npm install
cp .env.example .env
# edit .env and paste your key into WEATHER_AI_API_KEY
npm start
```

The server runs on `http://localhost:4000`.

### 2. Frontend

In a second terminal:

```bash
cd client
npm install
npm run dev
```

The app runs on `http://localhost:5173` and proxies `/api/*` requests to the
backend automatically (configured in `vite.config.js`).

Open `http://localhost:5173` in your browser.

### 3. Try it

- Pick one of the Kenyan location presets (Bomet is the default-feeling
  choice, given WeatherAI's own pilot there), or click **Detect my location**.
- Upload any aerial/farm-style photo (even a stock drone shot of a field or
  orchard) for the canopy report. The `/v1/trees/analyze` endpoint works on
  any plausible aerial image, not just real farm survey data.