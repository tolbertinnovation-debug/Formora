import { HttpError } from './validation.js';
export function authCookies(raw=''){return raw.split(';').map(s=>s.trim()).filter(s=>/^(?:__Secure-|__Host-)?(?:neon-auth|better-auth)\.[A-Za-z0-9_.-]+=/.test(s)).join('; ');}
export function authBase(){const value=process.env.NEON_AUTH_BASE_URL;if(!value)throw new Error('NEON_AUTH_BASE_URL is missing');const url=new URL(value);if(url.protocol!=='https:')throw new Error('Auth requires HTTPS');return value.replace(/\/$/,'');}
export async function requireUser(req){
  const cookie=authCookies(req.headers.cookie);if(!cookie)throw new HttpError(401,'Sign in to your workspace.');
  const response=await fetch(authBase()+'/get-session',{headers:{cookie},signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new HttpError(response.status>=500?503:401,'Your session has expired. Sign in again.');
  const data=await response.json();if(!data?.user?.id||!data?.session||data.user.banned)throw new HttpError(401,'Sign in to your workspace.');
  return {id:String(data.user.id),emailVerified:data.user.emailVerified===true};
}
