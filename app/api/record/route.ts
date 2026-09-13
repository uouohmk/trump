import {getChatGPTUser} from '../../chatgpt-auth';
import {loadRecord,saveRecord,deleteRecord} from '../../../db/records';
export const dynamic='force-dynamic';
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie'}});
export async function GET(){
 const user=await getChatGPTUser();if(!user)return json({error:'로그인이 필요해요.'},401);
 try{return json({record:await loadRecord(user.userId)});}catch{console.error('record_load_failed');return json({error:'기록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'},503);}
}
async function write(request:Request,remove=false){
 const user=await getChatGPTUser();if(!user)return json({error:'로그인이 필요해요.'},401);
 if(request.headers.get('origin')!==new URL(request.url).origin)return json({error:'이 페이지에서 다시 시도해 주세요.'},403);
 if(remove){try{await deleteRecord(user.userId);return json({deleted:true});}catch{return json({error:'지우지 못했어요. 다시 시도해 주세요.'},503);}}
 if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'입력 형식을 확인해 주세요.'},415);
 let raw;try{const text=await request.text();if(text.length>4096)return json({error:'입력 내용이 너무 길어요.'},413);raw=JSON.parse(text);}catch{return json({error:'입력 내용을 확인해 주세요.'},400);}
 try{return json({record:await saveRecord(user.userId,raw)});}catch(error){
   const message=error instanceof Error?error.message:'';
   if(/[가-힣]/.test(message))return json({error:message},400);
   console.error('record_save_failed');return json({error:'저장하지 못했어요. 입력은 남겨 두었으니 다시 시도해 주세요.'},503);
 }
}
export async function POST(request:Request){return write(request);}
export async function DELETE(request:Request){return write(request,true);}
