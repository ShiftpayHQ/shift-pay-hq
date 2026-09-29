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
for (const name of ['productionGroupingEvidence','earningsHeadingGateEvidence','teachingNumericEvidence','teachingNumericEvidenceHtml','earningsStructureAudit','earningsStructureAuditHtml','teachingPayeFocusedHtml','spatialRows','kindFromSpatialRow','wordCenterX','earningsRegionAnchor','rowInsideEarningsRegion','adaptiveHeaderGeometry','teachingSamePhysical','teachingPhysicalOccurrences','teachingPipeline','teachingPipelineHtml','teachingSpatialModelBf117','teachingExactOccurrences','teachingOccurrenceHtml','teachingSpatialModel','teachingRawRowsHtml','showAllTeachingRows','normalizeTeachingNumber','teachingCandidateReason','teachingCandidateTable','teachingDiagnosticHtml','showAllTeachingCandidates','readLearnedLayout','imageCoordinateBounds','learnedLayoutDiagnosticHtml','wordBox','numericWordValue','pageBounds','nearestLabel','fieldNumber','sane','ocrNormalise','fuzzyLabel','markScanField','setScanFieldState','applyLearnedLayout','snapshotManualReview','restoreManualReview','manualTrainingValues','expandedNumericCandidates','teachScannerFromManual','collectOcrWords','escDbg','scanDiagnosticHtml','isolateNewScan','scanPayslip']) vm.runInContext(source(name),ctx);
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
// Synthetic iPhone-like monetary rows: character fragments, separate currency/decimal,
// baseline shifts, and neighbouring payroll columns. These are not captured device OCR.
ctx.moneyRows=[
 token('PAYE',0,100,70,22),token('38.00',130,102,50,22),
 token('10',240,101,20,22),token('60',262,109,20,22),token('.',284,124,3,4),token('0',289,104,10,22),token('7',301,108,10,22),
 token('9999.99',420,101,70,22),
 token('Gross',0,190,70,22),token('48.00',130,192,50,22),token('£',220,191,9,22),
 token('5',232,192,10,22),token(',',244,209,3,5),token('3',249,195,10,22),token('49',261,202,20,22),
 token('.',283,215,3,4),token('6',288,195,10,22),token('3',300,201,10,22),token('8888.88',420,192,70,22),
 token('12.34',240,150,50,22),token('56.78',240,240,50,22)
];
run('moneyModel=teachingSpatialModel(moneyRows)');
assert.equal(run('moneyModel.candidates.filter(c=>!c.reason&&c.v===1060.07).length'),1,'PAYE integer and cents fragments reconstruct');
assert.equal(run('moneyModel.candidates.filter(c=>!c.reason&&c.v===5349.63).length'),1,'Gross currency/grouping/decimal reconstruct');
assert.equal(run('moneyModel.candidates.filter(c=>!c.reason&&c.v===9999.99).length'),1,'neighbouring amount remains separate');
assert.ok(run('moneyModel.rows.some(r=>r.boundaries.some(b=>b.reason.includes("Column/word gap")))'));
assert.equal(run('moneyModel.candidates.filter(c=>!c.reason&&c.parts.length>1&&c.w.text.includes("9999")).length'),0);
ctx.noDecimal=ctx.moneyRows.filter(t=>t.text!=='.');
assert.equal(run('expandedNumericCandidates(noDecimal).filter(c=>!c.reason&&[1060.07,5349.63].includes(c.v)).length'),0,'no decimal insertion');
ctx.noDigit=ctx.moneyRows.filter(t=>t.text!=='7');
assert.equal(run('expandedNumericCandidates(noDigit).filter(c=>!c.reason&&c.v===1060.07).length'),0,'no digit insertion');
ctx.crossRows=[token('10',240,100,20,22),token('60',262,135,20,22),token('.',284,150,3,4),token('07',289,135,20,22)];
assert.equal(run('expandedNumericCandidates(crossRows).filter(c=>!c.reason&&c.v===1060.07).length'),0,'neighbouring row cannot complete an amount');
ctx.wideGap=[token('10',240,100,20,22),token('60',290,100,20,22),token('.',312,117,3,4),token('07',317,100,20,22)];
assert.equal(run('expandedNumericCandidates(wideGap).filter(c=>!c.reason&&c.v===1060.07).length'),0,'neighbouring column cannot complete an amount');
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
assert.match(element('layoutLearningStatus').innerHTML,/DEV bf11.12 manual teaching diagnostics/);
assert.match(element('layoutLearningStatus').innerHTML,/DEV bf11.12 earnings header\/row audit/);
assert.doesNotMatch(element('layoutLearningStatus').innerHTML,/Header\/row audit unavailable/);
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
fields.forEach(id=>element(id).value='');element('aTax').value='1060.07';element('aGross').value='5349.63';
run('lastScanFullPageWords=noDecimal;teachScannerFromManual()');
assert.equal(writes.length,savedBefore,'failed monetary reconstruction retains saved profile');
assert.match(element('layoutLearningStatus').innerHTML,/Raw physical rows for PAYE/);
assert.match(element('layoutLearningStatus').innerHTML,/Raw physical rows for Gross/);
assert.match(element('layoutLearningStatus').innerHTML,/Contiguous runs/);
assert.match(element('layoutLearningStatus').innerHTML,/Run boundaries/);
assert.match(element('layoutLearningStatus').innerHTML,/240, 101, 260, 123/,'raw x/y bounds visible');
assert.match(element('layoutLearningStatus').innerHTML,/“10”/,'raw text visible');
assert.match(element('layoutLearningStatus').innerHTML,/No explicit decimal/,'why decimal-less run fails is visible');
run('showAllTeachingRows(8)');assert.match(element('teachingRows8').innerHTML,/9999.99/);
run("lastTeachingDiagnostic.previousLayout=null;lastTeachingDiagnostic.spatial=teachingSpatialModel([{text:'<img onerror=bad>',bbox:{x0:0,y0:0,x1:60,y1:20}}])");
assert.match(run('teachingRawRowsHtml(lastTeachingDiagnostic.fields[8],true)'),/Expected region is unknown/);
assert.match(run('teachingRawRowsHtml(lastTeachingDiagnostic.fields[8],true)'),/&lt;img/,'raw OCR is HTML escaped');
// bf11.8: hierarchy boxes must not turn two printed lines into one artificial row.
ctx.hierarchy=[
 token('PAYE 1060.07 Gross 5349.63',0,0,400,160),
 token('PAYE 1060.07',0,10,320,60),token('1060.07',180,0,140,90),
 token('PAYE',0,30,70,20),token('1060.07',200,31,70,20),
 token('Gross',0,100,70,20),token('5349.63',200,101,70,20),
 ...'1060.07'.split('').map((text,i)=>token(text,200+i*10,31,10,20))
];
run('hierarchyModel=teachingSpatialModel(hierarchy)');
assert.equal(run('hierarchyModel.rows.length'),2,'large parent/line boxes excluded before row clustering');
assert.ok(run('hierarchyModel.raw[0].excluded.includes("Parent")'));
assert.equal(run('hierarchyModel.raw.filter(t=>!t.excluded&&t.w.text==="1060.07").length'),1,'complete tight word preferred to parent and glyphs');
assert.equal(run('teachingExactOccurrences(hierarchyModel,1060.07,{x1:600,y1:10000}).length'),1,'word/run/hierarchy duplicates are one occurrence');
const persistedBeforeHierarchy=writes.length;
fields.forEach(id=>element(id).value='');element('aTax').value='1060.07';element('aGross').value='5349.63';element('aPen').value='345.67';
ctx.hierarchy.push(token('345.67',200,180,70,20)); // unique amount without a readable label
run('lastScanFullPageWords=hierarchy;teachScannerFromManual()');
assert.equal(writes.length,persistedBeforeHierarchy+1);
assert.equal(run('lastTeachingDiagnostic.fields.find(f=>f.field==="tax").occurrences.length'),1);
assert.equal(run('lastTeachingDiagnostic.fields.find(f=>f.field==="tax").saved'),true);
assert.equal(run('lastTeachingDiagnostic.fields.find(f=>f.field==="pen").saved'),true,'unique exact occurrence does not need perfect label rows');
assert.equal(run('learnedLayout.anchors.tax.x'),235/600,'position uses tight word centre, not large parent');
assert.match(element('layoutLearningStatus').innerHTML,/Exact numeric occurrences: 1/);
assert.match(element('layoutLearningStatus').innerHTML,/Centre \(235.0, 41.0\)/);
assert.match(element('layoutLearningStatus').innerHTML,/position saved: yes/);
assert.equal(element('aTax').value,'1060.07');
// Equal values in distinct columns on the same OT row remain ambiguous, not leftmost wins.
fields.forEach(id=>element(id).value='');element('aOTUnits').value='27.00';
ctx.repeated27=[token('Overtime',0,20,80,20),token('27.00',140,20,50,20),token('27.00',300,20,50,20)];
const persistedBeforeRepeat=writes.length;
run('lastScanFullPageWords=repeated27;teachScannerFromManual()');
assert.equal(writes.length,persistedBeforeRepeat);
assert.equal(run('lastTeachingDiagnostic.fields.find(f=>f.field==="otUnits").occurrences.length'),2);
assert.equal(run('lastTeachingDiagnostic.fields.find(f=>f.field==="otUnits").saved'),false);
assert.match(run('lastTeachingDiagnostic.fields.find(f=>f.field==="otUnits").reason'),/Ambiguous/);
ctx.repeated27=[token('Hours',0,20,80,20),token('27.00',140,20,50,20),token('Hours',0,80,80,20),token('27.00',140,80,50,20)];
run('lastScanFullPageWords=repeated27;teachScannerFromManual()');
assert.equal(writes.length,persistedBeforeRepeat,'generic hours labels cannot resolve OT repeats');
// A damaged neighbouring run cannot suppress a complete exact token.
ctx.intact=[token('££',180,20,18,20),token('1060.07',200,20,70,20)];
run('intactModel=teachingSpatialModel(intact)');
assert.equal(run('teachingExactOccurrences(intactModel,1060.07,{x1:600,y1:10000}).length'),1);
// Overlapping conflicting OCR words do not establish a trustworthy unique occurrence.
ctx.conflict=[token('1060.07',200,20,70,20),token('1060.01',200,20,70,20)];
run('conflictModel=teachingSpatialModel(conflict)');
assert.match(run('teachingExactOccurrences(conflictModel,1060.07,{x1:600,y1:10000})[0].problem'),/Conflicting/);
// bf11.10: a height ratio alone must not discard a complete standalone decimal.
ctx.partialHierarchy=[token('1060.07',200,20,70,60),token('1060',200,30,40,20),token('07',250,30,20,20)];
run('lossModel=teachingSpatialModel(partialHierarchy);oldLossModel=teachingSpatialModelBf117(partialHierarchy)');
assert.ok(run('oldLossModel.candidates.some(c=>!c.reason&&c.v===1060.07)'), 'bf11.7 retains the complete amount');
assert.equal(run('lossModel.candidates.filter(c=>!c.reason&&c.v===1060.07).length'),1,'standalone decimal survives the false multiline inference');
assert.match(run('lossModel.raw[0].excluded'),/Parent spans child baselines/);
assert.equal(run('lossModel.raw[0].against.join(",")'),'1,2');
assert.ok(run('lossModel.candidates.some(c=>c.source==="word"&&c.v===1060.07&&c.b.x1>c.b.x0&&c.b.y1>c.b.y0&&c.recovery)'),'standalone evidence retains its original geometry and exclusion history');
fields.forEach(id=>element(id).value='');element('aTax').value='1060.07';
run('lastScanFullPageWords=partialHierarchy;teachScannerFromManual()');
assert.match(element('layoutLearningStatus').innerHTML,/PAYE 1060.07 regression trace/);
assert.match(run('teachingPipeline(lastTeachingDiagnostic.fields[8]).verdict'),/exact unique match exists → selected/);
assert.equal(run('teachingPipeline(lastTeachingDiagnostic.fields[8]).legacy.length'),1);
assert.notEqual(run('lastTeachingDiagnostic.fields[8].selected'),null);
assert.match(element('layoutLearningStatus').innerHTML,/Complete standalone decimal retained/);
// Every valid excluded numeric token must have equivalent usable evidence, either
// an accepted contained replacement or an explicitly rejected diagnostic replacement.
for(const fixture of ['hierarchy','partialHierarchy','intact','conflict']){
 ctx.fixture=ctx[fixture];
 assert.ok(run(`teachingSpatialModel(fixture).raw.every(t=>{
  const v=normalizeTeachingNumber(t.w.text).value;
  if(!t.excluded||v===null||!(t.b.x1>t.b.x0&&t.b.y1>t.b.y0))return true;
  const m=teachingSpatialModel(fixture),ids=t.replacementIds.length?t.replacementIds:[t.auditCandidateId];
  return ids.length&&ids.every(id=>{const c=m.candidates[id];return c&&c.v===v&&c.b.x1>c.b.x0&&c.b.y1>c.b.y0&&(!c.reason||c.source==='dedup-audit')});
 })`),fixture+' cannot silently lose standalone numeric evidence');
}
// Reported candidate IDs/coordinates, with unspecified geometry explicitly synthetic.
const iphone=require('./iphone-teaching-fixture.json');
ctx.iphone=iphone;
run(`iphoneModel={raw:[],rows:[],candidates:iphone.representations.map(r=>({id:r.id,w:{text:r.text,bbox:r.bbox},b:wordBox(r),parts:r.parts,source:r.source,rowId:null,v:normalizeTeachingNumber(r.text).value,normalized:r.text,reason:''}))}`);
assert.equal(run('teachingExactOccurrences(iphoneModel,iphone.target,iphone.bounds).length'),1);
assert.equal(run('teachingExactOccurrences(iphoneModel,iphone.target,iphone.bounds)[0].candidateIds.join(",")'),'44,357');
// Duplicate annotations are provenance, never a reason to erase the occurrence.
run('iphoneModel.candidates.forEach(c=>c.reason="Same physical numeric occurrence as candidate 44")');
assert.equal(run('teachingExactOccurrences(iphoneModel,iphone.target,iphone.bounds).length'),1);
// Small geometry jitter and independent raw tokens collapse without losing provenance.
for(const amount of ['1060.07','210.98','345.67','2999.01','5349.63']){
 ctx.amount=Number(amount);
 ctx.duplicateWords=[token(amount,3275,541,245,40),token(amount,3276,542,245,40)];
 run('decimalModel=teachingSpatialModel(duplicateWords);decimalOccurrences=teachingExactOccurrences(decimalModel,amount,iphone.bounds)');
 assert.equal(run('decimalOccurrences.length'),1,amount);
 assert.equal(run('decimalOccurrences[0].parts.length'),2,'both raw token IDs preserved');
 assert.ok(run('decimalOccurrences[0].candidateIds.length>=2'),'word/run candidate IDs preserved');
 // Same amount in a neighbouring column or separate row is two printed occurrences.
 for(const [x,y] of [[3530,541],[3275,610]]){
  ctx.duplicateWords.push(token(amount,x,y,245,40));
  assert.equal(run('teachingExactOccurrences(teachingSpatialModel(duplicateWords),amount,iphone.bounds).length'),2);
  ctx.duplicateWords.pop();
 }
}
// End-to-end version of the reproduced zero path: duplicated complete amount plus
// partial child evidence. bf11.9 quarantined both copies; bf11.10 selects one.
ctx.duplicateLoss=[token('1060.07',3275,541,245,80),token('1060.07',3275,541,245,80),token('1060',3275,550,140,25),token('07',3450,550,70,25)];
run("lastScanCoordinateSpace={kind:'full-page-enhanced-v1',width:4200,height:6000};lastScanFullPageWords=duplicateLoss;teachScannerFromManual()");
assert.equal(run('lastTeachingDiagnostic.fields[8].occurrences.length'),1);
assert.notEqual(run('lastTeachingDiagnostic.fields[8].selected'),null);
assert.match(element('layoutLearningStatus').innerHTML,/PHYSICAL OCCURRENCES: 3 \/ 3/);
assert.match(element('layoutLearningStatus').innerHTML,/collapsed candidate IDs/);
assert.equal(element('aTax').value,'1060.07');
assert.equal(run('lastTeachingDiagnostic.fields[8].saved'),false,'one anchor still cannot save a profile');
ctx.conflictingChild=[...ctx.duplicateLoss,token('1060.01',3275,550,245,25)];
assert.match(run('teachingExactOccurrences(teachingSpatialModel(conflictingChild),1060.07,iphone.bounds)[0].problem'),/Conflicting/,'a different complete decimal inside the recovered box still conflicts');
// Actual multiple baselines must remain quarantined, not rescued by the manual target.
ctx.multiline=[token('1060.07',200,20,70,90),token('1060',200,25,40,20),token('07',250,80,20,20)];
assert.equal(run('teachingExactOccurrences(teachingSpatialModel(multiline),1060.07,iphone.bounds).length'),0);
ctx.invalid=[token('1060.07',200,20,0,20)];
assert.equal(run('teachingExactOccurrences(teachingSpatialModel(invalid),1060.07,iphone.bounds).length'),0);
// Grouping must not bridge distinct locations through a chain of overlap.
ctx.chain=[token('27.00',100,20,100,20),token('27.00',114,20,100,20),token('27.00',128,20,100,20)];
assert.equal(run('teachingExactOccurrences(teachingSpatialModel(chain),27,iphone.bounds).length'),2);
ctx.traceCases=[[],[token('1060.07',200,20,70,20)],[token('1060.07',-20,20,70,20)],ctx.conflict];
for(const [i,pattern] of [/not present in raw OCR/,/exact unique match exists → selected/,/rejected by geometry\/ambiguity/,/Conflicting numeric OCR/].entries()){
 ctx.caseWords=ctx.traceCases[i];run('lastScanFullPageWords=caseWords;teachScannerFromManual()');
 // With no collected tokens the teaching prerequisite explicitly blocks the pipeline.
 assert.match(run('teachingPipeline(lastTeachingDiagnostic.fields[8]).verdict'),i===0?/No OCR coordinate tokens/:pattern);
 assert.equal(run('teachingPipeline(lastTeachingDiagnostic.fields[8]).stages.length'),7);
}
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
