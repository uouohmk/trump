import {STEMS,ELEMENTS,dailyRelation,hangul,koreanDate} from './engine.js';
const NAMES=[['비견','겁재'],['식신','상관'],['편재','정재'],['편관','정관'],['편인','정인']];
const ADVICE=[
 {title:'내 방식과 함께하는 일',meaning:'사주에서는 오늘처럼 나와 비슷한 기운을 만날 때 동료와의 협력과 경쟁을 살펴봐요.',work:'혼자 막힌 일이 있다면 동료에게 의견을 구해 보세요.',people:'서로 원하는 것을 하나씩 말하고 역할을 나눠 보세요.',caution:'비교나 경쟁에 몰두해 내 계획을 놓치지 않도록 해 보세요.'},
 {title:'생각을 표현하는 일',meaning:'내 기운이 오늘의 기운을 만들어 내는 관계예요. 전통적으로 생각을 표현하고 결과물을 만드는 때로 풀이해요.',work:'생각만 해 둔 내용을 짧은 글이나 작은 결과물로 만들어 보세요.',people:'상대가 알아주기를 기다리기보다 내 생각을 구체적으로 말해 보세요.',caution:'말이 앞서 약속이 커지지 않도록 할 수 있는 범위를 먼저 정해 보세요.'},
 {title:'돈과 시간을 챙기는 일',meaning:'내 기운이 오늘의 기운을 제어하는 관계예요. 사주에서는 돈과 시간처럼 내가 관리할 것을 살펴보는 때로 풀이해요.',work:'오늘 쓸 시간과 필요한 비용을 적고 우선순위를 정해 보세요.',people:'함께 쓰는 돈이나 물건이 있다면 각자의 몫을 먼저 정해 보세요.',caution:'재물을 뜻하는 분류가 나왔다고 돈이 들어온다는 뜻은 아니에요. 실제 지출을 보고 결정해 보세요.'},
 {title:'책임과 기준을 정하는 일',meaning:'오늘의 기운이 내 기운을 제어하는 관계예요. 사주에서는 책임과 약속을 잘 챙길 때로 풀이해요.',work:'마감과 제출 조건을 확인하고 가장 중요한 일부터 끝내 보세요.',people:'부탁을 받으면 내 여유를 확인한 뒤 가능한 범위를 말해 보세요.',caution:'기대에 맞추려다 일을 너무 많이 맡지 않도록 해 보세요.'},
 {title:'배우고 도움을 받는 일',meaning:'오늘의 기운이 내 기운을 돕는 관계예요. 사주에서는 배우거나 조언을 구하며 준비하는 때로 풀이해요.',work:'모르는 부분은 경험 있는 사람에게 묻고 기초부터 확인해 보세요.',people:'혼자 해결하기 어렵다면 어떤 도움이 필요한지 구체적으로 부탁해 보세요.',caution:'자료만 모으느라 시작을 미루지 않도록 오늘 써 볼 내용을 하나 골라 보세요.'}
];
export function tenGod(dayStem,otherStem){
 const a=STEMS.indexOf(dayStem),b=STEMS.indexOf(otherStem);
 if(a<0||b<0)throw new Error('사주 글자를 확인해 주세요.');
 const relation=(Math.floor(b/2)-Math.floor(a/2)+5)%5;
 return {relation,name:NAMES[relation][a%2===b%2?0:1]};
}
export function sajuDailyCards(chart,date=koreanDate()){
 const daily=dailyRelation(chart,date),god=tenGod(chart.pillars.day[0],daily.pillar[0]),advice=ADVICE[god.relation];
 return [
  {title:`오늘 사주가 권하는 일`,symbol:'✦',text:`오늘은 ${advice.title}에 관심을 가져 보세요. ${advice.meaning}`,note:`${ELEMENTS[chart.dayElement]}에 속하는 내 기운과 ${ELEMENTS[daily.element]}에 속하는 오늘의 기운을 비교했어요.`,expression:'thoughtful',basis:{dayStem:chart.pillars.day[0],today:daily.pillar,tenGod:god.name,date}},
  {title:'일과 공부에서 해 볼 일',symbol:'◇',text:advice.work,expression:'happy'},
  {title:'사람들과 지낼 때',symbol:'♡',text:advice.people,expression:'happy'},
  {title:'오늘 사주에서 주의할 점',symbol:'☾',text:advice.caution,expression:'reassure'},
  {title:'이렇게 풀이했어요',symbol:daily.pillar,text:`태어난 날의 첫 글자와 오늘의 첫 글자를 비교했어요. 이 관계는 사주에서 ${god.name}에 해당해요. ${advice.meaning}`,note:`오늘은 사주 달력으로 ${hangul(daily.pillar)}에 해당해요. 태어날 때의 사주 전체나 장기 운세를 종합한 판단은 아니에요.`,expression:'thoughtful'}
 ];
}
