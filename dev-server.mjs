// Local development server; use a managed static host for public deployment.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
const root=process.cwd(), args=process.argv.slice(2);
const port=Number(args[args.indexOf('--port')+1])||4173;
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.md':'text/plain'};
createServer(async(req,res)=>{
  try {
    const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file=resolve(root,'.'+(path==='/'?'/index.html':path));
    if(!file.startsWith(root+'/')||path.split('/').some(part=>part.startsWith('.'))){res.writeHead(403);res.end('Forbidden');return;}
    const data=await readFile(file);
    res.writeHead(200,{'Content-Type':(mime[extname(file)]||'application/octet-stream')+'; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(data);
  }catch{res.writeHead(404);res.end('Not found');}
}).listen(port,'0.0.0.0',()=>console.log(`Formora preview on port ${port}`));
