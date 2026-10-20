import { createServer } from 'node:http';
import { createServer as createViteServer } from 'vite';
import forms from './api/forms.js';
import responses from './api/responses.js';
import publicForm from './api/public.js';
import auth from './api/auth/[...path].js';
const args=process.argv.slice(2),port=Number(args[args.indexOf('--port')+1])||4173;
const vite=await createViteServer({server:{middlewareMode:true,allowedHosts:['terminal.local','localhost']},appType:'spa'});
const server=createServer(async(req,res)=>{
  const path=new URL(req.url,'http://localhost').pathname;
  const handler=path.startsWith('/api/auth/')?auth:({'/api/forms':forms,'/api/responses':responses,'/api/public':publicForm})[path];
  if(!handler){vite.middlewares(req,res);return;}
  res.status=code=>{res.statusCode=code;return res;};res.json=value=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value));};res.send=value=>res.end(value);
  let raw='';try{for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>110000){res.status(413).json({error:'Request is too large.'});return;}}req.body=raw||undefined;await handler(req,res);}catch{res.status(500).json({error:'Development service unavailable.'});}
});
server.listen(port,'0.0.0.0',()=>console.log(`Formora preview on port ${port}`));
