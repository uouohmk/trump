import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {calculateChart,dayPillar,dailyRelation,koreanDate,nextMidnight,localToUTC,yearMonth} from '../lib/engine.js';
import {THEMES,readingFor} from '../lib/readings.js';
const terms=JSON.parse(fs.readFileSync(new URL('../public/assets/solar-terms.json',import.meta.url))).terms;
const fixtures=JSON.parse(fs.readFileSync(new URL('./python-fixtures.json',import.meta.url)));
const birth={year:1995,month:6,day:15,hour:12,minute:30,unknown:false,zone:'Asia/Seoul',calendar:'solar'};
const now=new Date('2026-09-13T03:00:00Z');
test('75 actual charts match the previously verified Python skill, including Korean historical offsets',()=>{
 for(const f of fixtures){const [d,t]=f.local.split('T'),[year,month,day]=d.split('-').map(Number),[hour,minute]=t.split(':').map(Number);
  const result=calculateChart({year,month,day,hour,minute,unknown:false,zone:f.zone},terms,new Date('2027-01-01T00:00:00Z'));
  assert.deepEqual(result.pillars,f.pillars,f.local);
 }
});
test('daily cycle changes at Korean midnight, not 23:00 or browser local midnight',()=>{
 const before=new Date('2026-09-13T14:59:59.999Z'),after=new Date('2026-09-13T15:00:00Z');
 assert.equal(koreanDate(before),'2026-09-13');assert.equal(koreanDate(after),'2026-09-14');
 assert.equal(nextMidnight(before),after.getTime());assert.notEqual(dayPillar(koreanDate(before)),dayPillar(koreanDate(after)));
 assert.equal(koreanDate(new Date('2026-09-13T14:00:00Z')),'2026-09-13');
});
test('same birth and date produces same result; adjacent day changes recorded cycle',()=>{
 const c=calculateChart(birth,terms,now),a=dailyRelation(c,'2026-09-13');
 assert.deepEqual(readingFor(a),readingFor(dailyRelation(c,'2026-09-13')));
 assert.notEqual(a.pillar,dailyRelation(c,'2026-09-14').pillar);
});
test('midnight birth day rule also used at 23:30',()=>{
 const c=calculateChart({...birth,year:2017,month:6,day:24,hour:23,minute:30},terms,now);
 assert.equal(c.pillars.day,'壬午');assert.equal(c.pillars.hour,'庚子');
});
test('Korean lunar leap month converts to known public example',()=>{
 const c=calculateChart({...birth,year:2017,month:5,day:1,calendar:'lunar',leap:true},terms,now);
 assert.equal(c.solar,'2017-06-24');assert.equal(c.pillars.day,'壬午');
 assert.throws(()=>calculateChart({...birth,year:2017,month:3,day:1,calendar:'lunar',leap:true},terms,now));
});
test('missing time never produces an hour; term day retains uncertain year and month',()=>{
 const c=calculateChart({...birth,unknown:true},terms,now);assert.equal(c.pillars.hour,null);assert.equal(c.utc,null);
 const edge=calculateChart({...birth,year:2026,month:2,day:4,unknown:true},terms,now);
 assert.equal(edge.pillars.year,null);assert.equal(edge.pillars.month,null);assert.equal(edge.boundary,true);
});
test('spring boundary uses actual UTC instant',()=>{
 const t=terms['2026'][2][2];assert.deepEqual(yearMonth(t-3600000,terms),{year:'乙巳',month:'己丑'});
 assert.deepEqual(yearMonth(t+3600000,terms),{year:'丙午',month:'庚寅'});
 const c=calculateChart({...birth,year:2026,month:2,day:4,hour:5,minute:2},terms,now);assert.equal(c.boundary,true);
});
test('invalid date, future date, missing number and invalid time rejected',()=>{
 for(const patch of [{month:2,day:30},{year:2040},{year:NaN},{hour:24},{minute:60},{calendar:'made-up'}])assert.throws(()=>calculateChart({...birth,...patch},terms,now));
});
test('DST overlap and nonexistent times cannot silently select a result',()=>{
 assert.throws(()=>localToUTC({year:2024,month:3,day:10,hour:2,minute:30},'America/New_York'));
 assert.throws(()=>localToUTC({year:2024,month:11,day:3,hour:1,minute:30},'America/New_York'));
});
test('all five relation paths contain six actionable perspectives, no fortune probabilities',()=>{
 assert.equal(THEMES.length,5);
 for(const theme of THEMES){assert.equal(theme.cards.length,6);assert.equal(theme.quests.length,3);for(const card of theme.cards){assert.equal(card.length,3);assert.ok(card.every(Boolean));}}
 const text=JSON.stringify(THEMES);assert.doesNotMatch(text,/사망|재앙|저주|파산|반드시.*(?:헤어|이혼)|적중률|성공 확률 [0-9]/);
});
