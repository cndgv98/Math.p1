import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import http from 'node:http';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'pages-dist');
const html=fs.readFileSync(path.join(output,'index.html'),'utf8');
assert(html.includes('<html lang="vi">'),'Missing Vietnamese document');
assert(html.includes('id="app"'),'Missing application mount');
assert(fs.existsSync(path.join(output,'.nojekyll')),'Missing .nojekyll');
assert.deepEqual(fs.readdirSync(output).sort(),['.nojekyll','index.html'],'Deploy only generated public assets; unexpected file in pages-dist');
assert(!/<(?:link|script)\b[^>]*(?:src|href)=["']\.?\.?\//i.test(html),'Standalone artifact still depends on local assets');
assert(!/(?:src|href)=["']\/(?!\/)/i.test(html),'Root-absolute asset paths fail on repository Pages');
assert(!/<base\b/i.test(html),'Unexpected base URL overrides repository paths');
assert(!html.includes('file:///'),'Local filesystem URL in artifact');
assert(!/\bfrom\s*['"]\.\.?\//.test(html),'Unbundled module import');

// A build must retain application state compatibility and the exact application
// source semantics. This check never reads or writes browser localStorage.
const source=fs.readFileSync(path.join(root,'data.js'),'utf8');
const key=source.match(/const KEY\s*=\s*(['"])(.*?)\1/);
assert(key&&html.includes(`const KEY=${key[1]}${key[2]}${key[1]}`),'Storage key changed while bundling');
assert(html.includes('dtd-math-demo-v1'),'Existing demo storage compatibility');
assert(html.includes('dtd-math-backup-v1'),'Existing backup format compatibility');
assert(html.includes('window.APP_CONFIG'),'Missing runtime configuration');
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'config.js'),'utf8'),context);
const config=context.window.APP_CONFIG;
assert(config&&typeof config.supabaseUrl==='string'&&typeof config.supabaseKey==='string','Invalid APP_CONFIG');
assert(Boolean(config.supabaseUrl)===Boolean(config.supabaseKey),'Configure both URL and publishable/anon key, or leave both empty');
if(config.supabaseUrl)assert(/^https:\/\/[^/]+\/?$/.test(config.supabaseUrl),'Supabase URL must use HTTPS and have no path');
assert(!config.supabaseKey.startsWith('sb_secret_'),'Secret key must never be deployed');
if(config.supabaseKey.split('.').length===3){
  const payload=JSON.parse(Buffer.from(config.supabaseKey.split('.')[1],'base64url').toString());
  assert(payload.role==='anon','Only anon JWT key may be published');
}

// Smoke test identical bytes at / and /Math.p1/, including an actual HTTP request.
// Deliberately no SPA fallback: unknown paths remain 404, as on GitHub Pages.
const routes=new Map([['/',html],['/index.html',html],['/Math.p1/',html],['/Math.p1/index.html',html]]);
const server=http.createServer((req,res)=>{const body=routes.get(new URL(req.url,'http://localhost').pathname);res.writeHead(body==null?404:200,{'Content-Type':'text/html; charset=utf-8'});res.end(body??'Not found');});
try{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}`;
 for(const route of routes.keys()){
  const response=await fetch(base+route);assert.equal(response.status,200);assert.equal(await response.text(),html);
 }
 assert.equal((await fetch(base+'/Math.p1/backend/schema.sql')).status,404);
 assert.equal((await fetch(base+'/Math.p1/unknown')).status,404);
 console.log('PASS: artifact layout, config, storage compatibility, root/subpath HTTP, no backend exposed.');
 console.log(config.supabaseUrl?'Mode: Supabase configured (network login not tested).':'Mode: demo; configure Supabase to use live accounts.');
}finally{await new Promise(resolve=>server.close(resolve));}
