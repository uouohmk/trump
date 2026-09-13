import {makeSnapshot,validateBirth,TAROT} from './consultation.js';
import {koreanDate} from './engine.js';
import {fortuneCards,compatibilityCards,questionIntent} from './fortune.js';
export function consultSession(profile,raw){
 if(!profile)throw new Error('먼저 출생 정보를 입력해 주세요.');
 if(!raw||!['question','compatibility','tarot'].includes(raw.kind))throw new Error('어떤 이야기를 볼지 선택해 주세요.');
 const question=typeof raw.question==='string'?raw.question.trim():'';
 if(question.length>160)throw new Error('질문은 160자 안으로 적어 주세요.');
 let cards,input,title;
 if(raw.kind==='compatibility'){
  if(!Array.isArray(raw.people)||raw.people.length<1||raw.people.length>5)throw new Error('나를 포함해 2~6명의 출생 정보를 넣어 주세요.');
  const relationship=['연인','친구','가족','동료'].includes(raw.relationship)?raw.relationship:'친구';
  const others=raw.people.map((p,i)=>{const value=validateBirth(p);return {name:typeof p.name==='string'&&p.name.trim()?p.name.trim().slice(0,20):`상대 ${i+1}`,...value};});
  const people=[{name:'나',chart:profile.chart},...others];cards=compatibilityCards(people,relationship);input={people:others.map(({name,input})=>({name,...input})),relationship};title=`${people.length}명 ${relationship} 궁합`;
 }else if(raw.kind==='tarot'){
  if(!Number.isInteger(raw.selection)||raw.selection<0||raw.selection>2)throw new Error('세 장 중 한 장을 골라 주세요.');
  const intent=questionIntent(question,raw.intent);
  if(intent==='highstakes')cards=fortuneCards(profile.chart,profile.snapshot.signIndex,profile.snapshot.planets,profile.snapshot.date,question,raw.intent);
  else{const random=crypto.getRandomValues(new Uint32Array(1))[0],index=random%22;
   cards=[{title:TAROT[index][0],symbol:String(index),image:`/assets/tarot/${String(index).padStart(2,'0')}.jpg`,kind:'tarot',text:`${TAROT[index][0]} 카드가 나왔어요. ${question?'떠올린 질문과 함께 카드의 조언을 살펴볼게요.':'이 카드가 어떤 조언을 하는지 살펴볼게요.'}`,note:'라이더 웨이트 스미스 · 정방향',expression:[13,15,16,18].includes(index)?'reassure':'happy'},
   {title:'이 카드로 해 볼 일',symbol:'✧',text:TAROT[index][1],expression:'thoughtful',note:'새로 뽑을 때 무작위로 한 장을 골라요. 미래를 보장하는 답은 아니에요.'}];}
  input={question,selection:raw.selection};title=question||'마녀의 타로';
 }else{
  if(!question)throw new Error('궁금한 내용을 한 문장으로 적어 주세요.');
  cards=fortuneCards(profile.chart,profile.snapshot.signIndex,profile.snapshot.planets,profile.snapshot.date,question,raw.intent);input={question,intent:raw.intent};title=question;
 }
 const id=crypto.randomUUID(),result={title,cards,date:profile.snapshot.date,guide:profile.guide},createdAt=new Date().toISOString();
 return {id,kind:raw.kind,result,created_at:createdAt};
}

export function createSessionRecord(raw){const value=validateBirth(raw);return {version:crypto.randomUUID(),...value,snapshot:makeSnapshot(value.chart,koreanDate())};}
