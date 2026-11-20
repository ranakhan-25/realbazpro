/* eslint-disable prettier/prettier */
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  MapPin,
  Search,
  Loader2,
  RefreshCw,
  Plus,
  Camera,
  Compass,
  ExternalLink,
  X,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { crApi } from "@/lib/crApi";
import { showAlert } from "@/lib/swal";

export default function CRVisitsPage() {
  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState<any[]>([]);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  // Photo viewer modal
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  // New Field Visit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [formData, setFormData] = useState({
    sale_agreement_id: "",
    action_date: new Date().toISOString().slice(0, 16),
    officer_name: "",
    customer_response: "",
    visit_outcome: "contact_made",
    geo_location: "",
    visit_photos: "",
    remarks: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [logs, agrs] = await Promise.all([
        crApi.getRecoveryLogs?.() ?? Promise.resolve([]),
        crApi.getAgreements?.() ?? Promise.resolve([]),
      ]);
      const rows = (Array.isArray(logs) ? logs : []).filter(
        (r: any) => r?.action_type === "in_person_visit"
      );
      setVisits(
        rows.map((r: any) => ({
          id: r?.id ?? r?.uuid,
          uuid: r?.uuid,
          customer_name: r?.sale_agreement?.customer_name ?? "—",
          agreement_number: r?.sale_agreement?.agreement_number ?? "—",
          unit_identifier: r?.sale_agreement?.unit_identifier ?? r?.sale_agreement?.unit_number ?? "—",
          visit_date: r?.action_date ? String(r.action_date).slice(0, 16).replace("T", " ") : "—",
          officer: r?.officer_name ?? "—",
          purpose: r?.customer_response ?? "—",
          outcome: r?.visit_outcome || r?.outcome_status || r?.outcome || "—",
          geo_location: r?.geo_location,
          visit_photos: r?.visit_photos,
          remarks: r?.remarks ?? "—",
        }))
      );
      setAgreements(Array.isArray(agrs) ? agrs : []);
    } catch (error) {
      console.error("Failed to load field visits:", error);
      setVisits([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFetchCurrentLocation = () => {
    if (!navigator.geolocation) {
      showAlert.warning("GPS Unavailable", "Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
        setFormData((prev) => ({ ...prev, geo_location: coords }));
        setLocating(false);
        showAlert.success("Coordinates Acquired", `GPS locked: ${coords}`);
      },
      (err) => {
        console.warn(err);
        setLocating(false);
        showAlert.error("GPS Failed", "Could not capture device coordinates.");
      },
      { timeout: 10000 }
    );
  };

  const handleSubmitVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sale_agreement_id) {
      showAlert.warning("Required", "Please select a customer agreement.");
      return;
    }
    if (!formData.officer_name.trim()) {
      showAlert.warning("Required", "Please provide visiting officer name.");
      return;
    }

    setSubmitting(true);
    try {
      await crApi.createRecoveryLog({
        sale_agreement_id: Number(formData.sale_agreement_id),
        action_type: "in_person_visit",
        action_date: formData.action_date,
        officer_name: formData.officer_name.trim(),
        customer_response: formData.customer_response.trim(),
        visit_outcome: formData.visit_outcome,
        outcome: formData.visit_outcome,
        outcome_status: formData.visit_outcome,
        geo_location: formData.geo_location.trim() || undefined,
        visit_photos: formData.visit_photos.trim() || undefined,
        remarks: formData.remarks.trim(),
      });
      setIsModalOpen(false);
      setFormData({
        sale_agreement_id: "",
        action_date: new Date().toISOString().slice(0, 16),
        officer_name: "",
        customer_response: "",
        visit_outcome: "contact_made",
        geo_location: "",
        visit_photos: "",
        remarks: "",
      });
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return visits;
    return visits.filter(
      (r) =>
        r.customer_name?.toLowerCase().includes(q) ||
        r.agreement_number?.toLowerCase().includes(q) ||
        r.officer?.toLowerCase().includes(q) ||
        r.outcome?.toLowerCase().includes(q)
    );
  }, [visits, search]);

  return (
    <div className="min-h-screen bg-canvas text-ink p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl border border-border bg-surface shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#0000F2]/10 text-[#0000F2] flex items-center justify-center">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink">Field Visits & Geolocation Proof</h1>
            <p className="text-xs text-ink-muted">
              Credit Realization / In-Person Recovery Visits with GPS Coordinates & Photo Evidence
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border bg-canvas text-xs font-semibold text-ink hover:bg-surface"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0000F2] text-white text-xs font-semibold hover:bg-blue-700 shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" /> Log Field Visit
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl border border-border bg-surface shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
            <input
              type="text"
              placeholder="Search customer, officer, outcome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 w-full rounded-lg border border-border bg-canvas text-ink text-xs focus:ring-2 focus:ring-[#0000F2]"
            />
          </div>
          <span className="text-xs text-ink-muted font-medium">
            Showing {filtered.length} Field Visit Records
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-ink-muted">
            <Loader2 className="w-8 h-8 animate-spin text-[#0000F2]" />
            <p className="text-xs">Loading GPS-tagged field visit records...</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-xs border-collapse text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-border text-ink-muted uppercase font-semibold">
                  <th className="px-3.5 py-3">#</th>
                  <th className="px-3.5 py-3">Customer & Agreement</th>
                  <th className="px-3.5 py-3">Unit / Property</th>
                  <th className="px-3.5 py-3">Visit Date & Time</th>
                  <th className="px-3.5 py-3">Field Officer</th>
                  <th className="px-3.5 py-3">Visit Outcome</th>
                  <th className="px-3.5 py-3">GPS Coordinates</th>
                  <th className="px-3.5 py-3">Evidence</th>
                  <th className="px-3.5 py-3">Field Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-ink-muted">
                      No field recovery visits logged yet. Use "Log Field Visit" to record one with GPS.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r, i) => (
                    <tr key={r.id} className="hover:bg-canvas/50 transition-colors">
                      <td className="px-3.5 py-3 text-ink-muted font-mono">{i + 1}</td>
                      <td className="px-3.5 py-3">
                        <div className="font-bold text-ink">{r.customer_name}</div>
                        <div className="text-[11px] text-ink-muted font-mono">{r.agreement_number}</div>
                      </td>
                      <td className="px-3.5 py-3 font-medium text-ink-muted">{r.unit_identifier}</td>
                      <td className="px-3.5 py-3 whitespace-nowrap font-mono">{r.visit_date}</td>
                      <td className="px-3.5 py-3 font-semibold text-ink">{r.officer}</td>
                      <td className="px-3.5 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold capitalize ${
                            r.outcome === "contact_made" || r.outcome === "resolved"
                              ? "bg-emerald-100 text-emerald-800"
                              : r.outcome === "customer_absent" || r.outcome === "premises_closed"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {r.outcome?.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        {r.geo_location ? (
                          <a
                            href={`https://maps.google.com/?q=${encodeURIComponent(r.geo_location)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-[#0000F2] hover:underline font-mono text-[11px] font-medium"
                          >
                            <Compass className="w-3 h-3" />
                            {r.geo_location}
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-3.5 py-3">
                        {r.visit_photos ? (
                          <button
                            type="button"
                            onClick={() => setActivePhoto(r.visit_photos)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 text-purple-700 hover:bg-purple-100 text-[11px] font-semibold"
                          >
                            <Camera className="w-3 h-3" /> Photo
                          </button>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-3.5 py-3 text-ink-muted max-w-xs truncate" title={r.purpose || r.remarks}>
                        {r.purpose || r.remarks}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Visit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 text-gray-900">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold">Log In-Person Field Visit</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitVisit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Customer Sale Agreement *
                </label>
                <select
                  required
                  value={formData.sale_agreement_id}
                  onChange={(e) => setFormData({ ...formData, sale_agreement_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#0000F2]"
                >
                  <option value="">Select Customer / Account...</option>
                  {agreements.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.agreement_number} - {a.customer_name} ({a.project_name || "Project"} {a.unit_number || ""})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Visiting Officer Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. S. M. Faruk"
                    value={formData.officer_name}
                    onChange={(e) => setFormData({ ...formData, officer_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#0000F2]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Visit Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.action_date}
                    onChange={(e) => setFormData({ ...formData, action_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#0000F2]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Visit Outcome *
                </label>
                <select
                  value={formData.visit_outcome}
                  onChange={(e) => setFormData({ ...formData, visit_outcome: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#0000F2]"
                >
                  <option value="contact_made">Contact Made (Customer Spoken With)</option>
                  <option value="partial_collected">Partial Payment Collected</option>
                  <option value="customer_absent">Customer Absent (Family Member Met)</option>
                  <option value="premises_closed">Premises Closed / Locked Door</option>
                  <option value="disputed_refusal">Disputed / Refused Payment</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-700">
                    GPS Coordinates (Latitude, Longitude)
                  </label>
                  <button
                    type="button"
                    onClick={handleFetchCurrentLocation}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0000F2] hover:underline"
                  >
                    <Compass className={`w-3 h-3 ${locating ? "animate-spin" : ""}`} />
                    Capture Device GPS
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="e.g. 23.810332, 90.412518"
                  value={formData.geo_location}
                  onChange={(e) => setFormData({ ...formData, geo_location: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-[#0000F2]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Visit Photo Evidence URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.visit_photos}
                  onChange={(e) => setFormData({ ...formData, visit_photos: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#0000F2]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Field Response & Customer Statement
                </label>
                <textarea
                  rows={2}
                  placeholder="Client confirmed payment on 28th via Sonali Bank pay order."
                  value={formData.customer_response}
                  onChange={(e) => setFormData({ ...formData, customer_response: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#0000F2]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#0000F2] text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Field Visit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Preview Modal */}
      {activePhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm font-bold text-gray-900">Field Visit Photo Evidence</span>
              <button onClick={() => setActivePhoto(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-xl overflow-hidden bg-black/5 flex items-center justify-center max-h-[70vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activePhoto}
                alt="Field visit evidence"
                className="max-h-[70vh] w-auto object-contain"
                onError={() => showAlert.error("Image Error", "Could not load the photo from provided URL.")}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
