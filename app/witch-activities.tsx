'use client';
import {useState} from 'react';
export type StoryCard={title:string,symbol:string,text:string,note?:string,kind?:string,image?:string,expression?:string,signIds?:string[],counts?:number[],planets?:{name:string,symbol:string,longitude:number}[]};
export type Story={id:string,kind:string,result:{title:string,cards:StoryCard[],date:string,guide:string}};
const newPerson=()=>({name:'',year:'',month:'',day:'',hour:'',minute:'0',unknown:true,calendar:'solar',leap:false,zone:'Asia/Seoul'});
export default function WitchActivities({kind,onBack,onStory}:{kind:'question'|'compatibility'|'tarot'|'history',onBack:()=>void,onStory:(story:Story)=>void}){
 const [question,setQuestion]=useState(''),[intent,setIntent]=useState('overall'),[people,setPeople]=useState([newPerson()]),[relationship,setRelationship]=useState('친구');
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[history,setHistory]=useState<Story[]|null>(null);
 async function submit(selection?:number){
  setBusy(true);setError('');try{
   const payload={kind,question,intent,relationship,selection,people:people.map(p=>({...p,year:Number(p.year),month:Number(p.month),day:Number(p.day),hour:p.unknown?null:Number(p.hour),minute:p.unknown?null:Number(p.minute)}))};
   const response=await fetch('/api/consultation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
   const data=await response.json() as {item:Story,error?:string};if(!response.ok)throw new Error(data.error||'다시 시도해 주세요.');onStory(data.item);
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 async function loadHistory(){setBusy(true);try{const response=await fetch('/api/consultation',{cache:'no-store'});const data=await response.json() as {items:Story[],error?:string};if(!response.ok)throw new Error(data.error);setHistory(data.items);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 const title=kind==='question'?'마녀에게 물어보세요.':kind==='compatibility'?'누구와의 궁합이 궁금한가요?':kind==='tarot'?'마음이 가는 한 장을 골라요.':'지난 이야기';
 function personChange(index:number,key:string,value:unknown){setPeople(people.map((person,i)=>i===index?{...person,[key]:value}:person));}
 return <section className={`activity-panel panel activity-${kind}`}><button className="quiet" onClick={onBack}>← 카드 선택</button><h1>{title}</h1>
  {kind==='history'?<><p>최근에 저장한 질문과 궁합, 타로를 다시 볼 수 있어요.</p>{history===null?<button className="primary" onClick={loadHistory} disabled={busy}>기록 불러오기</button>:history.length?<div className="history-list">{history.map(item=><button key={item.id} onClick={()=>onStory(item)}>{item.result.title}<span>이어서 보기 →</span></button>)}</div>:<p>아직 저장한 이야기가 없어요.</p>}</>:
   <form onSubmit={e=>{e.preventDefault();void submit();}}>
    {kind==='compatibility'?<>
      <p className="activity-help">나는 저장한 출생 정보로 볼게요. 함께 볼 사람을 추가해 주세요.</p>
      <label>어떤 관계인가요?<select value={relationship} onChange={e=>setRelationship(e.target.value)}>{['연인','친구','가족','동료'].map(x=><option key={x}>{x}</option>)}</select></label>
      {people.map((p,i)=><fieldset key={i} className="partner" disabled={busy}><legend>상대 {i+1}</legend><label>이름 또는 별명<input type="text" value={p.name} maxLength={20} placeholder={`상대 ${i+1}`} onChange={e=>personChange(i,'name',e.target.value)}/></label>
       <div className="date-row">{(['year','month','day'] as const).map((key,j)=><label key={key}>{['태어난 해','월','일'][j]}<input type="number" inputMode="numeric" min={j?1:1900} max={[2049,12,31][j]} required value={p[key]} placeholder={['1995','6','15'][j]} onChange={e=>personChange(i,key,e.target.value)}/></label>)}</div>
       <details><summary>음력·태어난 시간·지역</summary><label>달력<select value={p.calendar} onChange={e=>personChange(i,'calendar',e.target.value)}><option value="solar">양력</option><option value="lunar">음력</option></select></label>{p.calendar==='lunar'&&<label className="check"><input type="checkbox" checked={p.leap} onChange={e=>personChange(i,'leap',e.target.checked)}/>윤달</label>}
       <label className="check unknown"><input type="checkbox" checked={p.unknown} onChange={e=>personChange(i,'unknown',e.target.checked)}/>태어난 시간을 몰라요</label>{!p.unknown&&<div className="time-row"><label>시<input type="number" min={0} max={23} required value={p.hour} onChange={e=>personChange(i,'hour',e.target.value)}/></label><label>분<input type="number" min={0} max={59} required value={p.minute} onChange={e=>personChange(i,'minute',e.target.value)}/></label></div>}
       <label>출생 지역<select value={p.zone} onChange={e=>personChange(i,'zone',e.target.value)}>{[['Asia/Seoul','대한민국'],['Asia/Tokyo','일본'],['Asia/Shanghai','중국'],['America/New_York','미국 동부'],['America/Los_Angeles','미국 서부'],['Europe/London','영국']].map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label></details>
       {people.length>1&&<button type="button" className="quiet" onClick={()=>setPeople(people.filter((_,j)=>i!==j))}>이 사람 빼기</button>}
      </fieldset>)}
      {people.length<5&&<button type="button" className="quiet full" onClick={()=>setPeople([...people,newPerson()])}>+ 한 사람 더 추가</button>}<p className="save-note">입력한 상대 정보와 궁합도 내 계정에 저장돼요.</p>
     </>:<>
      <label>{kind==='tarot'?'떠올리고 있는 질문 (선택)':'궁금한 내용'}<textarea value={question} onChange={e=>setQuestion(e.target.value)} placeholder={kind==='tarot'?'이번 주에 집중하면 좋을 일은?':'오늘 면접에서 어떤 점을 신경 쓰면 좋을까?'} maxLength={160} required={kind==='question'} rows={3}/></label>
      {kind==='question'&&<label>어떤 이야기로 풀어볼까요?<select value={intent} onChange={e=>setIntent(e.target.value)}>{[['overall','전체 흐름'],['love','연애'],['work','일·공부'],['money','돈·생활'],['people','사람'],['choice','선택·도전']].map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>}
     </>}
    {error&&<p role="alert" className="error">{error}</p>}
    {kind==='tarot'?<div className="draw-deck">{[0,1,2].map(i=><button key={i} type="button" className="tarot-back" aria-label={`${i+1}번째 카드 뽑기`} disabled={busy} onClick={()=>submit(i)}><span aria-hidden="true">☾</span><small>{busy?'펼치는 중…':'카드 뽑기'}</small></button>)}</div>:<button className="primary full" disabled={busy}>{busy?'마녀가 이야기를 읽는 중…':kind==='compatibility'?'함께 궁합 보기':'마녀의 답변 듣기'}</button>}
    <p className="play-note">{kind==='tarot'?'재미로 보는 타로예요. 무작위로 뽑은 카드의 전통적인 의미로 답해요.':'재미로 보는 전통 운세예요. 실제 계산값에 정해진 해석 문장을 연결해 답해요.'}</p>
   </form>}
 </section>;
}
export function WitchPortrait({guide,expression='happy',small=false}:{guide:string,expression?:string,small?:boolean}){
 const index=expression==='thoughtful'?1:expression==='reassure'?2:0;
 return <div role="img" aria-label={`${guide==='dark'?'흑발':'금발'} 마녀 · ${['웃는','생각하는','안심시키는'][index]} 표정`} className={small?'witch-portrait small':'witch-portrait'} style={{backgroundImage:`url('/assets/witch-${guide}-expressions.png')`,backgroundPosition:`${index*50}% center`}}/>;
}
