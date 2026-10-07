// Run before deploying: node scripts/release.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const publicFiles=[];
function collect(dir){for(const entry of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){if(entry.name.startsWith('.'))continue;const rel=dir+'/'+entry.name;if(entry.isDirectory())collect(rel);else publicFiles.push(rel)}}
for(const entry of fs.readdirSync(root,{withFileTypes:true}))if(entry.isFile()&&/\.(html|css|js|webmanifest|xml|txt)$/.test(entry.name)&&entry.name!=='sw.js')publicFiles.push(entry.name);
for(const dir of ['assets','css','js','vendor'])if(fs.existsSync(path.join(root,dir)))collect(dir);
publicFiles.sort();
let sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const normalized=sw.replace(/V='[^']*'/,"V='BUILD'").replace(/VERSION=\{[^}]*\}/,'VERSION={}').replace(/CORE=\[.*?\];/s,'CORE=[];');
const hash=crypto.createHash('sha256').update(normalized);
for(const file of publicFiles)hash.update(file).update(fs.readFileSync(path.join(root,file)));
const build=hash.digest('hex').slice(0,12);
const version=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Karachi',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()).replaceAll('-','.');
const metadata={version,build};
sw=sw.replace(/V='[^']*'/,"V='askpapergen-"+build+"'").replace(/VERSION=\{[^}]*\}/,'VERSION='+JSON.stringify(metadata)).replace(/CORE=\[.*?\];/s,'CORE='+JSON.stringify(['./',...publicFiles])+';');
fs.writeFileSync(path.join(root,'sw.js'),sw);fs.writeFileSync(path.join(root,'version.json'),JSON.stringify(metadata)+'\n');
console.log('Release',build,'with',publicFiles.length,'public files');
