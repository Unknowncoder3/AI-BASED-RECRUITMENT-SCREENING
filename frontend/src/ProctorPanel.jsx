import React,{useEffect,useRef,useState} from "react";

export default function ProctorPanel({onReady,onEvent}){
  const videoRef=useRef(null); const streamRef=useRef(null); const [status,setStatus]=useState("idle"); const [error,setError]=useState(""); const [full,setFull]=useState(false);
  const emit=(type,detail="")=>onEvent?.({type,detail,time:new Date().toISOString()});
  const enable=async()=>{
    setError(""); setStatus("requesting");
    try{
      if(!navigator.mediaDevices?.getUserMedia) throw new Error("Camera and microphone access is not supported in this browser.");
      const stream=await navigator.mediaDevices.getUserMedia({video:{width:{ideal:1280},height:{ideal:720},facingMode:"user"},audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
      streamRef.current=stream; if(videoRef.current) videoRef.current.srcObject=stream;
      setStatus("ready"); onReady?.(stream); emit("proctoring_started");
    }catch(e){setStatus("denied");setError(e?.message||"Camera/microphone permission was denied.");emit("permission_error",e?.message||"");}
  };
  const goFullscreen=async()=>{try{await document.documentElement.requestFullscreen?.();setFull(true);emit("fullscreen_entered")}catch(e){emit("fullscreen_error",e?.message||"")}};
  useEffect(()=>{
    const vis=()=>{if(status==="ready"&&document.hidden)emit("tab_hidden","Candidate switched away from the assessment")};
    const blur=()=>{if(status==="ready")emit("window_blur")};
    const fs=()=>setFull(Boolean(document.fullscreenElement));
    document.addEventListener("visibilitychange",vis); window.addEventListener("blur",blur); document.addEventListener("fullscreenchange",fs);
    return()=>{document.removeEventListener("visibilitychange",vis);window.removeEventListener("blur",blur);document.removeEventListener("fullscreenchange",fs);streamRef.current?.getTracks().forEach(t=>t.stop())};
  },[status]);
  return <div className="card" style={{padding:16,marginBottom:16,borderColor:status==="ready"?"#3ddc9766":"var(--line)"}}>
    <div style={{display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"}}>
      <div style={{width:190,height:112,borderRadius:14,overflow:"hidden",background:"#03050a",border:"1px solid var(--line)",position:"relative"}}>
        <video ref={videoRef} autoPlay muted playsInline style={{width:"100%",height:"100%",objectFit:"cover",transform:"scaleX(-1)"}} />
        {status!=="ready"&&<div style={{position:"absolute",inset:0,display:"grid",placeItems:"center",color:"var(--muted)",fontSize:11,textAlign:"center",padding:12}}>Camera preview<br/>not enabled</div>}
        {status==="ready"&&<span style={{position:"absolute",left:8,bottom:8,background:"#000a",padding:"4px 7px",borderRadius:7,fontSize:9}}>● LIVE</span>}
      </div>
      <div style={{flex:1,minWidth:220}}>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}><span className="tag">PROCTORED SESSION</span><span className="status" style={{fontSize:10,color:status==="ready"?"#3ddc97":"var(--muted)"}}><i style={{background:status==="ready"?"#3ddc97":"var(--muted)"}}/>{status==="ready"?"Camera + microphone active":status==="requesting"?"Requesting permissions…":"Camera + microphone required"}</span></div>
        <p className="muted" style={{fontSize:11,lineHeight:1.5,margin:"8px 0"}}>Camera preview, microphone capture, tab switching, focus loss and fullscreen status are monitored during the assessment.</p>
        {error&&<div style={{color:"#ff8b96",fontSize:11,marginBottom:8}}>{error} Open browser site settings and allow Camera + Microphone, then retry.</div>}
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{status!=="ready"&&<button className="primary" onClick={enable} disabled={status==="requesting"}>{status==="requesting"?"Enabling…":"Enable camera & microphone"}</button>}{status==="ready"&&<button className="secondary" onClick={goFullscreen}>{full?"✓ Fullscreen active":"Enter fullscreen"}</button>}</div>
      </div>
    </div>
  </div>
}
