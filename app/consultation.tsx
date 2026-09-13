'use client';
import {useState,useEffect,useRef} from 'react';
import {koreanDate,nextMidnight} from '../lib/engine.js';
import WitchActivities,{WitchPortrait,Story,StoryCard,PlanetInsight} from './witch-activities';
import zodiacLines from '../public/assets/zodiac-lines.json';
type Topic='sky'|'flow'|'work'|'saju'|'tarot'|'compatibility';
type Planet={name:string,symbol:string,longitude:number};
type Card=StoryCard;
type Birth={year:number,month:number,day:number,hour:number|null,minute:number|null,unknown:boolean,calendar:string,leap:boolean,zone:string};
type RecordData={version:string,input:Birth,chart:{rules:string,source:string,unknown:boolean,boundary:boolean},guide:string,snapshot:{date:string,topics:Record<Topic,Card[]>}};
const topics:{id:Topic,label:string,icon:string}[]=[{id:'sky',label:'별자리',icon:'☉'},{id:'flow',label:'오늘 운세',icon:'✧'},{id:'work',label:'일',icon:'◇'},{id:'saju',label:'사주',icon:'四'},{id:'tarot',label:'타로',icon:'✦'},{id:'compatibility',label:'궁합',icon:'♡'}];
const blank={year:'',month:'',day:'',hour:'',minute:'0',calendar:'solar',leap:false,unknown:true,zone:'Asia/Seoul'};
export default function Consultation({signedIn,signIn,signOut}:{signedIn:boolean,signIn:string,signOut:string}){
 type Stage='gate'|'login'|'input'|'arrival'|'choose'|'reading'|'activity';
 const [stage,setStageNow]=useState<Stage>('gate');
 const [leaving,setLeaving]=useState(false);
 const motionTimer=useRef<ReturnType<typeof setTimeout>|null>(null),motionLock=useRef(false);
 function transition(action:()=>void){
  if(motionLock.current)return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){action();return;}
  motionLock.current=true;setLeaving(true);
  motionTimer.current=setTimeout(()=>{action();setLeaving(false);motionLock.current=false;},180);
 }
 function setStage(value:Stage){transition(()=>setStageNow(value));}
 useEffect(()=>()=>{if(motionTimer.current)clearTimeout(motionTimer.current);},[]);
 useEffect(()=>{
  if(stage!=='arrival')return;
  const timer=setTimeout(()=>setStage('choose'),window.matchMedia('(prefers-reduced-motion: reduce)').matches?50:2600);
  return()=>clearTimeout(timer);
 },[stage]);
 const [form,setForm]=useState(blank),[guide,setGuide]=useState('dark');
 const [record,setRecord]=useState<RecordData|null>(null),[topic,setTopic]=useState<Topic>('flow'),[step,setStep]=useState(0);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[settings,setSettings]=useState(false),[confirmDelete,setConfirmDelete]=useState(false);
 const [activity,setActivity]=useState<'question'|'compatibility'|'tarot'|'history'>('question'),[story,setStory]=useState<Story|null>(null);
 const [renewed,setRenewed]=useState(false),[planet,setPlanet]=useState(0);
 const heading=useRef<HTMLHeadingElement>(null),settingsRef=useRef<HTMLDialogElement>(null);
 const fresh=useRef({stage,record,topic,step});fresh.current={stage,record,topic,step};
 function applyRecord(value:RecordData){setRecord(value);setGuide(value.guide);setForm({...value.input,year:String(value.input.year),month:String(value.input.month),day:String(value.input.day),hour:value.input.hour===null?'':String(value.input.hour),minute:value.input.minute===null?'0':String(value.input.minute)});}
 async function api(method='GET',body?:unknown){
  const response=await fetch('/api/record',{method,cache:'no-store',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined});
  const data=await response.json() as {record:RecordData|null,error?:string,deleted?:boolean};if(!response.ok){if(response.status===401)setStage('login');throw new Error(data.error||'다시 시도해 주세요.');}return data;
 }
 async function enter(){
  setError('');if(!signedIn){setStage('login');return;}
  setBusy(true);try{const data=await api();if(data.record)applyRecord(data.record);setStage('input');}catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 useEffect(()=>{if(signedIn&&new URLSearchParams(location.search).get('enter')==='1'){history.replaceState({},'','/');void enter();}},[]);
 useEffect(()=>{if(stage!=='gate')heading.current?.focus();},[stage,step,topic]);
 useEffect(()=>{const dialog=settingsRef.current;if(settings)dialog?.showModal();else dialog?.close();},[settings]);
 useEffect(()=>{
  let timer:ReturnType<typeof setTimeout>;
  async function refresh(){
   const current=fresh.current.record;
   if(current&&current.snapshot.date!==koreanDate()){
    try{const data=await api();if(data.record){applyRecord(data.record);setRenewed(true);setStep(0);}else{setRecord(null);setStage('input');}}catch(e){setError((e as Error).message);}
   }
   clearTimeout(timer);timer=setTimeout(refresh,Math.max(100,nextMidnight()-Date.now()+100));
  }
  const visible=()=>{if(document.visibilityState==='visible')void refresh();};
  void refresh();document.addEventListener('visibilitychange',visible);window.addEventListener('focus',visible);
  return()=>{clearTimeout(timer);document.removeEventListener('visibilitychange',visible);window.removeEventListener('focus',visible);};
 },[record?.version]);
 function openTopic(value:Topic){transition(()=>{setStory(null);setTopic(value);setStep(0);setPlanet(0);setRenewed(false);if(value==='tarot'||value==='compatibility'){setActivity(value);setStageNow('activity');}else setStageNow('reading');});}
 function openActivity(value:'question'|'compatibility'|'tarot'|'history'){transition(()=>{setStory(null);setActivity(value);setStageNow('activity');setError('');});}
 function showStory(value:Story){transition(()=>{setStory(value);setGuide(value.result.guide);setStep(0);setStageNow('reading');});}
 useEffect(()=>{
  const context=(document as any).modelContext;if(!context?.registerTool)return;
  const lifecycle=new AbortController();
  Promise.resolve(context.registerTool({name:'open_consultation_topic',description:'저장한 기록의 별자리, 오늘의 운세, 일, 사주 카드 또는 타로 뽑기·다인 궁합 입력으로 이동합니다. 먼저 입장하고 출생 정보를 저장해야 합니다.',inputSchema:{type:'object',properties:{topic:{type:'string',enum:topics.map(x=>x.id)}},required:['topic'],additionalProperties:false},annotations:{readOnlyHint:false},execute:async(input:any)=>{
   if(!input||Object.keys(input).length!==1||!topics.some(t=>t.id===input.topic))throw new Error('올바른 카드 주제를 선택해 주세요.');
   if(!fresh.current.record||!['choose','reading'].includes(fresh.current.stage))throw new Error('먼저 입장하고 출생 정보를 저장해 주세요.');
   openTopic(input.topic);await new Promise(resolve=>requestAnimationFrame(resolve));return {topic:input.topic,stage:['tarot','compatibility'].includes(input.topic)?'input':'reading'};
  }},{signal:lifecycle.signal})).catch(()=>{});
  return()=>lifecycle.abort();
 },[]);
 async function save(event:React.FormEvent){
  event.preventDefault();setBusy(true);setError('');
  try{const data=await api('POST',{...form,year:Number(form.year),month:Number(form.month),day:Number(form.day),hour:form.unknown?null:Number(form.hour),minute:form.unknown?null:Number(form.minute),guide});if(!data.record)throw new Error('저장 결과를 확인하지 못했어요. 다시 시도해 주세요.');applyRecord(data.record);setStage('arrival');}
  catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 async function remove(){setBusy(true);setError('');try{await api('DELETE');setRecord(null);setForm(blank);setSettings(false);setConfirmDelete(false);setStage('input');}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 const activeCards=story?.result.cards||record?.snapshot.topics[topic]||[];
 const card=activeCards[step];
 const insight=card?.kind==='map'?card.insights?.[planet]:undefined;
 const total=activeCards.length;
 const currentTopic=topics.find(t=>t.id===topic)!;
 const guideName=guide==='dark'?'흑발 마녀':'금발 마녀';
 return <main className={`world stage-${stage}${leaving?' scene-leaving':''}`} aria-busy={busy||leaving}>
  <div className="room-background" aria-hidden="true" />
  {stage==='gate'?<section className="gate" aria-label="상담실 입구">
    <div className="gate-title"><p className="small-star" aria-hidden="true">✦</p><h1>별빛 상담실</h1></div>
    <div className="gate-action"><button className="primary enter" onClick={enter} disabled={busy}>{busy?'기록을 확인하는 중…':'상담 준비하기'}<span aria-hidden="true">→</span></button>{error&&<p role="alert" className="error">{error}</p>}</div>
  </section>:<>
   <header className="room-header"><button className="wordmark" onClick={()=>{setStage('gate');setError('');}}>별빛 상담실</button><div>{record&&<button className="quiet" onClick={()=>setSettings(true)}>내 기록</button>}<button className="quiet" onClick={()=>{setStage('gate');setError('');}}>나가기</button></div></header>
   {stage==='login'&&<section className="entry-panel panel"><span className="section-mark">✦</span><h1 ref={heading} tabIndex={-1}>먼저 상담을 준비할게요.</h1><p>로그인하면 다른 기기에서도<br/>나의 기록을 이어 볼 수 있어요.</p><a className="primary" href={signIn} target="_top">ChatGPT로 로그인</a></section>}
   {stage==='input'&&<section className="input-panel panel">
    <p className="eyebrow">입장 전, 나의 정보</p><h1 ref={heading} tabIndex={-1}>언제 태어났나요?</h1>
    <form onSubmit={save}>
     <fieldset disabled={busy}><legend className="sr-only">출생 정보</legend>
      <div className="calendar-row"><label>달력<select value={form.calendar} onChange={e=>setForm({...form,calendar:e.target.value,leap:false})}><option value="solar">양력</option><option value="lunar">음력</option></select></label>{form.calendar==='lunar'&&<label className="check"><input type="checkbox" checked={form.leap} onChange={e=>setForm({...form,leap:e.target.checked})}/>윤달</label>}</div>
      <div className="date-row">{(['year','month','day'] as const).map((key,i)=><label key={key}>{['태어난 해','월','일'][i]}<input inputMode="numeric" type="number" required min={i?1:1900} max={[2049,12,31][i]} placeholder={['1995','6','15'][i]} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})}/></label>)}</div>
      <label className="check unknown"><input type="checkbox" checked={form.unknown} onChange={e=>setForm({...form,unknown:e.target.checked})}/>태어난 시간을 몰라요</label>
      {!form.unknown&&<div className="time-row"><label>시<input type="number" inputMode="numeric" required min="0" max="23" placeholder="14" value={form.hour} onChange={e=>setForm({...form,hour:e.target.value})}/></label><label>분<input type="number" inputMode="numeric" required min="0" max="59" value={form.minute} onChange={e=>setForm({...form,minute:e.target.value})}/></label></div>}
      <details className="birth-options"><summary>해외에서 태어났어요</summary><label>출생 지역<select value={form.zone} onChange={e=>setForm({...form,zone:e.target.value})}><option value="Asia/Seoul">대한민국</option><option value="Asia/Tokyo">일본</option><option value="Asia/Shanghai">중국</option><option value="America/New_York">미국 동부</option><option value="America/Los_Angeles">미국 서부</option><option value="Europe/London">영국</option><option value="Europe/Paris">프랑스</option><option value="Australia/Sydney">호주 시드니</option></select></label></details>
      <fieldset className="guide-choice"><legend>누구와 이야기할까요?</legend>{['dark','blonde'].map(value=><label key={value} className={guide===value?'selected':''}><input type="radio" name="guide" value={value} checked={guide===value} onChange={()=>setGuide(value)}/><WitchPortrait guide={value} small/><span>{value==='dark'?'흑발 마녀':'금발 마녀'}</span></label>)}</fieldset>
     </fieldset>
     <p className="save-note">출생 정보와 결과는 내 계정에 저장돼요.</p>
     {error&&<p className="error" role="alert">{error}</p>}
     <button className="primary full" disabled={busy}>{busy?'기록을 만드는 중…':'저장하고 입장하기'}</button>
     {record&&<button type="button" className="quiet full" onClick={()=>{applyRecord(record);setStage('arrival');}}>저장된 정보로 입장하기</button>}
    </form>
   </section>}
   {stage==='arrival'&&<section className="arrival-scene" aria-label="커튼이 열리는 상담실"><div className="arrival-glow" aria-hidden="true"/><div className="arrival-witch"><WitchPortrait guide={guide}/><h1 ref={heading} tabIndex={-1}>어서 오세요.</h1><p>당신의 이야기를 들려주세요.</p></div><div className="curtain curtain-left" aria-hidden="true"/><div className="curtain curtain-right" aria-hidden="true"/><button className="quiet arrival-skip" onClick={()=>setStage('choose')}>바로 이야기하기 →</button></section>}
   {stage==='activity'&&record&&<WitchActivities key={activity} kind={activity} onBack={()=>setStage('choose')} onStory={showStory}/>}
   {(stage==='choose'||stage==='reading')&&record&&<div className="consultation-space">
    <section className="table-area">
     {stage==='choose'?<><p className="eyebrow">나의 카드</p><h1 ref={heading} tabIndex={-1}>어떤 이야기가 궁금한가요?</h1><div className="ask-actions"><button className="primary" onClick={()=>openActivity('question')}>마녀에게 직접 묻기</button><button className="quiet" onClick={()=>openActivity('history')}>지난 이야기</button></div><div className="topic-deck">{topics.map((item,i)=><button key={item.id} className="topic-card" onClick={()=>openTopic(item.id)} style={{'--card-index':i} as React.CSSProperties}><span className="card-corner">✦</span><span className="topic-icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span><span className="card-bottom" aria-hidden="true">· ✦ ·</span></button>)}</div></>:
      <><div className="reading-nav"><button className="quiet" onClick={()=>setStage('choose')}>← 카드 선택</button><span>{story?'마녀의 답변':currentTopic.label} · {step+1}/{total}</span></div>
       <article className={`revealed-card ${card?.kind==='map'?'map-card':''}`} key={`${topic}-${step}`}>
        <span className="card-corner" aria-hidden="true">✦</span>
        <p className="eyebrow">{story?'마녀의 답변':currentTopic.label}</p>
        <h1 ref={heading} tabIndex={-1}>{card?.title}</h1>
        {card?.image?<img className="tarot-art" src={card.image} alt={card.title+' 타로 카드'}/>:card?.kind==='sign'&&card.signIds?<Constellation ids={card.signIds}/>:card?.kind==='elements'&&card.counts?<ElementChart counts={card.counts}/>:card?.kind==='map'&&card.planets?<SkyMap planets={card.planets} selected={planet} onSelect={value=>transition(()=>setPlanet(value))} insights={card.insights}/>:<div className={`reading-symbol ${topic==='saju'?'hanja':''}`} aria-hidden="true">{card?.symbol}</div>}
        {card?.note&&<p className="card-note">{card.note}</p>}
       </article>
      </>}
    </section>
    <section className="dialogue" aria-label="마녀의 이야기">
     <WitchPortrait guide={guide} expression={stage==='choose'?'happy':insight?.expression||card?.expression||(step%3===1?'thoughtful':'happy')}/>
     <div className="dialogue-content"><p className="speaker">{guideName}{insight&&<span className="speaker-topic"> · {insight.domain}</span>}</p><p key={`${stage}-${topic}-${step}-${planet}`} className="speech" aria-live="polite">{stage==='choose'?'오늘의 운세를 볼까요? 궁금한 일이 있다면 제게 물어보세요.':insight?.text||card?.text}</p>
      {stage==='reading'&&<div className="dialogue-actions"><button className="quiet" disabled={step===0||leaving} onClick={()=>transition(()=>setStep(step-1))}>이전</button><button className="primary" disabled={leaving} onClick={()=>{if(step+1<total)transition(()=>{setStep(step+1);setPlanet(0);});else setStage('choose');}}>{step+1<total?'다음 이야기':'다른 카드 보기'}<span aria-hidden="true">→</span></button></div>}
     </div>
    </section>
    {renewed&&<p role="status" className="update-note">오늘의 카드로 바뀌었어요.</p>}{error&&<p role="alert" className="error">{error}</p>}
   </div>}
   <dialog ref={settingsRef} onCancel={()=>setSettings(false)} onClose={()=>{setSettings(false);setConfirmDelete(false);}} className="record-dialog panel">
    <div className="dialog-title"><h2>내 기록</h2><button className="quiet" onClick={()=>setSettings(false)} aria-label="닫기">닫기</button></div>
    <p>저장한 출생 정보와 카드는 같은 계정으로 로그인한 기기에서 확인할 수 있어요.</p>
    <button className="primary full" onClick={()=>{setSettings(false);setStage('input');setError('');}}>출생 정보 수정</button>
    <details><summary>계산 기준과 출처</summary><p>{record?.chart.rules}</p><p>오늘의 카드는 한국 시간 자정에 바뀌어요. 같은 날에는 페이지를 다시 열어도 같은 운세를 볼 수 있어요.</p><p>천체 위치와 사주 글자는 입력한 정보로 계산해요. 운세와 궁합은 여기에 전통적인 의미를 붙여 미리 준비한 문장으로 설명해요. AI가 자유롭게 작성하는 답변은 아니에요.</p><p>태어난 시간을 모르면 시간에 해당하는 사주 글자를 정하지 않아요. 절기가 바뀌는 날에는 해나 달의 사주 글자도 하나로 정하기 어려울 수 있어요.</p><p><a href="https://github.com/cosinekitty/astronomy" target="_blank" rel="noreferrer">Astronomy Engine 2.1.19</a> · <a href="https://github.com/usingsky/korean_lunar_calendar_js" target="_blank" rel="noreferrer">Korean Lunar Calendar 0.4.0</a></p><p>별자리 그림은 d3-celestial 자료(BSD-3-Clause)를 사용해요. 운세에서 나누는 별자리 구간과 실제 별자리의 경계는 달라요. 그림은 같은 이름의 실제 별들을 연결한 모습이에요.</p><p>천체별 운세는 오늘의 태양·달·수성·금성·화성·목성과 태어났을 때 태양의 각도를 비교해요. 시간을 모르면 태어난 날의 위치 범위를 사용해요. 주요 각에서 6° 안에 있을 때만 해석하며, 상승궁이나 하우스는 계산하지 않아요.</p><p>행성의 의미와 각도 해석은 <a href="https://www.astro.com/astrology/in_planets1_e.htm" target="_blank" rel="noreferrer">Astrodienst의 행성 설명</a>과 <a href="https://www.astro.com/astrology/in_aspect_e.htm" target="_blank" rel="noreferrer">각도 설명</a>을 참고했어요. 사주의 오늘 조언은 태어난 날과 오늘의 첫 글자를 비교해요. 사주 전체나 장기 운세를 종합한 풀이는 아니에요.</p><p>타로 그림: Pamela Colman Smith, Rider–Waite–Smith, Wikimedia Commons 공개 영역 원본.</p></details>
    {confirmDelete?<div className="delete-confirm"><p>출생 정보와 저장한 카드 기록을 모두 지울까요?</p><button onClick={remove} disabled={busy}>모두 지우기</button><button className="quiet" onClick={()=>setConfirmDelete(false)}>취소</button></div>:<button className="quiet full" onClick={()=>setConfirmDelete(true)}>기록 지우기</button>}
    {error&&<p role="alert" className="error">{error}</p>}<a className="quiet signout" href={signOut} target="_top">로그아웃</a>
   </dialog>
  </>}
 </main>;
}
function Constellation({ids}:{ids:string[]}){
 return <div className="constellation-gallery">{ids.map(id=>{
  const lines=(zodiacLines as Record<string,number[][][]>)[id];if(!lines)return null;
  const base=lines[0][0][0],unwrap=(ra:number)=>base+((ra-base+540)%360)-180;
  const points=lines.flat(),declination=points.reduce((s,p)=>s+p[1],0)/points.length;
  const project=(p:number[])=>[unwrap(p[0])*Math.cos(declination*Math.PI/180),p[1]];
  const coords=points.map(project),xs=coords.map(p=>p[0]),ys=coords.map(p=>p[1]);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),scale=Math.min(260/(maxX-minX||1),180/(maxY-minY||1));
  const screen=(p:number[])=>{const [x,y]=project(p);return [160-(x-(minX+maxX)/2)*scale,110-(y-(minY+maxY)/2)*scale];};
  const unique=[...new Map(points.map(p=>[p.join(','),p])).values()];
  return <svg key={id} viewBox="0 0 320 220" role="img" aria-label={`${id} 별자리의 실제 별 위치와 연결선`}><defs><filter id={`glow-${id}`}><feGaussianBlur stdDeviation="2"/></filter></defs>{lines.map((line,i)=><polyline className="constellation-line" pathLength={1} style={{animationDelay:`${1.5+i*.18}s`}} key={i} points={line.map(p=>screen(p).join(',')).join(' ')} fill="none" stroke="#af8ed0" strokeWidth="1.4"/>)}{unique.map((p,i)=>{const [x,y]=screen(p);return <g className="constellation-star" style={{animationDelay:`${.2+i/unique.length}s`,transformOrigin:`${x}px ${y}px`}} key={i}><circle cx={x} cy={y} r="6" fill="#eacb9e" opacity=".5" filter={`url(#glow-${id})`}/><path d={`M${x} ${y-4}L${x+1.3} ${y-1.3}L${x+4} ${y}L${x+1.3} ${y+1.3}L${x} ${y+4}L${x-1.3} ${y+1.3}L${x-4} ${y}L${x-1.3} ${y-1.3}Z`} fill="#fff0c9"/></g>;})}</svg>;
 })}</div>;
}
function ElementChart({counts}:{counts:number[]}){return <div className="element-chart">{['나무','불','흙','금속','물'].map((name,i)=><div key={name}><span>{name}</span><div className="element-track"><i style={{width:`${counts[i]/8*100}%`,background:['#a6ce8d','#e7a18a','#e0c27b','#dddae4','#88bde0'][i]}}/></div><span>{counts[i]}</span></div>)}</div>;}
function SkyMap({planets,selected,onSelect,insights}:{planets:Planet[],selected:number,onSelect:(index:number)=>void,insights?:PlanetInsight[]}){
 const symbols=['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
 const point=(angle:number,r:number)=>[180+r*Math.cos(-angle*Math.PI/180),180+r*Math.sin(-angle*Math.PI/180)];
 const insight=insights?.[selected],reference=insight?.natalRange;
 const [rx,ry]=point(reference?(reference[0]+reference[1])/2:0,148);
 return <div className="sky-map"><svg viewBox="0 0 360 360" role="img" aria-label="오늘 태양·달·수성·금성·화성·목성의 위치와 태어났을 때의 태양 방향"><circle cx="180" cy="180" r="148"/><circle cx="180" cy="180" r="118"/>{symbols.map((symbol,i)=>{const [x,y]=point(i*30,148),[a,b]=point(i*30,118),[tx,ty]=point(i*30+15,134);return <g key={symbol}><line x1={x} y1={y} x2={a} y2={b}/><text x={tx} y={ty} className="zodiac-label">{symbol}</text></g>;})}<text x="180" y="180" className="map-earth">지구</text>{reference&&<g className="natal-direction"><line x1="180" y1="180" x2={rx} y2={ry}/><circle cx={rx} cy={ry} r="4"/><title>태어났을 때의 태양 방향{reference[0]!==reference[1]?' 범위의 가운데':''}</title></g>}{planets.map((p,i)=>{const [x,y]=point(p.longitude,62+i*11);return <g key={p.name} className={i===selected?'planet active':'planet'} style={{animationDelay:`${i*.1}s`}}><line x1="180" y1="180" x2={x} y2={y}/><circle cx={x} cy={y} r={i===selected?15:11}/><text x={x} y={y}>{p.symbol}</text></g>;})}</svg><div className="planet-buttons" aria-label="운세를 살펴볼 천체">{planets.map((p,i)=><button key={p.name} onClick={()=>onSelect(i)} aria-pressed={i===selected}>{p.name}<small>{insights?.[i]?.domain}</small></button>)}</div><div className="planet-caption" key={selected}><p className="map-caption">{insight?.position||planets[selected].name}</p>{insight&&<><span className={`aspect-status status-${insight.status}`}>{({support:'기회를 살펴볼 때',focus:'관심을 기울일 때',adjust:'조정이 필요한 때',quiet:'평소처럼 살펴볼 때',uncertain:'출생 시간에 따라 달라져요'} as Record<string,string>)[insight.status]}</span><details className="aspect-evidence"><summary>이렇게 해석한 이유</summary><p>{insight.note}</p><p>오늘의 {insight.name}: {insight.longitude.toFixed(1)}°. 태어난 날의 태양: {insight.natalRange.map(n=>((n%360+360)%360).toFixed(1)+'°').filter((n,i,a)=>i===0||n!==a[0]).join(' ~ ')}.</p><p>{insight.angle===null?'출생 시간이 없어 각도를 하나로 정하지 않았어요.':insight.status==='quiet'?'해석에 사용하는 각도에서 6°보다 멀어 특별한 길흉을 붙이지 않았어요.':`${insight.angle}° 관계에서 ${insight.orb?.toFixed(1)}° 떨어져 있어요. 이 사이트는 6° 이내일 때만 해석해요.`}</p><p>가는 금빛 선은 태어났을 때의 태양 방향이에요. 선의 길이는 천체까지의 거리를 뜻하지 않아요. 운세는 전통적인 상징을 바탕으로 쓴 조언이에요.</p></details></>}</div></div>;
}
