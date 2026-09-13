import {STEMS,BRANCHES,ELEMENTS,dailyRelation,hangul,koreanDate} from './engine.js';
export const SIGN_NAMES=['양자리','황소자리','쌍둥이자리','게자리','사자자리','처녀자리','천칭자리','전갈자리','사수자리','염소자리','물병자리','물고기자리'];
export const SIGN_IDS=['Ari','Tau','Gem','Cnc','Leo','Vir','Lib','Sco','Sgr','Cap','Aqr','Psc'];
const MOD=(n,m)=>(n%m+m)%m;
const BRANCH_ELEMENTS=[4,2,0,0,2,1,1,2,3,3,2,4];
const LUCKY=[['작은 수첩','초록','떠오른 생각을 적어 두면 대화나 일에 다시 써먹기 좋아요.'],['밝은 손수건','주황','눈에 들어오는 작은 색으로 기분을 바꿔 보세요.'],['따뜻한 차','노랑','잠깐 쉬며 오늘 할 일을 정리해 보세요.'],['즐겨 쓰는 펜','흰색','약속이나 요청을 짧게 적어 두세요.'],['물병','파랑','이동할 때 챙길 물건을 하나 줄여 보세요.']];
const THEMES={
 overall:{label:'오늘의 운세',good:['미뤄 둔 일이 예상보다 쉽게 풀리는 장면을 기대해 볼 만해요. 먼저 작은 부탁 하나를 꺼내 보세요.','익숙한 일에서 새 방법을 찾기 좋은 날로 읽어요. 평소와 다른 순서로 시작해 보세요.','바쁜 흐름이 잦아들면 놓쳤던 도움을 발견할 수 있어요. 주변의 제안을 천천히 들어 보세요.'],caution:'일정이 겹치면 마음이 급해지기 쉬워요. 먼저 약속한 일부터 정리해 보세요.'},
 love:{label:'연애와 마음',good:['먼저 건넨 안부가 대화로 이어지기 좋은 흐름이에요. 가볍게 근황부터 물어보세요.','서로 좋아하는 것을 이야기하며 거리를 좁혀 볼 만해요. 답을 재촉하지 않는 편이 좋아요.','마음을 정리한 뒤 말을 고르면 오해를 줄일 수 있어요. 편한 대화 시간을 먼저 물어보세요.'],caution:'답장이 늦다는 이유로 상대의 마음을 단정하지 마세요. 궁금한 것은 직접 물어보세요.'},
 work:{label:'일과 공부',good:['준비한 의견을 꺼내 보기 좋은 날로 읽어요. 가장 자신 있는 근거부터 짧게 전해 보세요.','작업 순서를 바꾸면 막힌 부분에서 단서를 찾을 수 있어요. 쉬운 단계 하나부터 끝내 보세요.','마무리와 복습에 힘을 싣는 날이에요. 새 일을 늘리기보다 이미 한 일을 정리해 보세요.'],caution:'서두르면 작은 조건을 놓치기 쉬워요. 제출물과 약속한 범위를 한 번 더 확인해 보세요.'},
 money:{label:'돈과 생활',good:['잊고 있던 할인이나 보유 물건을 찾아보기 좋은 날로 읽어요. 새 지출보다 가진 것을 먼저 살펴보세요.','비슷한 지출을 묶어 보면 줄일 곳이 보일 수 있어요. 최근 기록 한 줄부터 확인해 보세요.','고정 지출을 정돈하는 쪽에 힘을 싣는 날이에요. 사용하지 않는 항목을 살펴보세요.'],caution:'운세나 행운 아이템을 이유로 큰돈을 쓰지 마세요. 실제 금액과 조건을 기준으로 결정해 주세요.'},
 people:{label:'친구와 사람',good:['가벼운 제안에 함께할 사람이 나타나기 좋은 흐름이에요. 부담 없는 모임부터 이야기해 보세요.','익숙한 사람의 다른 모습을 발견할 수 있어요. 요즘 관심사를 물어보세요.','많이 만나기보다 한 사람과 차분히 이야기하기 좋은 날로 읽어요.'],caution:'농담의 뜻이 다르게 전달될 수 있어요. 중요한 말은 짧고 분명하게 전해 보세요.'},
 choice:{label:'선택과 도전',good:['준비해 둔 작은 시도를 시작하기 좋은 흐름이에요. 되돌릴 수 있는 첫 단계부터 골라 보세요.','두 선택을 작게 시험해 보면 차이가 선명해질 수 있어요. 오늘 확인할 조건 하나를 정해 보세요.','결정에 앞서 빠진 정보를 채우는 날로 읽어요. 서둘러 결론을 내릴 필요는 없어요.'],caution:'확신이 들더라도 취소 조건과 필요한 시간을 확인해 보세요. 큰 결정의 근거를 운세에만 맡기지 마세요.'}
};
export function questionIntent(question,selected='overall'){
 if(/투자|주식|코인|복권|도박|질병|암\b|수술|임신|죽을|소송/.test(question))return 'highstakes';
 if(/연애|사랑|고백|짝사랑|재회|애인|데이트/.test(question))return 'love';
 if(/시험|취업|면접|직장|업무|회사|공부|이직|합격|발표/.test(question))return 'work';
 if(/돈|지출|쇼핑|구매|월급|재물/.test(question))return 'money';
 if(/친구|동료|가족|모임|인간관계/.test(question))return 'people';
 if(/선택|시작|도전|결정|이사|여행/.test(question))return 'choice';
 return Object.hasOwn(THEMES,selected)?selected:'overall';
}
export function signTransit(sign,planets){
 const center=sign*30+15;
 const aspects=planets.filter(p=>['금성','화성','목성','달'].includes(p.name)).map(p=>{
  const delta=Math.abs(MOD(p.longitude-center+180,360)-180);
  const angle=[0,60,90,120,180].reduce((best,a)=>Math.abs(delta-a)<Math.abs(delta-best)?a:best,0);
  return {planet:p.name,angle,orb:Math.abs(delta-angle)};
 }).sort((a,b)=>a.orb-b.orb);
 const active=aspects.filter(a=>a.orb<=6),focus=active[0];
 const phase=!focus?1:[90,180].includes(focus.angle)?2:0;
 return {phase,focus,aspects:active,label:['기회를 건네는 날','변화를 살피는 날','속도를 맞추는 날'][phase]};
}
export function fortuneCards(chart,sign,planets,date=koreanDate(),question='',intent='overall'){
 const transit=signTransit(sign,planets),relation=dailyRelation(chart,date),kind=questionIntent(question,intent);
 if(kind==='highstakes')return [{title:'이 질문은 실제 정보가 먼저예요',symbol:'?',text:'건강·투자·당첨·법적 결과는 운세로 판단할 수 없어요. 오늘 준비할 일이나 마음가짐에 대한 질문으로 바꿔 주세요.',expression:'reassure'}];
 const content=THEMES[kind],phase=transit.phase,lucky=LUCKY[relation.element];
 const specific=/면접/.test(question)?'답변을 길게 늘이기보다 경험 한 가지를 결과까지 이야기해 보세요.':/시험|공부|합격/.test(question)?'새 범위를 늘리기보다 자주 틀린 문제부터 다시 풀어 보세요.':/고백/.test(question)?'마음을 짧게 전하고 상대가 생각할 시간을 남겨 두세요.':/재회/.test(question)?'답을 요구하기보다 안부를 짧게 전할지부터 생각해 보세요.':/연락|답장/.test(question)?'부담 없는 안부 하나를 보내고 답을 기다려 보세요.':/이직|취업/.test(question)?'관심 있는 자리의 조건과 내가 보여 줄 경험을 나란히 적어 보세요.':/여행/.test(question)?'새 일정을 더 넣기보다 이동 시간에 여유를 남겨 보세요.':content.good[phase].split('. ')[1]||'좋은 흐름과 주의점을 한 장씩 살펴볼게요.';
 return [
  {title:content.label,symbol:'✦',text:question?`“${question}”에는 ${phase===0?'먼저 움직이는':phase===1?'작게 시험하는':'차분히 준비하는'} 쪽에 힘을 실었어요. ${specific}`:`오늘은 ${transit.label}로 읽었어요. 좋은 흐름과 주의점을 한 장씩 알려드릴게요.`,expression:phase===2?'thoughtful':'happy',kind:'fortune'},
  {title:'기대해 볼 좋은 일',symbol:'✧',text:content.good[(phase+relation.variant)%3],expression:'happy'},
  {title:'오늘의 주의점',symbol:'◇',text:content.caution,expression:'reassure'},
  {title:'행운의 아이템',symbol:['✎','✿','☕','✒','◈'][relation.element],text:`오늘의 상징 아이템은 ${lucky[0]}, 색은 ${lucky[1]}이에요. ${lucky[2]}`,note:'이미 가진 물건으로 즐겨도 좋아요.',expression:'happy',kind:'lucky'},
  {title:'마녀가 읽은 오늘',symbol:'☾',text:`${SIGN_NAMES[sign]}의 흐름과 사주의 ${hangul(relation.pillar)} 일진을 함께 읽었어요. ${transit.focus?`${transit.focus.planet}의 위치가 ${transit.phase===2?'조율':'시도'} 쪽에 무게를 더했어요.`:'가까운 주요 각이 없어 무리한 결론보다 일상의 변화를 살피는 쪽으로 풀었어요.'}`,note:'실제 천체 계산에 전통 해석과 오락용 문장을 연결한 간이 운세예요.',expression:'thoughtful'}
 ];
}
export function sajuInsight(chart){
 const counts=Array(5).fill(0);for(const pillar of Object.values(chart.pillars)){if(!pillar)continue;counts[Math.floor(STEMS.indexOf(pillar[0])/2)]++;counts[BRANCH_ELEMENTS[BRANCHES.indexOf(pillar[1])]]++;}
 const most=counts.indexOf(Math.max(...counts)),day=chart.dayElement;
 const strengths=['새로운 일을 배우고 연결하는 데 관심을 기울여 보세요.','생각을 표현하고 사람들에게 보여주는 일을 시도해 보세요.','흩어진 일을 정리하고 꾸준히 챙기는 역할을 맡아 보세요.','기준을 세우고 필요한 것을 고르는 일에 힘을 써 보세요.','자료를 모으고 여러 관점을 듣는 일에 시간을 써 보세요.'];
 return [{title:'내 사주에서 얻는 힌트',symbol:chart.pillars.day,text:`일간은 ${ELEMENTS[day]}, 겉으로 드러난 글자에서는 ${ELEMENTS[most]}이 가장 자주 나와요. ${strengths[most]}`,kind:'elements',counts,expression:'thoughtful',note:chart.unknown?'출생 시간 없이 확인한 글자만 세었어요.':'천간과 지지의 대표 오행을 센 값이에요.'},
 {title:'강점을 써 볼 곳',symbol:'✦',text:strengths[day],expression:'happy'},
 {title:'주의해서 읽을 부분',symbol:'◇',text:'많이 보이는 오행이 곧 좋은 오행은 아니에요. 이 분포만으로 용신이나 직업 적성을 확정하지 않았어요.',expression:'reassure'}];
}
export function compatibilityCards(people,relationship='친구'){
 const pairs=[];const harmony=['子丑','寅亥','卯戌','辰酉','巳申','午未'];
 for(let i=0;i<people.length;i++)for(let j=i+1;j<people.length;j++){
  const a=people[i],b=people[j],diff=MOD(b.chart.dayElement-a.chart.dayElement,5),ab=a.chart.pillars.day[1]+b.chart.pillars.day[1];
  const clash=MOD(BRANCHES.indexOf(ab[0])-BRANCHES.indexOf(ab[1]),12)===6;
  const join=harmony.some(x=>x===ab||x===ab[1]+ab[0]);
  const same=diff===0,produce=[1,4].includes(diff);
  const title=clash?'다른 속도를 맞추는 관계':join?'서로의 반응을 살펴볼 관계':same?'비슷한 힘으로 움직이는 관계':produce?'도움을 주고받는 관계':'역할을 나누는 관계';
  const text=same?'일간의 오행이 같아 관심이 겹치는 관계로 읽어요. 의견이 다를 때는 누가 결정할지 먼저 정해 보세요.':produce?'일간에 상생 관계가 있어 한쪽의 시도가 다른 쪽의 준비를 돕는 그림으로 읽어요. 도움을 주는 역할이 한 사람에게만 몰리지 않게 해 보세요.':'일간에 상극 관계가 있어 서로 기준을 점검하는 그림으로 읽어요. 지적보다 원하는 역할을 구체적으로 말해 보세요.';
  pairs.push({title:`${a.name} × ${b.name}`,symbol:'♡',text:`${title}예요. ${text}`,note:`일주 ${hangul(a.chart.pillars.day)} · ${hangul(b.chart.pillars.day)}`,expression:clash?'thoughtful':'happy'},
   {title:'잘 맞추는 방법',symbol:'◇',text:clash?'일지에 충 관계가 있어 생활 속도나 방식의 차이를 살피는 쪽으로 풀었어요. 일정과 혼자 쉴 시간을 먼저 맞춰 보세요.':join?'일지에 육합 관계가 있어 함께 익숙한 활동을 반복하는 쪽으로 풀었어요. 편한 만남 방식 하나를 정해 보세요.':`${relationship} 관계에서 기대하는 연락 빈도와 역할을 이야기해 보세요. 합이나 충이 없다고 좋거나 나쁜 관계가 되는 것은 아니에요.`,expression:'reassure'});
 }
 return [{title:`${people.length}명의 궁합 이야기`,symbol:'♡',text:`${relationship} 관계에서 각 쌍의 일간과 일지 관계를 살펴볼게요. 마음이나 관계의 결말을 단정하는 점수는 매기지 않아요.`,expression:'happy'},...pairs,{title:'함께 정할 한 가지',symbol:'✦',text:'각자 편한 방식과 어려운 방식을 하나씩 말해 보세요. 오늘 읽은 차이를 실제 대화로 확인하는 데 써 보세요.',expression:'happy'}];
}
