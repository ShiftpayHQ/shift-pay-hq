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
const ctx = vm.createContext({console:{error(){}}, document:{getElementById:element, createElement:()=>element('modal'), body:{appendChild(){}}}, localStorage:{getItem:()=>null,setItem:(k,v)=>writes.push([k,v])}});
for (const name of ['normalizeTeachingNumber','teachingCandidateReason','teachingCandidateTable','teachingDiagnosticHtml','showAllTeachingCandidates','readLearnedLayout','imageCoordinateBounds','learnedLayoutDiagnosticHtml','wordBox','numericWordValue','pageBounds','nearestLabel','fieldNumber','sane','ocrNormalise','fuzzyLabel','markScanField','setScanFieldState','applyLearnedLayout','snapshotManualReview','restoreManualReview','manualTrainingValues','expandedNumericCandidates','teachScannerFromManual','collectOcrWords','escDbg','scanDiagnosticHtml','isolateNewScan','scanPayslip']) vm.runInContext(source(name),ctx);
const run = code => vm.runInContext(code,ctx);
const word = (text,x,y=10) => ({text,bbox:{x0:x,y0:y,x1:x+30,y1:y+10},conf:95});
ctx.words=[word('Basic',0),word('1234.56',100),word('edge',300,300)];
run("layoutStorageStatus='Key present';lastScanCoordinateSpace={kind:'full-page-enhanced-v1',width:330,height:310};learnedLayout={version:2,profile:'sas_payslip_layout_v1',anchors:{basic:{x:115/330,y:5/300,label:'Basic'}}};scanDiagnostic={stage:'test',coordinates:3,failure:null};lastScanFullPageWords=words;lastScanEvidenceWords=[];");
assert.equal(run('applyLearnedLayout(words,{})'),1,'saved profile must return a local hit counter');
assert.equal(element('aBasic').value,'1234.56');
assert.equal(run('applyLearnedLayout(words,{})'),0,'existing reviewed evidence cannot be overwritten');
element('aBasic').value='';
ctx.ambiguous=[...ctx.words,word('1235.00',102)];
assert.equal(run('applyLearnedLayout(ambiguous,{})'),0,'ambiguous position stays blank');
assert.equal(element('aBasic').value,'');
assert.match(run('learnedMatchDiagnostic.anchors[0].reason'),/Ambiguous/);
assert.equal(run('learnedMatchDiagnostic.anchors[0].nearest.candidatesWithinThreshold'),2);
run("learnedLayout.anchors.basic.label='Different label'");
assert.equal(run('applyLearnedLayout(words,{})'),0);
assert.match(run('learnedMatchDiagnostic.anchors[0].reason'),/label text mismatch/);
assert.equal(run('learnedMatchDiagnostic.anchors[0].nearest.labelMatch'),false);
run("learnedLayout.anchors.basic.label='Basic'");
assert.match(run('learnedLayoutDiagnosticHtml()'),/teaching dimensions unknown/);
assert.match(run('learnedLayoutDiagnosticHtml()'),/Saved anchors: 1/);
assert.equal(run('applyLearnedLayout([{text:"1",bbox:{x0:0,y0:0,x1:0,y1:0}}],{})'),0);
assert.equal(run('applyLearnedLayout([],{})'),0);
run('learnedLayout=null');assert.equal(run('applyLearnedLayout(words,{})'),0);
assert.match(run('learnedMatchDiagnostic.status'),/No learned profile/);
ctx.localStorage.getItem=()=>'{invalid';
assert.equal(run('readLearnedLayout()'),null);
assert.match(run('layoutStorageStatus'),/Storage\/JSON error/);
ctx.localStorage.getItem=()=>null;
assert.equal(run('readLearnedLayout()'),null);
assert.equal(run('layoutStorageStatus'),'Missing key');
ctx.localStorage.getItem=()=>JSON.stringify({version:99,anchors:{basic:{x:.3,y:.2}}});
run('learnedLayout=readLearnedLayout();applyLearnedLayout(words,{})');
assert.match(run('learnedMatchDiagnostic.status'),/Incompatible profile/);
assert.match(run('learnedMatchDiagnostic.anchors[0].reason'),/Incompatible profile/);
ctx.localStorage.getItem=()=>null;
// V3 positions remain stable if unrelated edge OCR tokens disappear.
run("learnedLayout={version:3,profile:'sas_payslip_layout_v1',coordinateSpace:{kind:'full-page-enhanced-v1',normalization:'full-image',width:330,height:310},anchors:{basic:{x:115/330,y:15/310,label:'Basic'}}}");
assert.equal(run('applyLearnedLayout(words.slice(0,2),{})'),1);
element('aBasic').value='';
run('lastScanCoordinateSpace.width=660;lastScanCoordinateSpace.height=620');
ctx.scaledWords=ctx.words.map(w=>({...w,bbox:Object.fromEntries(Object.entries(w.bbox).map(([k,v])=>[k,v*2]))}));
assert.equal(run('applyLearnedLayout(scaledWords,{})'),1,'same aspect ratio and scaled positions');
element('aBasic').value='';
run('lastScanCoordinateSpace.width=330');
assert.equal(run('applyLearnedLayout(words,{})'),0);
assert.match(run('learnedMatchDiagnostic.status'),/Incompatible processed-image aspect ratio/);
assert.equal(element('aBasic').value,'');
ctx.data={blocks:[{paragraphs:[{lines:[{words:ctx.words}]}]}]};
assert.equal(run('collectOcrWords(data).length'),3);
ctx.data={tsv:'level\tpage\tblock\tpar\tline\tword\tleft\ttop\twidth\theight\tconf\ttext\n5\t1\t1\t1\t1\t1\t100\t10\t30\t10\t95\t1234.56'};
assert.equal(run('collectOcrWords(data)[0].bbox.x1'),130,'TSV fallback');
assert.equal(run('collectOcrWords({text:"1234.56"}).length'),0);
ctx.words=[word('1111.11',0),word('222.22',100,100),word('333.33',200,200)];
run("lastScanFullPageWords=words;lastScanCoordinateSpace={kind:'full-page-enhanced-v1',width:330,height:310}");
element('aBasic').value='1111.11';element('aPen').value='222.22';element('aNet').value='333.33';
// Modal is absent until teaching creates it.
ctx.document.getElementById=id=>id==='teachResultModal'?null:element(id);
const before=run('JSON.stringify(snapshotManualReview())');
run('teachScannerFromManual()');
assert.equal(run('JSON.stringify(snapshotManualReview())'),before,'all manual fields unchanged');
assert.equal(writes.length,1);
const profile=JSON.parse(writes[0][1]);
assert.equal(profile.version,3);
assert.equal(profile.coordinateSpace.normalization,'full-image');
assert.equal(profile.coordinateSpace.width,330);
assert.ok(profile.coordinateSpace.tokenBounds);
assert.equal(Object.keys(profile.anchors).length,3);
for(const anchor of Object.values(profile.anchors)) assert.deepEqual(Object.keys(anchor).sort(),['h','label','w','x','y']);
run('lastScanFullPageWords=[];teachScannerFromManual()');assert.equal(writes.length,1,'no coordinates means no saved profile');
// Teaching-only numeric normalization: no changes to normal scanner parsing.
for(const [raw,expected] of [['£ 1,234.56',1234.56],['£\u00a01\u202f234.56',1234.56],['1234·56;',1234.56],['1234,56',1234.56],['I,23O.5S',1230.55],['48.00',48]]){
 ctx.raw=raw;assert.equal(run('normalizeTeachingNumber(raw).value'),expected,raw);
}
for(const raw of ['48 00','(123.45)','-123.45','12/34','12..34','12.34 56.78','BOSS','12,34,56']){
 ctx.raw=raw;assert.equal(run('normalizeTeachingNumber(raw).value'),null,raw);
}
const token=(text,x,y,width=String(text).length*8,height=16)=>({text,bbox:{x0:x,y0:y,x1:x+width,y1:y+height},conf:95});
ctx.fragments=[token('1234',100,10),token('.',134,20,3,5),token('56',139,12)];
assert.equal(run('expandedNumericCandidates(fragments).filter(c=>!c.reason&&c.v===1234.56).length'),1,'three parts and baseline jitter reconstruct');
assert.equal(run('expandedNumericCandidates(fragments).filter(c=>!c.reason&&c.v===1234).length'),0,'integer fragment cannot teach another value');
ctx.fragments=[token('12',100,10),token('34',118,10)];
assert.equal(run('expandedNumericCandidates(fragments).filter(c=>!c.reason&&c.v===1234).length'),0,'no joining integer cells without separators');
ctx.fragments=[token('12',100,10),token('34.56',118,10)];
assert.equal(run('expandedNumericCandidates(fragments).filter(c=>!c.reason&&c.v===1234.56).length'),0,'two complete numeric cells must not merge');
ctx.fragments=[token('1234',100,10),token('.56',180,10)];
assert.equal(run('expandedNumericCandidates(fragments).filter(c=>!c.reason&&c.v===1234.56).length'),0,'distant columns cannot join');
ctx.fragments=[token('1234',100,10),token('.56',134,50)];
assert.equal(run('expandedNumericCandidates(fragments).filter(c=>!c.reason&&c.v===1234.56).length'),0,'different rows cannot join');
ctx.fragments=[token('1234',100,10),token('X',134,10),token('.56',144,10)];
assert.equal(run('expandedNumericCandidates(fragments).filter(c=>!c.reason&&c.v===1234.56).length'),0,'intervening tokens cannot be skipped');
const fields=['aBasic','aUSUnits','aUS','aSundayUnits','aSunday','aOTUnits','aOT','aGross','aTax','aNI','aPen','aNet'];
const labels=['Basic','Unsocial','Unsocial','Sunday','Sunday','Overtime','Overtime','Gross','Income tax','National insurance','Pension','Net'];
const values=['3210.45','41.00','234.56','21.00','234.56','17.00','654.32','4321.09','765.43','210.98','345.67','2999.01'];
ctx.teachingWords=[];
values.forEach((value,i)=>{
 const [whole,fraction]=value.split('.'),y=40+i*70;
 fields.forEach(id=>element(id));element(fields[i]).value=value;
 ctx.teachingWords.push(token(labels[i],0,y,80),token(whole,180,y),token('.',182+whole.length*8,y+10,3,5),token(fraction,187+whole.length*8,y+2));
});
// Same token volume as the reported device test, with synthetic noise only.
while(ctx.teachingWords.length<1411){const n=ctx.teachingWords.length;ctx.teachingWords.push(token('noise',400+(n%4)*45,1200+Math.floor(n/4)*20))}
run("lastScanFullPageWords=teachingWords;lastScanCoordinateSpace={kind:'full-page-enhanced-v1',width:600,height:10000};learnedLayout={version:2,anchors:{old:{x:.1,y:.1}}}");
const allBefore=run('JSON.stringify(snapshotManualReview())');
run('teachScannerFromManual()');
assert.equal(run('lastTeachingDiagnostic.fields.length'),12);
assert.equal(run('lastTeachingDiagnostic.fields.filter(f=>f.selected!==null).length'),12,'all synthetic values reconstructed, repeated Sunday/unsocial amounts distinguished by label');
assert.equal(run('JSON.stringify(snapshotManualReview())'),allBefore);
const taught=JSON.parse(writes.at(-1)[1]);
assert.equal(taught.version,3);assert.equal(Object.keys(taught.anchors).length,12);
assert.equal(taught.coordinateSpace.width,600);assert.ok(taught.coordinateSpace.tokenBounds);
assert.equal(taught.anchors.basic.x,(180+(187+4*8+16))/2/600);
for(const anchor of Object.values(taught.anchors))assert.deepEqual(Object.keys(anchor).sort(),['h','label','w','x','y']);
assert.ok(!JSON.stringify(taught).includes('3210.45'),'no historical payroll answers persisted');
assert.match(element('layoutLearningStatus').innerHTML,/DEV bf11.6 manual teaching diagnostics/);
assert.match(element('layoutLearningStatus').innerHTML,/numeric equality/i);
run('showAllTeachingCandidates(0)');assert.match(element('teachingCandidates0').innerHTML,/Selected for layout teaching/);
// Ambiguous repeats must not replace an old profile, even when the manual target is known.
fields.forEach(id=>element(id).value='');element('aOTUnits').value='17.00';
ctx.repeated=[token('17.00',100,10),token('17.00',100,100)];
const savedBefore=writes.length,layoutBefore=run('JSON.stringify(learnedLayout)');
run('lastScanFullPageWords=repeated;teachScannerFromManual()');
assert.equal(writes.length,savedBefore);
assert.equal(run('JSON.stringify(learnedLayout)'),layoutBefore);
assert.match(run('lastTeachingDiagnostic.fields.find(f=>f.field==="otUnits").reason'),/Ambiguous/);
assert.equal(element('aOTUnits').value,'17.00');
// One physical amount cannot train both Sunday and unsocial when a second occurrence is missing.
fields.forEach(id=>element(id).value='');element('aUS').value='234.56';element('aSunday').value='234.56';
ctx.repeated=[token('234.56',100,10)];
run('lastScanFullPageWords=repeated;teachScannerFromManual()');
assert.equal(writes.length,savedBefore);
assert.equal(run('lastTeachingDiagnostic.fields.filter(f=>f.selected!==null).length'),0);
assert.match(run('lastTeachingDiagnostic.fields.find(f=>f.field==="sunday").reason'),/same physical candidate/);
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
