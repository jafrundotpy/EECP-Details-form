"use client";

import { motion } from "framer-motion";
import { Activity, ArrowRight, LogOut, Search, ShieldCheck, UserCircle2, Download, Filter } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { fetchPatients, updatePatientStatus } from "@/lib/supabase";

type Status = "New" | "Contacted" | "Booked" | "Completed";

type Patient = {
  id: string;
  uniqueCode: string;
  name: string;
  phone: string;
  age: string;
  gender: string;
  city: string;
  symptoms: string;
  demoDate: string;
  demoTime: string;
  assessmentDate: string;
  score: number;
  status: Status;
  notes?: string;
};

const statuses: Status[] = ["New", "Contacted", "Booked", "Completed"];

export function AdminDashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<"ALL" | "HOT" | "WARM" | "COLD">("ALL");

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      if (filterMode === "HOT" && patient.score < 70) return false;
      if (filterMode === "WARM" && (patient.score >= 70 || patient.score < 40)) return false;
      if (filterMode === "COLD" && patient.score >= 40) return false;
      
      const searchValue = search.toLowerCase();
      return [patient.name, patient.city, patient.phone, patient.uniqueCode, patient.status].some((value) => value.toLowerCase().includes(searchValue));
    });
  }, [patients, search, filterMode]);

  useEffect(() => {
    const loadPatients = async () => {
      const rows = await fetchPatients();
      const mapped = rows.map((row: any) => ({
        id: row.id,
        uniqueCode: row.unique_code || "N/A",
        name: row.name || "Unnamed Patient",
        phone: row.phone_whatsapp || "N/A",
        age: row.age_group || "0",
        gender: row.gender || "N/A",
        city: row.city || "N/A",
        symptoms: row.symptoms?.join(", ") || "None",
        demoDate: row.demo_date || "N/A",
        demoTime: row.demo_time || "N/A",
        assessmentDate: row.created_at?.slice(0, 10) || "N/A",
        score: Number(row.lead_score) || 0,
        status: (row.status as Status) || "New",
        notes: row.notes || "",
      }));
      setPatients(mapped);
      if (mapped.length) {
        setSelectedPatient(mapped[0]);
      }
      setLoading(false);
    };

    loadPatients();
  }, []);

  const updateStatus = async (id: string, status: Status) => {
    const patient = patients.find((entry) => entry.id === id);
    if (!patient) return;

    const updated = await updatePatientStatus(patient.id, status);
    
    setPatients((prev) => prev.map((entry) => (entry.id === id ? { ...entry, status } : entry)));
    setSelectedPatient((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
  };

  const exportCSV = () => {
    const headers = ["Time", "Code", "Name", "Age", "Gender", "Symptoms", "Demo Date", "Demo Time", "Phone", "City", "Score", "Status"];
    const csvContent = [
      headers.join(","),
      ...filteredPatients.map(p => `"${p.assessmentDate}","${p.uniqueCode}","${p.name}","${p.age}","${p.gender}","${p.symptoms}","${p.demoDate}","${p.demoTime}","${p.phone}","${p.city}","${p.score}","${p.status}"`)
    ].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "patients.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-900 sm:p-6 lg:p-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">Admin Portal</p>
            <h1 className="text-2xl font-semibold">EECP Patient Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={exportCSV} className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600">
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.35fr_0.9fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  <Search className="h-4 w-4" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="bg-transparent outline-none" />
                </label>
                <select value={filterMode} onChange={e => setFilterMode(e.target.value as any)} className="rounded-full border border-slate-200 px-3 py-2 text-sm">
                  <option value="ALL">All Leads</option>
                  <option value="HOT">🔥 HOT (≥70)</option>
                  <option value="WARM">🟡 WARM (40-69)</option>
                  <option value="COLD">🔵 COLD (&lt;40)</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-3">Code</th>
                    <th className="px-3 py-3">Name</th>
                    <th className="px-3 py-3">Score</th>
                    <th className="px-3 py-3">Phone</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-sm text-slate-500">Loading patients from Supabase...</td>
                    </tr>
                  ) : filteredPatients.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-sm text-slate-500">No patients found.</td>
                    </tr>
                  ) : filteredPatients.map((patient) => (
                    <tr key={patient.id} className={`border-t border-slate-100 ${selectedPatient?.id === patient.id ? "bg-blue-50/80" : "bg-white"}`}>
                      <td className="px-3 py-3 font-mono text-xs">{patient.uniqueCode}</td>
                      <td className="px-3 py-3">
                        <button className="flex items-center gap-2 font-medium text-slate-800" onClick={() => setSelectedPatient(patient)}>
                           {patient.name}
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${patient.score >= 70 ? 'bg-red-100 text-red-700' : patient.score >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                          {patient.score}
                        </span>
                      </td>
                      <td className="px-3 py-3">{patient.phone}</td>
                      <td className="px-3 py-3">
                        <select value={patient.status} onChange={(e) => updateStatus(patient.id, e.target.value as Status)} className="rounded border border-slate-200 bg-white px-2 py-1 text-xs font-medium outline-none">
                          {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-3">
                         <button onClick={() => updateStatus(patient.id, "Booked")} className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs">Mark Booked</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <motion.aside initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-blue-600 to-slate-900 p-5 text-white shadow-sm">
            {selectedPatient ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-100">Medical Profile</p>
                    <h2 className="text-xl font-semibold">{selectedPatient.name}</h2>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3">
                    <Activity className="h-5 w-5" />
                  </div>
                </div>
                <div className="rounded-[20px] bg-white/10 p-4 text-sm">
                  <p><span className="text-blue-100">Code:</span> {selectedPatient.uniqueCode}</p>
                  <p><span className="text-blue-100">Phone:</span> {selectedPatient.phone}</p>
                  <p><span className="text-blue-100">Age/Gender:</span> {selectedPatient.age} / {selectedPatient.gender}</p>
                  <p><span className="text-blue-100">Symptoms:</span> {selectedPatient.symptoms}</p>
                  <p><span className="text-blue-100">Demo Date/Time:</span> {selectedPatient.demoDate} {selectedPatient.demoTime}</p>
                  <p><span className="text-blue-100">Assessment Date:</span> {selectedPatient.assessmentDate}</p>
                </div>
              </div>
            ) : (
              <div className="text-sm text-blue-100">Select a patient to view details.</div>
            )}
          </motion.aside>
        </section>
      </div>
    </div>
  );
}
