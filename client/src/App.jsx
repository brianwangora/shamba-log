import { useState, useCallback, useEffect } from "react";
import LocationPicker from "./components/LocationPicker";
import WeatherAlmanac from "./components/WeatherAlmanac";
import CanopyReport from "./components/CanopyReport";
import "./App.css";

const today = new Date().toLocaleDateString("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function entryNumber() {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const diff = new Date() - start;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default function App() {
  const [location, setLocation] = useState(null);
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(null);

  const [canopyResult, setCanopyResult] = useState(null);
  const [canopyLoading, setCanopyLoading] = useState(false);
  const [canopyError, setCanopyError] = useState(null);
  const [quota, setQuota] = useState(null);

  useEffect(() => {
    fetch("/api/trees/quota")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setQuota(data);
      })
      .catch(() => {});
  }, []);

  const fetchWeather = useCallback(async (loc) => {
    setWeatherLoading(true);
    setWeatherError(null);
    setWeather(null);

    try {
      if (loc.auto) {
        const res = await fetch("/api/geo");
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || data.error || "Could not detect location");
        setLocation({
          name: [data.geo?.city, data.geo?.country].filter(Boolean).join(", ") || "Detected location",
          lat: data.lat ?? data.location?.lat,
          lon: data.lon ?? data.location?.lon,
        });
        setWeather(data);
        setWeatherLoading(false);
        return;
      }

      setLocation(loc);

      const params = new URLSearchParams({
        lat: loc.lat,
        lon: loc.lon,
        days: 7,
        units: "metric",
      });
      const res = await fetch(`/api/weather?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Weather lookup failed");
      setWeather(data);
    } catch (err) {
      setWeatherError(err.message);
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  const handleCanopyAnalyze = useCallback(async ({ file, county, landAcres }) => {
    setCanopyLoading(true);
    setCanopyError(null);
    setCanopyResult(null);

    try {
      const formData = new FormData();
      formData.append("image", file);
      if (county) formData.append("county", county);
      if (landAcres) formData.append("landAcres", landAcres);
      if (location?.name) formData.append("location", location.name);

      const res = await fetch("/api/trees/analyze", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        const err = new Error(data.message || data.error || "Analysis failed");
        err.code = data.error;
        err.upgrade = data.upgrade;
        err.used = data.used;
        err.limit = data.limit;
        throw err;
      }
      setCanopyResult(data);

      fetch("/api/trees/quota")
        .then((r) => r.json())
        .then((d) => !d.error && setQuota(d))
        .catch(() => {});
    } catch (err) {
      setCanopyError({
        message: err.message,
        code: err.code,
        upgrade: err.upgrade,
        used: err.used,
        limit: err.limit,
      });
    } finally {
      setCanopyLoading(false);
    }
  }, [location]);

  return (
    <div className="page">
      <header className="masthead">
        <p className="masthead__eyebrow">Entry No. {entryNumber()}</p>
        <h1 className="masthead__title">Shamba Log</h1>
        <p className="masthead__subtitle">
          A field journal for weather conditions and canopy health, powered by
          WeatherAI
        </p>
        <p className="masthead__date">{today}</p>
      </header>

      <main className="journal">
        <section className="journal__entry">
          <div className="journal__entry-head">
            <span className="journal__entry-marker">I</span>
            <h2>Today's conditions</h2>
          </div>

          <LocationPicker onSelect={fetchWeather} loading={weatherLoading} />

          {weatherLoading && <p className="status status--loading">Checking the sky over {location?.name || "your farm"}…</p>}
          {weatherError && <p className="status status--error">{weatherError}</p>}

          {weather && location && (
            <>
              <p className="journal__location">— recorded at {location.name}</p>
              <WeatherAlmanac data={weather} units="metric" />
            </>
          )}
        </section>

        <hr className="journal__divider" />

        <section className="journal__entry">
          <div className="journal__entry-head">
            <span className="journal__entry-marker">II</span>
            <h2>Canopy &amp; tree health</h2>
          </div>
          <p className="journal__entry-intro">
            Upload an aerial or drone photo of the plot to count trees and
            assess canopy condition.
          </p>

          <CanopyReport
            onAnalyze={handleCanopyAnalyze}
            result={canopyResult}
            loading={canopyLoading}
            error={canopyError}
            quota={quota}
          />
        </section>
      </main>

      <footer className="colophon">
        <p>
          Built for the WeatherAI take-home challenge · Weather data via{" "}
          <code>/v1/weather</code> &amp; <code>/v1/weather-geo</code> · Canopy
          analysis via <code>/v1/trees/analyze</code>
        </p>
      </footer>
    </div>
  );
}