import {getChatGPTUser} from '../../chatgpt-auth';
import {consult,listConsultations} from '../../../db/consultations';
export const dynamic='force-dynamic';
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
export async function GET(){const user=await getChatGPTUser();if(!user)return json({error:'로그인이 필요해요.'},401);try{return json({items:await listConsultations(user.userId)});}catch{return json({error:'지난 이야기를 불러오지 못했어요.'},503);}}
export async function POST(request:Request){
 const user=await getChatGPTUser();if(!user)return json({error:'로그인이 필요해요.'},401);
 if(request.headers.get('origin')!==new URL(request.url).origin)return json({error:'이 페이지에서 다시 시도해 주세요.'},403);
 if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'입력 형식을 확인해 주세요.'},415);
 try{const text=await request.text();if(text.length>8192)return json({error:'입력 내용이 너무 길어요.'},413);let raw;try{raw=JSON.parse(text);}catch{return json({error:'입력 내용을 확인해 주세요.'},400);}return json({item:await consult(user.userId,raw)});}
 catch(error){const message=error instanceof Error?error.message:'';if(/[가-힣]/.test(message))return json({error:message},400);console.error('consultation_failed');return json({error:'이야기를 저장하지 못했어요. 입력은 남겨 두었으니 다시 시도해 주세요.'},503);}
}
