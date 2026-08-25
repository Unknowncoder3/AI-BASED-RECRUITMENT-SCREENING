import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const demoCandidates = [
  { name: "Aarav Sharma", role: "Data Scientist", score: 91, status: "Strong Match", skills: ["Python", "SQL", "ML"], interview: 88 },
  { name: "Priya Nair", role: "Data Analyst", score: 84, status: "Match", skills: ["SQL", "Power BI", "Python"], interview: 81 },
  { name: "Rohan Mehta", role: "ML Engineer", score: 72, status: "Hold", skills: ["Python", "TensorFlow", "Docker"], interview: 69 },
];

function ScoreRing({ value }) {
  return <div className="score-ring"><span>{value}</span><small>/100</small></div>;
}

function App() {
  const [active, setActive] = useState("Dashboard");
  const [query, setQuery] = useState("");
  const [job, setJob] = useState("Data Scientist");
  const filtered = useMemo(() => demoCandidates.filter(c => c.name.toLowerCase().includes(query.toLowerCase()) || c.role.toLowerCase().includes(query.toLowerCase())), [query]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">CI</div><div><strong>CandidateIQ</strong><span>AI recruitment intelligence</span></div></div>
        <nav>{["Dashboard", "Candidates", "Jobs", "Interviews", "Reports"].map(item => <button key={item} className={active === item ? "nav active" : "nav"} onClick={() => setActive(item)}>{item}</button>)}</nav>
        <div className="sidebar-bottom"><div className="privacy">● Local-first AI<br/><span>Human review required</span></div><div className="profile"><div className="avatar">SD</div><div><strong>Snehasish Das</strong><span>Recruiter Admin</span></div></div></div>
      </aside>

      <main className="main">
        <header className="topbar"><div><p className="eyebrow">Recruitment workspace</p><h1>{active}</h1></div><button className="primary">+ New candidate</button></header>

        {active === "Dashboard" && <>
          <section className="hero"><div><span className="pill">AI Candidate Intelligence</span><h2>Make every hiring decision <em>evidence-led.</em></h2><p>Screen candidates against the job, inspect portfolio evidence, run adaptive interviews, and keep a human in the loop.</p></div><div className="hero-score"><ScoreRing value="86" /><span>Average candidate match</span></div></section>
          <section className="stats"><div><span>Total candidates</span><strong>128</strong><small>+18% this month</small></div><div><span>Strong matches</span><strong>34</strong><small>26.6% of pipeline</small></div><div><span>Interviews completed</span><strong>47</strong><small>92% completion</small></div><div><span>Needs review</span><strong>12</strong><small>Human action required</small></div></section>
          <section className="content-grid"><div className="panel wide"><div className="panel-head"><div><h3>Candidate pipeline</h3><p>Ranked by job-relevant evidence</p></div><input placeholder="Search candidates..." value={query} onChange={e => setQuery(e.target.value)} /></div>{filtered.map(c => <div className="candidate-row" key={c.name}><div className="avatar large">{c.name.split(" ").map(x => x[0]).join("")}</div><div className="candidate-main"><strong>{c.name}</strong><span>{c.role}</span><div className="tags">{c.skills.map(s => <i key={s}>{s}</i>)}</div></div><div className="mini-score"><strong>{c.score}</strong><span>match</span></div><span className={`status ${c.status.toLowerCase().replace(" ", "-")}`}>{c.status}</span><button className="ghost">View →</button></div>)}</div>
          <div className="panel"><div className="panel-head"><div><h3>Target role</h3><p>Current screening profile</p></div></div><select value={job} onChange={e => setJob(e.target.value)}><option>Data Scientist</option><option>Data Analyst</option><option>ML Engineer</option><option>Python Developer</option></select><div className="match-box"><span>Role readiness</span><strong>84%</strong><div className="progress"><i style={{width:"84%"}} /></div></div><ul className="check-list"><li>Resume / JD matching</li><li>GitHub portfolio evidence</li><li>Project relevance</li><li>Adaptive interview</li></ul></div></section>
        </>}

        {active !== "Dashboard" && <section className="empty-state"><div className="empty-icon">{active[0]}</div><h2>{active}</h2><p>This workspace is ready for the production API and recruiter workflows. The new web shell is separated from the original Streamlit prototype.</p><button className="primary" onClick={() => setActive("Dashboard")}>Back to dashboard</button></section>}
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<React.StrictMode><App /></React.StrictMode>);
