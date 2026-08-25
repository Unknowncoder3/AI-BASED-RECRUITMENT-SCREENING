import React,{useEffect,useRef,useState} from "react";
import ProctorPanel from "./ProctorPanel.jsx";

const common={
 behavioral:["Tell me about yourself and walk me through your background.","What are your strongest skills, and can you give an example where you used them?","What is one weakness you are actively improving?","Tell me about a difficult project or problem you handled and what you learned."],
 motivation:["Why do you want this role?","Why are you interested in this company or type of work?","Where do you want your career to grow over the next few years?"],
 technical:["Explain your strongest project end-to-end and your personal contribution.","What was the hardest technical decision you made in that project?","How did you validate your solution and measure whether it worked?","What trade-off would you change if you rebuilt the project today?","How would you make that project production-ready and scalable?"],
 hr:["Tell me about a time you disagreed with a teammate. How did you handle it?","How do you respond when you receive critical feedback?","Why should we select you for this role?"]
};
const roleWords=role=>({"Data Scientist":["python","machine learning","statistics","model","data"],"Data Analyst":["sql","python","power bi","excel","analysis","dashboard"],"AI Engineer":["python","machine learning","llm","api","model"],"Software Engineer":["dsa","algorithm","system","api","testing"],"Full Stack Developer":["react","node","api","database","javascript"]}[role]||["python","project","testing","api","database"]);
function scoreAnswer(answer,phase,role){const text=answer.trim();if(!text)return 0;const words=text.split(/\s+/).filter(Boolean);if(words.length<8)return 18;const keywords=phase==="technical"?roleWords(role):phase==="motivation"?["role","company","learn","career","impact"]:phase==="hr"?["team","feedback","problem","learn","communication"]:["project","experience","learn","team","result"];const hits=keywords.filter(k=>text.toLowerCase().includes(k)).length;return Math.min(95,Math.round(30+Math.min(35,words.length*1.1)+hits*6));}

function pickVoice(){
  const voices=window.speechSynthesis?.getVoices?.()||[];
  const en=voices.filter(v=>/^en(-|_)/i.test(v.lang));
  const preferred=[/samantha/i,/jenny/i,/aria/i,/ava/i,/allison/i,/google us english/i,/google.*us/i,/daniel/i,/alex/i];
  for(const re of preferred){const v=en.find(x=>re.test(x.name));if(v)return v;}
  return en.find(v=>v.localService&&v.default)||en.find(v=>v.localService)||en.find(v=>v.default)||en[0]||voices[0]||null;
}

export default function VoiceInterview({p,phase,onComplete}){
 const qs=common[phase]||common.behavioral;
 const [q,setQ]=useState(0),[answer,setAnswer]=useState(""),[answers,setAnswers]=useState([]),[listening,setListening]=useState(false),[speaking,setSpeaking]=useState(false),[proctored,setProctored]=useState(false),[events,setEvents]=useState([]),[voice,setVoice]=useState(null);
 const recRef=useRef(null),runRef=useRef(false),finalRef=useRef(""),interimRef=useRef(""),restartTimerRef=useRef(null),generationRef=useRef(0);
 const emit=e=>setEvents(x=>[...x,e]);

 useEffect(()=>{
   const load=()=>setVoice(pickVoice());
   load();
   window.speechSynthesis?.addEventListener?.("voiceschanged",load);
   return()=>window.speechSynthesis?.removeEventListener?.("voiceschanged",load);
 },[]);

 const stopRec=()=>{
   runRef.current=false;
   generationRef.current+=1;
   if(restartTimerRef.current){clearTimeout(restartTimerRef.current);restartTimerRef.current=null;}
   try{recRef.current?.stop()}catch{}
   setListening(false);
 };

 const startRecognition=()=>{
   const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
   if(!SR){emit({type:"voice_unavailable"});return;}
   if(runRef.current)return;
   const generation=++generationRef.current;
   const r=new SR();
   recRef.current=r;
   r.lang="en-US";
   r.continuous=true;
   r.interimResults=true;
   r.maxAlternatives=1;
   r.onresult=e=>{
     let finalChunk="";
     let interim="";
     for(let n=e.resultIndex;n<e.results.length;n++){
       const s=e.results[n][0].transcript;
       if(e.results[n].isFinal) finalChunk+=s+" ";
       else interim+=s;
     }
     if(finalChunk) finalRef.current=(finalRef.current+finalChunk).replace(/\s+/g," ").trim();
     interimRef.current=interim;
     const display=(finalRef.current+(interim?" "+interim:"" )).replace(/\s+/g," ").trim();
     setAnswer(display);
   };
   r.onend=()=>{
     if(runRef.current&&generation===generationRef.current){
       restartTimerRef.current=setTimeout(()=>{restartTimerRef.current=null;startRecognition()},120);
     }
   };
   r.onerror=e=>{
     if(e.error!=="aborted"&&e.error!=="not-allowed"&&e.error!=="no-speech")emit({type:"speech_error",detail:e.error});
     if(e.error==="not-allowed"){runRef.current=false;setListening(false);}
   };
   runRef.current=true;
   setListening(true);
   try{r.start()}catch{if(runRef.current)restartTimerRef.current=setTimeout(()=>{restartTimerRef.current=null;startRecognition()},180);}
 };

 const ask=()=>{
   stopRec();
   window.speechSynthesis?.cancel();
   const u=new SpeechSynthesisUtterance(qs[q]);
   u.lang="en-US";
   u.rate=.96;
   u.pitch=1;
   u.volume=1;
   if(voice)u.voice=voice;
   u.onstart=()=>setSpeaking(true);
   u.onend=()=>setSpeaking(false);
   u.onerror=()=>setSpeaking(false);
   window.speechSynthesis?.speak(u);
 };

 useEffect(()=>{
   stopRec();
   finalRef.current="";
   interimRef.current="";
   setAnswer("");
   setSpeaking(false);
   if(window.speechSynthesis){const id=setTimeout(ask,220);return()=>clearTimeout(id);}
 },[q,voice]);

 const submit=()=>{
   const a=finalRef.current.trim()||answer.trim();
   if(!a){emit({type:"empty_answer",detail:`Question ${q+1} submitted without an answer`});return;}
   stopRec();
   window.speechSynthesis?.cancel();
   const all=[...answers,a];
   setAnswers(all);
   if(q<qs.length-1)setQ(q+1);
   else{
     const scores=all.map(x=>scoreAnswer(x,phase,p.role));
     onComplete({score:Math.round(scores.reduce((a,b)=>a+b,0)/scores.length),answers:all,events});
   }
 };

 return <><div style={{marginBottom:20}}><span className="eyebrow">🎙 {phase.toUpperCase()} INTERVIEW</span><h1 style={{fontSize:40,margin:"14px 0 6px"}}>{phase==="behavioral"?"Start with your story.":phase==="motivation"?"Now let's talk about the role.":phase==="technical"?"Show your technical depth.":"Let's finish with HR."}</h1><p className="muted">Question {q+1} of {qs.length} · Speak naturally. The microphone stays active until you submit this answer.</p></div>
 <ProctorPanel onReady={()=>setProctored(true)} onEvent={emit}/>
 <div className="card" style={{maxWidth:960,margin:"auto",opacity:proctored?1:.55}}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}><span className="tag">AI INTERVIEWER</span><span className="muted" style={{fontSize:10}}>{voice?`Voice: ${voice.name}`:"Browser voice"}</span></div>
  <div className="divider"/>
  <div style={{textAlign:"center"}}>
   <div style={{width:92,height:92,borderRadius:"50%",margin:"0 auto",display:"grid",placeItems:"center",background:"linear-gradient(135deg,#8065ff,#4e38c8)",boxShadow:speaking?"0 0 0 14px var(--soft),0 0 40px #8065ff66":"0 0 0 10px var(--soft)",fontSize:30}}>✦</div>
   <div className="muted" style={{fontSize:11,marginTop:15}}>{speaking?"AI is speaking…":listening?"Microphone active — keep speaking naturally":"Ready"}</div>
   <h2 style={{fontSize:25,lineHeight:1.4,maxWidth:760,margin:"20px auto"}}>{qs[q]}</h2>
   <div style={{display:"flex",justifyContent:"center",gap:8,flexWrap:"wrap"}}><button className="secondary" onClick={ask} disabled={!proctored||speaking}>🔊 Repeat question</button>{!listening?<button className="primary" onClick={startRecognition} disabled={!proctored||speaking}>🎙 Start answer</button>:<span className="tag" style={{padding:"11px 14px"}}>● Recording continuously</span>}</div>
   <textarea className="input" value={answer} onChange={e=>{finalRef.current=e.target.value;interimRef.current="";setAnswer(e.target.value)}} placeholder="Your live transcript appears here…" style={{minHeight:150,maxWidth:760,margin:"20px auto 0",display:"block"}}/>
   <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,maxWidth:760,margin:"10px auto 0"}}><span className="muted" style={{fontSize:10}}>Transcript is preserved across recognition restarts. It clears automatically only when the next question begins.</span><button className="primary" onClick={submit} disabled={!proctored}>{q===qs.length-1?"Submit & continue →":"Submit answer →"}</button></div>
  </div>
 </div></>;
}
