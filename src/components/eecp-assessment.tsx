"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, HeartPulse, ShieldCheck, Sparkles, Stethoscope, Clock3, Activity, Leaf, Zap, Copy } from "lucide-react";
import { useMemo, useState } from "react";
import { finalizePatientSubmission, PatientData } from "@/lib/supabase";

const CLINIC_WHATSAPP = "+971554710162";

const steps = [
  {
    key: "landing",
    title: "Let's Check Your Heart Health",
    subtitle: "This 2-minute assessment helps our medical team understand your condition and determine whether EECP therapy may be suitable for you.",
    type: "landing",
  },
  { key: "profile", title: "Let's start with your basic details", type: "mixed" },
  { key: "symptoms", title: "Have you experienced any of these?", type: "multi" },
  { key: "angioplasty", title: "Have you undergone Angioplasty?", type: "conditional" },
  { key: "conditions", title: "Do you have any of these medical conditions?", type: "multi" },
  { key: "demo", title: "Can you attend a 20-min free demo session at our Sheikh Zayed Road, Business Bay center?", type: "demo" },
  { key: "info", title: "Almost done — where should we send your results?", type: "info" },
  { key: "finish", title: "Assessment Submitted Successfully", type: "finish" },
] as const;

const ageOptions = ["Under 40", "40-50", "51-60", "61-70", "Above 70"];
const genderOptions = ["Male", "Female", "Prefer not to say"];
const symptomOptions = ["Chest Pain", "Shortness of Breath", "Fatigue while Walking", "Heart Attack", "Dizziness", "None"];
const conditionOptions = ["Diabetes", "High Blood Pressure", "High Cholesterol", "Kidney Disease", "Smoking History", "None"];
const stentOptions = ["1", "2", "3+", "Not Sure"];
const timeSlotOptions = ["Morning (9-12)", "Afternoon (12-4)", "Evening (4-8)"];

const reviews = [
  { name: "Deepak Kumar", role: "Recovery-focused patient", quote: "EECP therapy helped me feel more energized and comfortable during my recovery journey with Merlin Healthcare." },
  { name: "Badr", role: "Wellness seeker", quote: "The team at Merlin Healthcare made the experience reassuring, and the benefits of EECP felt clear and encouraging." },
  { name: "Shabnam", role: "Long-term care supporter", quote: "Merlin Healthcare offered a calm and supportive path to better wellness through EECP therapy." },
];

const getMinMaxDates = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const maxDate = new Date();
  maxDate.setDate(tomorrow.getDate() + 14);
  return {
    min: tomorrow.toISOString().split('T')[0],
    max: maxDate.toISOString().split('T')[0],
  };
};

export function EecpAssessment() {
  const [stepIndex, setStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    age: "",
    gender: "",
    symptoms: [] as string[],
    angioplasty: "",
    stents: "",
    angioplastyYear: "",
    conditions: [] as string[],
    demo: "",
    demoDate: "",
    demoTime: "",
    phoneWhatsapp: "",
    isWhatsappSame: true,
    altWhatsapp: "",
    city: "",
    email: "",
  });

  const currentStep = steps[stepIndex];
  const progress = ((stepIndex + 1) / (steps.length - 1)) * 100;

  const updateField = (key: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const canContinue = useMemo(() => {
    if (currentStep.key === "landing") return true;
    if (currentStep.key === "profile") return formData.fullName.trim() !== "" && formData.age !== "" && formData.gender !== "";
    if (currentStep.key === "symptoms") return formData.symptoms.length > 0;
    if (currentStep.key === "angioplasty") {
      if (!formData.angioplasty) return false;
      if (formData.angioplasty === "Yes") return formData.stents !== "" && formData.angioplastyYear !== "";
      return true;
    }
    if (currentStep.key === "conditions") return formData.conditions.length > 0;
    if (currentStep.key === "demo") {
      if (!formData.demo) return false;
      if (formData.demo === "Yes") return formData.demoDate !== "" && formData.demoTime !== "";
      return true;
    }
    if (currentStep.key === "info") {
      if (!formData.phoneWhatsapp || !formData.city) return false;
      if (!formData.isWhatsappSame && !formData.altWhatsapp) return false;
      return true;
    }
    return true;
  }, [currentStep.key, formData]);

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (stepIndex > 0) {
      setStepIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmissionError(null);

    const data: PatientData = {
      fullName: formData.fullName,
      ageGroup: formData.age,
      gender: formData.gender,
      symptoms: formData.symptoms,
      angioplastyDone: formData.angioplasty,
      stentCount: formData.stents,
      stentYear: formData.angioplastyYear,
      bypassDone: "No", // Defaulting since we merged questions
      bypassYear: "",
      medicalConditions: formData.conditions,
      demoInterest: formData.demo,
      demoDate: formData.demoDate,
      demoTime: formData.demoTime,
      phoneWhatsapp: formData.phoneWhatsapp,
      city: formData.city,
      email: formData.email,
    };

    try {
      const result = await finalizePatientSubmission(data);
      if (result && result.uniqueCode) {
         setGeneratedCode(result.uniqueCode);
      }
      setTimeout(() => {
        setIsSubmitting(false);
        handleNext();
      }, 800);
    } catch (error) {
      setIsSubmitting(false);
      setSubmissionError(error instanceof Error ? error.message : "Submission failed.");
    }
  };

  const { min: minDate, max: maxDate } = getMinMaxDates();

  const renderStepContent = () => {
    switch (currentStep.key) {
      case "landing":
        return (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-200">
              <HeartPulse className="h-8 w-8" />
            </div>
            <div className="space-y-3">
              <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-sm font-medium text-cyan-700">
                <Zap className="h-4 w-4" /> Merlin Life Sciences
              </div>
              <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">{currentStep.title}</h1>
              <p className="mx-auto max-w-2xl text-base text-slate-600">{currentStep.subtitle}</p>
            </div>
            
            <button
              onClick={handleNext}
              className="mx-auto mt-6 flex w-full sm:w-auto items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-orange-500 px-8 py-4 text-lg font-bold text-white shadow-xl shadow-red-500/30 transition hover:scale-[1.02] animate-heartbeat"
            >
              Start Assessment
            </button>

            <div className="grid gap-3 rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-4 text-left text-white shadow-xl sm:grid-cols-3 mt-8">
              <div className="flex items-center gap-2 rounded-2xl bg-white/10 p-3 text-sm"><Clock3 className="h-4 w-4 text-cyan-300" /> 2 Minutes</div>
              <div className="flex items-center gap-2 rounded-2xl bg-white/10 p-3 text-sm"><Sparkles className="h-4 w-4 text-cyan-300" /> Free Assessment</div>
              <div className="flex items-center gap-2 rounded-2xl bg-white/10 p-3 text-sm"><ShieldCheck className="h-4 w-4 text-cyan-300" /> Secure & Confidential</div>
            </div>
            
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-sm mt-4">
              <div className="flex items-center gap-2 text-cyan-700">
                <Activity className="h-5 w-5" />
                <h2 className="text-lg font-semibold text-slate-900">EECP Therapy in the UAE</h2>
              </div>
              <p className="mt-2 text-sm text-slate-600">A simple, non-invasive therapy designed to support circulation, recovery, energy, and overall wellness for everyday life.</p>
              <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                <div className="rounded-2xl bg-cyan-50 p-3">Better circulation</div>
                <div className="rounded-2xl bg-cyan-50 p-3">Improved recovery</div>
                <div className="rounded-2xl bg-cyan-50 p-3">Gentle wellness support</div>
              </div>
            </div>
            
            <div className="grid gap-3 md:grid-cols-3">
              {reviews.map((review) => (
                <div key={review.name} className="rounded-[24px] border border-slate-200 bg-gradient-to-br from-white to-cyan-50 p-4 text-left shadow-sm">
                  <p className="text-sm text-slate-700">“{review.quote}”</p>
                  <div className="mt-3">
                    <p className="text-sm font-semibold text-slate-900">{review.name}</p>
                    <p className="text-xs text-slate-500">{review.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case "profile":
        return (
          <div className="grid gap-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Your Name</label>
              <input value={formData.fullName} onChange={e => updateField("fullName", e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-0 focus:border-blue-600" placeholder="e.g. John Doe" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Age Group</label>
              <div className="flex flex-wrap gap-2">
                {ageOptions.map(opt => (
                  <button key={opt} onClick={() => updateField("age", opt)} className={`rounded-full border px-4 py-2 text-sm font-medium ${formData.age === opt ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-700'}`}>{opt}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Gender</label>
              <div className="flex flex-wrap gap-2">
                {genderOptions.map(opt => (
                  <button key={opt} onClick={() => updateField("gender", opt)} className={`rounded-full border px-4 py-2 text-sm font-medium ${formData.gender === opt ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-700'}`}>{opt}</button>
                ))}
              </div>
            </div>
          </div>
        );
      case "symptoms":
        return (
          <div className="grid gap-3">
            {symptomOptions.map((option) => {
              const selected = formData.symptoms.includes(option);
              return (
                <button
                  key={option}
                  onClick={() => {
                    const updated = selected
                      ? formData.symptoms.filter((item) => item !== option)
                      : [...formData.symptoms, option];
                    updateField("symptoms", updated);
                  }}
                  className={`rounded-2xl border px-4 py-4 text-left text-sm font-medium transition ${selected ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-blue-200"}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        );
      case "angioplasty":
        return (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {['Yes', 'No'].map((option) => (
                <button
                  key={option}
                  onClick={() => updateField("angioplasty", option)}
                  className={`rounded-2xl border px-4 py-4 text-center text-sm font-medium transition ${formData.angioplasty === option ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-blue-200"}`}
                >
                  {option}
                </button>
              ))}
            </div>
            {formData.angioplasty === "Yes" && (
              <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">How many stents?</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {stentOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => updateField("stents", option)}
                      className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${formData.stents === option ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-blue-200"}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">What year?</label>
                  <input
                    type="number"
                    min="1990"
                    max="2026"
                    value={formData.angioplastyYear}
                    onChange={(e) => updateField("angioplastyYear", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0 focus:border-blue-600"
                    placeholder="e.g. 2022"
                  />
                </div>
              </div>
            )}
          </div>
        );
      case "conditions":
        return (
          <div className="grid gap-3">
            {conditionOptions.map((option) => {
              const selected = formData.conditions.includes(option);
              return (
                <button
                  key={option}
                  onClick={() => {
                    const updated = selected
                      ? formData.conditions.filter((item) => item !== option)
                      : [...formData.conditions, option];
                    updateField("conditions", updated);
                  }}
                  className={`rounded-2xl border px-4 py-4 text-left text-sm font-medium transition ${selected ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-blue-200"}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        );
      case "demo":
        return (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {['Yes', 'No'].map((option) => (
                <button
                  key={option}
                  onClick={() => updateField("demo", option)}
                  className={`rounded-2xl border px-4 py-4 text-center text-sm font-medium transition ${formData.demo === option ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-blue-200"}`}
                >
                  {option}
                </button>
              ))}
            </div>
            {formData.demo === "Yes" && (
              <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Preferred Date</label>
                  <input
                    type="date"
                    min={minDate}
                    max={maxDate}
                    value={formData.demoDate}
                    onChange={(e) => updateField("demoDate", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0 focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Preferred Time Slot</label>
                  <div className="grid gap-2">
                    {timeSlotOptions.map(opt => (
                       <button
                         key={opt}
                         onClick={() => updateField("demoTime", opt)}
                         className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${formData.demoTime === opt ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm" : "border-slate-200 bg-white text-slate-700"}`}
                       >{opt}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case "info":
        return (
          <div className="grid gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">WhatsApp / Phone Number</label>
              <input value={formData.phoneWhatsapp} onChange={(e) => updateField("phoneWhatsapp", e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="e.g. +971 50 123 4567" />
              <label className="mt-3 flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input type="checkbox" checked={formData.isWhatsappSame} onChange={e => updateField("isWhatsappSame", e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                This number is also on WhatsApp
              </label>
            </div>
            {!formData.isWhatsappSame && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">WhatsApp Number (Optional)</label>
                <input value={formData.altWhatsapp} onChange={(e) => updateField("altWhatsapp", e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="e.g. +971 50 123 4567" />
              </div>
            )}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">City</label>
              <input value={formData.city} onChange={(e) => updateField("city", e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="e.g. Dubai" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Email (Optional)</label>
              <input type="email" value={formData.email} onChange={(e) => updateField("email", e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="e.g. john@example.com" />
            </div>
          </div>
        );
      case "finish":
        return (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold text-slate-900">{currentStep.title}</h2>
              <p className="text-sm text-slate-600">Thank you for submitting your information. Our EECP medical team will carefully review your assessment.</p>
            </div>
            
            <div className="rounded-[28px] border-2 border-emerald-500 bg-emerald-50 p-6 shadow-sm">
               <p className="font-bold text-slate-900 mb-2">Your Demo Reference Code</p>
               <div className="flex items-center justify-center gap-3">
                 <span className="text-3xl font-black text-emerald-700 tracking-wider font-mono">{generatedCode}</span>
                 <button onClick={() => navigator.clipboard.writeText(generatedCode)} className="p-2 bg-emerald-200 rounded-full hover:bg-emerald-300 transition">
                   <Copy className="w-5 h-5 text-emerald-800" />
                 </button>
               </div>
            </div>

            <div className="space-y-4">
               <p className="text-sm font-medium text-slate-700">📲 Send this code to us on WhatsApp to activate your EECP demo session.</p>
               <a 
                 href={`https://wa.me/${CLINIC_WHATSAPP.replace(/[^0-9]/g, '')}?text=${generatedCode}`} 
                 target="_blank" 
                 rel="noreferrer" 
                 className="inline-flex w-full items-center justify-center rounded-full bg-green-500 px-6 py-4 text-lg font-bold text-white shadow-lg transition hover:scale-[1.02]"
               >
                 Send Code on WhatsApp
               </a>
            </div>

            <button
              onClick={() => {
                setStepIndex(0);
                setFormData({
                  fullName: "", age: "", gender: "", symptoms: [], angioplasty: "", stents: "",
                  angioplastyYear: "", conditions: [], demo: "", demoDate: "", demoTime: "",
                  phoneWhatsapp: "", isWhatsappSame: true, altWhatsapp: "", city: "", email: ""
                });
                setGeneratedCode("");
              }}
              className="rounded-full mt-4 bg-slate-200 px-6 py-3 text-sm font-medium text-slate-700"
            >
              Return Home
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen p-4 text-slate-900 sm:p-6 lg:p-8 flex flex-col relative pb-32">
      <div className="mx-auto flex w-full max-w-6xl flex-col overflow-hidden rounded-[36px] border border-slate-200/80 bg-white/85 shadow-[0_30px_90px_-30px_rgba(15,23,42,0.35)] backdrop-blur">
        <div className="border-b border-slate-200 bg-gradient-to-r from-cyan-600 via-blue-600 to-slate-900 px-4 py-4 text-white sm:px-6">
          <div className="mb-3 h-2 overflow-hidden rounded-full bg-white/20">
            <motion.div initial={false} animate={{ width: `${progress}%` }} className="h-full rounded-full bg-cyan-300" transition={{ duration: 0.3 }} />
          </div>
          <div className="flex items-center justify-between text-sm text-cyan-50">
            <span>Step {Math.min(stepIndex, steps.length - 2)} of {steps.length - 2}</span>
            <span className="font-semibold">EECP Assessment</span>
          </div>
        </div>

        <div className="flex flex-col gap-6 p-4 sm:p-8 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
          <div className="flex-1">
            <div className="mb-6 flex flex-wrap items-center gap-3 rounded-3xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm sm:px-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500/15 to-blue-500/15 px-3 py-1 text-sm font-medium text-cyan-700">
                <Stethoscope className="h-4 w-4" />
                Medical Intake
              </div>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
              >
                {currentStep.key !== "landing" && currentStep.key !== "finish" && (
                  <div className="mb-6">
                    <h2 className="text-2xl font-semibold text-slate-900">{currentStep.title}</h2>
                  </div>
                )}
                {renderStepContent()}
                {submissionError && (
                  <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{submissionError}</p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="w-full max-w-sm rounded-[28px] border border-slate-200 bg-gradient-to-br from-cyan-50 via-blue-50 to-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
                <HeartPulse className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Your next steps</h3>
                <p className="text-sm text-slate-600">Friendly and secure medical screening</p>
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-white p-3 shadow-sm">• We review your answers with care.</div>
              <div className="rounded-2xl bg-white p-3 shadow-sm">• Your information stays confidential.</div>
              <div className="rounded-2xl bg-white p-3 shadow-sm">• Our team contacts you shortly after review.</div>
            </div>
            <div className="mt-5 rounded-2xl border border-cyan-100 bg-white/70 p-3 text-sm text-slate-600">
              <div className="flex items-center gap-2 text-cyan-700">
                <Leaf className="h-4 w-4" />
                <span className="font-medium">Designed for comfort and clarity</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {currentStep.key !== "landing" && currentStep.key !== "finish" && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/90 backdrop-blur-md px-4 py-4 sm:px-8 flex items-center justify-between">
          <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
            <button onClick={handlePrevious} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
              <ArrowLeft className="h-4 w-4" /> Previous
            </button>
            <button
              onClick={currentStep.key === "info" ? handleSubmit : handleNext}
              disabled={!canContinue || isSubmitting}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-cyan-200 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Submitting..." : currentStep.key === "info" ? "Submit Assessment" : "Next"}
              {!isSubmitting && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
