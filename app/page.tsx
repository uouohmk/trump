import {getChatGPTUser,chatGPTSignInPath,chatGPTSignOutPath} from './chatgpt-auth';
import Consultation from './consultation';
export const dynamic='force-dynamic';
export default async function Home(){
 const user=await getChatGPTUser();
 return <Consultation signedIn={!!user} signIn={chatGPTSignInPath('/?enter=1')} signOut={chatGPTSignOutPath('/')} />;
}
