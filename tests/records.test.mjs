import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {build} from 'esbuild';
import {readFileSync,mkdirSync,readdirSync} from 'node:fs';
import {validateBirth,makeSnapshot} from '../lib/consultation.js';
import {signTransit,compatibilityCards,questionIntent} from '../lib/fortune.js';
mkdirSync('.qa',{recursive:true});
await build({stdin:{contents:"export * as record from './app/api/record/route.ts'; export * as consultation from './app/api/consultation/route.ts';",resolveDir:process.cwd(),loader:'ts'},outfile:'.qa/api-test.mjs',bundle:true,platform:'node',format:'esm',plugins:[{name:'local-test-only',setup(b){
 b.onResolve({filter:/cloudflare:workers/},()=>({path:'cloudflare',namespace:'test'}));
 b.onResolve({filter:/chatgpt-auth$/},()=>({path:'auth',namespace:'test'}));
 b.onLoad({filter:/.*/,namespace:'test'},args=>({contents:args.path==='auth'?'export async function getChatGPTUser(){return globalThis.__testIdentity;}':'export const env={get DB(){return globalThis.__testDatabase;}};'}));
}}]});
const {record:api,consultation:consultationApi}=await import('../.qa/api-test.mjs');
const sqlite=new DatabaseSync(':memory:');
for(const file of readdirSync('drizzle').filter(x=>x.endsWith('.sql')).sort())sqlite.exec(readFileSync('drizzle/'+file,'utf8'));
globalThis.__testDatabase={prepare(sql){const statement=sqlite.prepare(sql);return {bind(...args){return {first:async()=>statement.get(...args)||null,all:async()=>({results:statement.all(...args)}),run:async()=>statement.run(...args),sql,args};}};},async batch(statements){sqlite.exec('BEGIN');try{const results=statements.map(s=>sqlite.prepare(s.sql).run(...s.args));sqlite.exec('COMMIT');return results;}catch(e){sqlite.exec('ROLLBACK');throw e;}}};
const raw={year:1995,month:6,day:15,hour:12,minute:30,unknown:false,zone:'Asia/Seoul',guide:'dark'};
const req=(body=raw,origin='https://test.local')=>new Request('https://test.local/api/record',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
test('anonymous APIs reject both reads and writes',async()=>{globalThis.__testIdentity=null;assert.equal((await api.GET()).status,401);assert.equal((await api.POST(req())).status,401);});
test('account-owned records persist and never expose another account',async()=>{
 globalThis.__testIdentity={userId:'test-a'};
 assert.equal((await api.POST(req(raw,'https://other.local'))).status,403);
 const saved=await (await api.POST(req())).json();assert.equal(saved.record.input.year,1995);assert.ok(saved.record.snapshot.topics.sky.length>3);
 const again=await (await api.GET()).json();assert.deepEqual(again.record,saved.record);assert.match((await api.GET()).headers.get('cache-control'),/no-store/);
 globalThis.__testIdentity={userId:'test-b'};assert.deepEqual(await (await api.GET()).json(),{record:null});
 await api.POST(req({...raw,year:2001,ownerId:'test-a',guide:'blonde'}));
 const b=await (await api.GET()).json();assert.equal(b.record.input.year,2001);
 globalThis.__testIdentity={userId:'test-a'};assert.equal((await (await api.GET()).json()).record.input.year,1995);
 const bad=await api.POST(req({...raw,month:2,day:30}));assert.equal(bad.status,400);assert.equal((await (await api.GET()).json()).record.version,saved.record.version);
 await api.DELETE(new Request('https://test.local/api/record',{method:'DELETE',headers:{Origin:'https://test.local'}}));assert.deepEqual(await (await api.GET()).json(),{record:null});
 globalThis.__testIdentity={userId:'test-b'};assert.equal((await (await api.GET()).json()).record.input.year,2001);
});
test('stored daily output is stable; unknown hour stays unset; map has real coordinates',()=>{
 const {chart}=validateBirth({...raw,unknown:true});assert.equal(chart.pillars.hour,null);
 const before=makeSnapshot(chart,'2026-09-13'),again=makeSnapshot(chart,'2026-09-13'),after=makeSnapshot(chart,'2026-09-14');assert.deepEqual(before,again);assert.notDeepEqual(before,after);
 const sun=makeSnapshot(chart,'2026-09-13').topics.sky.find(c=>c.kind==='map').planets[0];assert.ok(sun.longitude>169&&sun.longitude<171);
 assert.equal(Object.keys(before.topics).length,5);for(const cards of Object.values(before.topics))for(const c of cards){assert.ok(c.title&&c.text);assert.ok(!/불행|재앙|사고가|저주|확률\s*\d/.test(c.text));}
});
test('questions, tarot and group compatibility are validated, saved and owner-scoped',async()=>{
 const request=body=>new Request('https://test.local/api/consultation',{method:'POST',headers:{Origin:'https://test.local','Content-Type':'application/json'},body:JSON.stringify(body)});
 globalThis.__testIdentity=null;assert.equal((await consultationApi.GET()).status,401);assert.equal((await consultationApi.POST(request({kind:'question',question:'오늘은?'}))).status,401);
 globalThis.__testIdentity={userId:'test-b'};
 const response=await consultationApi.POST(request({kind:'question',question:'오늘 고백해도 될까?',intent:'overall'}));assert.equal(response.status,200);
 const story=(await response.json()).item;assert.equal(story.result.cards[0].title,'연애와 마음');assert.ok(story.result.cards.some(c=>c.title==='행운의 아이템'));assert.ok(story.result.cards.some(c=>c.title==='오늘의 주의점'));
 const group=await consultationApi.POST(request({kind:'compatibility',relationship:'친구',people:[{...raw,name:'A'},{...raw,year:1998,name:'B'}]}));assert.equal(group.status,200);assert.equal((await group.json()).item.result.cards.length,8);
 assert.equal((await consultationApi.POST(request({kind:'compatibility',people:[]}))).status,400);
 assert.equal((await consultationApi.POST(request({kind:'compatibility',people:Array(6).fill(raw)}))).status,400);
 assert.equal((await consultationApi.POST(request({kind:'compatibility',people:[{...raw,month:2,day:30}]}))).status,400);
 const tarot=await consultationApi.POST(request({kind:'tarot',question:'지금 할 일은?',selection:1}));assert.equal(tarot.status,200);assert.match((await tarot.json()).item.result.cards[0].image,/\/tarot\/\d{2}\.jpg$/);
 assert.equal((await consultationApi.POST(request({kind:'tarot',selection:3}))).status,400);
 const saved=(await (await consultationApi.GET()).json()).items;assert.equal(saved.length,3);assert.ok(saved.some(x=>x.id===story.id));
 globalThis.__testIdentity={userId:'other-account'};assert.deepEqual((await (await consultationApi.GET()).json()).items,[]);
 globalThis.__testIdentity={userId:'test-b'};
 await api.DELETE(new Request('https://test.local/api/record',{method:'DELETE',headers:{Origin:'https://test.local'}}));assert.deepEqual((await (await consultationApi.GET()).json()).items,[]);
});
test('planetary aspect rules respond to actual angular differences and all card art exists',()=>{
 assert.equal(signTransit(0,[{name:'금성',longitude:15}]).phase,0);
 assert.equal(signTransit(0,[{name:'금성',longitude:105}]).phase,2);
 assert.equal(signTransit(0,[{name:'금성',longitude:40}]).phase,1);
 for(let i=0;i<22;i++)assert.ok(readFileSync(`public/assets/tarot/${String(i).padStart(2,'0')}.jpg`).length>1000);
 const lines=JSON.parse(readFileSync('public/assets/zodiac-lines.json','utf8'));assert.equal(Object.keys(lines).length,12);for(const constellation of Object.values(lines))assert.ok(constellation.flat().length>=3);
 const people=Array.from({length:6},(_,i)=>({name:String(i),chart:validateBirth({...raw,year:1990+i}).chart}));assert.equal(compatibilityCards(people).length,32);
 assert.equal(questionIntent('시험에 합격할까?'),'work');assert.equal(questionIntent('주식 사도 될까?'),'highstakes');
});
