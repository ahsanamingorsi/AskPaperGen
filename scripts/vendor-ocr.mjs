// Bundle a pinned text reader and English/Urdu LSTM language models for offline scanning.
import {mkdir,writeFile,rename} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const J='https://cdn.jsdelivr.net/npm/',version='5.1.1';
const langs=process.argv.slice(2).length?process.argv.slice(2):['eng','urd'];
if(langs.some(l=>!/^\w+$/.test(l)))throw new Error('Invalid language code');
const list=[[J+'tesseract.js@'+version+'/dist/tesseract.min.js','tesseract.min.js'],[J+'tesseract.js@'+version+'/dist/worker.min.js','worker.min.js'],
 ...['tesseract-core.wasm.js','tesseract-core-simd.wasm.js','tesseract-core-lstm.wasm.js','tesseract-core-simd-lstm.wasm.js'].map(f=>[J+'tesseract.js-core@'+version+'/'+f,'core/'+f]),
 ...langs.map(l=>[J+'@tesseract.js-data/'+l+'/4.0.0_best_int/'+l+'.traineddata.gz','lang/'+l+'.traineddata.gz'])];
for(const [url,file] of list){const r=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!r.ok)throw new Error(file+': HTTP '+r.status);const bytes=Buffer.from(await r.arrayBuffer());if(bytes.length<100)throw new Error('Empty OCR asset: '+file);const target=resolve(root,'vendor/ocr',file);await mkdir(dirname(target),{recursive:true});await writeFile(target+'.tmp',bytes);await rename(target+'.tmp',target);console.log('Downloaded',file,bytes.length,'bytes')}
await writeFile(resolve(root,'vendor/ocr/files.json'),JSON.stringify(list.map(([,file])=>file)));
console.log('Complete OCR bundle ready. Run node scripts/release.mjs before deploying.');
