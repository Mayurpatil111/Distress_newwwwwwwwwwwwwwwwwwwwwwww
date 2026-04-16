import { useState, useMemo, useRef, useCallback } from "react";
import "./App.css";

const API_URL = "https://distressanalyzerv2-0.up.railway.app/process-image/";

/* ── Severity config ── */
const SEV = {
  SEVERE:   { color: "#dc2626", bg: "#fef2f2", label: "Severe"   },
  MODERATE: { color: "#d97706", bg: "#fffbeb", label: "Moderate" },
  MILD:     { color: "#16a34a", bg: "#f0fdf4", label: "Mild"     },
};

/* ── Helpers ── */
const pad          = (n) => String(n).padStart(2, "0");
const confColor    = (c) => c >= 0.6 ? "#16a34a" : c >= 0.4 ? "#d97706" : "#dc2626";
const confBg       = (c) => c >= 0.6 ? "#f0fdf4" : c >= 0.4 ? "#fffbeb" : "#fef2f2";
const typeLabel    = (t) => (t == null ? "Unknown" : String(t));
const typeDotColor = (t) => {
  const s = String(t ?? "");
  let h = 2166136261; // FNV-1a
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const hue = (h >>> 0) % 360;
  return `hsl(${hue} 75% 55%)`;
};

/* ════════════════════════════════════════
   APP
════════════════════════════════════════ */
export default function App() {
  const [file,        setFile]        = useState(null);
  const [preview,     setPreview]     = useState(null);
  const [processType, setProcessType] = useState("already_rotated");
  const [loading,     setLoading]     = useState(false);
  const [data,        setData]        = useState(null);
  const [error,       setError]       = useState(null);
  const [dragOver,    setDragOver]    = useState(false);
  const [typeScope,   setTypeScope]   = useState("predicted"); // "reported" | "predicted"
  const [filterSev,   setFilterSev]   = useState("ALL");
  const [filterType,  setFilterType]  = useState("ALL");
  const [hovered,     setHovered]     = useState(null);
  const fileRef = useRef(null);

  const handleFile = useCallback((f) => {
    if (!f?.type.startsWith("image/")) return;
    setFile(f);
    setData(null);
    setError(null);
    const r = new FileReader();
    r.onload = (e) => setPreview(e.target.result);
    r.readAsDataURL(f);
  }, []);

  const handleSubmit = async () => {
    if (!file || loading) return;
    setLoading(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    form.append("process_type", processType);
    try {
      const res = await fetch(API_URL, { method: "POST", body: form });
      if (!res.ok) throw new Error(`Server error — HTTP ${res.status}`);
      setData(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const scopedDefects = useMemo(() => {
    if (!data) return [];
    const want = String(typeScope);
    return data.defects.filter((d) => String(d.type ?? "").includes(want));
  }, [data, typeScope]);

  const scopedCounts = useMemo(() => {
    if (!data) return {};
    const want = String(typeScope);
    const counts = data.counts && typeof data.counts === "object" ? data.counts : {};
    return Object.fromEntries(
      Object.entries(counts).filter(([k]) => String(k).includes(want))
    );
  }, [data, typeScope]);

  const scopedCountsTotal = useMemo(() => {
    return Object.values(scopedCounts).reduce((sum, v) => sum + (Number(v) || 0), 0);
  }, [scopedCounts]);

  const stats = useMemo(() => {
    if (!data) return null;
    const bySev  = { MILD: 0, MODERATE: 0, SEVERE: 0 };
    scopedDefects.forEach((d) => {
      bySev[d.severity]  = (bySev[d.severity]  || 0) + 1;
    });
    return { bySev, total: scopedDefects.length };
  }, [data, scopedDefects]);

  const filtered = useMemo(() => {
    if (!data) return [];
    return scopedDefects.filter(
      (d) =>
        (filterSev  === "ALL" || d.severity === filterSev) &&
        (filterType === "ALL" || d.type     === filterType)
    );
  }, [data, scopedDefects, filterSev, filterType]);

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9" }}>

      {/* ════════ HEADER ════════ */}
      <header style={{
        background: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        position: "sticky", top: 0, zIndex: 50,
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      }}>
        <div style={{
          maxWidth: "1280px", margin: "0 auto",
          padding: "0 24px", height: "60px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "10px",
              background: "linear-gradient(135deg, #1e40af, #3b82f6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(59,130,246,0.4)",
            }}>
              <svg viewBox="0 0 20 20" fill="none" style={{ width: "20px", height: "20px" }}>
                <path d="M2 10 Q6 4 10 10 Q14 16 18 10"
                  stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
                <circle cx="6"  cy="8.5"  r="1.8" fill="#fbbf24"/>
                <circle cx="14" cy="11.5" r="1.8" fill="#f87171"/>
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", lineHeight: 1 }}>
                RoadScan AI
              </h1>
              <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
                Pavement Distress Analysis
              </p>
            </div>
          </div>

          {/* Status */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{
                width: "7px", height: "7px", borderRadius: "50%",
                background: "#22c55e", display: "inline-block",
                boxShadow: "0 0 0 2px rgba(34,197,94,0.2)",
              }} />
              <span style={{ fontSize: "12px", fontWeight: 500, color: "#16a34a" }}>
                System Online
              </span>
            </div>
            {data && (
              <span style={{
                fontSize: "12px", color: "#64748b",
                background: "#f1f5f9", padding: "3px 10px",
                borderRadius: "99px", border: "1px solid #e2e8f0",
              }}>
                {data.defects.length} defects found
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ════════ MAIN ════════ */}
      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "28px 24px 48px",
                     display: "flex", flexDirection: "column", gap: "24px" }}>

        {/* ── UPLOAD CARD ── */}
        <div className="card" style={{ padding: "28px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a",
                       marginBottom: "4px" }}>
            Upload Road Image
          </h2>
          <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "24px" }}>
            Upload a pavement survey image to detect and analyze road distresses automatically.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Drop Zone */}
            <div className={`lg:col-span-2 drop-zone ${dragOver ? "drag-over" : ""} ${preview ? "has-file" : ""}`}
                 style={{ minHeight: "200px", display: "flex", alignItems: "center",
                          justifyContent: "center", position: "relative", overflow: "hidden" }}
                 onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                 onDragLeave={() => setDragOver(false)}
                 onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                 onClick={() => !preview && fileRef.current?.click()}>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                     onChange={(e) => handleFile(e.target.files[0])} />

              {preview ? (
                <div style={{ width: "100%", position: "relative" }}>
                  <img src={preview} alt="preview"
                       style={{ width: "100%", height: "200px", objectFit: "cover",
                                borderRadius: "8px", display: "block" }} />
                  {/* Overlay */}
                  <div style={{ position: "absolute", inset: 0, borderRadius: "8px",
                                background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)" }} />
                  <div style={{ position: "absolute", bottom: "12px", left: "14px", right: "14px",
                                display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                      <p style={{ fontSize: "12px", fontWeight: 600, color: "#fff",
                                  maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis",
                                  whiteSpace: "nowrap" }}>{file.name}</p>
                      <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.65)",
                                  marginTop: "2px" }}>{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      style={{ fontSize: "11px", fontWeight: 600, color: "#fff",
                               background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
                               padding: "5px 12px", borderRadius: "6px", cursor: "pointer",
                               backdropFilter: "blur(4px)", transition: "background 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
                      onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
                      onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}>
                      Change
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "40px 24px", userSelect: "none" }}>
                  <div style={{
                    width: "52px", height: "52px", margin: "0 auto 16px",
                    background: "#eff6ff", borderRadius: "12px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg viewBox="0 0 24 24" fill="none" style={{ width: "26px", height: "26px" }}>
                      <path d="M12 4 L12 16 M7 9 L12 4 L17 9"
                        stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M4 18 L4 19.5 Q4 20 4.5 20 L19.5 20 Q20 20 20 19.5 L20 18"
                        stroke="#93c5fd" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "#334155" }}>
                    Drop your image here
                  </p>
                  <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
                    or <span style={{ color: "#3b82f6", fontWeight: 500 }}>click to browse</span>
                  </p>
                  <p style={{ fontSize: "11px", color: "#cbd5e1", marginTop: "10px" }}>
                    JPG, PNG, or BMP · Road survey images
                  </p>
                </div>
              )}
            </div>

            {/* Controls */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600,
                                color: "#374151", marginBottom: "6px" }}>
                  Image Orientation
                </label>
                <select className="filter-select" style={{ width: "100%", padding: "9px 12px",
                                                           fontSize: "13px" }}
                        value={processType}
                        onChange={(e) => setProcessType(e.target.value)}>
                  <option value="already_rotated">Already Oriented Correctly</option>
                  <option value="down_to_up">Captured Bottom to Top</option>
                  <option value="up_to_down">Captured Top to Bottom</option>
                </select>
                <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "5px" }}>
                  Choose how the image was captured
                </p>
              </div>

              <button className="analyze-btn" onClick={handleSubmit} disabled={!file || loading}>
                {loading ? (
                  <><span className="spinner" /> Analyzing Image...</>
                ) : (
                  <>
                    <svg viewBox="0 0 16 16" fill="none" style={{ width: "15px", height: "15px" }}>
                      <circle cx="8" cy="8" r="6.5" stroke="rgba(255,255,255,0.7)" strokeWidth="1.3"/>
                      <path d="M8 5 L8 8 L10.5 9.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    Analyze Image
                  </>
                )}
              </button>

              {file && !error && (
                <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px",
                              padding: "12px 14px", background: "#f8fafc" }}>
                  <p style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8",
                              letterSpacing: "0.06em", textTransform: "uppercase",
                              marginBottom: "8px" }}>Selected File</p>
                  <p style={{ fontSize: "12px", fontWeight: 500, color: "#334155",
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {file.name}
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between",
                                alignItems: "center", marginTop: "6px" }}>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#16a34a",
                                   display: "flex", alignItems: "center", gap: "4px" }}>
                      <svg viewBox="0 0 12 12" fill="none" style={{ width: "11px" }}>
                        <circle cx="6" cy="6" r="5.5" stroke="#16a34a" strokeWidth="1"/>
                        <path d="M3.5 6 L5.5 8 L8.5 4.5" stroke="#16a34a" strokeWidth="1.3"
                              strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Ready to scan
                    </span>
                  </div>
                </div>
              )}

              {error && (
                <div style={{ border: "1px solid #fecaca", borderRadius: "8px",
                              padding: "12px 14px", background: "#fef2f2" }}>
                  <p style={{ fontSize: "12px", fontWeight: 600, color: "#dc2626",
                              marginBottom: "3px" }}>Scan Failed</p>
                  <p style={{ fontSize: "12px", color: "#ef4444" }}>{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ════════ RESULTS ════════ */}
        {data && (
          <>
            {/* ── STAT CARDS ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Defects", value: stats.total,          color: "#3b82f6" },
                { label: "Severe",        value: stats.bySev.SEVERE,   color: "#dc2626" },
                { label: "Moderate",      value: stats.bySev.MODERATE, color: "#d97706" },
                { label: "Mild",          value: stats.bySev.MILD,     color: "#16a34a" },
                // { label: "Graph Edges",   value: data.meta.edges,      color: "#8b5cf6" },
              ].map(({ label, value, color }) => (
                <div key={label} className="stat-card">
                  <div className="accent-bar" style={{ background: color }} />
                  <div className="num" style={{ color }}>{value}</div>
                  <div className="lbl">{label}</div>
                </div>
              ))}
            </div>

            {/* ── TYPE BREAKDOWN ── */}
            <div className="card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <p className="section-title" style={{ marginBottom: 0 }}>Defect Type Breakdown</p>
                <div style={{
                  display: "inline-flex",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  padding: "4px",
                  gap: "4px",
                }}>
                  {[
                    { key: "reported", label: "Reported" },
                    { key: "predicted", label: "Predicted" },
                  ].map((opt) => {
                    const active = typeScope === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => {
                          setTypeScope(opt.key);
                          setFilterType("ALL");
                        }}
                        style={{
                          padding: "6px 10px",
                          fontSize: "12px",
                          fontWeight: 700,
                          borderRadius: "8px",
                          border: "none",
                          cursor: "pointer",
                          background: active ? "#1e40af" : "transparent",
                          color: active ? "#fff" : "#64748b",
                          transition: "background 0.15s, color 0.15s",
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(scopedCounts).map(([type, count]) => {
                  const pct   = scopedCountsTotal ? (count / scopedCountsTotal) * 100 : 0;
                  return (
                    <div key={type} className="stat-card" style={{ padding: "18px 18px 16px" }}>
                      <div className="accent-bar" style={{ background: typeDotColor(type) }} />
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{
                              width: "8px", height: "8px", borderRadius: "50%",
                              background: typeDotColor(type), display: "inline-block",
                              flexShrink: 0,
                            }} />
                            <span
                              title={typeLabel(type)}
                              style={{
                                fontSize: "13px",
                                fontWeight: 700,
                                color: "#0f172a",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {typeLabel(type)}
                            </span>
                          </div>
                          <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "8px" }}>
                            {pct.toFixed(0)}% of all detected defects
                          </div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "30px", fontWeight: 800, lineHeight: 1, color: typeDotColor(type) }}>
                            {count}
                          </div>
                          <div style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", marginTop: "6px" }}>
                            defects
                          </div>
                        </div>
                      </div>

                      <div className="prog-track" style={{ marginTop: "12px" }}>
                        <div className="prog-fill" style={{ width: `${pct}%`, background: typeDotColor(type) }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          
            {/* ── DEFECT DATABASE ── */}
            <div className="card" style={{ padding: "24px" }}>
              {/* Header */}
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between",
                            alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                <div>
                  <p className="section-title" style={{ marginBottom: "2px" }}>
                    Detected Defects
                  </p>
                  <p style={{ fontSize: "13px", color: "#64748b" }}>
                    Showing {filtered.length} of {stats.total} defects
                  </p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <select className="filter-select" value={filterSev}
                          onChange={(e) => setFilterSev(e.target.value)}>
                    <option value="ALL">All Severity Levels</option>
                    <option value="SEVERE">Severe Only</option>
                    <option value="MODERATE">Moderate Only</option>
                    <option value="MILD">Mild Only</option>
                  </select>
                  <select className="filter-select" value={filterType}
                          onChange={(e) => setFilterType(e.target.value)}>
                    <option value="ALL">All Types</option>
                    {Object.keys(scopedCounts).map((k) => (
                      <option key={k} value={k}>{typeLabel(k)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Grid */}
              {filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0" }}>
                  <div style={{ fontSize: "32px", marginBottom: "10px" }}>🔍</div>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "#374151" }}>
                    No defects match your filters
                  </p>
                  <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>
                    Try adjusting the severity or type filter above
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filtered.map((d) => (
                    <DefectCard key={d.id} d={d}
                      onEnter={() => setHovered(d)}
                      onLeave={() => setHovered(null)} />
                  ))}
                </div>
              )}
            </div>

            {/* ── SCAN INFO BAR ── */}
            <div style={{
              background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px",
              padding: "12px 20px", display: "flex", flexWrap: "wrap", gap: "6px 24px",
              alignItems: "center",
            }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8",
                             textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Scan Info
              </span>
              {[
                ["Total Defects",  data.defects.length],
                ["Graph Edges",    data.meta.edges],
                ["Components",     data.meta.components],
                ["Orientation",    processType.replace(/_/g, " ")],
              ].map(([k, v]) => (
                <span key={k} style={{ fontSize: "12px", color: "#64748b" }}>
                  {k}:{" "}
                  <span style={{ fontWeight: 600, color: "#334155" }}>{v}</span>
                </span>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

/* ════════════════════════════════════════
   DEFECT CARD
════════════════════════════════════════ */
function DefectCard({ d, onEnter, onLeave }) {
  const sev  = SEV[d.severity]  || {};
  const cc   = confColor(d.confidence);
  const cbg  = confBg(d.confidence);

  return (
    <div className="defect-card"
         onMouseEnter={onEnter}
         onMouseLeave={onLeave}
         style={{ borderLeft: `3px solid ${sev.color}` }}>

      {/* ── Header ── */}
      <div className="dc-header">
        <div style={{ display: "flex", justifyContent: "space-between",
                      alignItems: "flex-start" }}>
          {/* Left: severity + type */}
          <div>
            <span className={`sev-badge ${d.severity}`}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%",
                             background: sev.color, display: "inline-block" }} />
              {sev.label}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px",
                          marginTop: "8px" }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%",
                             background: typeDotColor(d.type), display: "inline-block",
                             flexShrink: 0 }} />
              <span style={{ fontSize: "12px", fontWeight: 500, color: "#64748b" }}>
                {typeLabel(d.type)}
              </span>
            </div>
          </div>

          {/* Right: ID */}
          <div style={{ textAlign: "right" }}>
            <span style={{
              fontSize: "20px", fontWeight: 800, color: "#1e293b",
              fontFamily: "'JetBrains Mono', monospace", lineHeight: 1,
            }}>
              #{pad(d.id)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Location ── */}
      <div className="dc-section">
        <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em",
                    textTransform: "uppercase", color: "#94a3b8", marginBottom: "10px" }}>
          Location on Road
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#1e293b",
                         fontFamily: "'JetBrains Mono',monospace", whiteSpace: "nowrap" }}>
            {d.start}m
          </span>
          {/* Arrow line */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "3px",
                        minWidth: 0 }}>
            <div style={{ flex: 1, height: "2px", background: "#e2e8f0",
                          borderRadius: "1px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0,
                            background: `linear-gradient(90deg, ${sev.color}, ${sev.color}60)`,
                            borderRadius: "1px" }} />
            </div>
            <svg viewBox="0 0 8 8" fill="none" style={{ width: "8px", flexShrink: 0 }}>
              <path d="M1 4 L7 4 M4.5 1.5 L7 4 L4.5 6.5"
                stroke={sev.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#1e293b",
                         fontFamily: "'JetBrains Mono',monospace", whiteSpace: "nowrap" }}>
            {d.end}m
          </span>
        </div>
        <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "6px" }}>
          Span: <span style={{ fontWeight: 600, color: "#374151" }}>{d.length}m</span> long,{" "}
          <span style={{ fontWeight: 600, color: "#374151" }}>{d.width}m</span> wide
        </p>
      </div>

      {/* ── Metrics ── */}
      <div className="dc-section" style={{ borderBottom: "none" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
          <div className="metric-cell">
            <p className="mc-lbl">Max Depth</p>
            <p className="mc-val" style={{ color: sev.color }}>{d.max_depth}mm</p>
          </div>
          <div className="metric-cell">
            <p className="mc-lbl">Length</p>
            <p className="mc-val">{d.length}m</p>
          </div>
          <div className="metric-cell">
            <p className="mc-lbl">Width</p>
            <p className="mc-val">{d.width}m</p>
          </div>
        </div>
      </div>

      {/* ── Footer: sensors + confidence ── */}
      <div className="dc-footer">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Sensors chip */}
         

          {/* Confidence */}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between",
                          alignItems: "center", marginBottom: "5px" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#64748b" }}>
                Confidence
              </span>
              <span style={{
                fontSize: "11px", fontWeight: 700, color: cc,
                background: cbg, padding: "1px 7px", borderRadius: "99px",
              }}>
                {(d.confidence * 100).toFixed(0)}%
              </span>
            </div>
            <div className="conf-track">
              <div className="conf-fill" style={{ width: `${d.confidence * 100}%`,
                                                   background: cc }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   TIMELINE
════════════════════════════════════════ */
function DefectTimeline({ defects, onHover }) {
  const W = 900, H = 96, PX = 32, roadY = 50;
  const positions = defects.flatMap((d) => [d.start, d.end]);
  const minPos    = Math.min(...positions);
  const maxPos    = Math.max(...positions);
  const range     = maxPos - minPos || 1;
  const toX       = (p) => PX + ((p - minPos) / range) * (W - PX * 2);
  const TICKS     = 9;

  return (
    <div className="timeline-wrap">
      <svg viewBox={`0 0 ${W} ${H}`}
           style={{ width: "100%", height: "auto", display: "block" }}
           preserveAspectRatio="xMidYMid meet">

        {/* Tick lines + labels */}
        {Array.from({ length: TICKS + 1 }, (_, i) => {
          const x   = PX + (i / TICKS) * (W - PX * 2);
          const val = minPos + (i / TICKS) * range;
          return (
            <g key={i}>
              <line x1={x} y1={10} x2={x} y2={H - 14}
                    stroke="#e2e8f0" strokeWidth="1" />
              <text x={x} y={H - 3} fill="#94a3b8" fontSize="7.5"
                    textAnchor="middle" fontFamily="'JetBrains Mono',monospace">
                {val.toFixed(1)}m
              </text>
            </g>
          );
        })}

        {/* Road track */}
        <rect x={PX} y={roadY - 7} width={W - PX * 2} height={14}
              rx={3} fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1" />
        <line x1={PX} y1={roadY} x2={W - PX} y2={roadY}
              stroke="#cbd5e1" strokeWidth="1" strokeDasharray="10 7" />

        {/* Defect markers */}
        {defects.map((d) => {
          const x1    = toX(d.start);
          const x2    = toX(d.end);
          const color = SEV[d.severity]?.color || "#888";
          const isPoint = Math.abs(x2 - x1) < 3;
          const cx    = isPoint ? x1 : (x1 + x2) / 2;

          return (
            <g key={d.id} style={{ cursor: "pointer" }}
               onMouseEnter={() => onHover(d)}
               onMouseLeave={() => onHover(null)}>
              {isPoint ? (
                <circle cx={x1} cy={roadY} r={4.5} fill={color} opacity={0.85}>
                  <animate attributeName="r" values="4.5;6;4.5" dur="2s" repeatCount="indefinite"/>
                </circle>
              ) : (
                <rect x={x1} y={roadY - 5.5} width={Math.max(x2 - x1, 5)} height={11}
                      rx={2} fill={color} opacity={0.85} />
              )}
              <line x1={cx} y1={roadY - (isPoint ? 5 : 6)} x2={cx} y2={roadY - 18}
                    stroke={color} strokeWidth="1" opacity={0.35} />
              <circle cx={cx} cy={roadY - 20} r={2} fill={color} opacity={0.5} />
            </g>
          );
        })}

        {/* Legend */}
        {[["Severe","#dc2626"],["Moderate","#d97706"],["Mild","#16a34a"]].map(([label, color], i) => (
          <g key={label} transform={`translate(${W - 215 + i * 72}, 6)`}>
            <circle cx={5} cy={5} r={3.5} fill={color} />
            <text x={13} y={9.5} fill="#64748b" fontSize="8.5"
                  fontFamily="'Inter',sans-serif">{label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}
