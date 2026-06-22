import { useState, useRef } from "react";

export default function CanopyReport({ onAnalyze, result, loading, error, quota }) {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [county, setCounty] = useState("");
  const [landAcres, setLandAcres] = useState("");
  const fileInputRef = useRef(null);

  function handleFileChange(e) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!file) return;
    onAnalyze({ file, county, landAcres });
  }

  return (
    <div className="canopy">
      <p className="canopy__eyebrow">
        Canopy report
        {quota && (
          <span className="canopy__quota">
            {" "}
            · {quota.remaining}/{quota.limit} analyses left this month
          </span>
        )}
      </p>

      <form className="canopy__form" onSubmit={handleSubmit}>
        <div
          className={`canopy__drop ${preview ? "canopy__drop--filled" : ""}`}
          onClick={() => fileInputRef.current?.click()}
        >
          {preview ? (
            <img src={preview} alt="Selected farm plot" />
          ) : (
            <>
              <span className="canopy__drop-icon">⊕</span>
              <p>Drop a drone or aerial farm photo here</p>
              <p className="canopy__drop-hint">JPEG, PNG or WEBP · max 20MB</p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            hidden
          />
        </div>

        <div className="canopy__fields">
          <input
            type="text"
            placeholder="County (optional)"
            value={county}
            onChange={(e) => setCounty(e.target.value)}
          />
          <input
            type="number"
            step="any"
            placeholder="Plot size, acres (optional)"
            value={landAcres}
            onChange={(e) => setLandAcres(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="btn"
          disabled={!file || loading || quota?.remaining === 0}
        >
          {loading
            ? "Reading the canopy…"
            : quota?.remaining === 0
            ? "Monthly quota used up"
            : "Analyze plot"}
        </button>
      </form>

      {error && (
        error.code === "tree_quota_exceeded" ? (
          <div className="canopy__quota-block">
            <p className="canopy__quota-block-title">
              ⊘ Monthly analyses used up
            </p>
            <p className="canopy__quota-block-body">
              {error.used}/{error.limit} canopy analyses used this month on
              the free plan. The quota resets at the start of next month's
              billing period.
            </p>
            {error.upgrade && (
              <a
                className="canopy__quota-block-link"
                href={error.upgrade}
                target="_blank"
                rel="noreferrer"
              >
                View upgrade options →
              </a>
            )}
          </div>
        ) : (
          <p className="canopy__error">{error.message}</p>
        )
      )}

      {result && (
        <div className="canopy__result">
          {result.low_confidence && (
            <div className="canopy__low-confidence">
              <p className="canopy__low-confidence-title">
                ◐ Low confidence reading
              </p>
              <p className="canopy__low-confidence-body">
                The image didn't look like a clear top-down aerial or drone
                shot of tree canopy, so the count below isn't reliable. For an
                accurate reading, try a photo taken from directly overhead —
                drone, satellite, or aerial — showing the plot's tree crowns.
              </p>
            </div>
          )}

          <div className={`canopy__images ${result.low_confidence ? "canopy__images--muted" : ""}`}>
            {result.original_image_url && (
              <figure>
                <img src={result.original_image_url} alt="Original farm plot" />
                <figcaption>Original</figcaption>
              </figure>
            )}
            {result.overlay_image_url && (
              <figure>
                <img src={result.overlay_image_url} alt="Annotated canopy overlay" />
                <figcaption>Annotated</figcaption>
              </figure>
            )}
          </div>

          <div className={`canopy__sidebar ${result.low_confidence ? "canopy__sidebar--muted" : ""}`}>
            <p className="canopy__sidebar-title">Field tally</p>
            <ul className="canopy__tally">
              <li>
                <span>Trees counted</span>
                <strong>{result.total_tree_count}</strong>
              </li>
              {result.confidence_score != null && (
                <li>
                  <span>Confidence</span>
                  <strong>{Math.round(result.confidence_score * 100)}%</strong>
                </li>
              )}
              {result.tree_density_per_acre != null && (
                <li>
                  <span>Density / acre</span>
                  <strong>{result.tree_density_per_acre}</strong>
                </li>
              )}
              {result.canopy_coverage_pct != null && (
                <li>
                  <span>Canopy coverage</span>
                  <strong>{result.canopy_coverage_pct}%</strong>
                </li>
              )}
              {result.tree_species_guess && (
                <li>
                  <span>Likely species</span>
                  <strong>{result.tree_species_guess}</strong>
                </li>
              )}
            </ul>

            {result.tree_health && !result.low_confidence && (
              <>
                <p className="canopy__sidebar-title">Health breakdown</p>
                <div className="canopy__health-bar">
                  {(() => {
                    const { healthy = 0, needs_care = 0, needs_replacement = 0 } =
                      result.tree_health;
                    const total = healthy + needs_care + needs_replacement || 1;
                    return (
                      <>
                        <span
                          className="canopy__health-seg canopy__health-seg--good"
                          style={{ width: `${(healthy / total) * 100}%` }}
                        />
                        <span
                          className="canopy__health-seg canopy__health-seg--warn"
                          style={{ width: `${(needs_care / total) * 100}%` }}
                        />
                        <span
                          className="canopy__health-seg canopy__health-seg--bad"
                          style={{ width: `${(needs_replacement / total) * 100}%` }}
                        />
                      </>
                    );
                  })()}
                </div>
                <ul className="canopy__health-legend">
                  <li><span className="dot dot--good" /> Healthy: {result.tree_health.healthy}</li>
                  <li><span className="dot dot--warn" /> Needs care: {result.tree_health.needs_care}</li>
                  <li><span className="dot dot--bad" /> Needs replacement: {result.tree_health.needs_replacement}</li>
                </ul>
              </>
            )}
          </div>

          {(result.observations?.length > 0 || result.recommendations?.length > 0) && (
            <div className="canopy__notes">
              {result.observations?.length > 0 && (
                <div>
                  <p className="canopy__sidebar-title">Observations</p>
                  <ul>
                    {result.observations.map((obs, i) => (
                      <li key={i}>{obs}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.recommendations?.length > 0 && (
                <div>
                  <p className="canopy__sidebar-title">Recommended next steps</p>
                  <ul>
                    {result.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}