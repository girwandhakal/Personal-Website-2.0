const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
require('dotenv').config({path:path.resolve(__dirname,'../.env.local'),quiet:true});
const root = path.resolve(__dirname, '../retro');
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.pdf':'application/pdf'};
http.createServer(async (req,res) => {
  try {
    const url=new URL(req.url,'http://localhost:3000');
    if(url.pathname==='/api/leaderboard') {
      const chunks=[];let length=0;
      for await(const chunk of req){length+=chunk.length;if(length>150000){res.writeHead(413);return res.end('Request too large');}chunks.push(chunk);}
      const handler=(await import('../retro/api/leaderboard.mjs')).default;
      const headers=new Headers();for(const [key,value] of Object.entries(req.headers))if(value)headers.set(key,Array.isArray(value)?value.join(','):value);
      headers.set('x-forwarded-for','127.0.0.1');
      const request=new Request(url,{method:req.method,headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})});
      const response=await handler.fetch(request);
      res.writeHead(response.status,Object.fromEntries(response.headers));return res.end(Buffer.from(await response.arrayBuffer()));
    }
    if(url.pathname.startsWith('/api/')||url.pathname.includes('/node_modules/')){res.writeHead(404);return res.end('Not found');}
    const pathname = decodeURIComponent(url.pathname);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end('Forbidden'); }
    const body = await fs.readFile(file);
    res.writeHead(200, {'Content-Type':types[path.extname(file)] || 'application/octet-stream'}); res.end(body);
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(3000, '127.0.0.1', () => console.log('Retro site: http://localhost:3000'));
