import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {build} from 'esbuild';
import {readFileSync,mkdirSync,readdirSync} from 'node:fs';
import {createSessionRecord,consultSession} from '../lib/session-reading.js';
mkdirSync('.qa',{recursive:true});
await build({stdin:{contents:"export * as record from './app/api/record/route.ts'; export * as consultation from './app/api/consultation/route.ts';",resolveDir:process.cwd(),loader:'ts'},outfile:'.qa/retired-api-test.mjs',bundle:true,platform:'node',format:'esm'});
const apis=await import('../.qa/retired-api-test.mjs');
const raw={year:1995,month:6,day:15,hour:12,minute:30,unknown:false,zone:'Asia/Seoul',guide:'dark'};

test('old APIs reject every read and write without touching the existing database',async()=>{
 const sqlite=new DatabaseSync(':memory:');
 for(const file of readdirSync('drizzle').filter(x=>x.endsWith('.sql')).sort())sqlite.exec(readFileSync('drizzle/'+file,'utf8'));
 sqlite.prepare('INSERT INTO profiles (owner_id, version, input, chart, guide, updated_at) VALUES (?, ?, ?, ?, ?, ?)').run('preserved-owner','version','{}','{}','dark','2026-09-13');
 const before=sqlite.prepare('SELECT * FROM profiles').all();
 for(const api of Object.values(apis))for(const method of ['GET','POST','DELETE']){
  const result=await api[method](new Request('https://test.local/api/record',{method,...(method==='POST'?{body:JSON.stringify(raw)}:{})}));
  assert.equal(result.status,410);assert.equal(result.headers.get('cache-control'),'no-store');
 }
 assert.deepEqual(sqlite.prepare('SELECT * FROM profiles').all(),before);sqlite.close();
});

test('birth, questions, group readings and tarot work with network and browser storage forbidden',()=>{
 const originalFetch=globalThis.fetch;
 globalThis.fetch=()=>{throw new Error('Unexpected network request');};
 for(const key of ['localStorage','sessionStorage','indexedDB'])Object.defineProperty(globalThis,key,{configurable:true,get(){throw new Error('Unexpected persistent storage');}});
 try{
  const profile=createSessionRecord(raw);
  assert.equal(profile.input.year,1995);assert.equal(profile.snapshot.topics.sky[1].insights.length,6);
  assert.ok(profile.snapshot.topics.saju.some(c=>c.title.includes('주의')));
  const question=consultSession(profile,{kind:'question',question:'오늘 고백해도 될까?'});
  assert.equal(question.result.cards[0].title,'연애와 마음');
  const group=consultSession(profile,{kind:'compatibility',people:[{...raw,name:'A'},{...raw,year:1998,name:'B'}]});
  assert.equal(group.result.cards.length,8);
  const tarot=consultSession(profile,{kind:'tarot',selection:1});assert.match(tarot.result.cards[0].image,/tarot\/\d{2}\.jpg$/);
  assert.equal('owner_id' in question,false);assert.equal('input' in question,false);
  assert.throws(()=>createSessionRecord({...raw,month:2,day:30}));
  assert.throws(()=>consultSession(profile,{kind:'compatibility',people:[]}));
  assert.throws(()=>consultSession(profile,{kind:'tarot',selection:3}));
 }finally{globalThis.fetch=originalFetch;for(const key of ['localStorage','sessionStorage','indexedDB'])delete globalThis[key];}
});

test('the standalone entry blocks requests and form submission, and has no account endpoints',()=>{
 const html=readFileSync('standalone/index.html','utf8');
 assert.match(html,/connect-src 'none'/);assert.match(html,/form-action 'none'/);
 for(const path of ['app/consultation.tsx','app/witch-activities.tsx','lib/session-reading.js']){
  const source=readFileSync(path,'utf8');
  assert.doesNotMatch(source,/fetch\s*\(|localStorage|sessionStorage|indexedDB|document\.cookie|sendBeacon|chatgpt-auth|from ['"]\.\.\/db/);
 }
 const source=readFileSync('app/consultation.tsx','utf8');assert.match(source,/pagehide/);assert.match(source,/pageshow/);
});
