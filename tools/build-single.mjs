import fs from 'node:fs';import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const args=process.argv.slice(2);
if(args.length&&!(args.length===2&&args[0]==='--out-dir'))throw Error('Usage: node tools/build-single.mjs [--out-dir pages-dist]');
const outName=args[1]??'dist';
if(!['dist','pages-dist'].includes(outName))throw Error('Output must be dist or pages-dist');
function moduleWrap(file,name,prelude=''){
 const source=read(file),exports=[...source.matchAll(/export\s+(?:async\s+)?(?:function|const|let)\s+(\w+)/g)].map(m=>m[1]);
 return `const ${name}=(()=>{\n${prelude}\n${source.replace(/^import .*;\r?\n/gm,'').replace(/\bexport\s+/g,'')}\nreturn {${exports.join(',')}};})();\n`;
}
const core=moduleWrap('core.js','Core'),demo=moduleWrap('demo.js','Demo'),data=moduleWrap('data.js','Data','const {makeDemo}=Demo;');
let app=read('app.js').replace(/^import .*;\r?\n/gm,'');
app=`const {esc:e,num,STATUS,stats,rankRows,quartiles,groupedQuartiles,quartileGroup,parseScore,previewImport,csvParse,correlation}=Core; const api=Data;\n`+app;
const js=core+demo+data+app;
let html=read('index.html').replace('<link rel="stylesheet" href="./style.css">',`<style>\n${read('style.css')}\n</style>`).replace('<script src="./config.js"></script>',`<script>\n${read('config.js')}\n</script>`).replace('<script type="module" src="./app.js"></script>',`<script type="module">\n${js}\n</script>`);
fs.mkdirSync(path.join(root,outName),{recursive:true});fs.writeFileSync(path.join(root,outName,'index.html'),html);console.log(`Built ${outName}/index.html — standalone browser app`);
if(outName==='pages-dist')fs.writeFileSync(path.join(root,outName,'.nojekyll'),'');
