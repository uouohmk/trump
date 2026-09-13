import test from 'node:test';
import assert from 'node:assert/strict';
import {aspectAt,natalSunRange,planetReadings,focusReading} from '../lib/celestial-reading.js';
import {tenGod,sajuDailyCards} from '../lib/saju-guidance.js';
import {makeSnapshot,validateBirth} from '../lib/consultation.js';
import {STEMS} from '../lib/engine.js';
import {fortuneCards} from '../lib/fortune.js';

test('angles wrap at 360; conjunction is focus, not automatically good; orb boundaries are inclusive',()=>{
 assert.equal(aspectAt(1,359).status,'focus');
 assert.equal(aspectAt(60,0).status,'support');
 assert.equal(aspectAt(120,0).status,'support');
 assert.equal(aspectAt(90,0).status,'adjust');
 assert.equal(aspectAt(180,0).status,'adjust');
 assert.equal(aspectAt(66,0).status,'support');
 assert.equal(aspectAt(66.01,0).status,'quiet');
});
const birth={year:1995,month:6,day:15,hour:12,minute:30,unknown:false,zone:'Asia/Seoul'};
test('every planet carries a distinct domain and uses the natal Sun, including unknown-time uncertainty',()=>{
 const chart=validateBirth(birth).chart,[sun]=natalSunRange(chart);
 const names=['태양','달','수성','금성','화성','목성'];
 const readings=planetReadings(chart,names.map(name=>({name,symbol:'',longitude:(sun+120)%360})));
 assert.equal(new Set(readings.map(p=>p.domain)).size,6);
 assert.ok(readings.every(p=>p.status==='support'));
 assert.equal(focusReading(readings,'love').name,'달');
 const money=fortuneCards(chart,2,[{name:'금성',longitude:(sun+120)%360}],'2026-09-13','오늘 지출을 줄이려면?','money');
 assert.match(money[1].text,/할인|지출|물건/);assert.doesNotMatch(money[1].text,/안부|가까워져/);
 const unknown=validateBirth({...birth,unknown:true}).chart;
 const range=natalSunRange(unknown);
 assert.ok(range[1]>range[0]&&range[1]-range[0]<1.2);
 const crossing=planetReadings(unknown,[{name:'수성',longitude:(range[0]+range[1])/2+66}])[0];
 assert.equal(crossing.status,'uncertain');assert.equal(crossing.angle,null);assert.equal(crossing.orb,null);
});
test('ten gods depend on both elemental direction and polarity; advice contains practical follow-through',()=>{
 const expected=['비견','겁재','식신','상관','편재','정재','편관','정관','편인','정인'];
 assert.deepEqual([...STEMS].map(stem=>tenGod('甲',stem).name),expected);
 assert.equal(tenGod('乙','庚').name,'정관');assert.equal(tenGod('乙','辛').name,'편관');
 assert.equal(tenGod('庚','甲').name,'편재');
 const chart=validateBirth(birth).chart;
 const cards=sajuDailyCards(chart,'2026-09-13');
 assert.ok(cards.some(c=>c.title.includes('일과 공부')));assert.ok(cards.some(c=>c.title.includes('주의')));
 assert.notEqual(cards[0].basis.tenGod,sajuDailyCards(chart,'2026-09-14')[0].basis.tenGod);
 const snapshot=makeSnapshot(chart,'2026-09-13');
 assert.equal(snapshot.topics.sky[1].kind,'map');assert.equal(snapshot.topics.sky[1].insights.length,6);
 assert.equal(snapshot.topics.saju[0].basis.date,'2026-09-13');
});
