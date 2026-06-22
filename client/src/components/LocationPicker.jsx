import { useState } from "react";

const PRESET_LOCATIONS = [
  { name: "Bomet, Kenya", lat: -0.7893, lon: 35.3411 },
  { name: "Nairobi, Kenya", lat: -1.2921, lon: 36.8219 },
  { name: "Nakuru, Kenya", lat: -0.3031, lon: 36.08 },
  { name: "Kakamega, Kenya", lat: 0.2827, lon: 34.7519 },
];

export default function LocationPicker({ onSelect, loading }) {
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [name, setName] = useState("");

  function handleManualSubmit(e) {
    e.preventDefault();
    if (!lat || !lon) return;
    onSelect({
      name: name || `${lat}, ${lon}`,
      lat: parseFloat(lat),
      lon: parseFloat(lon),
    });
  }

  function handleAutoDetect() {
    onSelect({ auto: true });
  }

  return (
    <div className="location-picker">
      <p className="location-picker__eyebrow">Where's the farm?</p>

      <div className="location-picker__presets">
        {PRESET_LOCATIONS.map((loc) => (
          <button
            key={loc.name}
            type="button"
            className="chip"
            onClick={() => onSelect(loc)}
            disabled={loading}
          >
            {loc.name}
          </button>
        ))}
        <button
          type="button"
          className="chip chip--accent"
          onClick={handleAutoDetect}
          disabled={loading}
        >
          ↻ Detect my location
        </button>
      </div>

      <form className="location-picker__form" onSubmit={handleManualSubmit}>
        <input
          type="text"
          placeholder="Farm name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="number"
          step="any"
          placeholder="Latitude"
          value={lat}
          onChange={(e) => setLat(e.target.value)}
          required
        />
        <input
          type="number"
          step="any"
          placeholder="Longitude"
          value={lon}
          onChange={(e) => setLon(e.target.value)}
          required
        />
        <button type="submit" className="btn btn--small" disabled={loading}>
          Use coordinates
        </button>
      </form>
    </div>
  );
}
