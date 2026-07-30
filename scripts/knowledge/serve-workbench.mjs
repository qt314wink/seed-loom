#!/usr/bin/env node
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root=process.cwd();
const built=spawnSync('node',['scripts/knowledge/build-workbench.mjs'],{stdio:'inherit'});
if(built.status!==0) process.exit(built.status??1);
const base=path.join(root,'tools','graph-workbench');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8'};
const server=http.createServer((req,res)=>{const name=req.url==='/'?'index.html':req.url.slice(1).split('?')[0];const file=path.resolve(base,name);if(!file.startsWith(base)||!fs.existsSync(file)){res.writeHead(404);return res.end('not found');}res.writeHead(200,{'content-type':types[path.extname(file)]??'application/octet-stream','cache-control':'no-store'});fs.createReadStream(file).pipe(res);});
const port=Number(process.env.SEED_LOOM_GRAPH_PORT??4177);
server.listen(port,'127.0.0.1',()=>console.log(`Graph Workbench: http://127.0.0.1:${port}`));