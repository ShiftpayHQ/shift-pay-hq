// Run: node test/scanner-regression.test.js. No network or personal payslip data.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
new vm.Script(script); // Parse the actual development build, not the older extracted copy.
function source(name) {
  const start = script.search(new RegExp('(?:async )?function '+name+'\\('));
  assert.ok(start >= 0, name);
  for (let end = script.indexOf('}', start); end >= 0; end = script.indexOf('}', end + 1)) {
    const candidate = script.slice(start, end + 1);
    try { new vm.Script('('+candidate+')'); return candidate; } catch {}
  }
  throw Error('Cannot extract '+name);
}
const elements = {};
const writes = [];
const element = id => elements[id] ||= {value:'', innerHTML:'', style:{}, classList:{add(){}}, insertAdjacentHTML(_, value){this.innerHTML+=value}};
const ctx = vm.createContext({console:{error(){}}, document:{getElementById:element, createElement:()=>element('modal'), body:{appendChild(){}}}, localStorage:{setItem:(k,v)=>writes.push([k,v])}});
for (const name of ['wordBox','numericWordValue','pageBounds','nearestLabel','fieldNumber','sane','ocrNormalise','fuzzyLabel','markScanField','setScanFieldState','applyLearnedLayout','snapshotManualReview','restoreManualReview','manualTrainingValues','expandedNumericCandidates','teachScannerFromManual','collectOcrWords','escDbg','scanDiagnosticHtml','isolateNewScan','scanPayslip']) vm.runInContext(source(name),ctx);
const run = code => vm.runInContext(code,ctx);
const word = (text,x,y=10) => ({text,bbox:{x0:x,y0:y,x1:x+30,y1:y+10},conf:95});
ctx.words=[word('Basic',0),word('1234.56',100),word('edge',300,300)];
run("learnedLayout={anchors:{basic:{x:115/330,y:5/300,label:'Basic'}}};scanDiagnostic={stage:'test',coordinates:3,failure:null};lastScanFullPageWords=words;lastScanEvidenceWords=[];");
assert.equal(run('applyLearnedLayout(words,{})'),1,'saved profile must return a local hit counter');
assert.equal(element('aBasic').value,'1234.56');
assert.equal(run('applyLearnedLayout(words,{})'),0,'existing reviewed evidence cannot be overwritten');
element('aBasic').value='';
ctx.ambiguous=[...ctx.words,word('1235.00',102)];
assert.equal(run('applyLearnedLayout(ambiguous,{})'),0,'ambiguous position stays blank');
assert.equal(element('aBasic').value,'');
assert.equal(run('applyLearnedLayout([{text:"1",bbox:{x0:0,y0:0,x1:0,y1:0}}],{})'),0);
assert.equal(run('applyLearnedLayout([],{})'),0);
run('learnedLayout=null');assert.equal(run('applyLearnedLayout(words,{})'),0);
ctx.data={blocks:[{paragraphs:[{lines:[{words:ctx.words}]}]}]};
assert.equal(run('collectOcrWords(data).length'),3);
ctx.data={tsv:'level\tpage\tblock\tpar\tline\tword\tleft\ttop\twidth\theight\tconf\ttext\n5\t1\t1\t1\t1\t1\t100\t10\t30\t10\t95\t1234.56'};
assert.equal(run('collectOcrWords(data)[0].bbox.x1'),130,'TSV fallback');
assert.equal(run('collectOcrWords({text:"1234.56"}).length'),0);
ctx.words=[word('1111.11',0),word('222.22',100,100),word('333.33',200,200)];
run('lastScanFullPageWords=words');
element('aBasic').value='1111.11';element('aPen').value='222.22';element('aNet').value='333.33';
// Modal is absent until teaching creates it.
ctx.document.getElementById=id=>id==='teachResultModal'?null:element(id);
const before=run('JSON.stringify(snapshotManualReview())');
run('teachScannerFromManual()');
assert.equal(run('JSON.stringify(snapshotManualReview())'),before,'all manual fields unchanged');
assert.equal(writes.length,1);
const profile=JSON.parse(writes[0][1]);
assert.equal(Object.keys(profile.anchors).length,3);
for(const anchor of Object.values(profile.anchors)) assert.deepEqual(Object.keys(anchor).sort(),['h','label','w','x','y']);
run('lastScanFullPageWords=[];teachScannerFromManual()');assert.equal(writes.length,1,'no coordinates means no saved profile');
run('lastScanFullPageWords=words;lastScanEvidenceWords=words;isolateNewScan()');
assert.equal(run('lastScanFullPageWords.length+lastScanEvidenceWords.length'),0,'new scan clears stale coordinates');
// Exercise the actual orchestration with local fake OCR and deliberate failures.
for(const id of ['scanProgress','scanProgressBar','scanProgressTitle','scanFound','scanTitle','scanCopy'])ctx[id]=element(id);
ctx.ensureOCRWorker=async()=>{throw Error('synthetic worker failure')};
(async()=>{
  await run('scanPayslip({})');
  assert.match(element('scanFound').innerHTML,/OCR worker initialization/);
  ctx.loadScanImage=async()=>({});ctx.cropPaperCanvas=ctx.rotateCanvas=ctx.enhanceCanvas=ctx.cropRegion=()=>({});ctx.quickOCR=async()=>'';ctx.ocrScore=()=>1;
  let calls=0;
  ctx.ensureOCRWorker=async()=>({setParameters:async()=>{},recognize:async()=>{calls++;if(calls===3)throw Error('synthetic detail failure');return {data:calls===1?{text:''}:{words:ctx.words}}}});
  await run('scanPayslip({})');
  assert.equal(run('lastScanFullPageWords.length'),3,'alternate full-page pass retained before detail failure');
  assert.equal(run('scanDiagnostic.stage'),'Detail OCR');
  assert.match(element('scanFound').innerHTML,/synthetic detail failure/);
  ctx.ensureOCRWorker=async()=>({setParameters:async()=>{},recognize:async()=>({data:{text:'text without coordinates'}})});
  await run('scanPayslip({})');
  assert.equal(run('scanDiagnostic.coordinates'),0);
  assert.match(element('scanFound').innerHTML,/Full-page coordinate capture/);
  console.log('PASS: inline syntax, learned counter, safety, block/TSV capture, teaching, manual preservation, local profile schema, scan isolation, failure stages and retained coordinates.');
})().catch(e=>{console.error(e);process.exitCode=1});
