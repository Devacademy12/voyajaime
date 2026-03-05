"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  MapPin,
  Clock,
  Star,
  Pencil,
  Trash2,
  FileText,
  Send,
  Grip,
  Search,
  CheckCircle2,
  PiggyBank,
  Layers,
  SlidersHorizontal,
  BookMarked,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

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
  { name:"Nabeul",    emoji:"🏺", region:"Nord",   description:"Poterie & art" },
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
.city-c{transition:all .18s;cursor:pointer}
.city-c:hover{transform:translateY(-2px);box-shadow:0 8px 18px -6px rgba(43,150,168,.25)!important}
.cat-c{transition:all .15s;cursor:pointer}
.cat-c:hover{transform:translateY(-1px)}
.exc-c{transition:all .2s;cursor:grab}
.exc-c:hover{transform:translateY(-2px);box-shadow:0 12px 24px -8px rgba(43,150,168,.2)!important}
.exc-c:active{cursor:grabbing;transform:scale(.98)}
.dz{transition:all .18s}
.dz.ov{border-color:#2B96A8!important;background:rgba(43,150,168,.05)!important}
.act{transition:all .18s;cursor:grab}
.act:hover{transform:translateY(-1px);box-shadow:0 6px 14px -4px rgba(0,0,0,.1)!important}
.act:active{cursor:grabbing}
.dtab{transition:all .15s;cursor:pointer}
.dtab:hover{border-color:#2B96A8!important}
.ib{transition:all .12s;border-radius:7px}
.ib:hover{background:rgba(43,150,168,.1)!important}
.nvb{transition:all .18s}
.nvb:hover:not(:disabled){background:#1e7a8a!important}
.cta-btn{transition:all .22s}
.cta-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 14px 28px -8px rgba(43,150,168,.5)!important}
.day-quick{transition:all .15s;cursor:pointer}
.day-quick:hover{border-color:#2B96A8!important;color:#2B96A8!important}
@keyframes lp{0%,100%{opacity:1}50%{opacity:.4}}
.lp{animation:lp 1.5s ease infinite}
@keyframes fu{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.fu{animation:fu .28s ease forwards}
input[type=range]{accent-color:#2B96A8;cursor:pointer}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:#E5E7EB;border-radius:4px}
::-webkit-scrollbar-thumb:hover{background:#D1D5DB}
`;

function ItineraireInner(){
  const router = useRouter();
  const sb = createClient();

  const [step,       setStep]       = useState<Step>("config");
  const [days,       setDays]       = useState(3);
  const [selCities,  setSelCities]  = useState<string[]>([]);
  const [selCats,    setSelCats]    = useState<string[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [allExc,     setAllExc]     = useState<Excursion[]>([]);
  const [ldCats,     setLdCats]     = useState(true);
  const [ldExc,      setLdExc]      = useState(true);
  const [search,     setSearch]     = useState("");
  const [palCat,     setPalCat]     = useState("Toutes");
  const [palCity,    setPalCity]    = useState("Toutes");
  const [itin,       setItin]       = useState<DayPlan[]>([]);
  const [activeDay,  setActiveDay]  = useState(0);
  const [editNote,   setEditNote]   = useState<string|null>(null);
  const [noteText,   setNoteText]   = useState("");
  const [dragOver,   setDragOver]   = useState<{day:number;time:TimeKey}|null>(null);
  const dragRef = useRef<DragPayload|null>(null);

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

  const cc = (n:string) => categories.find(c=>c.nom===n)?.couleur||"#2B96A8";
  const ce = (n:string) => categories.find(c=>c.nom===n)?.emoji||"🏔️";

  const palette = allExc.filter(e=>{
    const q = search.toLowerCase();
    return (e.title.toLowerCase().includes(q)||e.city.toLowerCase().includes(q))
      &&(palCat==="Toutes"||e.categories?.includes(palCat))
      &&(palCity==="Toutes"||e.city===palCity)
      &&(selCities.length===0||selCities.includes(e.city));
  });

  const startBuilder = () => {
    setItin(Array.from({length:days},(_,i)=>({city:selCities[i%selCities.length]||"Tunis",activities:[]})));
    setActiveDay(0);
    setPalCity(selCities.length===1?selCities[0]:"Toutes");
    setStep("builder");
  };

  const drop = (dayIdx:number, time:TimeKey) => {
    const p = dragRef.current; if(!p) return;
    if(p.kind==="excursion"){
      setItin(prev=>{const u=[...prev];u[dayIdx]={...u[dayIdx],activities:[...u[dayIdx].activities,{id:`${Date.now()}-${Math.random()}`,excursion:p.excursion,note:"",time}]};return u;});
    } else {
      const{activityId,fromDay,fromTime}=p;
      if(fromDay===dayIdx&&fromTime===time) return;
      setItin(prev=>{const u=prev.map(d=>({...d,activities:[...d.activities]}));const idx=u[fromDay].activities.findIndex(a=>a.id===activityId);if(idx===-1)return prev;const[act]=u[fromDay].activities.splice(idx,1);u[dayIdx].activities.push({...act,time});return u;});
    }
    dragRef.current=null; setDragOver(null);
  };

  const rmAct = (dayIdx:number, id:string) => setItin(prev=>{const u=[...prev];u[dayIdx]={...u[dayIdx],activities:u[dayIdx].activities.filter(a=>a.id!==id)};return u;});
  const saveNote = (dayIdx:number, id:string) => {setItin(prev=>{const u=[...prev];u[dayIdx]={...u[dayIdx],activities:u[dayIdx].activities.map(a=>a.id===id?{...a,note:noteText}:a)};return u;});setEditNote(null);setNoteText("");};

  const totAct    = itin.reduce((s,d)=>s+d.activities.length,0);
  const totBudget = itin.reduce((s,d)=>s+d.activities.reduce((ss,a)=>ss+a.excursion.price_per_person,0),0);

  // ════════════════ CONFIG ════════════════
  if(step==="config") return (
    <div style={{height:"100vh",display:"flex",flexDirection:"column",background:"#FAFAF9",fontFamily:"'DM Sans',system-ui,sans-serif",overflow:"hidden"}}>
      <style>{CSS}</style>

      {/* ── Top bar ── */}
      <div style={{height:56,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 28px",borderBottom:"1px solid #F3F4F6",background:"white",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button className="vj-btn" onClick={()=>router.push("/")}
            style={{background:"none",border:"1px solid #E5E7EB",color:"#374151",fontSize:13,display:"inline-flex",alignItems:"center",gap:6,padding:"6px 14px",borderRadius:24,fontWeight:600}}>
            <ArrowLeft size={14}/> Retour
          </button>
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 12px",background:"rgba(43,150,168,.08)",borderRadius:24}}>
            <SlidersHorizontal size={13} color="#2B96A8"/>
            <span style={{fontSize:12,fontWeight:700,color:"#2B96A8",letterSpacing:".04em"}}>Planificateur</span>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:900,color:"#111827"}}>
            Créez votre itinéraire <span style={{color:"#2B96A8"}}>sur mesure</span>
          </h1>
        </div>
        <div style={{width:120}}/>
      </div>

      {/* ── Main area: 2 columns ── */}
      <div style={{flex:1,display:"grid",gridTemplateColumns:"340px 1fr",minHeight:0,overflow:"hidden"}}>

        {/* LEFT: Durée + Catégories */}
        <div style={{borderRight:"1px solid #F3F4F6",background:"white",display:"flex",flexDirection:"column",overflow:"hidden"}}>

          {/* Durée */}
          <div style={{padding:"20px 24px",borderBottom:"1px solid #F3F4F6",flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
              <Calendar size={16} color="#2B96A8"/>
              <h2 style={{fontSize:14,fontWeight:800,color:"#111827"}}>Durée du voyage</h2>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:14}}>
              <div style={{flex:1}}>
                <input type="range" min={1} max={14} value={days} onChange={e=>setDays(Number(e.target.value))}
                  style={{width:"100%",height:4}} />
                <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                  <span style={{fontSize:10,color:"#C4C9D0"}}>1 jour</span>
                  <span style={{fontSize:10,color:"#C4C9D0"}}>14 jours</span>
                </div>
              </div>
              <div style={{textAlign:"center",background:"rgba(43,150,168,.07)",border:"1.5px solid rgba(43,150,168,.2)",borderRadius:14,padding:"8px 16px",flexShrink:0}}>
                <span style={{fontFamily:"'Playfair Display',serif",fontSize:32,fontWeight:900,color:"#2B96A8",lineHeight:1,display:"block"}}>{days}</span>
                <span style={{fontSize:10,color:"#6B7280",textTransform:"uppercase",letterSpacing:".05em",fontWeight:600}}>{days>1?"jours":"jour"}</span>
              </div>
            </div>
            <div style={{display:"flex",gap:4}}>
              {[1,2,3,5,7,10,14].map(n=>(
                <button key={n} className="day-quick vj-btn" onClick={()=>setDays(n)}
                  style={{flex:1,padding:"6px 0",borderRadius:20,border:`1.5px solid ${days===n?"#2B96A8":"#E5E7EB"}`,background:days===n?"#2B96A8":"transparent",color:days===n?"white":"#9CA3AF",fontSize:11,fontWeight:days===n?700:500}}>
                  {n}j
                </button>
              ))}
            </div>
          </div>

          {/* Catégories */}
          <div style={{flex:1,padding:"18px 24px",overflowY:"auto"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
              <Layers size={15} color="#2B96A8"/>
              <h2 style={{fontSize:14,fontWeight:800,color:"#111827"}}>Centres d&apos;intérêt</h2>
              <span style={{fontSize:11,color:"#9CA3AF",fontWeight:400}}>(optionnel)</span>
            </div>
            {ldCats ? (
              <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                {[1,2,3,4,5,6].map(i=><div key={i} className="lp" style={{height:34,width:100,borderRadius:22,background:"#F3F4F6"}}/>)}
              </div>
            ) : (
              <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                {categories.map(cat=>{
                  const sel = selCats.includes(cat.nom);
                  return(
                    <button key={cat.id} className="cat-c vj-btn" onClick={()=>setSelCats(tog(selCats,cat.nom))}
                      style={{padding:"7px 14px",borderRadius:22,border:`1.5px solid ${sel?cat.couleur:"#E5E7EB"}`,background:sel?`${cat.couleur}12`:"white",color:sel?cat.couleur:"#6B7280",fontSize:12,fontWeight:sel?700:500,display:"flex",alignItems:"center",gap:6,boxShadow:sel?`0 3px 10px -3px ${cat.couleur}40`:"none"}}>
                      <span>{cat.emoji}</span>{cat.nom}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom CTA */}
          <div style={{flexShrink:0,padding:"16px 24px",borderTop:"1px solid #F3F4F6",background:"#FAFAF9"}}>
            {selCities.length>0 && (
              <div style={{marginBottom:12,padding:"9px 12px",background:"white",borderRadius:12,border:"1px solid #E5E7EB",fontSize:12,color:"#374151",fontWeight:500}}>
                <span style={{color:"#9CA3AF",fontSize:11,textTransform:"uppercase",letterSpacing:".04em",fontWeight:700}}>Sélection · </span>
                <span style={{color:"#2B96A8",fontWeight:700}}>{days} j</span>
                {" · "}{selCities.slice(0,3).map(c=>`${CITY_EMOJI[c]||""} ${c}`).join(", ")}
                {selCities.length>3&&<span style={{color:"#2B96A8"}}> +{selCities.length-3}</span>}
              </div>
            )}
            <button className="cta-btn vj-btn" onClick={startBuilder} disabled={selCities.length===0}
              style={{width:"100%",padding:"13px",background:selCities.length===0?"#E5E7EB":"#2B96A8",color:selCities.length===0?"#9CA3AF":"white",border:"none",borderRadius:14,fontSize:14,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:8,cursor:selCities.length===0?"not-allowed":"pointer",boxShadow:selCities.length>0?"0 8px 20px -6px rgba(43,150,168,.5)":"none"}}>
              Composer mon itinéraire <ArrowRight size={16}/>
            </button>
          </div>
        </div>

        {/* RIGHT: Villes */}
        <div style={{display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{padding:"16px 24px 12px",flexShrink:0,borderBottom:"1px solid #F3F4F6",display:"flex",alignItems:"center",gap:8}}>
            <MapPin size={15} color="#2B96A8"/>
            <h2 style={{fontSize:14,fontWeight:800,color:"#111827"}}>Villes à explorer</h2>
            {selCities.length>0&&(
              <span style={{fontSize:12,fontWeight:700,color:"#2B96A8",background:"rgba(43,150,168,.08)",padding:"2px 10px",borderRadius:20}}>
                {selCities.length} sélectionnée{selCities.length>1?"s":""}
              </span>
            )}
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"16px 24px"}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:10}}>
              {ALL_CITIES.map(c=>{
                const sel = selCities.includes(c.name);
                return(
                  <button key={c.name} className="city-c vj-btn" onClick={()=>setSelCities(tog(selCities,c.name))}
                    style={{padding:"14px 10px",borderRadius:16,border:`2px solid ${sel?"#2B96A8":"#F3F4F6"}`,background:sel?"rgba(43,150,168,.05)":"white",textAlign:"center",boxShadow:sel?"0 6px 16px -6px rgba(43,150,168,.28)":"0 1px 4px rgba(0,0,0,.04)",position:"relative"}}>
                    {sel&&<div style={{position:"absolute",top:8,right:8,width:16,height:16,background:"#2B96A8",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}><CheckCircle2 size={10} color="white"/></div>}
                    <div style={{fontSize:28,marginBottom:6}}>{c.emoji}</div>
                    <div style={{fontSize:12,fontWeight:sel?700:600,color:sel?"#2B96A8":"#374151",marginBottom:2}}>{c.name}</div>
                    <div style={{fontSize:10,color:sel?"#2B96A8":"#9CA3AF"}}>{c.description}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ════════════════ BUILDER ════════════════
  if(step==="builder") return (
    <div style={{height:"100vh",display:"flex",flexDirection:"column",background:"#FAFAF9",fontFamily:"'DM Sans',system-ui,sans-serif",overflow:"hidden"}}>
      <style>{CSS}</style>

      {/* Topbar */}
      <div style={{height:56,flexShrink:0,background:"rgba(255,255,255,.97)",backdropFilter:"blur(16px)",borderBottom:"1px solid #F3F4F6",padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 1px 6px rgba(0,0,0,.04)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button className="vj-btn" onClick={()=>setStep("config")}
            style={{background:"none",border:"1px solid #E5E7EB",color:"#374151",fontSize:12,display:"flex",alignItems:"center",gap:6,padding:"6px 14px",borderRadius:22,fontWeight:600}}>
            <ArrowLeft size={13}/> Config
          </button>
          <span style={{fontSize:12,color:"#2B96A8",background:"rgba(43,150,168,.08)",padding:"4px 12px",borderRadius:22,fontWeight:600,display:"flex",alignItems:"center",gap:5}}>
            <Calendar size={12}/>{days}j · {selCities.join(" · ")}
          </span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {totAct>0&&<>
            <span style={{fontSize:11,color:"#374151",background:"#F9FAFB",padding:"4px 12px",borderRadius:22,border:"1px solid #E5E7EB",fontWeight:600,display:"flex",alignItems:"center",gap:5}}>
              <Layers size={12}/>{totAct} excursion{totAct>1?"s":""}
            </span>
            <span style={{fontSize:11,fontWeight:700,color:"#059669",background:"rgba(5,150,105,.1)",padding:"4px 12px",borderRadius:22,display:"flex",alignItems:"center",gap:5}}>
              <PiggyBank size={12}/>{totBudget} TND
            </span>
          </>}
          <button className="vj-btn" onClick={()=>setStep("result")}
            style={{padding:"7px 20px",background:"#111827",color:"white",border:"none",borderRadius:22,fontSize:12,fontWeight:700,boxShadow:"0 4px 12px rgba(0,0,0,.15)",display:"flex",alignItems:"center",gap:6}}>
            Résumé <ArrowRight size={13}/>
          </button>
        </div>
      </div>

      <div style={{flex:1,display:"flex",minHeight:0}}>

        {/* ── Palette ── */}
        <div style={{width:280,flexShrink:0,borderRight:"1px solid #F3F4F6",background:"white",display:"flex",flexDirection:"column",overflow:"hidden"}}>

          {/* Filters */}
          <div style={{padding:"12px 14px 8px",flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
              <BookMarked size={13} color="#2B96A8"/>
              <h2 style={{fontSize:13,fontWeight:800,color:"#111827"}}>Excursions</h2>
            </div>
            <div style={{position:"relative",marginBottom:9}}>
              <Search size={12} color="#9CA3AF" style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
              <input type="text" placeholder="Rechercher..." value={search} onChange={e=>setSearch(e.target.value)}
                style={{width:"100%",padding:"7px 10px 7px 28px",border:"1.5px solid #E5E7EB",borderRadius:20,fontSize:12,fontFamily:"inherit",outline:"none",color:"#111827",background:"#FAFAF9",transition:"border-color .2s"}}
                onFocus={e=>e.currentTarget.style.borderColor="#2B96A8"}
                onBlur={e=>e.currentTarget.style.borderColor="#E5E7EB"}/>
            </div>
            {/* City filter */}
            <div style={{marginBottom:7}}>
              <p style={{fontSize:10,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:".06em",marginBottom:4}}>Villes</p>
              <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                {["Toutes",...selCities].map(c=>(
                  <button key={c} className="vj-btn" onClick={()=>setPalCity(c)}
                    style={{padding:"3px 8px",borderRadius:18,border:`1px solid ${palCity===c?"#2B96A8":"#E5E7EB"}`,background:palCity===c?"#2B96A8":"white",color:palCity===c?"white":"#6B7280",fontSize:10,fontWeight:palCity===c?700:500,transition:"all .12s"}}>
                    {c==="Toutes"?"Toutes":`${CITY_EMOJI[c]||""} ${c}`}
                  </button>
                ))}
              </div>
            </div>
            {/* Cat filter */}
            <div style={{paddingBottom:8,borderBottom:"1px solid #F3F4F6"}}>
              <p style={{fontSize:10,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:".06em",marginBottom:4}}>Catégories</p>
              <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                {["Toutes",...categories.map(c=>c.nom)].map(cat=>(
                  <button key={cat} className="vj-btn" onClick={()=>setPalCat(cat)}
                    style={{padding:"3px 8px",borderRadius:18,border:`1px solid ${palCat===cat?(cc(cat)||"#2B96A8"):"#E5E7EB"}`,background:palCat===cat?`${cc(cat)||"#2B96A8"}12`:"white",color:palCat===cat?cc(cat)||"#2B96A8":"#6B7280",fontSize:10,fontWeight:palCat===cat?700:500,transition:"all .12s"}}>
                    {cat==="Toutes"?"Toutes":`${ce(cat)} ${cat}`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Excursion cards */}
          <div style={{flex:1,overflowY:"auto",padding:"8px 10px 12px"}}>
            {ldExc ? Array.from({length:3}).map((_,i)=><div key={i} className="lp" style={{height:130,borderRadius:12,background:"#F3F4F6",marginBottom:8}}/>)
            : palette.length===0 ? (
              <div style={{textAlign:"center",padding:"32px 0"}}>
                <Search size={28} color="#D1D5DB" style={{margin:"0 auto 8px"}}/>
                <p style={{fontSize:12,color:"#9CA3AF"}}>Aucune excursion</p>
              </div>
            ) : palette.map(exc=>{
              const col = cc(exc.categories?.[0]);
              return(
                <div key={exc.id} className="exc-c" draggable onDragStart={()=>{dragRef.current={kind:"excursion",excursion:exc};}}
                  style={{marginBottom:8,borderRadius:12,background:"white",border:"1px solid #F3F4F6",userSelect:"none",overflow:"hidden",boxShadow:"0 1px 6px rgba(0,0,0,.04)"}}>
                  {exc.photos?.[0]&&(
                    <div style={{height:74,overflow:"hidden",position:"relative"}}>
                      <img src={exc.photos[0]} alt={exc.title} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                      <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,transparent 40%,rgba(0,0,0,.45))"}}/>
                      <span style={{position:"absolute",bottom:5,left:7,fontSize:9,color:"white",fontWeight:700,background:`${col}cc`,padding:"2px 6px",borderRadius:12}}>
                        {ce(exc.categories?.[0])} {exc.categories?.[0]}
                      </span>
                      <span style={{position:"absolute",top:5,right:7,display:"flex",alignItems:"center",gap:3,fontSize:9,color:"rgba(255,255,255,.85)",background:"rgba(0,0,0,.3)",padding:"2px 5px",borderRadius:10}}>
                        <Grip size={9}/> glisser
                      </span>
                    </div>
                  )}
                  <div style={{padding:"7px 9px"}}>
                    <div style={{fontSize:11,fontWeight:700,color:"#111827",marginBottom:3}}>{exc.title}</div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{display:"flex",gap:6,alignItems:"center"}}>
                        <span style={{fontSize:10,color:"#9CA3AF",display:"flex",alignItems:"center",gap:2}}><MapPin size={9}/>{exc.city}</span>
                        <span style={{fontSize:10,color:"#9CA3AF",display:"flex",alignItems:"center",gap:2}}><Clock size={9}/>{exc.duration_hours}h</span>
                      </div>
                      <span style={{fontSize:11,fontWeight:700,color:col}}>{exc.price_per_person} TND</span>
                    </div>
                    {exc.rating>0&&<div style={{fontSize:9,color:"#9CA3AF",marginTop:2,display:"flex",alignItems:"center",gap:3}}>
                      <Star size={9} color="#F59E0B" fill="#F59E0B"/>{exc.rating} ({exc.reviews_count})
                    </div>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stats footer */}
          <div style={{padding:"8px 14px",borderTop:"1px solid #F3F4F6",background:"#FAFAF9",flexShrink:0}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:11,color:"#9CA3AF",display:"flex",alignItems:"center",gap:4}}><Layers size={11}/>Activités</span>
              <span style={{fontSize:12,fontWeight:800,color:"#2B96A8"}}>{totAct}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{fontSize:11,color:"#9CA3AF",display:"flex",alignItems:"center",gap:4}}><PiggyBank size={11}/>Budget</span>
              <span style={{fontSize:12,fontWeight:800,color:"#059669"}}>{totBudget} TND</span>
            </div>
            <div style={{height:3,background:"#F3F4F6",borderRadius:10,overflow:"hidden"}}>
              <div style={{height:"100%",background:"linear-gradient(90deg,#2B96A8,#7DD9E8)",borderRadius:10,width:`${Math.min(100,(totAct/(days*2))*100)}%`,transition:"width .4s ease"}}/>
            </div>
          </div>
        </div>

        {/* ── Calendar ── */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

          {/* Day tabs */}
          <div style={{flexShrink:0,padding:"10px 16px",borderBottom:"1px solid #F3F4F6",background:"white",display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
            {itin.map((day,i)=>{
              const act = activeDay===i;
              const cnt = day.activities.length;
              return(
                <button key={i} className="dtab vj-btn" onClick={()=>setActiveDay(i)}
                  style={{padding:"6px 14px",borderRadius:20,border:`2px solid ${act?"#2B96A8":"#E5E7EB"}`,background:act?"#2B96A8":"white",fontSize:12,fontWeight:act?700:500,color:act?"white":"#6B7280",display:"flex",alignItems:"center",gap:5,boxShadow:act?"0 4px 12px -4px rgba(43,150,168,.45)":"none"}}>
                  <span style={{fontSize:13}}>{CITY_EMOJI[day.city]||"📅"}</span>
                  Jour {i+1}
                  {cnt>0&&<span style={{fontSize:9,background:act?"rgba(255,255,255,.25)":"#2B96A8",color:"white",borderRadius:12,padding:"1px 6px",fontWeight:800}}>{cnt}</span>}
                </button>
              );
            })}
          </div>

          {/* Day content */}
          <div style={{flex:1,overflowY:"auto",padding:"14px 16px"}}>
            {itin[activeDay]&&(
              <div style={{background:"white",borderRadius:18,border:"1px solid #F3F4F6",overflow:"hidden",boxShadow:"0 3px 14px rgba(0,0,0,.05)"}}>
                {/* Day header */}
                <div style={{padding:"13px 18px",background:"#FAFAF9",borderBottom:"1px solid #F3F4F6",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:40,height:40,borderRadius:12,background:"#2B96A8",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,boxShadow:"0 4px 10px rgba(43,150,168,.35)"}}>
                      {CITY_EMOJI[itin[activeDay].city]||"📅"}
                    </div>
                    <div>
                      <h2 style={{fontSize:15,fontWeight:800,color:"#111827",marginBottom:1}}>Jour {activeDay+1} — {itin[activeDay].city}</h2>
                      <p style={{fontSize:11,color:"#9CA3AF"}}>
                        {itin[activeDay].activities.length} activité{itin[activeDay].activities.length!==1?"s":""}
                        {itin[activeDay].activities.length>0&&` · ${itin[activeDay].activities.reduce((s,a)=>s+a.excursion.price_per_person,0)} TND`}
                      </p>
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <label style={{fontSize:11,color:"#9CA3AF",fontWeight:600}}>Ville :</label>
                    <select value={itin[activeDay].city}
                      onChange={e=>setItin(prev=>{const u=[...prev];u[activeDay]={...u[activeDay],city:e.target.value};return u;})}
                      style={{border:"1.5px solid #E5E7EB",borderRadius:16,padding:"5px 10px",fontSize:12,fontFamily:"inherit",color:"#111827",background:"white",cursor:"pointer",outline:"none",fontWeight:600}}>
                      {ALL_CITIES.map(c=><option key={c.name} value={c.name}>{c.emoji} {c.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Slots */}
                <div style={{padding:"14px 18px"}}>
                  {SLOTS.map(slot=>{
                    const acts   = itin[activeDay].activities.filter(a=>a.time===slot.key);
                    const isOver = dragOver?.day===activeDay&&dragOver?.time===slot.key;
                    return(
                      <div key={slot.key} style={{marginBottom:13}}>
                        <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:6}}>
                          <span style={{fontSize:15}}>{slot.emoji}</span>
                          <span style={{fontSize:12,fontWeight:700,color:"#374151"}}>{slot.label}</span>
                          <span style={{fontSize:10,color:"#9CA3AF",background:"#F3F4F6",padding:"1px 7px",borderRadius:12}}>{slot.hint}</span>
                          {acts.length>0&&(
                            <span style={{marginLeft:"auto",fontSize:10,color:"#059669",background:"rgba(5,150,105,.08)",padding:"2px 8px",borderRadius:12,fontWeight:700}}>
                              {acts.reduce((s,a)=>s+a.excursion.price_per_person,0)} TND · {acts.reduce((s,a)=>s+a.excursion.duration_hours,0)}h
                            </span>
                          )}
                        </div>
                        <div className={`dz${isOver?" ov":""}`}
                          onDragOver={e=>{e.preventDefault();setDragOver({day:activeDay,time:slot.key});}}
                          onDragLeave={()=>setDragOver(null)}
                          onDrop={()=>drop(activeDay,slot.key)}
                          style={{minHeight:64,borderRadius:12,border:`2px dashed ${isOver?"#2B96A8":"#E5E7EB"}`,background:isOver?"rgba(43,150,168,.04)":"#FAFAF9",padding:8,display:"flex",flexWrap:"wrap",gap:7,alignItems:"flex-start"}}>
                          {acts.length===0 ? (
                            <div style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",padding:"10px 0",fontSize:12,color:isOver?"#2B96A8":"#C4B8B0",fontStyle:"italic",fontWeight:isOver?700:400,gap:5}}>
                              {isOver ? <><CheckCircle2 size={13}/>Déposez ici</> : `Glissez une excursion ${slot.emoji}`}
                            </div>
                          ) : acts.map(act=>{
                            const col = cc(act.excursion.categories?.[0]);
                            return(
                              <div key={act.id} className="act" draggable onDragStart={()=>{dragRef.current={kind:"activity",activityId:act.id,fromDay:activeDay,fromTime:act.time};}}
                                style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:10,background:"white",border:`1.5px solid ${col}18`,boxShadow:"0 1px 5px rgba(0,0,0,.05)",flex:"1 1 auto",minWidth:200}}>
                                {act.excursion.photos?.[0]&&<img src={act.excursion.photos[0]} alt="" style={{width:32,height:32,borderRadius:8,objectFit:"cover",flexShrink:0}}/>}
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{fontSize:11,fontWeight:700,color:"#111827",marginBottom:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{act.excursion.title}</div>
                                  <div style={{fontSize:10,color:"#9CA3AF",display:"flex",gap:7,alignItems:"center"}}>
                                    <span style={{display:"flex",alignItems:"center",gap:2}}><MapPin size={8}/>{act.excursion.city}</span>
                                    <span style={{display:"flex",alignItems:"center",gap:2}}><Clock size={8}/>{act.excursion.duration_hours}h</span>
                                    <span style={{color:col,fontWeight:700}}>{act.excursion.price_per_person} TND</span>
                                  </div>
                                  {act.note&&<div style={{fontSize:9,color:"#9CA3AF",marginTop:1,fontStyle:"italic",display:"flex",alignItems:"center",gap:3}}><FileText size={8}/>{act.note}</div>}
                                </div>
                                <div style={{display:"flex",gap:1,flexShrink:0}}>
                                  <button className="ib" onClick={()=>{setEditNote(act.id);setNoteText(act.note);}}
                                    style={{background:"none",border:"none",cursor:"pointer",color:"#9CA3AF",padding:"3px 4px",display:"flex",alignItems:"center"}}>
                                    <FileText size={13}/>
                                  </button>
                                  <button className="ib" onClick={()=>rmAct(activeDay,act.id)}
                                    style={{background:"none",border:"none",cursor:"pointer",color:"#9CA3AF",padding:"3px 4px",display:"flex",alignItems:"center",transition:"color .15s"}}
                                    onMouseEnter={e=>e.currentTarget.style.color="#DC2626"}
                                    onMouseLeave={e=>e.currentTarget.style.color="#9CA3AF"}>
                                    <Trash2 size={13}/>
                                  </button>
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
                <div style={{padding:"8px 18px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",borderTop:"1px solid #F3F4F6"}}>
                  <p style={{fontSize:11,color:"#C4C9D0",fontStyle:"italic",display:"flex",alignItems:"center",gap:5}}>
                    <Grip size={12} color="#C4C9D0"/>Glissez-déposez entre créneaux
                  </p>
                  <div style={{display:"flex",gap:6}}>
                    <button className="nvb vj-btn" onClick={()=>setActiveDay(p=>Math.max(0,p-1))} disabled={activeDay===0}
                      style={{padding:"6px 14px",border:`1.5px solid ${activeDay===0?"#E5E7EB":"#2B96A8"}`,borderRadius:20,background:activeDay===0?"transparent":"#2B96A8",fontSize:11,fontWeight:700,color:activeDay===0?"#D1D5DB":"white",cursor:activeDay===0?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:4}}>
                      <ChevronLeft size={13}/> Préc.
                    </button>
                    <button className="nvb vj-btn" onClick={()=>setActiveDay(p=>Math.min(days-1,p+1))} disabled={activeDay===days-1}
                      style={{padding:"6px 14px",border:`1.5px solid ${activeDay===days-1?"#E5E7EB":"#2B96A8"}`,borderRadius:20,background:activeDay===days-1?"transparent":"#2B96A8",fontSize:11,fontWeight:700,color:activeDay===days-1?"#D1D5DB":"white",cursor:activeDay===days-1?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:4}}>
                      Suiv. <ChevronRight size={13}/>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Note modal */}
      {editNote&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}}
          onClick={e=>{if(e.target===e.currentTarget)setEditNote(null);}}>
          <div style={{background:"white",borderRadius:20,padding:24,width:370,boxShadow:"0 28px 56px -14px rgba(0,0,0,.28)"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
              <FileText size={18} color="#2B96A8"/>
              <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:900,color:"#111827"}}>Note personnelle</h3>
            </div>
            <p style={{fontSize:12,color:"#9CA3AF",marginBottom:12}}>Conseil, rappel, info utile pour cette excursion...</p>
            <textarea autoFocus value={noteText} onChange={e=>setNoteText(e.target.value)}
              placeholder="Ex : Réservation recommandée..."
              style={{width:"100%",height:88,padding:"10px 12px",border:"1.5px solid #E5E7EB",borderRadius:12,fontSize:13,fontFamily:"inherit",resize:"none",outline:"none",color:"#111827",background:"#FAFAF9"}}
              onFocus={e=>e.currentTarget.style.borderColor="#2B96A8"}
              onBlur={e=>e.currentTarget.style.borderColor="#E5E7EB"}/>
            <div style={{display:"flex",gap:8,marginTop:12}}>
              <button className="vj-btn" onClick={()=>setEditNote(null)}
                style={{flex:1,padding:"10px",border:"1.5px solid #E5E7EB",borderRadius:20,background:"white",fontSize:13,color:"#374151",fontWeight:600}}>
                Annuler
              </button>
              <button className="vj-btn" onClick={()=>saveNote(activeDay,editNote!)}
                style={{flex:1,padding:"10px",border:"none",borderRadius:20,background:"#2B96A8",fontSize:13,color:"white",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:6,boxShadow:"0 6px 14px -4px rgba(43,150,168,.45)"}}>
                <CheckCircle2 size={14}/>Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ════════════════ RÉSUMÉ ════════════════
  return (
    <div style={{height:"100vh",display:"flex",flexDirection:"column",background:"#FAFAF9",fontFamily:"'DM Sans',system-ui,sans-serif",overflow:"hidden"}}>
      <style>{CSS}</style>

      {/* Top bar */}
      <div style={{height:56,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 24px",borderBottom:"1px solid #F3F4F6",background:"white",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
        <button className="vj-btn" onClick={()=>setStep("builder")}
          style={{background:"none",border:"1px solid #E5E7EB",color:"#374151",fontSize:13,display:"inline-flex",alignItems:"center",gap:6,padding:"6px 14px",borderRadius:22,fontWeight:600}}>
          <ArrowLeft size={13}/> Retour au planning
        </button>
        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:900,color:"#111827"}}>
          Résumé du voyage
        </h1>
        <div style={{display:"flex",gap:8}}>
          <button className="vj-btn" onClick={()=>setStep("builder")}
            style={{padding:"7px 18px",border:"1.5px solid #2B96A8",borderRadius:20,background:"transparent",fontSize:13,color:"#2B96A8",fontWeight:700,display:"flex",alignItems:"center",gap:6}}>
            <Pencil size={13}/>Modifier
          </button>
          <button className="vj-btn" onClick={()=>alert("Itinéraire sauvegardé !")}
            style={{padding:"7px 18px",border:"none",borderRadius:20,background:"#111827",fontSize:13,color:"white",fontWeight:700,display:"flex",alignItems:"center",gap:6,boxShadow:"0 4px 12px rgba(0,0,0,.15)"}}>
            <Send size={13}/>Sauvegarder
          </button>
        </div>
      </div>

      {/* Main: 2 columns */}
      <div style={{flex:1,display:"grid",gridTemplateColumns:"280px 1fr",minHeight:0,overflow:"hidden"}}>

        {/* LEFT: Stats panel */}
        <div style={{borderRight:"1px solid #F3F4F6",background:"white",display:"flex",flexDirection:"column",padding:"22px 20px",gap:12,overflow:"hidden"}}>
          <div>
            <p style={{fontSize:10,fontWeight:700,color:"#2B96A8",textTransform:"uppercase",letterSpacing:".08em",marginBottom:6,display:"flex",alignItems:"center",gap:5}}>
              <BookMarked size={11}/>Votre itinéraire
            </p>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:900,color:"#111827",lineHeight:1.1,marginBottom:6}}>
              {days} jours<br/>en Tunisie
            </h2>
            <p style={{fontSize:13,color:"#6B7280"}}>{selCities.join(" · ")}</p>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {/* Stat: activités */}
            <div style={{padding:"12px 14px",background:"#F9FAFB",borderRadius:14,border:"1px solid #F3F4F6",display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:34,height:34,borderRadius:10,background:"rgba(43,150,168,.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <Layers size={16} color="#2B96A8"/>
              </div>
              <div>
                <p style={{fontSize:10,color:"#9CA3AF",fontWeight:600,textTransform:"uppercase",letterSpacing:".04em"}}>Activités</p>
                <p style={{fontSize:20,fontWeight:800,color:"#111827",lineHeight:1}}>{totAct}</p>
              </div>
            </div>
            {/* Stat: budget */}
            <div style={{padding:"12px 14px",background:"#F9FAFB",borderRadius:14,border:"1px solid #F3F4F6",display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:34,height:34,borderRadius:10,background:"rgba(5,150,105,.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <PiggyBank size={16} color="#059669"/>
              </div>
              <div>
                <p style={{fontSize:10,color:"#9CA3AF",fontWeight:600,textTransform:"uppercase",letterSpacing:".04em"}}>Budget total</p>
                <p style={{fontSize:20,fontWeight:800,color:"#059669",lineHeight:1}}>{totBudget} <span style={{fontSize:12}}>TND</span></p>
              </div>
            </div>
            {/* Stat: jours */}
            <div style={{padding:"12px 14px",background:"#F9FAFB",borderRadius:14,border:"1px solid #F3F4F6",display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:34,height:34,borderRadius:10,background:"rgba(139,92,246,.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <Calendar size={16} color="#8B5CF6"/>
              </div>
              <div>
                <p style={{fontSize:10,color:"#9CA3AF",fontWeight:600,textTransform:"uppercase",letterSpacing:".04em"}}>Durée</p>
                <p style={{fontSize:20,fontWeight:800,color:"#111827",lineHeight:1}}>{days} <span style={{fontSize:12}}>jours</span></p>
              </div>
            </div>
          </div>

          {/* Fill empty space */}
          <div style={{flex:1}}/>

          {/* Actions */}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <button className="vj-btn" onClick={()=>setStep("builder")}
              style={{width:"100%",padding:"11px",border:"1.5px solid #2B96A8",borderRadius:14,background:"transparent",fontSize:13,color:"#2B96A8",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:7}}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(43,150,168,.05)"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <Pencil size={14}/>Modifier l&apos;itinéraire
            </button>
            <button className="vj-btn" onClick={()=>alert("Itinéraire sauvegardé !")}
              style={{width:"100%",padding:"11px",border:"none",borderRadius:14,background:"#111827",fontSize:13,color:"white",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:7,boxShadow:"0 6px 16px -6px rgba(0,0,0,.35)"}}
              onMouseEnter={e=>{(e.target as HTMLButtonElement).style.background="#374151";}}
              onMouseLeave={e=>{(e.target as HTMLButtonElement).style.background="#111827";}}>
              <Send size={14}/>Sauvegarder ce voyage
            </button>
          </div>
        </div>

        {/* RIGHT: Days list */}
        <div style={{overflowY:"auto",padding:"16px 20px"}}>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {itin.map((day,i)=>(
              <div key={i} style={{padding:"14px 16px",background:"white",borderRadius:16,border:"1px solid #F3F4F6",boxShadow:"0 1px 6px rgba(0,0,0,.04)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:day.activities.length>0?10:0}}>
                  <h3 style={{fontSize:13,fontWeight:800,color:"#111827",display:"flex",alignItems:"center",gap:8}}>
                    <span style={{width:28,height:28,borderRadius:8,background:"#2B96A8",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:14,boxShadow:"0 3px 8px rgba(43,150,168,.3)"}}>
                      {CITY_EMOJI[day.city]||"📅"}
                    </span>
                    Jour {i+1} — {day.city}
                  </h3>
                  {day.activities.length>0&&(
                    <span style={{fontSize:11,fontWeight:700,color:"#059669",background:"rgba(5,150,105,.08)",padding:"3px 10px",borderRadius:18,display:"flex",alignItems:"center",gap:4}}>
                      <PiggyBank size={11}/>{day.activities.reduce((s,a)=>s+a.excursion.price_per_person,0)} TND
                      <span style={{color:"#9CA3AF",fontWeight:400,marginLeft:2}}>·</span>
                      <Clock size={10} color="#9CA3AF"/><span style={{color:"#9CA3AF",fontWeight:500}}>{day.activities.reduce((s,a)=>s+a.excursion.duration_hours,0)}h</span>
                    </span>
                  )}
                </div>
                {day.activities.length>0 ? (
                  <div style={{display:"flex",flexDirection:"column",gap:5}}>
                    {SLOTS.map(slot=>day.activities.filter(a=>a.time===slot.key).map(act=>{
                      const col = cc(act.excursion.categories?.[0]);
                      return(
                        <div key={act.id} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 10px",background:"#FAFAF9",borderRadius:10,border:`1px solid ${col}15`}}>
                          <span style={{fontSize:13,flexShrink:0}}>{slot.emoji}</span>
                          {act.excursion.photos?.[0]&&<img src={act.excursion.photos[0]} alt="" style={{width:34,height:34,borderRadius:8,objectFit:"cover",flexShrink:0}}/>}
                          <div style={{flex:1}}>
                            <div style={{fontSize:12,fontWeight:700,color:"#111827",marginBottom:2}}>{act.excursion.title}</div>
                            <div style={{fontSize:10,color:"#9CA3AF",display:"flex",gap:10,alignItems:"center"}}>
                              <span style={{display:"flex",alignItems:"center",gap:2}}><MapPin size={8}/>{act.excursion.city}</span>
                              <span style={{display:"flex",alignItems:"center",gap:2}}><Clock size={8}/>{act.excursion.duration_hours}h</span>
                              {act.excursion.rating>0&&<span style={{display:"flex",alignItems:"center",gap:2}}><Star size={8} color="#F59E0B" fill="#F59E0B"/>{act.excursion.rating}</span>}
                            </div>
                            {act.note&&<div style={{fontSize:10,color:"#9CA3AF",marginTop:1,fontStyle:"italic",display:"flex",alignItems:"center",gap:3}}><FileText size={8}/>{act.note}</div>}
                          </div>
                          <span style={{fontSize:12,fontWeight:800,color:col,flexShrink:0}}>{act.excursion.price_per_person} TND</span>
                        </div>
                      );
                    }))}
                  </div>
                ) : (
                  <p style={{fontSize:11,color:"#D1D5DB",fontStyle:"italic",marginTop:6}}>Aucune activité planifiée</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ItinerairePage(){
  return(
    <Suspense fallback={
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#FAFAF9",fontFamily:"system-ui"}}>
        <Loader2 size={28} color="#2B96A8" style={{animation:"spin .7s linear infinite"}}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <ItineraireInner/>
    </Suspense>
  );
}