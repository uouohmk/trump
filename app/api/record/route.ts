const retired=()=>Response.json({error:'상담 정보 저장 기능은 종료했어요. 입력은 브라우저 안에서만 처리해요.'},{status:410,headers:{'Cache-Control':'no-store'}});
export const GET=retired;
export const POST=retired;
export const DELETE=retired;
