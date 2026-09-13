import KoreanLunarCalendar from './korean-lunar-calendar.mjs';

export const STEMS='甲乙丙丁戊己庚辛壬癸', BRANCHES='子丑寅卯辰巳午未申酉戌亥';
const STEM_KO='갑을병정무기경신임계', BRANCH_KO='자축인묘진사오미신유술해';
export const ELEMENTS=['나무','불','흙','금속','물'];
const DAY=86400000;
const mod=(n,m)=>((n%m)+m)%m;
const pad=n=>String(n).padStart(2,'0');
export const dateText=({year,month,day})=>`${year}-${pad(month)}-${pad(day)}`;
export function koreanDate(now=new Date()) {
  return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
}
export function nextMidnight(now=new Date()) {
  const [y,m,d]=koreanDate(now).split('-').map(Number);
  return Date.UTC(y,m-1,d+1)-9*3600000;
}
export function shiftDate(iso,days) {return new Date(Date.parse(iso+'T00:00:00Z')+days*DAY).toISOString().slice(0,10);}
const formatters=new Map();
function zoneParts(ms,zone) {
  if(!formatters.has(zone))formatters.set(zone,new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}));
  return Object.fromEntries(formatters.get(zone).formatToParts(new Date(ms)).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));
}
const fields=['year','month','day','hour','minute','second'];
const utcParts=p=>Date.UTC(p.year,p.month-1,p.day,p.hour||0,p.minute||0,p.second||0);
export function localToUTC(p,zone) {
  const desired=utcParts(p), offsets=new Set();
  for(const delta of [-DAY,0,DAY]){const time=desired+delta;offsets.add(utcParts(zoneParts(time,zone))-time);}
  const candidates=[...offsets].map(offset=>desired-offset).filter(ms=>fields.every(k=>zoneParts(ms,zone)[k]===(p[k]||0)));
  if(!candidates.length)throw new Error('그 지역의 시계가 바뀌며 건너뛴 시각이에요. 출생 기록의 시간을 한 번 확인해 주세요.');
  if(candidates.length>1)throw new Error('그날에는 같은 시각이 두 번 있었어요. 정확한 시각을 확인하거나 ‘시간을 몰라요’로 먼저 살펴봐 주세요.');
  return candidates[0];
}
export function dayPillar(iso) {
  const [y,m,d]=iso.split('-').map(Number), cal=new KoreanLunarCalendar();
  if(!cal.setSolarDate(y,m,d))throw new Error('현재 날짜가 계산 범위를 벗어났어요. 2050년까지 살펴볼 수 있어요.');
  return cal.getChineseGapja().day.slice(0,2);
}
export function hangul(pillar){return pillar?STEM_KO[STEMS.indexOf(pillar[0])]+BRANCH_KO[BRANCHES.indexOf(pillar[1])]:'아직 미정';}
export function yearMonth(ms,terms) {
  const year=new Date(ms).getUTCFullYear();
  const current=terms[String(year)];
  if(!current)throw new Error('절기 자료의 범위를 벗어났어요.');
  const solarYear=ms>=current[2][2]?year:year-1;
  const all=[...(terms[String(year-1)]||[]),...current,...(terms[String(year+1)]||[])].filter(([,lon])=>mod(lon-315,30)===0).sort((a,b)=>a[2]-b[2]);
  const previous=all.filter(t=>t[2]<=ms).at(-1);
  const month=mod(previous[1]-315,360)/30, stem=mod(solarYear-4,10);
  return {year:STEMS[stem]+BRANCHES[mod(solarYear-4,12)],month:STEMS[(stem%5*2+2+month)%10]+BRANCHES[(month+2)%12]};
}
export function calculateChart(input,terms,now=new Date()) {
  const {year,month,day}=input;
  if(![year,month,day].every(Number.isInteger)||year<1900||year>2049)throw new Error('1900~2049년 사이의 생년월일을 숫자로 입력해 주세요.');
  const kind=input.calendar||'solar';
  if(!['solar','lunar'].includes(kind))throw new Error('양력 또는 음력을 선택해 주세요.');
  const cal=new KoreanLunarCalendar();
  const ok=kind==='lunar'?cal.setLunarDate(year,month,day,!!input.leap):cal.setSolarDate(year,month,day);
  if(!ok)throw new Error('달력에 없는 날짜예요. 월·일과 윤달 선택을 한 번 확인해 주세요.');
  const solar=cal.getSolarCalendar(), iso=dateText(solar), zone=input.zone||'Asia/Seoul';
  if(solar.year<1900||solar.year>2049)throw new Error('변환한 양력 날짜가 1900~2049년 범위에 있어야 해요.');
  if(iso>dateText(zoneParts(now.getTime(),zone)))throw new Error('아직 오지 않은 생일이에요. 태어난 연도를 다시 확인해 주세요.');
  const dayValue=cal.getChineseGapja().day.slice(0,2), known=!input.unknown;
  let candidates=[],moment=null,hourValue=null,boundary=false;
  const all=[...(terms[String(solar.year-1)]||[]),...terms[String(solar.year)],...(terms[String(solar.year+1)]||[])].filter(([,lon])=>mod(lon-315,30)===0);
  if(known){
    if(!Number.isInteger(input.hour)||!Number.isInteger(input.minute)||input.hour<0||input.hour>23||input.minute<0||input.minute>59)throw new Error('시간은 0~23시, 분은 0~59분으로 입력해 주세요.');
    moment=localToUTC({...solar,hour:input.hour,minute:input.minute},zone);
    candidates=[yearMonth(moment,terms)];
    const nearest=all.reduce((a,b)=>Math.abs(a[2]-moment)<Math.abs(b[2]-moment)?a:b);
    if(Math.abs(nearest[2]-moment)<=30*60000){boundary=true;candidates=[yearMonth(nearest[2]-31*60000,terms),yearMonth(nearest[2]+31*60000,terms)];}
    const h=Math.floor((input.hour+1)/2)%12;
    hourValue=STEMS[(STEMS.indexOf(dayValue[0])%5*2+h)%10]+BRANCHES[h];
  }else{
    // Enumerate valid hours to include a term transition without inventing a birth time.
    for(let h=0;h<24;h++)for(const minute of [0,59]){
      try{const t=localToUTC({...solar,hour:h,minute},zone);candidates.push(yearMonth(t,terms));
        for(const term of all)if(Math.abs(term[2]-t)<=30*60000){candidates.push(yearMonth(term[2]-31*60000,terms),yearMonth(term[2]+31*60000,terms));boundary=true;}
      }catch(error){if(!error.message.includes('시각'))throw error;}
    }
  }
  if(!candidates.length)throw new Error('이 날짜의 지역 시각을 확인할 수 없어요. 출생 기록을 확인해 주세요.');
  const unique=key=>[...new Set(candidates.map(c=>c[key]))];
  const y=unique('year'),m=unique('month');
  const result={solar:iso,lunar:dateText(cal.getLunarCalendar()),leap:cal.getLunarCalendar().intercalation,
    pillars:{year:y.length===1?y[0]:null,month:m.length===1?m[0]:null,day:dayValue,hour:hourValue},
    candidates:{year:y,month:m},unknown:!known,boundary:boundary||y.length>1||m.length>1,
    dayElement:Math.floor(STEMS.indexOf(dayValue[0])/2),zone,utc:moment===null?null:new Date(moment).toISOString(),
    rules:'입춘·12절 / 현지 법정시 / 일주 00:00 변경 / 진태양시 보정 없음',
    source:'기존 astronomy-astrology 스킬 + Astronomy Engine 2.1.19 + Korean Lunar Calendar 0.4.0'};
  return result;
}
export function dailyRelation(chart,date){
  const pillar=dayPillar(date), stem=STEMS.indexOf(pillar[0]), element=Math.floor(stem/2);
  const diff=mod(element-chart.dayElement,5);
  return {index:diff,element,pillar,date,variant:mod(BRANCHES.indexOf(pillar[1])+STEMS.indexOf(chart.pillars.day[0]),3)};
}
