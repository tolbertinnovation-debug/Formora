import { HttpError } from './validation.js';
export function origin(req){return `${process.env.VERCEL?'https':'http'}://${req.headers.host}`;}
export function json(res,status,body){res.setHeader('Cache-Control','no-store, private');res.setHeader('X-Content-Type-Options','nosniff');return res.status(status).json(body);}
export function guard(req,methods){if(!methods.includes(req.method))throw new HttpError(405,'Method not allowed.');if(req.method!=='GET'&&req.method!=='HEAD'){
  if(!String(req.headers['content-type']||'').startsWith('application/json'))throw new HttpError(415,'Use application/json.');
  const from=req.headers.origin;if(from&&from!==origin(req))throw new HttpError(403,'Request origin is not allowed.');
}}
export function body(req,max=100000){let value=req.body;if(typeof value==='string'){if(Buffer.byteLength(value)>max)throw new HttpError(413,'Request is too large.');try{value=JSON.parse(value);}catch{throw new HttpError(400,'Invalid JSON.');}}
  if(!value||typeof value!=='object'||Array.isArray(value)||Buffer.byteLength(JSON.stringify(value))>max)throw new HttpError(400,'Invalid or oversized request.');return value;}
export function endpoint(fn){return async(req,res)=>{try{await fn(req,res);}catch(error){const status=error.status||500;if(status>=500)console.error('Formora API failure',{code:error.code||'INTERNAL_ERROR'});json(res,status,{error:status>=500?'The service is temporarily unavailable. Please try again.':error.message,...(error.details?{details:error.details}:{})});}};}
