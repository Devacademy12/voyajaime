"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

type Excursion = { id:string; title:string; city:string; price_per_person:number; duration_hours:number; rating:number; reviews_count:number; categories:string[]; photos:string[]; };
type Categorie = { id:string; nom:string; emoji:string; couleur:string; };
type DragPayload = { kind:"excursion"; excursion:Excursion } | { kind:"activity"; activityId:string; fromDay:number; fromTime:TimeKey };
type ActivityItem = { id:string; excursion:Excursion; note:string; time:TimeKey; };
type DayPlan = { city:string; activities:ActivityItem[] };
type TimeKey = "matin"|"aprem"|"soir";
type Step = "config"|"builder"|"result";

const ALL_CITIES = [
  { name:"Tunis",     emoji:"🏛️", region:"Nord",   description:"Capitale vibrante" },
  { name:"Sousse",    emoji:"🏖️", region:"Sahel",  description:"Perle du Sahel" },
  { name:"Hammamet",  emoji:"🌺", region:"Sahel",  description:"Station balnéaire" },
  { name:"Djerba",    emoji:"🏝️", region:"Sud",    description:"Île aux rêves" },
  { name:"Tozeur",    emoji:"🌴", region:"Sud",    description:"Porte du désert" },
  { name:"Douz",      emoji:"🐪", region:"Sud",    description:"Sahara infini" },
  { name:"Kairouan",  emoji:"🕌", region:"Centre", description:"Ville sainte" },
  { name:"Sfax",      emoji:"🫒", region:"Centre", description:"Capitale du Sud" },
  { name:"Tataouine", emoji:"⭐", region:"Sud",    description:"Terre de Star Wars" },
  { name:"Tabarka",   emoji:"🌊", region:"Nord",   description:"Corail et nature" },
  { name:"Nabeul",    emoji:"🏺", region:"Nord",   description:"Poterie et art." },
  { name:"Gafsa",     emoji:"⛏️", region:"Sud",    description:"Oasis millénaire" },
];
const CITY_EMOJI:Record<string,string> = Object.fromEntries(ALL_CITIES.map(c=>[c.name,c.emoji]));

const FALLBACK_CATS:Categorie[] = [
  {id:"1",nom:"Culture",    emoji:"🏛️",couleur:"#2B96A8"},
  {id:"2",nom:"Archéologie",emoji:"🏺",couleur:"#8B5CF6"},
  {id:"3",nom:"Nature",     emoji:"🌿",couleur:"#059669"},
  {id:"4",nom:"Gastronomie",emoji:"🍽️",couleur:"#D97706"},
  {id:"5",nom:"Aventure",   emoji:"⚡",couleur:"#DC2626"},
  {id:"6",nom:"Relaxation", emoji:"🧘",couleur:"#2563EB"},
];

const MOCK_EXC:Excursion[] = [
  {id:"1",title:"Médina de Tunis",    city:"Tunis", price_per_person:45,duration_hours:3,  rating:4.9,reviews_count:128,categories:["Culture","Archéologie"],photos:["https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=400&q=80"]},
  {id:"2",title:"Sidi Bou Saïd",      city:"Tunis", price_per_person:35,duration_hours:2.5,rating:4.8,reviews_count:94, categories:["Culture"],              photos:["https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=400&q=80"]},
  {id:"3",title:"Sahara à Douz",      city:"Douz",  price_per_person:95,duration_hours:8,  rating:5.0,reviews_count:67, categories:["Aventure","Nature"],     photos:["https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=400&q=80"]},
  {id:"4",title:"Île de Djerba",      city:"Djerba",price_per_person:55,duration_hours:4,  rating:4.7,reviews_count:203,categories:["Relaxation","Nature"],   photos:["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80"]},
  {id:"5",title:"Oasis de Tozeur",    city:"Tozeur",price_per_person:75,duration_hours:5,  rating:4.9,reviews_count:45, categories:["Nature","Aventure"],     photos:["https://images.unsplash.com/photo-1548013146-72479768bada?w=400&q=80"]},
  {id:"6",title:"Amphithéâtre El Jem",city:"Sfax",  price_per_person:40,duration_hours:4,  rating:4.8,reviews_count:112,categories:["Archéologie","Culture"], photos:["https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=400&q=80"]},
];

const SLOTS:{key:TimeKey;label:string;emoji:string;hint:string}[] = [
  {key:"matin", label:"Matin",      emoji:"🌅",hint:"8h — 12h"},
  {key:"aprem", label:"Après-midi", emoji:"☀️",hint:"13h — 17h"},
  {key:"soir",  label:"Soir",       emoji:"🌙",hint:"18h — 22h"},
];

function tog<T>(arr:T[],item:T):T[]{return arr.includes(item)?arr.filter(x=>x!==item):[...arr,item];}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
*{box-sizing:border-box}
.vj-btn{transition:all .2s;cursor:pointer;font-family:inherit}
.city-c{transition:all .2s;cursor:pointer}
.city-c:hover{transform:translateY(-3px);box-shadow:0 10px 24px -8px rgba(43,150,168,.3)!important}
.cat-c{transition:all .18s;cursor:pointer}
.cat-c:hover{transform:translateY(-2px)}
.exc-c{transition:all .22s;cursor:grab}
.exc-c:hover{transform:translateY(-3px);box-shadow:0 14px 28px -10px rgba(43,150,168,.2)!important}
.exc-c:active{cursor:grabbing;transform:scale(.98)}
.dz{transition:all .18s}
.dz.ov{border-color:#2B96A8!important;background:rgba(43,150,168,.04)!important}
.act{transition:all .2s;cursor:grab}
.act:hover{transform:translateY(-2px);box-shadow:0 8px 18px -6px rgba(0,0,0,.12)!important}
.act:active{cursor:grabbing}
.dtab{transition:all .18s;cursor:pointer}
.dtab:hover{border-color:#2B96A8!important}
.ib{transition:all .15s;border-radius:8px}
.ib:hover{background:rgba(43,150,168,.1)!important}
.nvb{transition:all .2s}
.nvb:hover:not(:disabled){background:#1e7a8a!important;transform:translateY(-1px)}
.cta{transition:all .25s}
.cta:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 16px 32px -10px rgba(43,150,168,.55)!important}
.rng{accent-color:#2B96A8}
@keyframes lp{0%,100%{opacity:1}50%{opacity:.4}}
.lp{animation:lp 1.5s ease infinite}
@keyframes fu{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.fu{animation:fu .32s ease forwards}
input[type=range]{accent-color:#2B96A8}
`;

function ItineraireInner(){
  const router=useRouter();
  const sb=createClient();

  const [step,setStep]=useState<Step>("config");
  const [days,setDays]=useState(3);
  const [selCities,setSelCities]=useState<string[]>([]);
  const [selCats,setSelCats]=useState<string[]>([]);
  const [categories,setCategories]=useState<Categorie[]>([]);
  const [allExc,setAllExc]=useState<Excursion[]>([]);
  const [ldCats,setLdCats]=useState(true);
  const [ldExc,setLdExc]=useState(true);
  const [search,setSearch]=useState("");
  const [palCat,setPalCat]=useState("Toutes");
  const [palCity,setPalCity]=useState("Toutes");
  const [itin,setItin]=useState<DayPlan[]>([]);
  const [activeDay,setActiveDay]=useState(0);
  const [editNote,setEditNote]=useState<string|null>(null);
  const [noteText,setNoteText]=useState("");
  const [dragOver,setDragOver]=useState<{day:number;time:TimeKey}|null>(null);
  const dragRef=useRef<DragPayload|null>(null);

  useEffect(()=>{
    sb.from("categories").select("*").order("nom").then(({data,error})=>{
      setCategories((!error&&data?.length)?data as Categorie[]:FALLBACK_CATS);
      setLdCats(false);
    });
  },[]);
  useEffect(()=>{
    sb.from("excursions").select("*").or("is_active.eq.true,is_active.is.null").then(({data,error})=>{
      setAllExc((!error&&data?.length)?data as Excursion[]:MOCK_EXC);
      setLdExc(false);
    });
  },[]);

  const cc=(n:string)=>categories.find(c=>c.nom===n)?.couleur||"#2B96A8";
  const ce=(n:string)=>categories.find(c=>c.nom===n)?.emoji||"🏔️";

  const palette=allExc.filter(e=>{
    const q=search.toLowerCase();
    return (e.title.toLowerCase().includes(q)||e.city.toLowerCase().includes(q))
      &&(palCat==="Toutes"||e.categories?.includes(palCat))
      &&(palCity==="Toutes"||e.city===palCity)
      &&(selCities.length===0||selCities.includes(e.city));
  });

  const startBuilder=()=>{
    setItin(Array.from({length:days},(_,i)=>({city:selCities[i%selCities.length]||"Tunis",activities:[]})));
    setActiveDay(0);
    setPalCity(selCities.length===1?selCities[0]:"Toutes");
    setStep("builder");
  };

  const drop=(dayIdx:number,time:TimeKey)=>{
    const p=dragRef.current; if(!p)return;
    if(p.kind==="excursion"){
      setItin(prev=>{const u=[...prev];u[dayIdx]={...u[dayIdx],activities:[...u[dayIdx].activities,{id:`${Date.now()}-${Math.random()}`,excursion:p.excursion,note:"",time}]};return u;});
    } else {
      const{activityId,fromDay,fromTime}=p;
      if(fromDay===dayIdx&&fromTime===time)return;
      setItin(prev=>{const u=prev.map(d=>({...d,activities:[...d.activities]}));const idx=u[fromDay].activities.findIndex(a=>a.id===activityId);if(idx===-1)return prev;const[act]=u[fromDay].activities.splice(idx,1);u[dayIdx].activities.push({...act,time});return u;});
    }
    dragRef.current=null; setDragOver(null);
  };

  const rmAct=(dayIdx:number,id:string)=>setItin(prev=>{const u=[...prev];u[dayIdx]={...u[dayIdx],activities:u[dayIdx].activities.filter(a=>a.id!==id)};return u;});
  const saveNote=(dayIdx:number,id:string)=>{setItin(prev=>{const u=[...prev];u[dayIdx]={...u[dayIdx],activities:u[dayIdx].activities.map(a=>a.id===id?{...a,note:noteText}:a)};return u;});setEditNote(null);setNoteText("");};

  const totAct=itin.reduce((s,d)=>s+d.activities.length,0);
  const totBudget=itin.reduce((s,d)=>s+d.activities.reduce((ss,a)=>ss+a.excursion.price_per_person,0),0);

  // ── SECTION card styles ──
  const S={
    card:{background:"white",borderRadius:20,border:"1px solid #F3F4F6",padding:"28px 32px",marginBottom:16,boxShadow:"0 1px 4px rgba(0,0,0,.04)"},
    h2:{fontSize:17,fontWeight:800,color:"#111827",marginBottom:4},
    sub:{fontSize:13,color:"#9CA3AF"},
    badge:(c:string)=>({fontSize:11,fontWeight:700,color:c,background:`${c}12`,border:`1px solid ${c}30`,padding:"5px 14px",borderRadius:30,letterSpacing:".06em",textTransform:"uppercase" as const}),
  };

  // ════════════════ CONFIG ════════════════
  if(step==="config") return (
    <div style={{minHeight:"100vh",background:"#FAFAF9",fontFamily:"'DM Sans',system-ui,sans-serif",padding:"40px 20px 60px"}}>
      <style>{CSS}</style>
      <div style={{maxWidth:860,margin:"0 auto"}}>

        {/* Nav */}
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:36}}>
          <button className="vj-btn" onClick={()=>router.push("/")}
            style={{background:"white",border:"1px solid #E5E7EB",color:"#374151",fontSize:13,display:"inline-flex",alignItems:"center",gap:8,padding:"9px 20px",borderRadius:30,fontWeight:600}}>
            ← Retour
          </button>
          <span style={S.badge("#2B96A8")}>✏️ Planificateur</span>
        </div>

        {/* Hero */}
        <div style={{marginBottom:40}} className="fu">
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(32px,5vw,52px)",fontWeight:900,color:"#111827",lineHeight:1.1,letterSpacing:"-0.5px",marginBottom:12}}>
            Créez votre itinéraire<br/><span style={{color:"#2B96A8"}}>sur mesure</span>
          </h1>
          <p style={{fontSize:16,color:"#6B7280",lineHeight:1.65}}>Sélectionnez vos destinations et composez votre voyage parfait.</p>
        </div>

        {/* Durée */}
        <div style={S.card} className="fu">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
            <div><h2 style={S.h2}>Durée du voyage</h2><p style={S.sub}>De 1 à 14 jours d&apos;exploration</p></div>
            <div style={{textAlign:"center",background:"rgba(43,150,168,.06)",border:"1.5px solid rgba(43,150,168,.2)",borderRadius:16,padding:"12px 28px"}}>
              <span style={{fontFamily:"'Playfair Display',serif",fontSize:42,fontWeight:900,color:"#2B96A8",lineHeight:1,display:"block"}}>{days}</span>
              <span style={{fontSize:11,color:"#6B7280",letterSpacing:".05em",textTransform:"uppercase",fontWeight:600}}>{days>1?"jours":"jour"}</span>
            </div>
          </div>
          <input type="range" min={1} max={14} value={days} onChange={e=>setDays(Number(e.target.value))}
            style={{width:"100%",height:5,cursor:"pointer",marginBottom:16}} />
          <div style={{display:"flex",gap:6}}>
            {[1,2,3,5,7,10,14].map(n=>(
              <button key={n} className="vj-btn" onClick={()=>setDays(n)}
                style={{flex:1,padding:"8px 0",borderRadius:24,border:`1.5px solid ${days===n?"#2B96A8":"#E5E7EB"}`,background:days===n?"#2B96A8":"white",color:days===n?"white":"#6B7280",fontSize:12,fontWeight:days===n?700:500}}>
                {n}j
              </button>
            ))}
          </div>
        </div>

        {/* Villes */}
        <div style={S.card} className="fu">
          <div style={{marginBottom:22}}>
            <h2 style={S.h2}>
              Villes à explorer
              {selCities.length>0&&<span style={{fontSize:13,fontWeight:600,color:"#2B96A8",marginLeft:10}}>{selCities.length} sélectionnée{selCities.length>1?"s":""}</span>}
            </h2>
            <p style={S.sub}>Choisissez une ou plusieurs destinations</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(106px,1fr))",gap:8}}>
            {ALL_CITIES.map(c=>{
              const sel=selCities.includes(c.name);
              return(
                <button key={c.name} className="city-c vj-btn" onClick={()=>setSelCities(tog(selCities,c.name))}
                  style={{padding:"14px 8px",borderRadius:16,border:`2px solid ${sel?"#2B96A8":"#F3F4F6"}`,background:sel?"rgba(43,150,168,.06)":"white",textAlign:"center",boxShadow:sel?"0 6px 18px -6px rgba(43,150,168,.3)":"0 1px 4px rgba(0,0,0,.04)"}}>
                  <div style={{fontSize:26,marginBottom:5}}>{c.emoji}</div>
                  <div style={{fontSize:12,fontWeight:sel?700:500,color:sel?"#2B96A8":"#374151",marginBottom:2}}>{c.name}</div>
                  <div style={{fontSize:10,color:sel?"#2B96A8":"#9CA3AF"}}>{c.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Catégories */}
        <div style={S.card} className="fu">
          <div style={{marginBottom:20}}>
            <h2 style={S.h2}>Centres d&apos;intérêt <span style={{fontSize:12,fontWeight:500,color:"#9CA3AF"}}>(optionnel)</span></h2>
            <p style={S.sub}>Pour affiner les excursions suggérées</p>
          </div>
          {ldCats?(
            <div style={{display:"flex",gap:8}}>
              {[1,2,3,4].map(i=><div key={i} className="lp" style={{height:38,width:110,borderRadius:24,background:"#F3F4F6"}}/>)}
            </div>
          ):(
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {categories.map(cat=>{
                const sel=selCats.includes(cat.nom);
                return(
                  <button key={cat.id} className="cat-c vj-btn" onClick={()=>setSelCats(tog(selCats,cat.nom))}
                    style={{padding:"9px 18px",borderRadius:24,border:`1.5px solid ${sel?cat.couleur:"#E5E7EB"}`,background:sel?`${cat.couleur}10`:"white",color:sel?cat.couleur:"#6B7280",fontSize:13,fontWeight:sel?700:500,display:"flex",alignItems:"center",gap:7,boxShadow:sel?`0 4px 12px -4px ${cat.couleur}40`:"none"}}>
                    <span>{cat.emoji}</span>{cat.nom}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* CTA */}
        <div style={{...S.card,display:"flex",justifyContent:"space-between",alignItems:"center",boxShadow:"0 4px 20px rgba(0,0,0,.06)"}}>
          <div>
            {selCities.length>0?(
              <>
                <p style={{fontSize:11,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:".06em",marginBottom:5,fontWeight:600}}>Votre sélection</p>
                <p style={{fontSize:14,fontWeight:600,color:"#111827"}}>
                  {days} jour{days>1?"s":""} · {selCities.slice(0,2).map(c=>`${CITY_EMOJI[c]||""} ${c}`).join(", ")}
                  {selCities.length>2&&<span style={{color:"#2B96A8"}}> +{selCities.length-2}</span>}
                  {selCats.length>0&&<span style={{color:"#9CA3AF"}}> · {selCats.slice(0,2).join(", ")}</span>}
                </p>
              </>
            ):(
              <p style={{fontSize:13,color:"#9CA3AF",fontStyle:"italic"}}>Sélectionnez au moins une ville pour commencer</p>
            )}
          </div>
          <button className="cta vj-btn" onClick={startBuilder} disabled={selCities.length===0}
            style={{background:selCities.length===0?"#E5E7EB":"#2B96A8",color:selCities.length===0?"#9CA3AF":"white",border:"none",padding:"14px 32px",borderRadius:30,fontSize:14,fontWeight:700,boxShadow:selCities.length>0?"0 10px 24px -8px rgba(43,150,168,.5)":"none",cursor:selCities.length===0?"not-allowed":"pointer"}}>
            Composer mon itinéraire →
          </button>
        </div>
      </div>
    </div>
  );

  // ════════════════ BUILDER ════════════════
  if(step==="builder") return (
    <div style={{minHeight:"100vh",background:"#FAFAF9",fontFamily:"'DM Sans',system-ui,sans-serif"}}>
      <style>{CSS}</style>

      {/* Topbar */}
      <div style={{position:"sticky",top:0,zIndex:50,background:"rgba(255,255,255,.96)",backdropFilter:"blur(16px)",borderBottom:"1px solid #F3F4F6",padding:"0 24px",height:64,display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 1px 8px rgba(0,0,0,.05)"}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <button className="vj-btn" onClick={()=>setStep("config")}
            style={{background:"none",border:"1px solid #E5E7EB",color:"#374151",fontSize:13,display:"flex",alignItems:"center",gap:7,padding:"7px 16px",borderRadius:24,fontWeight:600}}>
            ← Config
          </button>
          <span style={{fontSize:13,color:"#2B96A8",background:"rgba(43,150,168,.08)",padding:"5px 14px",borderRadius:24,fontWeight:600}}>
            {days}j · {selCities.join(" · ")}
          </span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {totAct>0&&<>
            <span style={{fontSize:12,color:"#374151",background:"#F9FAFB",padding:"5px 14px",borderRadius:24,border:"1px solid #E5E7EB",fontWeight:600}}>{totAct} excursion{totAct>1?"s":""}</span>
            <span style={{fontSize:12,fontWeight:700,color:"#059669",background:"rgba(5,150,105,.1)",padding:"5px 14px",borderRadius:24}}>{totBudget} TND</span>
          </>}
          <button className="vj-btn" onClick={()=>setStep("result")}
            style={{padding:"9px 24px",background:"#111827",color:"white",border:"none",borderRadius:24,fontSize:13,fontWeight:700,boxShadow:"0 4px 12px rgba(0,0,0,.15)"}}>
            Voir le résumé →
          </button>
        </div>
      </div>

      <div style={{display:"flex",height:"calc(100vh - 64px)"}}>

        {/* Palette */}
        <div style={{width:296,flexShrink:0,borderRight:"1px solid #F3F4F6",background:"white",display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{padding:"18px 16px 10px",flexShrink:0}}>
            <h2 style={{fontSize:14,fontWeight:800,color:"#111827",marginBottom:12}}>Excursions disponibles</h2>
            <input type="text" placeholder="🔍  Rechercher..." value={search} onChange={e=>setSearch(e.target.value)}
              style={{width:"100%",padding:"8px 13px",border:"1.5px solid #E5E7EB",borderRadius:22,fontSize:12,fontFamily:"inherit",outline:"none",color:"#111827",marginBottom:10,background:"#FAFAF9",transition:"border-color .2s"}}
              onFocus={e=>e.currentTarget.style.borderColor="#2B96A8"}
              onBlur={e=>e.currentTarget.style.borderColor="#E5E7EB"} />
            <div style={{marginBottom:8}}>
              <p style={{fontSize:10,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:".06em",marginBottom:5}}>Villes</p>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                {["Toutes",...selCities].map(c=>(
                  <button key={c} className="vj-btn" onClick={()=>setPalCity(c)}
                    style={{padding:"3px 9px",borderRadius:20,border:`1px solid ${palCity===c?"#2B96A8":"#E5E7EB"}`,background:palCity===c?"#2B96A8":"white",color:palCity===c?"white":"#6B7280",fontSize:11,fontWeight:palCity===c?700:500,transition:"all .15s"}}>
                    {c==="Toutes"?"Toutes":`${CITY_EMOJI[c]||""} ${c}`}
                  </button>
                ))}
              </div>
            </div>
            <div style={{paddingBottom:10,borderBottom:"1px solid #F3F4F6"}}>
              <p style={{fontSize:10,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:".06em",marginBottom:5}}>Catégories</p>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                {["Toutes",...categories.map(c=>c.nom)].map(cat=>(
                  <button key={cat} className="vj-btn" onClick={()=>setPalCat(cat)}
                    style={{padding:"3px 9px",borderRadius:20,border:`1px solid ${palCat===cat?(cc(cat)||"#2B96A8"):"#E5E7EB"}`,background:palCat===cat?`${cc(cat)||"#2B96A8"}12`:"white",color:palCat===cat?cc(cat)||"#2B96A8":"#6B7280",fontSize:11,fontWeight:palCat===cat?700:500,transition:"all .15s"}}>
                    {cat==="Toutes"?"Toutes":`${ce(cat)} ${cat}`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{flex:1,overflowY:"auto",padding:"8px 12px 16px"}}>
            {ldExc?Array.from({length:3}).map((_,i)=><div key={i} className="lp" style={{height:148,borderRadius:14,background:"#F3F4F6",marginBottom:10}}/>)
            :palette.length===0?(
              <div style={{textAlign:"center",padding:"40px 0"}}>
                <p style={{fontSize:36,marginBottom:8}}>🔍</p>
                <p style={{fontSize:13,color:"#9CA3AF"}}>Aucune excursion</p>
              </div>
            ):palette.map(exc=>{
              const col=cc(exc.categories?.[0]);
              return(
                <div key={exc.id} className="exc-c" draggable onDragStart={()=>{dragRef.current={kind:"excursion",excursion:exc};}}
                  style={{marginBottom:10,borderRadius:14,background:"white",border:"1px solid #F3F4F6",userSelect:"none",overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,.04)"}}>
                  {exc.photos?.[0]&&(
                    <div style={{height:86,overflow:"hidden",position:"relative"}}>
                      <img src={exc.photos[0]} alt={exc.title} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                      <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,transparent 40%,rgba(0,0,0,.4))"}}/>
                      <span style={{position:"absolute",bottom:6,left:8,fontSize:10,color:"white",fontWeight:700,background:`${col}cc`,padding:"2px 7px",borderRadius:14,backdropFilter:"blur(4px)"}}>
                        {ce(exc.categories?.[0])} {exc.categories?.[0]}
                      </span>
                      <span style={{position:"absolute",top:6,right:8,fontSize:9,color:"rgba(255,255,255,.85)",background:"rgba(0,0,0,.35)",padding:"2px 6px",borderRadius:12}}>✋ glisser</span>
                    </div>
                  )}
                  <div style={{padding:"8px 10px"}}>
                    <div style={{fontSize:12,fontWeight:700,color:"#111827",marginBottom:4}}>{exc.title}</div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontSize:11,color:"#9CA3AF"}}>📍 {exc.city} · ⏱️ {exc.duration_hours}h</span>
                      <span style={{fontSize:12,fontWeight:700,color:col}}>{exc.price_per_person} TND</span>
                    </div>
                    {exc.rating>0&&<div style={{fontSize:10,color:"#9CA3AF",marginTop:3}}>⭐ {exc.rating} ({exc.reviews_count})</div>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stats */}
          <div style={{padding:"10px 14px",borderTop:"1px solid #F3F4F6",background:"#FAFAF9",flexShrink:0}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
              <span style={{fontSize:11,color:"#9CA3AF"}}>Activités</span>
              <span style={{fontSize:12,fontWeight:800,color:"#2B96A8"}}>{totAct}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
              <span style={{fontSize:11,color:"#9CA3AF"}}>Budget</span>
              <span style={{fontSize:12,fontWeight:800,color:"#059669"}}>{totBudget} TND</span>
            </div>
            <div style={{height:4,background:"#F3F4F6",borderRadius:10,overflow:"hidden"}}>
              <div style={{height:"100%",background:"linear-gradient(90deg,#2B96A8,#7DD9E8)",borderRadius:10,width:`${Math.min(100,(totAct/(days*2))*100)}%`,transition:"width .4s ease"}}/>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div style={{flex:1,overflowY:"auto",padding:"20px 22px"}}>
          {/* Day tabs */}
          <div style={{display:"flex",gap:6,marginBottom:18,flexWrap:"wrap"}}>
            {itin.map((day,i)=>{
              const act=activeDay===i;
              const cnt=day.activities.length;
              return(
                <button key={i} className="dtab vj-btn" onClick={()=>setActiveDay(i)}
                  style={{padding:"8px 18px",borderRadius:22,border:`2px solid ${act?"#2B96A8":"#E5E7EB"}`,background:act?"#2B96A8":"white",fontSize:13,fontWeight:act?700:500,color:act?"white":"#6B7280",display:"flex",alignItems:"center",gap:7,boxShadow:act?"0 6px 16px -6px rgba(43,150,168,.5)":"none"}}>
                  <span style={{fontSize:14}}>{CITY_EMOJI[day.city]||"📅"}</span>
                  Jour {i+1}
                  {cnt>0&&<span style={{fontSize:10,background:act?"rgba(255,255,255,.25)":"#2B96A8",color:"white",borderRadius:14,padding:"2px 7px",fontWeight:800}}>{cnt}</span>}
                </button>
              );
            })}
          </div>

          {itin[activeDay]&&(
            <div style={{background:"white",borderRadius:20,border:"1px solid #F3F4F6",overflow:"hidden",boxShadow:"0 4px 20px rgba(0,0,0,.06)"}}>
              {/* Header */}
              <div style={{padding:"16px 22px",background:"#FAFAF9",borderBottom:"1px solid #F3F4F6",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:46,height:46,borderRadius:14,background:"#2B96A8",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,boxShadow:"0 4px 12px rgba(43,150,168,.4)"}}>
                    {CITY_EMOJI[itin[activeDay].city]||"📅"}
                  </div>
                  <div>
                    <h2 style={{fontSize:16,fontWeight:800,color:"#111827",marginBottom:2}}>Jour {activeDay+1} — {itin[activeDay].city}</h2>
                    <p style={{fontSize:12,color:"#9CA3AF"}}>
                      {itin[activeDay].activities.length} activité{itin[activeDay].activities.length!==1?"s":""}
                      {itin[activeDay].activities.length>0&&` · ${itin[activeDay].activities.reduce((s,a)=>s+a.excursion.price_per_person,0)} TND`}
                    </p>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <label style={{fontSize:11,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:".05em",fontWeight:600}}>Ville :</label>
                  <select value={itin[activeDay].city}
                    onChange={e=>setItin(prev=>{const u=[...prev];u[activeDay]={...u[activeDay],city:e.target.value};return u;})}
                    style={{border:"1.5px solid #E5E7EB",borderRadius:18,padding:"6px 12px",fontSize:12,fontFamily:"inherit",color:"#111827",background:"white",cursor:"pointer",outline:"none",fontWeight:600}}>
                    {ALL_CITIES.map(c=><option key={c.name} value={c.name}>{c.emoji} {c.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Slots */}
              <div style={{padding:"18px 22px"}}>
                {SLOTS.map(slot=>{
                  const acts=itin[activeDay].activities.filter(a=>a.time===slot.key);
                  const isOver=dragOver?.day===activeDay&&dragOver?.time===slot.key;
                  return(
                    <div key={slot.key} style={{marginBottom:16}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
                        <span style={{fontSize:17}}>{slot.emoji}</span>
                        <span style={{fontSize:13,fontWeight:700,color:"#374151"}}>{slot.label}</span>
                        <span style={{fontSize:11,color:"#9CA3AF",background:"#F3F4F6",padding:"2px 8px",borderRadius:14}}>{slot.hint}</span>
                        {acts.length>0&&(
                          <span style={{marginLeft:"auto",fontSize:11,color:"#059669",background:"rgba(5,150,105,.08)",padding:"2px 9px",borderRadius:14,fontWeight:700}}>
                            {acts.reduce((s,a)=>s+a.excursion.price_per_person,0)} TND · {acts.reduce((s,a)=>s+a.excursion.duration_hours,0)}h
                          </span>
                        )}
                      </div>
                      <div className={`dz${isOver?" ov":""}`}
                        onDragOver={e=>{e.preventDefault();setDragOver({day:activeDay,time:slot.key});}}
                        onDragLeave={()=>setDragOver(null)}
                        onDrop={()=>drop(activeDay,slot.key)}
                        style={{minHeight:76,borderRadius:14,border:`2px dashed ${isOver?"#2B96A8":"#E5E7EB"}`,background:isOver?"rgba(43,150,168,.04)":"#FAFAF9",padding:10,display:"flex",flexWrap:"wrap",gap:8,alignItems:"flex-start"}}>
                        {acts.length===0?(
                          <div style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",padding:"14px 0",fontSize:12,color:isOver?"#2B96A8":"#C4B8B0",fontStyle:"italic",fontWeight:isOver?700:400}}>
                            {isOver?"✓ Déposez ici":`Glissez une excursion ${slot.emoji}`}
                          </div>
                        ):acts.map(act=>{
                          const col=cc(act.excursion.categories?.[0]);
                          return(
                            <div key={act.id} className="act" draggable onDragStart={()=>{dragRef.current={kind:"activity",activityId:act.id,fromDay:activeDay,fromTime:act.time};}}
                              style={{display:"flex",alignItems:"center",gap:9,padding:"8px 11px",borderRadius:12,background:"white",border:`1.5px solid ${col}20`,boxShadow:"0 1px 6px rgba(0,0,0,.05)",flex:"1 1 auto"}}>
                              {act.excursion.photos?.[0]&&<img src={act.excursion.photos[0]} alt="" style={{width:36,height:36,borderRadius:9,objectFit:"cover",flexShrink:0}}/>}
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:12,fontWeight:700,color:"#111827",marginBottom:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{act.excursion.title}</div>
                                <div style={{fontSize:11,color:"#9CA3AF",display:"flex",gap:8}}>
                                  <span>📍 {act.excursion.city}</span>
                                  <span>⏱️ {act.excursion.duration_hours}h</span>
                                  <span style={{color:col,fontWeight:700}}>{act.excursion.price_per_person} TND</span>
                                </div>
                                {act.note&&<div style={{fontSize:10,color:"#9CA3AF",marginTop:2,fontStyle:"italic"}}>📝 {act.note}</div>}
                              </div>
                              <div style={{display:"flex",gap:2,flexShrink:0}}>
                                <button className="ib" onClick={()=>{setEditNote(act.id);setNoteText(act.note);}}
                                  style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:"#9CA3AF",padding:"3px 5px"}}>📝</button>
                                <button className="ib" onClick={()=>rmAct(activeDay,act.id)}
                                  style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:"#9CA3AF",padding:"3px 5px"}}
                                  onMouseEnter={e=>e.currentTarget.style.color="#DC2626"}
                                  onMouseLeave={e=>e.currentTarget.style.color="#9CA3AF"}>✕</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer nav */}
              <div style={{padding:"10px 22px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",borderTop:"1px solid #F3F4F6"}}>
                <p style={{fontSize:11,color:"#9CA3AF",fontStyle:"italic"}}>💡 Glissez-déposez entre créneaux</p>
                <div style={{display:"flex",gap:7}}>
                  <button className="nvb vj-btn" onClick={()=>setActiveDay(p=>Math.max(0,p-1))} disabled={activeDay===0}
                    style={{padding:"7px 14px",border:`1.5px solid ${activeDay===0?"#E5E7EB":"#2B96A8"}`,borderRadius:22,background:activeDay===0?"transparent":"#2B96A8",fontSize:12,fontWeight:700,color:activeDay===0?"#D1D5DB":"white",cursor:activeDay===0?"not-allowed":"pointer"}}>
                    ← Préc.
                  </button>
                  <button className="nvb vj-btn" onClick={()=>setActiveDay(p=>Math.min(days-1,p+1))} disabled={activeDay===days-1}
                    style={{padding:"7px 14px",border:`1.5px solid ${activeDay===days-1?"#E5E7EB":"#2B96A8"}`,borderRadius:22,background:activeDay===days-1?"transparent":"#2B96A8",fontSize:12,fontWeight:700,color:activeDay===days-1?"#D1D5DB":"white",cursor:activeDay===days-1?"not-allowed":"pointer"}}>
                    Suiv. →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Note modal */}
      {editNote&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}}
          onClick={e=>{if(e.target===e.currentTarget)setEditNote(null);}}>
          <div style={{background:"white",borderRadius:22,padding:28,width:390,boxShadow:"0 32px 64px -16px rgba(0,0,0,.3)"}}>
            <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900,color:"#111827",marginBottom:6}}>Note personnelle</h3>
            <p style={{fontSize:13,color:"#9CA3AF",marginBottom:14}}>Conseil, rappel, info utile pour cette excursion...</p>
            <textarea autoFocus value={noteText} onChange={e=>setNoteText(e.target.value)}
              placeholder="Ex : Réservation recommandée..."
              style={{width:"100%",height:96,padding:"12px 14px",border:"1.5px solid #E5E7EB",borderRadius:13,fontSize:13,fontFamily:"inherit",resize:"none",outline:"none",color:"#111827",background:"#FAFAF9"}}
              onFocus={e=>e.currentTarget.style.borderColor="#2B96A8"}
              onBlur={e=>e.currentTarget.style.borderColor="#E5E7EB"}/>
            <div style={{display:"flex",gap:10,marginTop:14}}>
              <button className="vj-btn" onClick={()=>setEditNote(null)}
                style={{flex:1,padding:12,border:"1.5px solid #E5E7EB",borderRadius:22,background:"white",fontSize:13,color:"#374151",fontWeight:600}}>Annuler</button>
              <button className="vj-btn" onClick={()=>saveNote(activeDay,editNote!)}
                style={{flex:1,padding:12,border:"none",borderRadius:22,background:"#2B96A8",fontSize:13,color:"white",fontWeight:700,boxShadow:"0 6px 16px -6px rgba(43,150,168,.5)"}}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ════════════════ RÉSUMÉ ════════════════
  return(
    <div style={{minHeight:"100vh",background:"#FAFAF9",padding:"40px 20px 60px",fontFamily:"'DM Sans',system-ui,sans-serif"}}>
      <style>{CSS}</style>
      <div style={{maxWidth:760,margin:"0 auto"}}>
        <button className="vj-btn" onClick={()=>setStep("builder")}
          style={{background:"white",border:"1px solid #E5E7EB",color:"#374151",fontSize:13,display:"inline-flex",alignItems:"center",gap:8,padding:"9px 20px",borderRadius:24,fontWeight:600,marginBottom:28}}>
          ← Retour au planning
        </button>

        <div style={{background:"white",borderRadius:20,border:"1px solid #F3F4F6",overflow:"hidden",boxShadow:"0 4px 24px rgba(0,0,0,.07)"}}>
          {/* Header */}
          <div style={{padding:"26px 32px",background:"#FAFAF9",borderBottom:"1px solid #F3F4F6"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <p style={{fontSize:11,fontWeight:700,color:"#2B96A8",textTransform:"uppercase",letterSpacing:".08em",marginBottom:8}}>✏️ Votre itinéraire</p>
                <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:34,fontWeight:900,color:"#111827",lineHeight:1.1,marginBottom:8}}>{days} jours en Tunisie</h1>
                <p style={{fontSize:14,color:"#6B7280"}}>{selCities.join(" · ")}</p>
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8}}>
                <span style={{fontSize:13,fontWeight:600,color:"#374151",background:"#F3F4F6",padding:"6px 16px",borderRadius:22}}>{totAct} activité{totAct>1?"s":""}</span>
                <span style={{fontSize:16,fontWeight:800,color:"#059669",background:"rgba(5,150,105,.1)",padding:"7px 20px",borderRadius:22}}>{totBudget} TND</span>
              </div>
            </div>
          </div>

          {/* Days */}
          <div style={{padding:"18px 24px"}}>
            {itin.map((day,i)=>(
              <div key={i} style={{marginBottom:10,padding:"16px 18px",background:"#FAFAF9",borderRadius:16,border:"1px solid #F3F4F6"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <h3 style={{fontSize:14,fontWeight:800,color:"#111827",display:"flex",alignItems:"center",gap:8}}>
                    <span style={{width:30,height:30,borderRadius:9,background:"#2B96A8",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:14}}>{CITY_EMOJI[day.city]||"📅"}</span>
                    Jour {i+1} — {day.city}
                  </h3>
                  {day.activities.length>0&&(
                    <span style={{fontSize:11,fontWeight:700,color:"#059669",background:"rgba(5,150,105,.08)",padding:"3px 10px",borderRadius:20}}>
                      {day.activities.reduce((s,a)=>s+a.excursion.price_per_person,0)} TND · {day.activities.reduce((s,a)=>s+a.excursion.duration_hours,0)}h
                    </span>
                  )}
                </div>
                {day.activities.length>0?(
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {SLOTS.map(slot=>day.activities.filter(a=>a.time===slot.key).map(act=>{
                      const col=cc(act.excursion.categories?.[0]);
                      return(
                        <div key={act.id} style={{display:"flex",alignItems:"center",gap:9,padding:"9px 11px",background:"white",borderRadius:12,border:`1px solid ${col}18`}}>
                          <span style={{fontSize:14,flexShrink:0}}>{slot.emoji}</span>
                          {act.excursion.photos?.[0]&&<img src={act.excursion.photos[0]} alt="" style={{width:38,height:38,borderRadius:9,objectFit:"cover",flexShrink:0}}/>}
                          <div style={{flex:1}}>
                            <div style={{fontSize:13,fontWeight:700,color:"#111827",marginBottom:2}}>{act.excursion.title}</div>
                            <div style={{fontSize:11,color:"#9CA3AF",display:"flex",gap:10}}>
                              <span>📍 {act.excursion.city}</span><span>⏱️ {act.excursion.duration_hours}h</span>
                              {act.excursion.rating>0&&<span>⭐ {act.excursion.rating}</span>}
                            </div>
                            {act.note&&<div style={{fontSize:11,color:"#9CA3AF",marginTop:2,fontStyle:"italic"}}>📝 {act.note}</div>}
                          </div>
                          <span style={{fontSize:13,fontWeight:800,color:col,flexShrink:0}}>{act.excursion.price_per_person} TND</span>
                        </div>
                      );
                    }))}
                  </div>
                ):(
                  <p style={{fontSize:12,color:"#D1D5DB",fontStyle:"italic"}}>Aucune activité planifiée</p>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{padding:"14px 24px 24px",display:"flex",gap:10,borderTop:"1px solid #F3F4F6"}}>
            <button className="vj-btn" onClick={()=>setStep("builder")}
              style={{flex:1,padding:12,border:"1.5px solid #2B96A8",borderRadius:22,background:"none",fontSize:14,color:"#2B96A8",fontWeight:700}}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(43,150,168,.05)"}
              onMouseLeave={e=>e.currentTarget.style.background="none"}>
              ✏️ Modifier
            </button>
            <button className="vj-btn" onClick={()=>alert("Itinéraire sauvegardé !")}
              style={{flex:1,padding:12,border:"none",borderRadius:22,background:"#111827",fontSize:14,color:"white",fontWeight:700,boxShadow:"0 8px 20px -8px rgba(0,0,0,.4)"}}
              onMouseEnter={e=>{(e.target as HTMLButtonElement).style.background="#374151";}}
              onMouseLeave={e=>{(e.target as HTMLButtonElement).style.background="#111827";}}>
              💾 Sauvegarder ce voyage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ItinerairePage(){
  return(
    <Suspense fallback={
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",fontSize:14,color:"#9CA3AF",background:"#FAFAF9",fontFamily:"system-ui"}}>
        Chargement...
      </div>
    }>
      <ItineraireInner/>
    </Suspense>
  );
}