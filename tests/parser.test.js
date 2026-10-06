// Run: node tests/parser.test.js
const fs=require('fs'),vm=require('vm'),path=require('path');
const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/scan-parser.js'),'utf8')+';this.parseDoc=parseDoc;',ctx);
let fail=0;const eq=(n,a,b)=>{const ok=JSON.stringify(a)===JSON.stringify(b);if(!ok)fail++;console.log(ok?'PASS':'FAIL',n,ok?'':'\n   got '+JSON.stringify(a)+'\n   want '+JSON.stringify(b))};
const fx=f=>ctx.parseDoc(fs.readFileSync(path.join(__dirname,'fixtures',f),'utf8'));
let d=fx('page-objective.txt');eq('objective: paper details',d.meta,{subject:'English',cls:'9th'});
eq('objective: structure',d.items.map(i=>i.type),['section','instr','mcq','mcq','mcq','mcq']);
eq('objective: Q1 options',d.items[2].opts,['We speak urdu fluently','she speaks English','He speaks Hindi','They speak French']);
eq('objective: Q3 (option a without marker)',d.items[4].opts[0],'We get an mango yesterday');
d=fx('page-mcq-5-9.txt');eq('page 5-9: five MCQs',d.items.map(i=>i.type),['mcq','mcq','mcq','mcq','mcq']);
eq('page 5-9: Q7 option a/b',d.items[2].opts.slice(0,2),['Duty','clan']);eq('page 5-9: Q9 options',d.items[4].opts,['The chart was hanged','You are a boy.','We laughed','They slept']);
d=fx('page-passage.txt');eq('passage: one long question',d.items.map(i=>i.type),['long']);eq('passage: details',d.meta,{subject:'English',cls:'9th'});
d=ctx.parseDoc('SECTION A: Multiple Choice Questions (10)\n1. Capital of France?\n(a) Rome (b) Paris (c) Berlin (d) Madrid\nSection B - Short Questions\n2. Define RAM. [3]');
eq('sections + marks',d.items.map(i=>i.type+(i.sub?':'+i.sub:'')+(i.marks?'#'+i.marks:'')),['section:Multiple Choice Questions#10','mcq','section:Short Questions','short#3']);
d=ctx.parseDoc('حصہ اول: کثیر الانتخابی\nسوال ۱۔ پاکستان کا دارالحکومت کیا ہے؟\nالف) لاہور\nب) اسلام آباد\nج) کراچی\nد) پشاور');
eq('urdu: section + mcq',d.items.map(i=>i.type),['section','mcq']);eq('urdu: options',d.items[1].opts,['لاہور','اسلام آباد','کراچی','پشاور']);
d=ctx.parseDoc('Which one is a programming language?\na) Python\nb) Chess');eq('lost number: still a question',d.items.map(i=>i.type),['mcq']);
console.log(fail?fail+' FAILED':'all parser tests passed');process.exit(fail?1:0)
