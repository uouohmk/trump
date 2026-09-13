import {env} from 'cloudflare:workers';
import {makeSnapshot,validateBirth,SNAPSHOT_VERSION} from '../lib/consultation.js';
import {koreanDate} from '../lib/engine.js';
export function db(){if(!env.DB)throw new Error('Database unavailable');return env.DB;}
export async function loadRecord(owner:string){
 const database=db();
 const profile=await database.prepare('SELECT version, input, chart, guide FROM profiles WHERE owner_id = ?').bind(owner).first<{version:string,input:string,chart:string,guide:string}>();
 if(!profile)return null;
 const date=koreanDate();
 let row=await database.prepare('SELECT payload FROM readings WHERE owner_id = ? AND profile_version = ? AND day = ?').bind(owner,profile.version,date).first<{payload:string}>();
 if(row&&JSON.parse(row.payload).version!==SNAPSHOT_VERSION){
   const payload=JSON.stringify(makeSnapshot(JSON.parse(profile.chart),date));
   await database.prepare('UPDATE readings SET payload = ? WHERE owner_id = ? AND profile_version = ? AND day = ?').bind(payload,owner,profile.version,date).run();row={payload};
 }
 if(!row){
   const payload=JSON.stringify(makeSnapshot(JSON.parse(profile.chart),date));
   await database.prepare('INSERT OR IGNORE INTO readings (owner_id, profile_version, day, payload) SELECT ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM profiles WHERE owner_id = ? AND version = ?)').bind(owner,profile.version,date,payload,owner,profile.version).run();
   row={payload};
 }
 return {version:profile.version,input:JSON.parse(profile.input),chart:JSON.parse(profile.chart),guide:profile.guide,snapshot:JSON.parse(row.payload)};
}
export async function saveRecord(owner:string,raw:unknown){
 const value=validateBirth(raw),version=crypto.randomUUID(),now=new Date().toISOString(),date=koreanDate();
 const payload=JSON.stringify(makeSnapshot(value.chart,date)),database=db();
 await database.batch([
   database.prepare('INSERT INTO profiles (owner_id, version, input, chart, guide, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(owner_id) DO UPDATE SET version=excluded.version, input=excluded.input, chart=excluded.chart, guide=excluded.guide, updated_at=excluded.updated_at').bind(owner,version,JSON.stringify(value.input),JSON.stringify(value.chart),value.guide,now),
   database.prepare('DELETE FROM readings WHERE owner_id = ?').bind(owner),
   database.prepare('INSERT INTO readings (owner_id, profile_version, day, payload) VALUES (?, ?, ?, ?)').bind(owner,version,date,payload),
 ]);
 return {version,...value,snapshot:JSON.parse(payload)};
}
export async function deleteRecord(owner:string){const database=db();await database.batch([database.prepare('DELETE FROM readings WHERE owner_id = ?').bind(owner),database.prepare('DELETE FROM consultations WHERE owner_id = ?').bind(owner),database.prepare('DELETE FROM profiles WHERE owner_id = ?').bind(owner)]);}
