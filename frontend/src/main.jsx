import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const candidates = [
  { id: 1, name: "Rohit Sharma", role: "Data Scientist", score: 86, status: "Strong Match", skills: ["Python", "SQL", "ML"], date: "May 18, 2025" },
  { id: 2, name: "Priya Patel", role: "ML Engineer", score: 74, status: "Match", skills: ["Python", "TensorFlow", "Docker"], date: "May 18, 2025" },
  { id: 3, name: "Sneha Iyer", role: "Data Analyst", score: 62, status: "Hold", skills: ["SQL", "Power BI", "Excel"], date: "May 17, 2025" },
  { id: 4, name: "Arjun Mehta", role: "Backend Developer", score: 38, status: "Reject", skills: ["Python", "FastAPI", "Postgres"], date: "May 17, 2025" },
  { id: 5, name: "Vikram Singh", role: "AI Engineer", score: 81, status: "Strong Match", skills: ["Python", "LLM", "RAG"], date: "May 16, 2025" },
];

const defaultJobs = [
  { title: "Data Scientist", candidates: 32, fit: 68 },
  { title: "ML Engineer", candidates: 28, fit: 64 },
  { title: "Backend Developer", candidates: 22, fit: 58 },
  { title: "Data Analyst", candidates: 18, fit: 55 },
  { title: "AI Engineer", candidates: 14, fit: 50 },
];

const nav = [
  ["⌂", "Dashboard"], ["▣", "Jobs"], ["＋", "Create Job"], ["♙", "All Candidates"],
  ["＋", "Add Candidate"], ["↯", "Screening Pipeline"], ["◫", "Interviews"], ["?", "Question Bank"],
  ["▤", "Reports"], ["◒", "Analytics"], ["⚙", "Settings"],
];

function ScoreRing({ value = 0, small = false }) {
  return <div className={`score-ring ${small ? "small" : ""}`} style={{ "--score": `${value * 3.6}deg` }}><span>{value}</span><small>/100</small></div>;
}

function Status({ value }) {
  return <span className={`status ${value.toLowerCase().replaceAll(" ", "-")}`}>{value}</span>;
}

function StatCard({ icon, label, value, change, tone }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div><span>{label}</span><strong>{value}</strong><small>↗ {change} <em>vs last week</em></small></div></div>;
}

function Dashboard({ onScreen, onViewCandidate }) {
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState("Last 7 days");
  const filtered = useMemo(() => candidates.filter(c => `${c.name} ${c.role}`.toLowerCase().includes(query.toLowerCase())), [query]);

  return <div className="page-stack">
    <section className="welcome-row"><div><h2>Dashboard</h2><p>Welcome back! Here's what's happening with your hiring.</p></div><div className="header-actions"><div className="search"><span>⌕</span><input placeholder="Search candidates, jobs..." value={query} onChange={e => setQuery(e.target.value)} /></div><button className="icon-btn">♧</button><button className="primary" onClick={onScreen}>＋ Create Job <span>⌄</span></button></div></section>

    <section className="stats-grid five"><StatCard icon="♙" label="Total Candidates" value="128" change="12.5%" tone="purple" /><StatCard icon="♧" label="Screened" value="96" change="18.6%" tone="blue" /><StatCard icon="★" label="Strong Matches" value="28" change="25.3%" tone="green" /><StatCard icon="◫" label="Interviews" value="19" change="8.9%" tone="orange" /><StatCard icon="✦" label="Hired" value="5" change="66.7%" tone="pink" /></section>

    <section className="dashboard-grid top-grid">
      <div className="panel chart-panel"><div className="panel-head"><div><h3>Screening Trend</h3><p>Candidate activity across the pipeline</p></div><select value={period} onChange={e => setPeriod(e.target.value)}><option>Last 7 days</option><option>Last 30 days</option><option>This quarter</option></select></div><div className="line-chart"><div className="y-labels"><span>80</span><span>60</span><span>40</span><span>20</span><span>0</span></div><div className="chart-area"><div className="grid-lines"><i/><i/><i/><i/><i/></div><svg viewBox="0 0 700 210" preserveAspectRatio="none" aria-label="Screening trend"><polyline points="0,116 100,112 200,84 300,112 400,92 500,66 600,118 700,84" className="line purple-line"/><polyline points="0,150 100,142 200,132 300,148 400,130 500,142 600,158 700,138" className="line blue-line"/><polyline points="0,186 100,174 200,166 300,180 400,168 500,192 600,180 700,168" className="line green-line"/></svg><div className="x-labels"><span>May 12</span><span>May 13</span><span>May 14</span><span>May 15</span><span>May 16</span><span>May 17</span><span>May 18</span></div></div></div><div className="legend"><span><i className="dot purple"/>Screened</span><span><i className="dot blue"/>Interviews</span><span><i className="dot green"/>Strong Matches</span></div></div>
      <div className="panel status-panel"><div className="panel-head"><div><h3>Candidates by Status</h3><p>Current pipeline distribution</p></div></div><div className="donut-wrap"><div className="donut"><strong>128</strong><span>Total</span></div><div className="status-list"><span><i className="green"/>Strong Match <b>28</b><em>22%</em></span><span><i className="blue"/>Match <b>34</b><em>27%</em></span><span><i className="orange"/>Hold <b>36</b><em>28%</em></span><span><i className="red"/>Reject <b>30</b><em>23%</em></span></div></div></div>
      <div className="panel jobs-panel"><div className="panel-head"><div><h3>Top Jobs</h3><p>Roles attracting the most candidates</p></div><button className="link-btn">View all</button></div>{defaultJobs.map(j => <div className="job-row" key={j.title}><div className="job-icon">▣</div><div><strong>{j.title}</strong><span>{j.candidates} Candidates</span></div><div className="job-bar"><i style={{ width: `${j.fit}%` }}/></div><b>{j.fit}%</b></div>)}</div>
    </section>

    <section className="dashboard-grid bottom-grid">
      <div className="panel candidates-panel"><div className="panel-head"><div><h3>Recent Candidates</h3><p>Latest screening activity</p></div><button className="link-btn">View all</button></div><div className="table"><div className="table-head"><span>Candidate</span><span>Job</span><span>Overall Match</span><span>Status</span><span>Screened On</span></div>{filtered.slice(0, 5).map(c => <button className="table-row" key={c.id} onClick={() => onViewCandidate(c)}><div><span className="avatar">{c.name.split(" ").map(x => x[0]).join("")}</span><strong>{c.name}</strong></div><span>{c.role}</span><b className="match-score">{c.score}%</b><Status value={c.status}/><span>{c.date}</span></button>)}</div></div>
      <div className="panel pipeline-panel"><div className="panel-head"><div><h3>Screening Pipeline</h3><p>Evidence collected per stage</p></div><button className="link-btn">View all</button></div>{[["♙","Resume Analysis","128","purple"],["♧","GitHub Analysis","84","blue"],["★","Academic Evaluation","128","green"],["◫","Project Analysis","92","orange"],["✦","Interview Round","38","pink"]].map(([icon,label,value,tone]) => <div className="pipeline-step" key={label}><div className={`step-icon ${tone}`}>{icon}</div><span>{label}</span><b>{value}</b><em>›</em></div>)}</div>
      <div className="panel insights-panel"><div className="panel-head"><div><h3>AI Insights</h3><p>Patterns detected from screening data</p></div></div><div className="insight"><span className="insight-icon">🐍</span><div><small>High Demand Skill</small><strong>Python</strong><p>Found in 76% of top candidates</p></div></div><div className="insight"><span className="insight-icon">↗</span><div><small>Most Improving</small><strong>ML Engineers</strong><p>↑ 24% more strong matches this month</p></div></div><div className="insight"><span className="insight-icon">💡</span><div><small>Recommendation</small><strong>Cloud + MLOps skills</strong><p>Prioritize candidates with both</p></div></div></div>
    </section>
    <section className="ai-banner"><div className="ai-orb">✦</div><div><strong>AI-Powered Screening</strong><p>Our AI analyzed 128 candidates and found 28 strong matches that best fit your job requirements.</p></div><button className="outline" onClick={onScreen}>View Strong Matches →</button></section>
  </div>;
}

function CandidateScreening({ onBack, initialCandidate }) {
  const [form, setForm] = useState({ job_description: "Data Scientist — Python, SQL, machine learning, pandas, scikit-learn", github_username: "", tenth: "", twelfth: "", cgpa: "", projects: "", resume_text: "" });
  const [fileName, setFileName] = useState(""); const [loading, setLoading] = useState(false); const [extracting, setExtracting] = useState(false); const [result, setResult] = useState(initialCandidate?.result || null); const [error, setError] = useState("");
  const update = (key, value) => setForm(f => ({ ...f, [key]: value }));
  async function uploadResume(event) { const file = event.target.files?.[0]; if (!file) return; setFileName(file.name); setExtracting(true); setError(""); try { const body = new FormData(); body.append("file", file); const r = await fetch(`${API_BASE}/api/v1/resume/extract`, { method: "POST", body }); const d = await r.json(); if (!r.ok) throw new Error(d.detail || "Resume extraction failed"); update("resume_text", d.text); } catch (e) { setError(e.message); } finally { setExtracting(false); } }
  async function screen() { setLoading(true); setError(""); try { const payload = { ...form, projects: form.projects ? form.projects.split("\n").filter(Boolean) : [], tenth: Number(form.tenth || 0), twelfth: Number(form.twelfth || 0), cgpa: Number(form.cgpa || 0) }; const r = await fetch(`${API_BASE}/api/v1/screen`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); const d = await r.json(); if (!r.ok) throw new Error(d.detail || "Screening failed"); setResult(d); } catch (e) { setError(e.message || "Backend unavailable. Start FastAPI on port 8000."); } finally { setLoading(false); } }
  return <div className="page-stack"><section className="welcome-row"><div><p className="eyebrow">Candidate intake</p><h2>Screen a candidate</h2><p>Build an explainable candidate profile from resume, GitHub, academics and projects.</p></div><button className="ghost-btn" onClick={onBack}>← Dashboard</button></section><div className="screening-layout"><div className="panel form-panel"><label>Target job description<textarea value={form.job_description} onChange={e => update("job_description", e.target.value)}/></label><label>Resume PDF<input type="file" accept="application/pdf,.pdf" onChange={uploadResume} disabled={extracting}/><small>{extracting ? "Extracting resume…" : fileName || "Processed in memory; not persisted."}</small></label><label>Resume text<textarea placeholder="Paste resume text here..." value={form.resume_text} onChange={e => update("resume_text", e.target.value)}/></label><div className="two-col"><label>GitHub username<input value={form.github_username} onChange={e => update("github_username", e.target.value)} placeholder="octocat"/></label><label>CGPA<input type="number" min="0" max="10" step="0.01" value={form.cgpa} onChange={e => update("cgpa", e.target.value)} placeholder="8.5"/></label></div><div className="two-col"><label>10th %<input type="number" min="0" max="100" value={form.tenth} onChange={e => update("tenth", e.target.value)}/></label><label>12th %<input type="number" min="0" max="100" value={form.twelfth} onChange={e => update("twelfth", e.target.value)}/></label></div><label>Projects<textarea placeholder="One project per line" value={form.projects} onChange={e => update("projects", e.target.value)}/></label>{error && <div className="error-box">{error}</div>}<button className="primary full" onClick={screen} disabled={loading || extracting}>{loading ? "Running AI screening…" : "Run AI Screening →"}</button></div><div className="panel results-panel"><p className="eyebrow">Explainable output</p><h3>Screening result</h3>{!result ? <div className="result-placeholder"><div className="empty-icon">AI</div><p>Your score breakdown, evidence and human-review recommendation will appear here.</p></div> : <Result result={result}/>}</div></div></div>;
}

function Result({ result }) { const score = Math.round(result.screening_score || 0); return <><div className="result-score"><ScoreRing value={score}/><div><span>Overall screening score</span><strong>Human review required</strong></div></div><div className="breakdown">{Object.entries(result.breakdown || {}).filter(([k]) => k !== "total" && !k.endsWith("_contribution")).map(([key,value]) => <div key={key}><span>{key.replaceAll("_", " ")}</span><strong>{value}</strong></div>)}</div><div className="evidence"><h4>Evidence summary</h4><p>{result.resume?.summary || "Resume evidence processed."}</p><p>{result.github?.summary || "GitHub evidence processed."}</p><p>{result.projects?.summary || "Project evidence processed."}</p></div>{result.resume?.missing_skills?.length > 0 && <div className="evidence"><h4>Missing skills</h4><div className="tags">{result.resume.missing_skills.map(s => <i key={s}>{s}</i>)}</div></div>}</>; }

function Module({ title, icon, onScreen }) { return <div className="module-page"><div className="module-card"><div className="module-icon">{icon}</div><p className="eyebrow">Recruiter workspace</p><h2>{title}</h2><p>This module is wired into the CandidateIQ workspace. Use the screening engine to generate real candidate evidence and keep every hiring decision human-reviewed.</p><button className="primary" onClick={onScreen}>Open candidate screening →</button></div></div>; }

function App() { const [active, setActive] = useState("Dashboard"); const [candidate, setCandidate] = useState(null); const setPage = p => setActive(p); return <div className="app-shell"><aside className="sidebar"><div className="brand"><div className="brand-mark">CI</div><div><strong>CandidateIQ <b>AI</b></strong><span>Intelligent Hiring, Better Teams</span></div></div><div className="nav-groups"><div><small>MAIN</small>{nav.slice(0, 1).map(([i,n]) => <button key={n} className={`nav ${active === n ? "active" : ""}`} onClick={() => setPage(n)}><i>{i}</i>{n}</button>)}</div><div><small>JOBS</small>{nav.slice(1,3).map(([i,n]) => <button key={n} className={`nav ${active === n ? "active" : ""}`} onClick={() => setPage(n)}><i>{i}</i>{n}</button>)}</div><div><small>CANDIDATES</small>{nav.slice(3,6).map(([i,n]) => <button key={n} className={`nav ${active === n ? "active" : ""}`} onClick={() => setPage(n)}><i>{i}</i>{n}</button>)}</div><div><small>INTERVIEWS</small>{nav.slice(6,8).map(([i,n]) => <button key={n} className={`nav ${active === n ? "active" : ""}`} onClick={() => setPage(n)}><i>{i}</i>{n}</button>)}</div><div><small>REPORTS</small>{nav.slice(8,10).map(([i,n]) => <button key={n} className={`nav ${active === n ? "active" : ""}`} onClick={() => setPage(n)}><i>{i}</i>{n}</button>)}</div><div><small>SETTINGS</small>{nav.slice(10).map(([i,n]) => <button key={n} className={`nav ${active === n ? "active" : ""}`} onClick={() => setPage(n)}><i>{i}</i>{n}</button>)}</div></div><div className="sidebar-footer"><div className="privacy"><span>●</span> Local-first AI <small>Human review required</small></div><div className="profile"><div className="avatar">SD</div><div><strong>Snehasish Das</strong><span>Recruiter Admin</span></div><b>⌄</b></div><div className="dark-toggle"><span>☾</span> Dark Mode <i>●</i></div></div></aside><main className="main">{active === "Dashboard" && <Dashboard onScreen={() => setPage("Add Candidate")} onViewCandidate={c => { setCandidate(c); setPage("Candidates"); }}/>} {active === "Add Candidate" && <CandidateScreening onBack={() => setPage("Dashboard")}/>} {active === "Candidates" && <CandidateScreening onBack={() => setPage("Dashboard")} initialCandidate={candidate}/>} {!['Dashboard','Add Candidate','Candidates'].includes(active) && <Module title={active} icon={nav.find(x => x[1] === active)?.[0] || "✦"} onScreen={() => setPage("Add Candidate")}/>}</main></div>; }

createRoot(document.getElementById("root")).render(<React.StrictMode><App /></React.StrictMode>);
