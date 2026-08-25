import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const demoCandidates = [
  { name: "Aarav Sharma", role: "Data Scientist", score: 91, status: "Strong Match", skills: ["Python", "SQL", "ML"], interview: 88 },
  { name: "Priya Nair", role: "Data Analyst", score: 84, status: "Match", skills: ["SQL", "Power BI", "Python"], interview: 81 },
  { name: "Rohan Mehta", role: "ML Engineer", score: 72, status: "Hold", skills: ["Python", "TensorFlow", "Docker"], interview: 69 },
];

const jobs = ["Data Scientist", "Data Analyst", "ML Engineer", "Python Developer"];

function ScoreRing({ value }) {
  return <div className="score-ring"><span>{value}</span><small>/100</small></div>;
}

function Dashboard({ onNewCandidate }) {
  const [query, setQuery] = useState("");
  const [job, setJob] = useState("Data Scientist");
  const filtered = useMemo(() => demoCandidates.filter(c => c.name.toLowerCase().includes(query.toLowerCase()) || c.role.toLowerCase().includes(query.toLowerCase())), [query]);

  return <>
    <section className="hero">
      <div><span className="pill">AI Candidate Intelligence</span><h2>Make every hiring decision <em>evidence-led.</em></h2><p>Screen candidates against the job, inspect portfolio evidence, run adaptive interviews, and keep a human in the loop.</p><button className="primary hero-action" onClick={onNewCandidate}>+ Screen a candidate</button></div>
      <div className="hero-score"><ScoreRing value="86" /><span>Average candidate match</span></div>
    </section>
    <section className="stats"><div><span>Total candidates</span><strong>128</strong><small>+18% this month</small></div><div><span>Strong matches</span><strong>34</strong><small>26.6% of pipeline</small></div><div><span>Interviews completed</span><strong>47</strong><small>92% completion</small></div><div><span>Needs review</span><strong>12</strong><small>Human action required</small></div></section>
    <section className="content-grid">
      <div className="panel wide"><div className="panel-head"><div><h3>Candidate pipeline</h3><p>Ranked by job-relevant evidence</p></div><input placeholder="Search candidates..." value={query} onChange={e => setQuery(e.target.value)} /></div>{filtered.map(c => <div className="candidate-row" key={c.name}><div className="avatar large">{c.name.split(" ").map(x => x[0]).join("")}</div><div className="candidate-main"><strong>{c.name}</strong><span>{c.role}</span><div className="tags">{c.skills.map(s => <i key={s}>{s}</i>)}</div></div><div className="mini-score"><strong>{c.score}</strong><span>match</span></div><span className={`status ${c.status.toLowerCase().replace(" ", "-")}`}>{c.status}</span><button className="ghost">View →</button></div>)}</div>
      <div className="panel"><div className="panel-head"><div><h3>Target role</h3><p>Current screening profile</p></div></div><select value={job} onChange={e => setJob(e.target.value)}>{jobs.map(j => <option key={j}>{j}</option>)}</select><div className="match-box"><span>Role readiness</span><strong>84%</strong><div className="progress"><i style={{width:"84%"}} /></div></div><ul className="check-list"><li>Resume / JD matching</li><li>GitHub portfolio evidence</li><li>Project relevance</li><li>Adaptive interview</li></ul></div>
    </section>
  </>;
}

function CandidateScreening({ onDone }) {
  const [form, setForm] = useState({ job_description: "Data Scientist — Python, SQL, machine learning, pandas, scikit-learn", github_username: "", tenth: "", twelfth: "", cgpa: "", projects: "", resume_text: "" });
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const update = (key, value) => setForm(f => ({...f, [key]: value}));

  async function screen() {
    setLoading(true);
    try {
      const payload = {...form, projects: form.projects ? form.projects.split("\n").filter(Boolean) : [], tenth: Number(form.tenth || 0), twelfth: Number(form.twelfth || 0), cgpa: Number(form.cgpa || 0)};
      const response = await fetch(`${API_BASE}/api/v1/screen`, { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error("API unavailable");
      setResult(await response.json());
    } catch { setResult({error: "Backend unavailable. Start FastAPI on port 8000 to run live screening."}); }
    finally { setLoading(false); }
  }

  return <section className="screening-layout">
    <div className="panel form-panel"><div className="section-title"><div><p className="eyebrow">Candidate intake</p><h2>Screen a candidate</h2><p>Provide evidence, then let the screening engine build an explainable profile.</p></div><button className="ghost" onClick={onDone}>← Dashboard</button></div>
      <label>Target job description<textarea value={form.job_description} onChange={e => update("job_description", e.target.value)} /></label>
      <label>Resume text<textarea placeholder="Paste extracted resume text here..." value={form.resume_text} onChange={e => update("resume_text", e.target.value)} /></label>
      <label>Resume PDF<input type="file" accept=".pdf" onChange={e => setFileName(e.target.files?.[0]?.name || "")} /><small>{fileName || "PDF upload UI — connect parser endpoint for production extraction."}</small></label>
      <div className="two-col"><label>GitHub username<input value={form.github_username} onChange={e => update("github_username", e.target.value)} placeholder="octocat" /></label><label>CGPA<input type="number" min="0" max="10" step="0.01" value={form.cgpa} onChange={e => update("cgpa", e.target.value)} placeholder="8.5" /></label></div>
      <div className="two-col"><label>10th %<input type="number" min="0" max="100" value={form.tenth} onChange={e => update("tenth", e.target.value)} /></label><label>12th %<input type="number" min="0" max="100" value={form.twelfth} onChange={e => update("twelfth", e.target.value)} /></label></div>
      <label>Projects <textarea placeholder="One project per line" value={form.projects} onChange={e => update("projects", e.target.value)} /></label>
      <button className="primary full" onClick={screen} disabled={loading}>{loading ? "Running AI screening…" : "Run AI Screening →"}</button>
    </div>
    <div className="panel results-panel"><p className="eyebrow">Explainable output</p><h3>Screening result</h3>{!result && <div className="result-placeholder"><div className="empty-icon">AI</div><p>Your score breakdown, evidence and human-review recommendation will appear here.</p></div>}{result?.error && <div className="error-box">{result.error}</div>}{result && !result.error && <><div className="result-score"><ScoreRing value={Math.round(result.screening_score || 0)} /><div><span>Overall screening score</span><strong>{result.human_review_required ? "Human review required" : "Review complete"}</strong></div></div><div className="breakdown">{Object.entries(result.breakdown || {}).filter(([k]) => k !== "total").map(([key,value]) => <div key={key}><span>{key.replaceAll("_", " ")}</span><strong>{value}</strong></div>)}</div><div className="evidence"><h4>Evidence summary</h4><p>{result.resume?.summary || "Resume evidence processed."}</p><p>{result.github?.summary || "GitHub evidence processed."}</p><p>{result.projects?.summary || "Project evidence processed."}</p></div></>}</div>
  </section>;
}

function App() {
  const [active, setActive] = useState("Dashboard");
  const nav = ["Dashboard", "Candidates", "Jobs", "Interviews", "Reports"];
  return <div className="app-shell"><aside className="sidebar"><div className="brand"><div className="brand-mark">CI</div><div><strong>CandidateIQ</strong><span>AI recruitment intelligence</span></div></div><nav>{nav.map(item => <button key={item} className={active === item ? "nav active" : "nav"} onClick={() => setActive(item)}>{item}</button>)}</nav><div className="sidebar-bottom"><div className="privacy">● Local-first AI<br/><span>Human review required</span></div><div className="profile"><div className="avatar">SD</div><div><strong>Snehasish Das</strong><span>Recruiter Admin</span></div></div></div></aside><main className="main"><header className="topbar"><div><p className="eyebrow">Recruitment workspace</p><h1>{active}</h1></div><button className="primary" onClick={() => setActive("Candidates")}>+ New candidate</button></header>{active === "Dashboard" && <Dashboard onNewCandidate={() => setActive("Candidates")} />}{active === "Candidates" && <CandidateScreening onDone={() => setActive("Dashboard")} />}{!['Dashboard','Candidates'].includes(active) && <section className="empty-state"><div className="empty-icon">{active[0]}</div><h2>{active}</h2><p>Recruiter workflow module ready for the next integration step.</p><button className="primary" onClick={() => setActive("Dashboard")}>Back to dashboard</button></section>}</main></div>;
}

createRoot(document.getElementById("root")).render(<React.StrictMode><App /></React.StrictMode>);
