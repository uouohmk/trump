import {SunPosition} from './astronomy.mjs';
import {localToUTC} from './engine.js';

const mod=(n,m)=>(n%m+m)%m;
const SIGNS=['양자리','황소자리','쌍둥이자리','게자리','사자자리','처녀자리','천칭자리','전갈자리','사수자리','염소자리','물병자리','물고기자리'];
// Modern, editorial prompts from traditional planetary symbolism. Not event probabilities.
export const PLANET_THEMES={
 '태양':{domain:'자신감과 표현',meaning:'태양은 내가 원하는 것을 드러내고 행동하는 힘을 상징해요.',support:'준비한 생각을 사람들 앞에서 이야기해 보기 좋겠어요.',focus:'오늘 가장 하고 싶은 일을 하나 정해 보세요.',adjust:'의욕만 앞서지 않도록 맡을 수 있는 일의 범위를 정해 보세요.',quiet:'다른 사람의 반응보다 내가 원하는 것을 먼저 적어 보세요.'},
 '달':{domain:'마음과 편안함',meaning:'달은 감정과 익숙한 일상에서 느끼는 편안함을 상징해요.',support:'편한 사람과 마음을 나누며 쉬어 가기 좋겠어요.',focus:'내 기분이 어떤지 살피고 편안해지는 일을 골라 보세요.',adjust:'기분이 바뀔 때 바로 답하지 말고 잠깐 생각할 시간을 가져 보세요.',quiet:'익숙한 일상에서 나를 편하게 해 주는 것을 찾아보세요.'},
 '수성':{domain:'대화와 공부',meaning:'수성은 말과 글, 배우고 이해하는 일을 상징해요.',support:'궁금한 것을 질문하거나 준비한 내용을 설명해 보기 좋겠어요.',focus:'전하고 싶은 말을 짧게 정리해 보세요.',adjust:'오해를 줄이도록 약속한 내용과 전달할 말을 한 번 더 확인해 보세요.',quiet:'읽거나 들은 내용을 내 말로 정리해 보세요.'},
 '금성':{domain:'연애와 취향',meaning:'금성은 호감과 관계, 내가 좋아하는 것을 상징해요.',support:'먼저 안부를 묻거나 서로 좋아하는 것을 나누며 가까워져 볼 만해요.',focus:'어떤 관계와 취미에 시간을 쓰고 싶은지 골라 보세요.',adjust:'내 취향을 상대도 좋아할 거라고 생각하기보다 직접 물어보세요.',quiet:'좋아하는 사람이나 취미에 부담 없는 시간을 내 보세요.'},
 '화성':{domain:'행동과 도전',meaning:'화성은 일을 시작하는 힘과 경쟁심을 상징해요.',support:'미뤄 둔 일의 첫 단계를 실행해 보기 좋겠어요.',focus:'의욕을 한 가지 일에 모아 보세요.',adjust:'서두르거나 상대를 이기려 하기보다 할 일을 차분히 끝내 보세요.',quiet:'오늘 끝낼 수 있는 작은 일을 하나 골라 보세요.'},
 '목성':{domain:'배움과 기회',meaning:'목성은 배움과 성장, 가능성을 넓히는 일을 상징해요.',support:'새로운 배움이나 제안을 살펴볼 만해요. 작은 도전이 경험을 넓혀 줄 수도 있어요.',focus:'관심 있는 분야에서 무엇을 더 배우고 싶은지 생각해 보세요.',adjust:'기대가 커지더라도 시간과 비용을 먼저 확인하고 계획을 잡아 보세요.',quiet:'큰 행운을 기다리기보다 배울 만한 자료나 조언을 찾아보세요.'}
};

export function aspectAt(longitude,reference){
 const separation=Math.abs(mod(longitude-reference+180,360)-180);
 const angle=[0,60,90,120,180].reduce((best,a)=>Math.abs(separation-a)<Math.abs(separation-best)?a:best,0);
 const orb=Math.abs(separation-angle);
 return {separation,angle,orb,status:orb>6?'quiet':angle===0?'focus':[60,120].includes(angle)?'support':'adjust'};
}

export function natalSunRange(chart){
 if(chart.utc){const value=SunPosition(new Date(chart.utc)).elon;return [value,value];}
 const [year,month,day]=chart.solar.split('-').map(Number),valid=[];
 // Retain unknown time, including historical clock changes; no invented noon birth.
 for(let hour=0;hour<24;hour++)for(const minute of [0,59]){
  try{valid.push(localToUTC({year,month,day,hour,minute},chart.zone));}catch{}
 }
 if(!valid.length)throw new Error('태어난 날의 태양 위치를 확인할 수 없어요. 출생 정보를 확인해 주세요.');
 const first=SunPosition(new Date(valid[0])).elon,last=SunPosition(new Date(valid.at(-1))).elon;
 return [first,first+mod(last-first+180,360)-180];
}

export function planetReadings(chart,planets){
 const range=natalSunRange(chart),mid=(range[0]+range[1])/2;
 return planets.filter(p=>PLANET_THEMES[p.name]).map(p=>{
  const theme=PLANET_THEMES[p.name],center=aspectAt(p.longitude,mid),start=aspectAt(p.longitude,range[0]),end=aspectAt(p.longitude,range[1]);
  const uncertain=start.status!==end.status||start.angle!==end.angle;
  const status=uncertain?'uncertain':center.status;
  const reason=status==='support'?'태어났을 때의 태양과 조화를 뜻하는 각도를 이루고 있어요.':status==='focus'?'태어났을 때의 태양과 비슷한 방향에 있어 이 주제에 관심을 둘 때로 봐요.':status==='adjust'?'태어났을 때의 태양과 긴장을 뜻하는 각도를 이루어 조정이 필요한 때로 봐요.':status==='uncertain'?'태어난 시간에 따라 각도 해석이 달라질 수 있어 좋고 나쁨을 정하기 어려워요.':'태어났을 때의 태양과 특별한 해석을 붙일 만한 각도는 없어요.';
  const action=theme[status==='uncertain'?'quiet':status];
  return {...p,domain:theme.domain,status,angle:uncertain?null:center.angle,orb:uncertain?null:center.orb,natalRange:range,
   title:`${p.name} · ${theme.domain}`,text:`${theme.meaning} ${reason} ${action}`,action,
   position:`오늘 ${p.name}의 위치는 ${SIGNS[Math.floor(mod(p.longitude,360)/30)]} 구간이에요.`,
   note:chart.utc?'태어난 순간의 태양 위치와 비교했어요.':'태어난 날의 태양 위치 범위를 비교했어요. 정확한 출생 시간은 알 수 없어요.',
   expression:status==='support'?'happy':status==='adjust'?'reassure':'thoughtful'};
 });
}

export function focusReading(readings,intent='overall'){
 const names={overall:['태양','목성','달'],love:['금성','달'],work:['수성','화성','목성'],money:['금성','목성'],people:['수성','금성','달'],choice:['화성','목성','태양']}[intent]||[];
 const options=readings.filter(p=>names.includes(p.name));
 return options.filter(p=>['support','adjust','focus'].includes(p.status)).sort((a,b)=>a.orb-b.orb)[0]||options[0];
}
