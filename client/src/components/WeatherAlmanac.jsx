const WEATHER_ICONS = {
  clear: "☼",
  sunny: "☼",
  cloud: "☁",
  cloudy: "☁",
  overcast: "☁",
  rain: "☂",
  drizzle: "☂",
  storm: "⚡",
  thunder: "⚡",
  snow: "❄",
  fog: "≈",
  mist: "≈",
  wind: "≋",
};

function iconFor(condition = "") {
  const lower = condition.toLowerCase();
  for (const key of Object.keys(WEATHER_ICONS)) {
    if (lower.includes(key)) return WEATHER_ICONS[key];
  }
  return "○";
}

function formatDay(dateStr, idx) {
  if (idx === 0) return "Today";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", { weekday: "short" });
  } catch {
    return dateStr;
  }
}

export default function WeatherAlmanac({ data, units }) {
  if (!data) return null;

  const current = data.current || data.current_conditions || {};
  const forecast = data.forecast || data.daily || [];
  const aiSummary =
    data.ai_summary || data.summary || data.insight || data.ai?.summary;

  const unitSymbol = units === "imperial" ? "°F" : "°C";
  const windUnit = units === "imperial" ? "mph" : "km/h";

  return (
    <div className="almanac">
      <div className="almanac__header">
        <span className="almanac__icon" aria-hidden="true">
          {iconFor(current.condition || current.summary)}
        </span>
        <div>
          <p className="almanac__temp">
            {Math.round(current.temp ?? current.temperature ?? 0)}
            <span className="almanac__unit">{unitSymbol}</span>
          </p>
          <p className="almanac__condition">
            {current.condition || current.summary || "Conditions unavailable"}
          </p>
        </div>
        <dl className="almanac__stats">
          {current.humidity != null && (
            <div>
              <dt>Humidity</dt>
              <dd>{current.humidity}%</dd>
            </div>
          )}
          {(current.wind_speed != null || current.wind != null) && (
            <div>
              <dt>Wind</dt>
              <dd>
                {current.wind_speed ?? current.wind} {windUnit}
              </dd>
            </div>
          )}
          {current.precipitation != null && (
            <div>
              <dt>Rain</dt>
              <dd>{current.precipitation} mm</dd>
            </div>
          )}
        </dl>
      </div>

      {aiSummary && (
        <p className="almanac__ai-note">
          <span className="almanac__ai-label">Field note —</span> {aiSummary}
        </p>
      )}

      {forecast.length > 0 && (
        <div className="almanac__forecast">
          {forecast.slice(0, 7).map((day, idx) => (
            <div className="almanac__forecast-day" key={idx}>
              <p className="almanac__forecast-label">
                {formatDay(day.date, idx)}
              </p>
              <span className="almanac__forecast-icon" aria-hidden="true">
                {iconFor(day.condition || day.summary)}
              </span>
              <p className="almanac__forecast-temp">
                {Math.round(day.temp_max ?? day.max ?? day.temp ?? 0)}°
                <span className="almanac__forecast-low">
                  {" "}
                  {Math.round(day.temp_min ?? day.min ?? 0)}°
                </span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
