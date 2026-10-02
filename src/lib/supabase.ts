import { createClient } from "@supabase/supabase-js";

const defaultSupabaseUrl = "https://ydssmgkhvubevsqdlmib.supabase.co";
const defaultSupabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlkc3NtZ2todnViZXZzcWRsbWliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyMjQwMTQsImV4cCI6MjEwMDgwMDAxNH0.maGfIoKF5DTGTMD5ySKsLuFTV5d_ADNMxUIMbLIY2JM";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || defaultSupabaseUrl;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || defaultSupabaseAnonKey;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

function getSupabaseClient() {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }
  return supabase;
}

export type PatientData = {
  fullName: string;
  ageGroup: string;
  gender: string;
  symptoms: string[];
  angioplastyDone: string;
  stentCount: string;
  stentYear: string;
  bypassDone: string;
  bypassYear: string;
  medicalConditions: string[];
  demoInterest: string;
  demoDate: string;
  demoTime: string;
  phoneWhatsapp: string;
  city: string;
  email: string;
};

function generateUniqueCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'EECP-';
  for (let i = 0; i < 4; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  result += '-';
  for (let i = 0; i < 4; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

function calculateLeadScore(data: PatientData) {
  let score = 0;
  const cardiacSymptoms = ["Chest Pain", "Shortness of Breath", "Fatigue while Walking", "Heart Attack", "Dizziness"];
  if (data.symptoms.some(s => cardiacSymptoms.includes(s))) score += 30;
  if (data.angioplastyDone === "Yes" || data.bypassDone === "Yes") score += 20;
  if (data.demoInterest === "Yes") score += 20;
  if (data.demoDate && data.demoDate.trim() !== "") score += 15;
  if (["51-60", "61-70", "Above 70"].includes(data.ageGroup)) score += 15;
  return score;
}

export async function finalizePatientSubmission(patientData: PatientData) {
  const client = getSupabaseClient();
  const uniqueCode = generateUniqueCode();
  const leadScore = calculateLeadScore(patientData);
  
  const payload = {
    unique_code: uniqueCode,
    name: patientData.fullName || "Unnamed Patient",
    age_group: patientData.ageGroup,
    gender: patientData.gender,
    symptoms: patientData.symptoms,
    angioplasty_done: patientData.angioplastyDone,
    stent_count: patientData.stentCount,
    stent_year: patientData.stentYear,
    medical_conditions: patientData.medicalConditions,
    demo_interest: patientData.demoInterest,
    demo_date: patientData.demoDate,
    demo_time: patientData.demoTime,
    phone_whatsapp: patientData.phoneWhatsapp,
    city: patientData.city,
    email: patientData.email,
    lead_score: leadScore,
    status: "New",
  };

  if (client) {
    const { error } = await client.from("leads").insert([payload]);
    if (error) {
      console.error("Failed to save lead:", error);
    }
  }

  fetch('/api/notify-boss', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(e => console.error(e));

  return { uniqueCode };
}

export async function fetchPatients() {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client.from("leads").select("*").order("created_at", { ascending: false });
  if (error) return [];
  return data || [];
}

export async function updatePatientStatus(id: string, status: string, note?: string) {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.from("leads").update({ status }).eq("id", id).select().single();
  if (error) return null;
  return data;
}
