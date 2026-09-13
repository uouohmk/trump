import {STEMS,BRANCHES,ELEMENTS,dailyRelation,hangul,koreanDate} from './engine.js';
import {planetReadings,focusReading} from './celestial-reading.js';
export const SIGN_NAMES=['양자리','황소자리','쌍둥이자리','게자리','사자자리','처녀자리','천칭자리','전갈자리','사수자리','염소자리','물병자리','물고기자리'];
export const SIGN_IDS=['Ari','Tau','Gem','Cnc','Leo','Vir','Lib','Sco','Sgr','Cap','Aqr','Psc'];
const MOD=(n,m)=>(n%m+m)%m;
const BRANCH_ELEMENTS=[4,2,0,0,2,1,1,2,3,3,2,4];
const LUCKY=[['작은 수첩','초록','떠오른 생각을 적어 두면 대화하거나 일할 때 활용하기 좋아요.'],['밝은 손수건','주황','밝은 색 손수건으로 기분을 바꿔 보세요.'],['따뜻한 차','노랑','잠깐 쉬며 오늘 할 일을 정리해 보세요.'],['즐겨 쓰는 펜','흰색','약속이나 요청을 짧게 적어 두세요.'],['물병','파랑','외출할 때는 짐을 가볍게 챙겨 보세요.']];
const THEMES={
 overall:{label:'오늘의 운세',good:['미뤄 둔 일이 예상보다 쉽게 풀릴 수도 있어요. 먼저 작은 부탁 하나를 해 보세요.','익숙한 일도 다른 방법으로 해 보기 좋은 날이에요. 평소와 다른 순서로 시작해 보세요.','바쁜 일이 줄어들면 그동안 놓쳤던 도움을 발견할 수 있어요. 주변의 제안을 천천히 들어 보세요.'],caution:'일정이 겹치면 마음이 급해지기 쉬워요. 먼저 약속한 일부터 정리해 보세요.'},
 love:{label:'연애와 마음',good:['먼저 안부를 물으면 대화를 이어 가기 좋겠어요. 가볍게 근황부터 물어보세요.','서로 좋아하는 것을 이야기하며 가까워져 보세요. 답을 재촉하지 않는 편이 좋아요.','마음을 정리한 뒤 말을 고르면 오해를 줄일 수 있어요. 언제 이야기하면 좋을지 먼저 물어보세요.'],caution:'답장이 늦다는 이유로 상대의 마음을 단정하지 마세요. 궁금한 것은 직접 물어보세요.'},
 work:{label:'일과 공부',good:['준비한 의견을 이야기해 보기 좋은 날이에요. 가장 자신 있는 근거부터 짧게 전해 보세요.','일하는 순서를 바꾸면 막힌 부분을 풀 방법이 보일 수 있어요. 쉬운 단계 하나부터 끝내 보세요.','오늘은 마무리와 복습에 집중하면 좋겠어요. 새 일을 늘리기보다 이미 한 일을 정리해 보세요.'],caution:'서두르면 작은 조건을 놓치기 쉬워요. 제출할 내용과 맡은 일을 한 번 더 확인해 보세요.'},
 money:{label:'돈과 생활',good:['잊고 있던 할인 혜택이나 물건을 찾아보기 좋은 날이에요. 새로 사기 전에 가진 것을 먼저 살펴보세요.','비슷한 지출을 묶어 보면 줄일 곳이 보일 수 있어요. 최근 지출 내역부터 확인해 보세요.','오늘은 매달 나가는 돈을 정리하면 좋겠어요. 사용하지 않는 서비스가 있는지 살펴보세요.'],caution:'운세나 행운 아이템을 이유로 큰돈을 쓰지 마세요. 실제 금액과 조건을 기준으로 결정해 주세요.'},
 people:{label:'친구와 사람',good:['가볍게 제안하면 함께할 사람을 만날 수도 있어요. 부담 없는 모임부터 이야기해 보세요.','익숙한 사람의 다른 모습을 발견할 수 있어요. 요즘 관심사를 물어보세요.','오늘은 한 사람과 차분히 이야기하기 좋겠어요. 여러 약속을 잡기보다 한 번의 만남에 시간을 써 보세요.'],caution:'농담의 뜻이 다르게 전달될 수 있어요. 중요한 말은 짧고 분명하게 전해 보세요.'},
 choice:{label:'선택과 도전',good:['준비해 둔 일을 조금씩 시작해 보기 좋은 날이에요. 부담 없이 되돌릴 수 있는 일부터 해 보세요.','두 가지를 조금씩 해 보면 어느 쪽이 나은지 알기 쉬워요. 오늘 확인할 조건 하나를 정해 보세요.','오늘은 결정에 필요한 정보를 더 알아보면 좋겠어요. 서둘러 결론을 내릴 필요는 없어요.'],caution:'확신이 들더라도 취소할 수 있는 조건과 필요한 시간을 확인해 보세요. 큰 결정을 운세만 보고 내리지는 마세요.'}
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
export function fortuneCards(chart,sign,planets,date=koreanDate(),question='',intent='overall'){
 const relation=dailyRelation(chart,date),kind=questionIntent(question,intent);
 if(kind==='highstakes')return [{title:'이 질문은 실제 정보가 먼저예요',symbol:'?',text:'건강·투자·당첨·법적 결과는 운세로 판단할 수 없어요. 오늘 준비할 일이나 마음가짐에 대한 질문으로 바꿔 주세요.',expression:'reassure'}];
 const evidence=focusReading(planetReadings(chart,planets),kind);
 const content=THEMES[kind],phase=evidence?.status==='support'?0:evidence?.status==='adjust'?2:1,lucky=LUCKY[relation.element];
 const label=['새로운 일을 시도해 보기 좋은 날','주변의 변화를 살펴볼 날','서두르지 않고 준비할 날'][phase];
 const specific=/면접/.test(question)?'답변을 길게 늘이기보다 경험 한 가지를 결과까지 이야기해 보세요.':/시험|공부|합격/.test(question)?'새 범위를 늘리기보다 자주 틀린 문제부터 다시 풀어 보세요.':/고백/.test(question)?'마음을 짧게 전하고 상대가 생각할 시간을 남겨 두세요.':/재회/.test(question)?'답을 요구하기보다 안부를 짧게 전할지부터 생각해 보세요.':/연락|답장/.test(question)?'부담 없는 안부 하나를 보내고 답을 기다려 보세요.':/이직|취업/.test(question)?'관심 있는 자리의 조건과 내가 보여 줄 경험을 나란히 적어 보세요.':/여행/.test(question)?'새 일정을 더 넣기보다 이동 시간에 여유를 남겨 보세요.':content.good[phase].split('. ')[1]||'좋은 흐름과 주의점을 한 장씩 살펴볼게요.';
 return [
  {title:content.label,symbol:'✦',text:question?`질문하신 일은 ${phase===0?'먼저 행동해 보면 좋겠어요':phase===1?'작게 시도하며 반응을 살펴보세요':'서두르지 않고 차분히 준비하면 좋겠어요'}. ${specific}`:`오늘의 운세는 ${label}로 볼 수 있어요. 기대할 만한 일과 조심할 점을 하나씩 알려드릴게요.`,expression:phase===2?'thoughtful':'happy',kind:'fortune'},
  {title:'기대해 볼 좋은 일',symbol:'✧',text:content.good[phase],expression:'happy'},
  {title:'오늘의 주의점',symbol:'◇',text:content.caution,expression:'reassure'},
  {title:'행운의 아이템',symbol:['✎','✿','☕','✒','◈'][relation.element],text:`오늘의 행운 아이템으로 ${lucky[0]}, 행운의 색으로 ${lucky[1]}을 골랐어요. ${lucky[2]}`,note:'새로 사지 않고 이미 가진 물건으로 즐겨도 좋아요.',expression:'happy',kind:'lucky'},
  {title:'마녀가 읽은 오늘',symbol:'☾',text:evidence?evidence.text:`${SIGN_NAMES[sign]} 운세와 사주에서 보는 오늘의 기운을 살펴봤어요. 오늘은 일상의 작은 변화를 살펴보길 권해드려요.`,note:`천체 위치로 오늘의 조언을, 사주의 ${hangul(relation.pillar)} 날짜 기운으로 행운 아이템을 골랐어요. 재미로 보는 운세예요.`,expression:'thoughtful'}
 ];
}
export function sajuInsight(chart){
 const counts=Array(5).fill(0);for(const pillar of Object.values(chart.pillars)){if(!pillar)continue;counts[Math.floor(STEMS.indexOf(pillar[0])/2)]++;counts[BRANCH_ELEMENTS[BRANCHES.indexOf(pillar[1])]]++;}
 const most=counts.indexOf(Math.max(...counts)),day=chart.dayElement;
 const strengths=['새로운 것을 배우거나 사람들을 이어 주는 일을 해 보세요.','내 생각을 사람들에게 표현해 보세요.','해야 할 일을 정리하고 꾸준히 챙겨 보세요.','나만의 기준을 세워 필요한 것을 골라 보세요.','자료를 모으고 여러 사람의 의견을 들어 보세요.'];
 return [{title:'내 사주에서 얻는 힌트',symbol:chart.pillars.day,text:`사주에서 나를 나타내는 글자는 ${ELEMENTS[day]}에 속해요. 사주 전체의 글자를 세어 보면 ${ELEMENTS[most]}에 해당하는 글자가 가장 많아요. ${strengths[most]}`,kind:'elements',counts,expression:'thoughtful',note:chart.unknown?'나무·불·흙·금속·물을 오행이라고 해요. 태어난 시간을 몰라 확인할 수 있는 글자만 세었어요.':'나무·불·흙·금속·물을 오행이라고 해요. 사주의 각 글자를 대표하는 오행을 세었어요.'},
 {title:'나에게 권하는 활동',symbol:'✦',text:strengths[day],expression:'happy'},
 {title:'사주를 볼 때 알아둘 점',symbol:'◇',text:'사주에 나무나 불 같은 요소가 많이 나온다고 무조건 좋은 것은 아니에요. 이 개수만으로 어떤 기운이 내게 도움이 되는지, 어떤 직업이 잘 맞는지 단정할 수는 없어요.',expression:'reassure'}];
}
export function compatibilityCards(people,relationship='친구'){
 const pairs=[];const harmony=['子丑','寅亥','卯戌','辰酉','巳申','午未'];
 for(let i=0;i<people.length;i++)for(let j=i+1;j<people.length;j++){
  const a=people[i],b=people[j],diff=MOD(b.chart.dayElement-a.chart.dayElement,5),ab=a.chart.pillars.day[1]+b.chart.pillars.day[1];
  const clash=MOD(BRANCHES.indexOf(ab[0])-BRANCHES.indexOf(ab[1]),12)===6;
  const join=harmony.some(x=>x===ab||x===ab[1]+ab[0]);
  const same=diff===0,produce=[1,4].includes(diff);
  const title=clash?'서로 다른 생활 속도를 맞춰 갈 관계':join?'서로의 반응을 살펴볼 관계':same?'관심사가 비슷할 수 있는 관계':produce?'도움을 주고받는 관계':'역할을 나누는 관계';
  const text=same?'사주에서 두 사람을 나타내는 기운이 같아요. 전통적으로 관심사가 겹칠 수 있다고 봐요. 의견이 다를 때는 누가 결정할지 먼저 정해 보세요.':produce?'사주에서 두 사람의 기운은 서로 돕는 조합이에요. 한 사람의 도전이 다른 사람에게 도움이 될 수 있다는 뜻으로 봐요. 다만 한 사람만 계속 도와주지는 않도록 해 보세요.':'사주에서 두 사람의 기운은 서로를 견제하는 조합이에요. 서로의 기준을 점검하는 관계로 볼 수 있어요. 지적하기보다 어떤 역할을 맡아 주면 좋을지 말해 보세요.';
  pairs.push({title:`${a.name} × ${b.name}`,symbol:'♡',text:`${title}로 볼 수 있어요. ${text}`,note:`태어난 날의 사주 글자: ${hangul(a.chart.pillars.day)} · ${hangul(b.chart.pillars.day)}`,expression:clash?'thoughtful':'happy'},
   {title:'서로 맞춰 가는 방법',symbol:'◇',text:clash?'태어난 날의 글자에는 서로 부딪치는 조합이 있어요. 전통적으로 생활 속도나 방식이 다를 수 있다고 봐요. 일정과 혼자 쉴 시간을 먼저 맞춰 보세요.':join?'태어난 날의 글자에는 서로 어울리는 조합이 있어요. 함께 즐기는 활동을 꾸준히 해 보길 권해드려요. 두 사람 모두 편한 만남 방식을 정해 보세요.':`${relationship} 사이에서 얼마나 자주 연락하고 무엇을 함께할지 이야기해 보세요. 사주에 특별히 어울리거나 부딪치는 조합이 없다고 관계가 좋거나 나쁘다고 볼 수는 없어요.`,expression:'reassure'});
 }
 return [{title:`${people.length}명의 궁합 이야기`,symbol:'♡',text:`${relationship} 궁합을 두 사람씩 짝지어 살펴볼게요. 태어난 날의 사주 글자를 비교해 서로 맞춰 갈 점을 알려드려요. 상대의 마음이나 두 사람의 앞날을 점수로 단정하지는 않아요.`,expression:'happy'},...pairs,{title:'함께 정할 한 가지',symbol:'✦',text:'각자 함께할 때 편한 점과 어려운 점을 하나씩 말해 보세요. 궁합에서 나온 이야기가 실제로도 그런지 대화하며 확인해 보세요.',expression:'happy'}];
}
