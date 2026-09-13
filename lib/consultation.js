import {calculateChart,dailyRelation,koreanDate,localToUTC,hangul,ELEMENTS} from './engine.js';
import {readingFor,ELEMENT_STORIES} from './readings.js';
import {SunPosition,GeoVector,Ecliptic} from './astronomy.mjs';
import termData from '../public/assets/solar-terms.json' with {type:'json'};
import {fortuneCards,sajuInsight,SIGN_IDS} from './fortune.js';
import {planetReadings} from './celestial-reading.js';
import {sajuDailyCards} from './saju-guidance.js';
export const TOPICS=['sky','flow','work','saju','tarot'];
export const SNAPSHOT_VERSION=5;
const SIGNS=['양자리','황소자리','쌍둥이자리','게자리','사자자리','처녀자리','천칭자리','전갈자리','사수자리','염소자리','물병자리','물고기자리'];
export const TAROT=[['바보','처음 해 보는 일의 작은 시작을 떠올려 보세요.'],['마법사','이미 갖춘 도구로 무엇을 할 수 있을까요?'],['여사제','바로 답하기 전에 내 생각을 적어 보세요.'],['여황제','오늘 돌보고 싶은 것을 하나 골라 보세요.'],['황제','내가 지킬 수 있는 기준 하나를 정해 보세요.'],['교황','경험 있는 사람의 이야기를 들어 보세요.'],['연인','지금 중요하게 여기는 선택의 기준을 떠올려 보세요.'],['전차','가려는 방향을 먼저 정해 보세요.'],['힘','밀어붙이기보다 차분하게 다뤄 보세요.'],['은둔자','혼자 생각할 시간을 잠깐 가져 보세요.'],['운명의 수레바퀴','바뀐 상황에서 내가 할 수 있는 일을 찾아보세요.'],['정의','내 생각과 확인한 사실을 나눠 적어 보세요.'],['매달린 사람','익숙한 문제를 다른 방향에서 살펴보세요.'],['죽음','마무리하고 싶은 습관을 떠올려 보세요. 끝맺음의 상징이에요.'],['절제','일과 쉼의 비중을 조절해 보세요.'],['악마','반복하는 선택이 내게 필요한지 살펴보세요.'],['탑','당연하게 여긴 생각 하나를 다시 확인해 보세요.'],['별','계속해 보고 싶은 일을 하나 적어 보세요.'],['달','모호한 부분은 결론을 미루고 확인해 보세요.'],['태양','요즘 즐거웠던 일을 다시 해 보세요.'],['심판','지난 경험에서 배운 것을 떠올려 보세요.'],['세계','끝낸 일을 확인하고 잠깐 쉬어 가세요.']];
export function validateBirth(raw, now=new Date()){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('생년월일을 입력해 주세요.');
 const input={year:raw.year,month:raw.month,day:raw.day,hour:raw.hour,minute:raw.minute,unknown:raw.unknown===true,calendar:raw.calendar||'solar',leap:raw.leap===true,zone:raw.zone||'Asia/Seoul'};
 if(typeof input.zone!=='string'||input.zone.length>80)throw new Error('출생 지역을 확인해 주세요.');
 const chart=calculateChart(input,termData.terms,now);
 if(input.unknown){input.hour=null;input.minute=null;}
 return {input,chart,guide:raw.guide==='blonde'?'blonde':'dark'};
}
export function makeSnapshot(chart, date=koreanDate()){
 const daily=readingFor(dailyRelation(chart,date));
 const moment=new Date(date+'T00:00:00+09:00');
 const planets=[['Sun','태양','☉'],['Moon','달','☽'],['Mercury','수성','☿'],['Venus','금성','♀'],['Mars','화성','♂'],['Jupiter','목성','♃']].map(([body,name,symbol])=>({name,symbol,longitude:body==='Sun'?SunPosition(moment).elon:Ecliptic(GeoVector(body,moment,true)).elon}));
 const [year,month,day]=chart.solar.split('-').map(Number);
 const valid=[];if(!chart.utc)for(let hour=0;hour<24;hour++)for(const minute of [0,59]){try{valid.push(new Date(localToUTC({year,month,day,hour,minute},chart.zone)));}catch{}}
 const moments=chart.utc?[new Date(chart.utc)]:[valid[0],valid.at(-1)];
 const signs=[...new Set(moments.map(time=>SIGNS[Math.floor(SunPosition(time).elon/30)]))];
 let hash=2166136261;for(const c of chart.solar+chart.pillars.day+date){hash^=c.charCodeAt(0);hash=Math.imul(hash,16777619);}
 const tarotIndex=(hash>>>0)%TAROT.length;
 const card=daily.cards;
 const topics={
  sky:[{title:signs.join(' 또는 '),symbol:'☉',text:signs.length>1?'태어난 시간을 몰라 두 별자리의 경계에 있어요.':`태어난 날의 태양은 ${signs[0]} 구간에 있어요.`,note:'열대황도 12궁 기준',kind:'sign',signIds:signs.map(s=>SIGN_IDS[SIGNS.indexOf(s)])},
       {title:'오늘의 천문지도',symbol:'✦',text:'태양과 달, 가까운 행성들이 놓인 방향이에요. 표시를 눌러 하나씩 살펴보세요.',kind:'map',planets},
       {title:'별자리와 나',symbol:'☉',text:'별자리는 나를 돌아보는 이야기의 출발점이에요. 실제 성격을 정하거나 미래를 보장하지는 않아요.'}],
  flow:[{title:daily.tag,symbol:'✧',text:card[0].body},{title:card[0].title,symbol:'✧',text:card[0].action},{title:'오늘의 한 걸음',symbol:'✧',text:daily.focus,note:'오행의 관계를 바탕으로 쓴 성찰 문장이에요.'}],
  work:[{title:card[1].title,symbol:'◇',text:card[1].body},{title:'지금 해 볼 일',symbol:'◇',text:card[1].action}],
  saju:[{title:`태어난 날의 사주 · ${hangul(chart.pillars.day)}`,symbol:chart.pillars.day,text:ELEMENT_STORIES[chart.dayElement],note:`나를 나타내는 기운: ${ELEMENTS[chart.dayElement]}`},
        ...[['year','태어난 해'],['month','태어난 달'],['hour','태어난 시간']].map(([key,title])=>({title,symbol:chart.pillars[key]||'?',text:chart.pillars[key]?`${title}의 사주 글자는 ${hangul(chart.pillars[key])}에 해당해요. ${key==='year'?'이 두 글자를 연주라고 불러요.':key==='month'?'달을 나누는 기준은 달력의 1일이 아니라 계절이 바뀌는 절기예요.':'이 두 글자를 시주라고 불러요.'}`:key==='hour'?'태어난 시간을 몰라도 해·달·날에 해당하는 사주 글자는 살펴볼 수 있어요.':'절기가 바뀌는 때와 겹쳐 사주 글자를 하나로 정하기 어려워요.'})),
        {title:'사주의 네 기둥',symbol:'四',text:'사주는 태어난 해·달·날·시간을 각각 두 글자로 나타내 해석하는 전통이에요. 이 네 쌍을 기둥이라고 불러요. 어느 한 쌍만으로 성격이나 삶을 단정하지는 않아요.'}],
  tarot:[{title:TAROT[tarotIndex][0],symbol:String(tarotIndex).padStart(2,'0'),text:TAROT[tarotIndex][1],note:'메이저 아르카나 · 정방향',kind:'tarot',image:'/assets/tarot/'+String(tarotIndex).padStart(2,'0')+'.jpg'},
         {title:'카드가 건네는 질문',symbol:'✧',text:'카드의 조언 중 지금 내 상황에 맞는 부분은 무엇인가요?',note:'같은 출생 정보로는 하루 동안 같은 카드가 나와요. 무작위 추첨이나 미래 예측은 아니에요.'}]
 };
 const signIndex=SIGNS.indexOf(signs[0]);
 topics.flow=fortuneCards(chart,signIndex,planets,date);
 topics.work=fortuneCards(chart,signIndex,planets,date,'','work');
 topics.sky=[topics.sky[0],{...topics.sky[1],text:'천체를 하나 골라 보세요. 그 위치가 어떤 운세와 연결되는지 알려드릴게요.',insights:planetReadings(chart,planets)},...fortuneCards(chart,signIndex,planets,date)];
 topics.saju=[...sajuDailyCards(chart,date),...sajuInsight(chart),...topics.saju];
 if(signs.length>1){const note=`태어난 날에 태양의 별자리가 바뀌어 ${signs.join(' 또는 ')}일 수 있어요. 태어난 시간을 모르니 오늘은 ${signs[0]} 기준의 운세를 먼저 보여드릴게요.`;topics.flow.unshift({title:'두 별자리 사이에서 태어났어요',symbol:'☉',text:note});topics.work.unshift({title:'두 별자리 사이에서 태어났어요',symbol:'☉',text:note});topics.sky[0].text+=' 이어지는 운세는 '+signs[0]+' 기준으로 살펴볼게요.';}
 return {date,topics,planets,signIndex,signCandidates:signs.map(s=>SIGNS.indexOf(s)),version:SNAPSHOT_VERSION};
}
