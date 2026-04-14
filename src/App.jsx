import React, { useState, useMemo } from "react";

export default function App() {
  const [file, setFile] = useState(null);
  const [processType, setProcessType] = useState("already_rotated");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please upload an image");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("process_type", processType);

    try {
      setLoading(true);
      const res = await fetch("https://distressanalyzerv2-0.up.railway.app/process-image/", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error(err);
      alert("Error processing image");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    if (severity === "SEVERE") return "bg-red-500";
    if (severity === "MODERATE") return "bg-yellow-400";
    return "bg-green-500";
  };

  // 🔢 Count calculations
  const stats = useMemo(() => {
    if (!data) return null;

    const severityCount = { MILD: 0, MODERATE: 0, SEVERE: 0 };
    const typeCount = {};

    data.defects.forEach((d) => {
      severityCount[d.severity]++;
      typeCount[d.type] = (typeCount[d.type] || 0) + 1;
    });

    return { severityCount, typeCount };
  }, [data]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">
          🚧 Road Crack Detection Dashboard
        </h1>

        {/* Upload */}
        <div className="bg-white shadow-xl rounded-2xl p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full border p-2 rounded-lg"
            />

            <select
              value={processType}
              onChange={(e) => setProcessType(e.target.value)}
              className="w-full border p-2 rounded-lg"
            >
              <option value="already_rotated">Already Rotated</option>
              <option value="down_to_up">Down to Up</option>
              <option value="up_to_down">Up to Down</option>
            </select>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            >
              {loading ? "Processing..." : "Upload & Process"}
            </button>
          </form>
        </div>

        {/* 📊 Stats Section */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Severity Count */}
            <div className="bg-white p-6 rounded-2xl shadow">
              <h2 className="text-xl font-semibold mb-4">Severity Count</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>MILD</span>
                  <span className="font-bold">{stats.severityCount.MILD}</span>
                </div>
                <div className="flex justify-between">
                  <span>MODERATE</span>
                  <span className="font-bold">{stats.severityCount.MODERATE}</span>
                </div>
                <div className="flex justify-between">
                  <span>SEVERE</span>
                  <span className="font-bold">{stats.severityCount.SEVERE}</span>
                </div>
              </div>
            </div>

            {/* Type Count */}
            <div className="bg-white p-6 rounded-2xl shadow">
              <h2 className="text-xl font-semibold mb-4">Distress Type Count</h2>
              <div className="space-y-2">
                {Object.entries(stats.typeCount).map(([type, count]) => (
                  <div key={type} className="flex justify-between">
                    <span>{type}</span>
                    <span className="font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {data && (
          <div className="bg-white shadow-xl rounded-2xl p-6">
            <h2 className="text-2xl font-semibold mb-4">
              📊 Detected Defects ({data.defects.length})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.defects.map((d) => (
                <div
                  key={d.id}
                  className="p-4 rounded-xl shadow border hover:shadow-lg transition"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold">#{d.id}</span>
                    <span
                      className={`text-white px-2 py-1 rounded text-sm ${getSeverityColor(
                        d.severity
                      )}`}
                    >
                      {d.severity}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-2">{d.type}</p>

                  <div className="text-sm space-y-1">
                    <p>📍 Start: {d.start}</p>
                    <p>📍 End: {d.end}</p>
                    <p>📏 Length: {d.length}</p>
                    <p>📐 Width: {d.width}</p>
                    <p>⬇ Depth: {d.max_depth}</p>
                    <p>📡 Sensors: {d.sensors}</p>
                    <p>🎯 Confidence: {(d.confidence * 100).toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Meta */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold">Meta Info</h3>
              <p>Edges: {data.meta.edges}</p>
              <p>Components: {data.meta.components}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
