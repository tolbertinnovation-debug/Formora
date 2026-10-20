import { authBase,authCookies } from '../../server/auth.js';
import { endpoint,guard,body,origin } from '../../server/http.js';
import { HttpError } from '../../server/validation.js';
const allowed=new Set(['get-session','sign-up/email','sign-in/email','sign-out','request-password-reset','reset-password','send-verification-email','email-otp/send-verification-otp','email-otp/verify-email']);
export default endpoint(async(req,res)=>{
  guard(req,['GET','POST']);
  const path=new URL(req.url,'https://localhost').pathname.replace(/^\/api\/auth\//,'');
  if(!allowed.has(path))throw new HttpError(404,'Authentication route not found.');
  if(req.method==='GET'&&path!=='get-session')throw new HttpError(405,'Use POST.');
  const cookie=authCookies(req.headers.cookie);
  if(path==='get-session'&&!cookie){res.setHeader('Cache-Control','no-store');return res.status(200).json(null);}
  const input=req.method==='POST'?body(req,16000):undefined;
  for(const key of ['callbackURL','redirectTo'])if(input?.[key]&&new URL(input[key],origin(req)).origin!==origin(req))throw new HttpError(400,'Invalid redirect address.');
  const upstream=await fetch(authBase()+'/'+path,{method:req.method,headers:{'content-type':'application/json','x-neon-auth-middleware':'true',origin:origin(req),...(cookie?{cookie}:{})},...(input?{body:JSON.stringify(input)}:{}),redirect:'manual',signal:AbortSignal.timeout(15000)});
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  const cookies=upstream.headers.getSetCookie();if(cookies.length)res.setHeader('Set-Cookie',cookies.map(cookie=>cookie.replace(/;\s*Domain=[^;]+/ig,'').replace(/;\s*Path=[^;]+/ig,'; Path=/').replace(/SameSite=None/ig,'SameSite=Lax')));
  res.setHeader('Content-Type','application/json');res.status(upstream.status).send(await upstream.text());
});
