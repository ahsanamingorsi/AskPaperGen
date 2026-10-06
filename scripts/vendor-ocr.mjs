// Bundles the OCR engine so Scan to Paper works fully offline with no CDN:  node scripts/vendor-ocr.mjs [eng urd ...]
// Needs Node 18+ and internet once. Then run  python3 scripts/release.py  and deploy.
import {mkdir,writeFile} from 'node:fs/promises';import {dirname} from 'node:path';
const J='https://cdn.jsdelivr.net/npm/',L='https://tessdata.projectnaptha.com/4.0.0/',langs=process.argv.slice(2).length?process.argv.slice(2):['eng','urd'];
const list=[[J+'tesseract.js@5/dist/tesseract.min.js','tesseract.min.js'],[J+'tesseract.js@5/dist/worker.min.js','worker.min.js'],
 ...['tesseract-core.wasm.js','tesseract-core-simd.wasm.js','tesseract-core-lstm.wasm.js','tesseract-core-simd-lstm.wasm.js'].map(f=>[J+'tesseract.js-core@5/'+f,'core/'+f]),
 ...langs.map(l=>[L+l+'.traineddata.gz','lang/'+l+'.traineddata.gz'])],ok=[];
for(const [u,f] of list){try{const r=await fetch(u);if(!r.ok)throw new Error(r.status);const p='vendor/ocr/'+f;await mkdir(dirname(p),{recursive:true});await writeFile(p,Buffer.from(await r.arrayBuffer()));ok.push(f);console.log('✓',f)}catch(e){console.log('✗',f,e.message)}}
await writeFile('vendor/ocr/files.json',JSON.stringify(ok));console.log(ok.length+'/'+list.length+' files saved. Now run: python3 scripts/release.py');
