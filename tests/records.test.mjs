import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {build} from 'esbuild';
import {readFileSync,mkdirSync} from 'node:fs';
import {validateBirth,makeSnapshot} from '../lib/consultation.js';
mkdirSync('.qa',{recursive:true});
await build({entryPoints:['app/api/record/route.ts'],outfile:'.qa/api-test.mjs',bundle:true,platform:'node',format:'esm',plugins:[{name:'local-test-only',setup(b){
 b.onResolve({filter:/cloudflare:workers/},()=>({path:'cloudflare',namespace:'test'}));
 b.onResolve({filter:/chatgpt-auth$/},()=>({path:'auth',namespace:'test'}));
 b.onLoad({filter:/.*/,namespace:'test'},args=>({contents:args.path==='auth'?'export async function getChatGPTUser(){return globalThis.__testIdentity;}':'export const env={get DB(){return globalThis.__testDatabase;}};'}));
}}]});
const api=await import('../.qa/api-test.mjs');
const sqlite=new DatabaseSync(':memory:');
sqlite.exec(readFileSync('drizzle/0000_flawless_cassandra_nova.sql','utf8'));
globalThis.__testDatabase={prepare(sql){const statement=sqlite.prepare(sql);return {bind(...args){return {first:async()=>statement.get(...args)||null,run:async()=>statement.run(...args),sql,args};}};},async batch(statements){sqlite.exec('BEGIN');try{const results=statements.map(s=>sqlite.prepare(s.sql).run(...s.args));sqlite.exec('COMMIT');return results;}catch(e){sqlite.exec('ROLLBACK');throw e;}}};
const raw={year:1995,month:6,day:15,hour:12,minute:30,unknown:false,zone:'Asia/Seoul',guide:'dark'};
const req=(body=raw,origin='https://test.local')=>new Request('https://test.local/api/record',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
test('anonymous APIs reject both reads and writes',async()=>{globalThis.__testIdentity=null;assert.equal((await api.GET()).status,401);assert.equal((await api.POST(req())).status,401);});
test('account-owned records persist and never expose another account',async()=>{
 globalThis.__testIdentity={userId:'test-a'};
 assert.equal((await api.POST(req(raw,'https://other.local'))).status,403);
 const saved=await (await api.POST(req())).json();assert.equal(saved.record.input.year,1995);assert.equal(saved.record.snapshot.topics.sky.length,3);
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
 const sun=makeSnapshot(chart,'2026-09-13').topics.sky[1].planets[0];assert.ok(sun.longitude>169&&sun.longitude<171);
 assert.equal(Object.keys(before.topics).length,5);for(const cards of Object.values(before.topics))for(const c of cards){assert.ok(c.title&&c.text);assert.ok(!/불행|재앙|사고가|저주|확률\s*\d/.test(c.text));}
});
