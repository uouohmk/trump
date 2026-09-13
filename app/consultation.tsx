'use client';
import {useState,useEffect,useRef} from 'react';
import {koreanDate,nextMidnight} from '../lib/engine.js';
import WitchActivities,{WitchPortrait,Story,StoryCard} from './witch-activities';
import zodiacLines from '../public/assets/zodiac-lines.json';
type Topic='sky'|'flow'|'work'|'saju'|'tarot'|'compatibility';
type Planet={name:string,symbol:string,longitude:number};
type Card=StoryCard;
type Birth={year:number,month:number,day:number,hour:number|null,minute:number|null,unknown:boolean,calendar:string,leap:boolean,zone:string};
type RecordData={version:string,input:Birth,chart:{rules:string,source:string,unknown:boolean,boundary:boolean},guide:string,snapshot:{date:string,topics:Record<Topic,Card[]>}};
const topics:{id:Topic,label:string,icon:string}[]=[{id:'sky',label:'별자리',icon:'☉'},{id:'flow',label:'오늘 운세',icon:'✧'},{id:'work',label:'일',icon:'◇'},{id:'saju',label:'사주',icon:'四'},{id:'tarot',label:'타로',icon:'✦'},{id:'compatibility',label:'궁합',icon:'♡'}];
const blank={year:'',month:'',day:'',hour:'',minute:'0',calendar:'solar',leap:false,unknown:true,zone:'Asia/Seoul'};
export default function Consultation({signedIn,signIn,signOut}:{signedIn:boolean,signIn:string,signOut:string}){
 const [stage,setStage]=useState<'gate'|'login'|'input'|'choose'|'reading'|'activity'>('gate');
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
  setBusy(true);try{const data=await api();if(data.record){applyRecord(data.record);setStage('choose');}else setStage('input');}catch(e){setError((e as Error).message);}finally{setBusy(false);}
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
 function openTopic(value:Topic){setStory(null);setTopic(value);setStep(0);setPlanet(0);setRenewed(false);if(value==='tarot'||value==='compatibility'){setActivity(value);setStage('activity');}else setStage('reading');}
 function openActivity(value:'question'|'compatibility'|'tarot'|'history'){setStory(null);setActivity(value);setStage('activity');setError('');}
 function showStory(value:Story){setStory(value);setGuide(value.result.guide);setStep(0);setStage('reading');}
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
  try{const data=await api('POST',{...form,year:Number(form.year),month:Number(form.month),day:Number(form.day),hour:form.unknown?null:Number(form.hour),minute:form.unknown?null:Number(form.minute),guide});if(!data.record)throw new Error('저장 결과를 확인하지 못했어요. 다시 시도해 주세요.');applyRecord(data.record);setStage('choose');}
  catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 async function remove(){setBusy(true);setError('');try{await api('DELETE');setRecord(null);setForm(blank);setSettings(false);setConfirmDelete(false);setStage('input');}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 const activeCards=story?.result.cards||record?.snapshot.topics[topic]||[];
 const card=activeCards[step];
 const total=activeCards.length;
 const currentTopic=topics.find(t=>t.id===topic)!;
 const guideName=guide==='dark'?'흑발 마녀':'금발 마녀';
 return <main className={`world stage-${stage}`}>
  <div className="room-background" aria-hidden="true" />
  {stage==='gate'?<section className="gate" aria-label="상담실 입구">
    <div className="gate-title"><p className="small-star" aria-hidden="true">✦</p><h1>별빛 상담실</h1></div>
    <div className="gate-action"><button className="primary enter" onClick={enter} disabled={busy}>{busy?'문을 여는 중…':'들어가기'}<span aria-hidden="true">→</span></button>{error&&<p role="alert" className="error">{error}</p>}</div>
  </section>:<>
   <header className="room-header"><button className="wordmark" onClick={()=>{setStage('gate');setError('');}}>별빛 상담실</button><div>{record&&<button className="quiet" onClick={()=>setSettings(true)}>내 기록</button>}<button className="quiet" onClick={()=>{setStage('gate');setError('');}}>나가기</button></div></header>
   {stage==='login'&&<section className="entry-panel panel"><span className="section-mark">✦</span><h1 ref={heading} tabIndex={-1}>커튼 안으로 오세요.</h1><p>로그인하면 다른 기기에서도<br/>나의 기록을 이어볼 수 있어요.</p><a className="primary" href={signIn} target="_top">ChatGPT로 로그인</a></section>}
   {stage==='input'&&<section className="input-panel panel">
    <p className="eyebrow">첫 번째 이야기</p><h1 ref={heading} tabIndex={-1}>언제 태어났나요?</h1>
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
     <button className="primary full" disabled={busy}>{busy?'기록을 만드는 중…':'저장하고 이야기 시작'}</button>
     {record&&<button type="button" className="quiet full" onClick={()=>setStage('choose')}>기존 기록으로 돌아가기</button>}
    </form>
   </section>}
   {stage==='activity'&&record&&<WitchActivities key={activity} kind={activity} onBack={()=>setStage('choose')} onStory={showStory}/>}
   {(stage==='choose'||stage==='reading')&&record&&<div className="consultation-space">
    <section className="table-area">
     {stage==='choose'?<><p className="eyebrow">나의 카드</p><h1 ref={heading} tabIndex={-1}>어떤 이야기가 궁금한가요?</h1><div className="ask-actions"><button className="primary" onClick={()=>openActivity('question')}>마녀에게 직접 묻기</button><button className="quiet" onClick={()=>openActivity('history')}>지난 이야기</button></div><div className="topic-deck">{topics.map((item,i)=><button key={item.id} className="topic-card" onClick={()=>openTopic(item.id)} style={{'--card-index':i} as React.CSSProperties}><span className="card-corner">✦</span><span className="topic-icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span><span className="card-bottom" aria-hidden="true">· ✦ ·</span></button>)}</div></>:
      <><div className="reading-nav"><button className="quiet" onClick={()=>setStage('choose')}>← 카드 선택</button><span>{story?'마녀의 답변':currentTopic.label} · {step+1}/{total}</span></div>
       <article className={`revealed-card ${card?.kind==='map'?'map-card':''}`} key={`${topic}-${step}`}>
        <span className="card-corner" aria-hidden="true">✦</span>
        <p className="eyebrow">{story?'마녀의 답변':currentTopic.label}</p>
        <h1 ref={heading} tabIndex={-1}>{card?.title}</h1>
        {card?.image?<img className="tarot-art" src={card.image} alt={card.title+' 타로 카드'}/>:card?.kind==='sign'&&card.signIds?<Constellation ids={card.signIds}/>:card?.kind==='elements'&&card.counts?<ElementChart counts={card.counts}/>:card?.kind==='map'&&card.planets?<SkyMap planets={card.planets} selected={planet} onSelect={setPlanet}/>:<div className={`reading-symbol ${topic==='saju'?'hanja':''}`} aria-hidden="true">{card?.symbol}</div>}
        {card?.note&&<p className="card-note">{card.note}</p>}
       </article>
      </>}
    </section>
    <section className="dialogue" aria-label="마녀의 이야기">
     <WitchPortrait guide={guide} expression={stage==='choose'?'happy':card?.expression||(step%3===1?'thoughtful':'happy')}/>
     <div className="dialogue-content"><p className="speaker">{guideName}</p><p className="speech" aria-live="polite">{stage==='choose'?'오늘의 운세를 볼까요? 궁금한 일이 있다면 제게 물어보세요.':card?.text}</p>
      {stage==='reading'&&<div className="dialogue-actions"><button className="quiet" disabled={step===0} onClick={()=>setStep(step-1)}>이전</button><button className="primary" onClick={()=>{if(step+1<total)setStep(step+1);else setStage('choose');}}>{step+1<total?'다음 이야기':'다른 카드 보기'}<span aria-hidden="true">→</span></button></div>}
     </div>
    </section>
    {renewed&&<p role="status" className="update-note">오늘의 카드로 바뀌었어요.</p>}{error&&<p role="alert" className="error">{error}</p>}
   </div>}
   <dialog ref={settingsRef} onCancel={()=>setSettings(false)} onClose={()=>{setSettings(false);setConfirmDelete(false);}} className="record-dialog panel">
    <div className="dialog-title"><h2>내 기록</h2><button className="quiet" onClick={()=>setSettings(false)} aria-label="닫기">닫기</button></div>
    <p>저장한 출생 정보와 카드는 같은 계정으로 로그인한 기기에서 확인할 수 있어요.</p>
    <button className="primary full" onClick={()=>{setSettings(false);setStage('input');setError('');}}>출생 정보 수정</button>
    <details><summary>계산 기준과 출처</summary><p>{record?.chart.rules}</p><p>오늘의 카드는 한국 시간 00:00에 바뀌어요. 페이지를 닫았다 열어도 그날의 같은 카드를 볼 수 있어요.</p><p>천체 위치는 실제 계산값이에요. 운세·행운 아이템·궁합은 실제 계산에 전통 해석과 오락용 문장을 연결해 만들어요. 자유 생성 AI 답변은 아니에요.</p><p>시간을 모르면 시주를 만들지 않아요. 절기 경계에서는 결과를 하나로 정하지 않아요.</p><p><a href="https://github.com/cosinekitty/astronomy" target="_blank" rel="noreferrer">Astronomy Engine 2.1.19</a> · <a href="https://github.com/usingsky/korean_lunar_calendar_js" target="_blank" rel="noreferrer">Korean Lunar Calendar 0.4.0</a></p><p>별자리 선: d3-celestial (BSD-3-Clause). 황도궁과 실제 별자리 경계는 다르며, 선 그림은 같은 이름의 별자리를 보여줘요. 일일 운세는 태양 별자리 중심각과 주요 행성의 각을 사용해요.</p><p>타로 그림: Pamela Colman Smith, Rider–Waite–Smith, Wikimedia Commons 공개 영역 원본.</p></details>
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
  return <svg key={id} viewBox="0 0 320 220" role="img" aria-label={`${id} 별자리의 실제 별 위치와 연결선`}><defs><filter id={`glow-${id}`}><feGaussianBlur stdDeviation="2"/></filter></defs>{lines.map((line,i)=><polyline key={i} points={line.map(p=>screen(p).join(',')).join(' ')} fill="none" stroke="#af8ed0" strokeWidth="1.4"/>)}{unique.map((p,i)=>{const [x,y]=screen(p);return <g key={i}><circle cx={x} cy={y} r="6" fill="#eacb9e" opacity=".5" filter={`url(#glow-${id})`}/><path d={`M${x} ${y-4}L${x+1.3} ${y-1.3}L${x+4} ${y}L${x+1.3} ${y+1.3}L${x} ${y+4}L${x-1.3} ${y+1.3}L${x-4} ${y}L${x-1.3} ${y-1.3}Z`} fill="#fff0c9"/></g>;})}</svg>;
 })}</div>;
}
function ElementChart({counts}:{counts:number[]}){return <div className="element-chart">{['나무','불','흙','금속','물'].map((name,i)=><div key={name}><span>{name}</span><div className="element-track"><i style={{width:`${counts[i]/8*100}%`,background:['#a6ce8d','#e7a18a','#e0c27b','#dddae4','#88bde0'][i]}}/></div><span>{counts[i]}</span></div>)}</div>;}
function SkyMap({planets,selected,onSelect}:{planets:Planet[],selected:number,onSelect:(index:number)=>void}){
 const symbols=['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
 const point=(angle:number,r:number)=>[180+r*Math.cos(-angle*Math.PI/180),180+r*Math.sin(-angle*Math.PI/180)];
 return <div className="sky-map"><svg viewBox="0 0 360 360" role="img" aria-label="오늘 태양·달·수성·금성·화성의 황도 위치"><circle cx="180" cy="180" r="148"/><circle cx="180" cy="180" r="118"/>{symbols.map((symbol,i)=>{const [x,y]=point(i*30,148),[a,b]=point(i*30,118),[tx,ty]=point(i*30+15,134);return <g key={symbol}><line x1={x} y1={y} x2={a} y2={b}/><text x={tx} y={ty} className="zodiac-label">{symbol}</text></g>;})}<text x="180" y="180" className="map-earth">지구</text>{planets.map((p,i)=>{const [x,y]=point(p.longitude,62+i*11);return <g key={p.name} className={i===selected?'planet active':'planet'}><line x1="180" y1="180" x2={x} y2={y}/><circle cx={x} cy={y} r={i===selected?15:11}/><text x={x} y={y}>{p.symbol}</text></g>;})}</svg><div className="planet-buttons">{planets.map((p,i)=><button key={p.name} onClick={()=>onSelect(i)} aria-pressed={i===selected}>{p.name}</button>)}</div><p className="map-caption">{planets[selected].name} · {['양자리','황소자리','쌍둥이자리','게자리','사자자리','처녀자리','천칭자리','전갈자리','사수자리','염소자리','물병자리','물고기자리'][Math.floor(planets[selected].longitude/30)]}</p></div>;
}
