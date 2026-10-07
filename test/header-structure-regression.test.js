// Read-only header diagnostics and exact-PAYE trace. No real payslip data.
// Run: node test/header-structure-regression.test.js
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(require('node:path').join(__dirname,'index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
new vm.Script(script);
function source(name){
 const start=script.indexOf('function '+name+'(');assert.ok(start>=0,name);
 for(let end=script.indexOf('}',start);end>=0;end=script.indexOf('}',end+1)){
  const s=script.slice(start,end+1);try{new vm.Script('('+s+')');return s}catch{}
 }
 throw Error(name);
}
const ctx=vm.createContext({});const run=s=>vm.runInContext(s,ctx);
for(const name of ['productionGroupingEvidence','earningsHeadingGateEvidence','earningsLabelSuspects','earningsLabelSuspectsHtml','earningsStructureAudit','earningsStructureAuditHtml','teachingPayeFocusedHtml','spatialRows','kindFromSpatialRow','wordCenterX','earningsRegionAnchor','rowInsideEarningsRegion','adaptiveHeaderGeometry','teachingSpatialModel','teachingPhysicalOccurrences','teachingSamePhysical','teachingExactOccurrences','teachingCandidateReason','wordBox','normalizeTeachingNumber','fuzzyLabel','ocrNormalise','escDbg'])run(source(name));
const token=(text,x,y,width=text.length*8,conf=95)=>({text,conf,bbox:{x0:x,y0:y,x1:x+width,y1:y+20}});
// Synthetic full-page coordinates: split words and stacked Hours worked / Units paid.
// Only the total count (1411), not the token contents, came from the device report.
ctx.words=[token('Hou',1000,20),token('rs',1024,20),token('wor',1000,45),token('ked',1024,45),
 token('Un',1200,20),token('its',1216,20),token('pa',1200,45),token('id',1216,45),
 token('Ra',1400,20),token('te',1416,20),token('Am',1600,20),token('ount',1616,20),
 token('Ba',100,110),token('sic',116,110),token('Pay',140,110),token('120.00',1000,110),token('120.00',1200,110),token('25.00',1400,110),token('3000.00',1600,110),
 token('Sun',100,150),token('day',124,150),token('27.00',1000,150)];
while(ctx.words.length<1411){let n=ctx.words.length;ctx.words.push(token('noise',1900+(n%5)*80,1000+Math.floor(n/5)*25))}
const original=JSON.stringify(ctx.words);
assert.equal(run('adaptiveHeaderGeometry(words).reason'),'No labelled earnings rows');
run('audit=earningsStructureAudit(words,"synthetic 1411-token full page")');
assert.equal(run('audit.tokenCount'),1411);
assert.equal(run('audit.headerSearchSkipped'),true,'production exits before examining header words');
assert.ok(run('audit.headers.some(h=>h.match==="partial fragment")'));
assert.ok(run('audit.headers.some(h=>h.direction==="stacked"&&h.joined==="hoursworked"&&h.accepted)'));
assert.ok(run('audit.headers.some(h=>h.direction==="stacked"&&h.joined==="unitspaid"&&h.accepted)'));
assert.ok(run('audit.bands.some(b=>b.ordered&&b.columns.every(c=>c.bounds&&c.options[0].tokens.length>=2))'),'all four proposals reconstructed without whole-word labels');
assert.ok(run('audit.rows.some(r=>r.reason.includes("Rejected by production label regex")&&r.reconstructedLabels.some(l=>l.kind==="basic"))'));
assert.ok(run('audit.rows.some(r=>r.reconstructedLabels.some(l=>l.kind==="sunday"))'));
assert.equal(JSON.stringify(ctx.words),original,'audit cannot mutate source evidence');
assert.equal(run('adaptiveHeaderGeometry(words).reason'),'No labelled earnings rows','diagnostic proposals do not enable the scanner');
assert.match(run('earningsStructureAuditHtml(words,"synthetic 1411-token full page")'),/Header search NOT REACHED/);
assert.match(run('earningsStructureAuditHtml(words,"synthetic 1411-token full page")'),/proposed \[left,right\]/);
// Identifies confidence loss explicitly, including missing conf (not coerced to valid).
ctx.confidenceWords=[token('Hours',100,10),token('worked',144,10),token('Units',250,10),token('paid',300,10),token('Rate',450,10),token('Amount',600,10),token('Basic',0,100,40,19)];
run('low=earningsStructureAudit(confidenceWords)');
assert.equal(run('low.headerSearchSkipped'),true);
assert.match(run('low.tokens[6].rowFilter'),/below 20/);
delete ctx.confidenceWords[6].conf;
assert.match(run('earningsStructureAudit(confidenceWords).tokens[6].rowFilter'),/Missing conf/);
// Fixed window and fixed row-centre cap are reported using production row membership.
ctx.windowWords=[token('Hours',100,20),token('Units',250,20),token('Rate',450,20),token('Amount',600,20),token('Basic',0,700)];
run('windowAudit=earningsStructureAudit(windowWords)');
assert.equal(run('windowAudit.headerSearchSkipped'),false);
assert.match(run('windowAudit.tokens[0].headerGate'),/520 px/);
ctx.jitterWords=[{text:'Ba',conf:95,bbox:{x0:0,y0:100,x1:32,y1:140}},{text:'sic',conf:95,bbox:{x0:32,y0:118,x1:80,y1:158}}];
run('jitterAudit=earningsStructureAudit(jitterWords)');
assert.equal(run('jitterAudit.normalRows.length'),2,'18 px centre shift exceeds production cap');
assert.equal(run('jitterAudit.rows.length'),1,'height-relative diagnostic row retains the fragments');
assert.ok(run('jitterAudit.rows[0].reconstructedLabels.some(l=>l.kind==="basic")'));
// Partial tokens separated by a column-sized gap cannot propose a complete heading.
ctx.gapWords=[token('Ra',100,10),token('te',240,10)];
run('gapAudit=earningsStructureAudit(gapWords)');
assert.ok(run('gapAudit.headers.some(h=>h.joined==="rate"&&!h.accepted&&h.reason.includes("gap"))'));
assert.equal(run('gapAudit.bands.some(b=>b.ordered)'),false);
// Competing Amount headings are shown as alternatives; no rightmost/nearest guessing.
ctx.competing=[token('Hours',100,10),token('Units',250,10),token('Rate',450,10),token('Amount',600,10),token('Amount',800,10)];
run('competingAudit=earningsStructureAudit(competing)');
assert.equal(run('competingAudit.bands[0].ordered'),false);
assert.equal(run('competingAudit.bands[0].columns[3].options.length'),2);
assert.equal(run('competingAudit.bands[0].columns[3].bounds'),null);
ctx.unsafe=[token('<img onerror=bad>',0,0),{text:'Hours',bbox:{x0:5,y0:5,x1:5,y1:10}}];
const safeHtml=run('earningsStructureAuditHtml(unsafe,"<unsafe>")');
assert.match(safeHtml,/&lt;img/);assert.ok(!safeHtml.includes('<img onerror'));
assert.match(safeHtml,/valid geometry false/);
// A missing earnings header does not prevent a trustworthy PAYE exact occurrence.
ctx.paye=[token('PAYE',3200,541),token('1060.07',3275,541),token('1060.07',3275,541)];
run('payeModel=teachingSpatialModel(paye);payeOccurrences=teachingExactOccurrences(payeModel,1060.07,{x1:4200,y1:6000});lastTeachingDiagnostic={spatial:payeModel};field={field:"tax",target:1060.07,occurrences:payeOccurrences,selected:payeOccurrences[0].id,saved:false,reason:"Selected unique trustworthy exact occurrence"}');
assert.equal(run('payeOccurrences.length'),1);
assert.equal(run('adaptiveHeaderGeometry(paye).reason'),'No labelled earnings rows');
assert.match(run('teachingPayeFocusedHtml(field)'),/collapsed IDs/);
assert.match(run('teachingPayeFocusedHtml(field)'),/3275/);
assert.match(run('teachingPayeFocusedHtml(field)'),/not a prerequisite/);
ctx.paye.push(token('1060.07',3275,700));
run('payeModel=teachingSpatialModel(paye);payeOccurrences=teachingExactOccurrences(payeModel,1060.07,{x1:4200,y1:6000})');
assert.equal(run('payeOccurrences.length'),2,'separate positions remain separate');
ctx.noPaye=[token('1060',3275,541),token('07',3350,541)];
run('lastTeachingDiagnostic={spatial:teachingSpatialModel(noPaye)};field={field:"tax",target:1060.07,occurrences:[],selected:null,saved:false,reason:"No exact normalized numeric match"}');
assert.match(run('teachingPayeFocusedHtml(field)'),/No normalized-equal candidate exists/);
// bf11.12: per-heading production gate ledger, including the body-row blocker.
ctx.gateWords=[token('Rate',450,20),...ctx.jitterWords];
run('gateAudit=earningsStructureAudit(gateWords);grouping=productionGroupingEvidence(gateWords,gateWords.map((w,id)=>id));heading=gateAudit.headers.find(h=>h.joined==="rate"&&h.accepted);gates=earningsHeadingGateEvidence(heading,gateAudit,grouping)');
assert.match(run('gates.headerPrerequisite'),/NOT REACHED/);
assert.match(run('gates.regexGate'),/not expected to become labelled earnings rows/,'header role is not confused with a body description');
assert.ok(run('gates.fragmentedBodyRows.some(r=>r.grouping.some(t=>t.nearestRejected.some(g=>g.dist===18&&g.limit===17&&g.reason.includes("17px"))))'),'exact pre-section grouping measurements show why Basic fragments split');
assert.match(run('gates.headerWindow520'),/Not evaluated/,'a downstream gate is not blamed when it was never reached');
assert.match(run('gates.regionGate.path'),/Separate/);
const gateBefore=JSON.stringify(ctx.gateWords);
assert.match(run('earningsStructureAuditHtml(gateWords,"gate fixture")'),/Diagnostic headings versus production gates/);
assert.equal(JSON.stringify(ctx.gateWords),gateBefore);
ctx.gateWords=[token('Ra',100,10),token('te',116,10)];
run('gateAudit=earningsStructureAudit(gateWords);grouping=productionGroupingEvidence(gateWords,[0,1]);gates=earningsHeadingGateEvidence(gateAudit.headers.find(h=>h.joined==="rate"),gateAudit,grouping)');
assert.ok(run('gates.headerVocabulary.every(t=>!t.wholeTokenMatches)'),'diagnostic fragment joining does not alter whole-token vocabulary');
ctx.gateWords=[token('Rate',100,10,32,19)];
run('gateAudit=earningsStructureAudit(gateWords);gates=earningsHeadingGateEvidence(gateAudit.headers[0],gateAudit,productionGroupingEvidence(gateWords,[0]))');
assert.match(run('gates.confidenceGate[0].reason'),/below 20/);
assert.equal(run('gates.rowGrouping.length'),0,'confidence filtering occurs before row grouping');
run('gateAudit=earningsStructureAudit(windowWords);gates=earningsHeadingGateEvidence(gateAudit.headers.find(h=>h.joined==="rate"),gateAudit,productionGroupingEvidence(windowWords,[2]))');
assert.equal(run('gates.headerWindow520[0].passed'),false);
// Compact suspects use this same captured audit, including confidence rejects.
ctx.suspectWords=[token('Ba',0,100,16,19),token('sic',16,100,24),token('Pay',40,100,24),token('Saturday',0,150),token('enhanced',0,200),token('hours',70,200),token('OT',0,250),token('noise',0,300),token('Rate',400,20),token('Amount',500,20)];
const suspectBefore=JSON.stringify(ctx.suspectWords);
run('suspectAudit=earningsStructureAudit(suspectWords);suspects=earningsLabelSuspects(suspectAudit)');
assert.ok(run('suspects.some(s=>s.neighbouringReconstructions.some(j=>j.joined==="basicpay"&&j.tokenIds.join(",")==="0,1,2"))'));
assert.ok(run('suspects.some(s=>s.confidenceRemovedTokenIds.includes(0))'));
assert.ok(run('suspects.some(s=>s.productionRowId===null&&s.tokens[0].id===0&&s.rejectionReason.includes("below 20"))'));
assert.ok(run('suspects.some(s=>s.exactText==="sic Pay"&&s.kindFromSpatialRow===null&&s.rejectionReason.includes("returned null"))'));
assert.ok(run('suspects.some(s=>s.exactText==="Saturday"&&s.kindFromSpatialRow===null)'));
assert.ok(run('suspects.some(s=>s.exactText==="enhanced hours")'));
assert.ok(run('suspects.some(s=>s.exactText==="OT"&&s.kindFromSpatialRow==="ot")'));
assert.ok(run('suspects.every(s=>!["noise","Rate","Amount"].includes(s.exactText))'));
assert.equal(run('suspects.find(s=>s.productionRowId===null).tokens[0].b.cx'),8);
const suspectHtml=run('earningsStructureAuditHtml(suspectWords,"suspect fixture")');
assert.ok(suspectHtml.indexOf('Earnings label suspects')<suspectHtml.indexOf('Diagnostic headings versus production gates'));
assert.match(suspectHtml,/productionGrouping/);
assert.equal(JSON.stringify(ctx.suspectWords),suspectBefore);
const auditBefore=run('JSON.stringify(suspectAudit)');
run('earningsLabelSuspectsHtml(suspectAudit,suspectWords)');
assert.equal(run('JSON.stringify(suspectAudit)'),auditBefore,'suspect rendering cannot mutate the captured audit');
run('splitSuspects=earningsLabelSuspects(earningsStructureAudit(jitterWords))');
assert.ok(run('splitSuspects.some(s=>s.neighbouringReconstructions.some(j=>j.joined==="basic"&&j.productionRows.length===2))'),'neighbour fragments remain visible across the production 17px row split');
ctx.excludedLabel=[token('Basic',0,100),token('taxable',50,100),token('pay',115,100)];
assert.ok(run('earningsLabelSuspects(earningsStructureAudit(excludedLabel)).some(s=>s.rejectionReason.includes("Basic label exclusion matched"))'));
// Same-height but distant fragments must not fabricate a diagnostic label.
ctx.distantFragments=[token('Ba',0,100,16),token('sic',300,100,24)];
assert.equal(run('earningsLabelSuspects(earningsStructureAudit(distantFragments)).some(s=>s.neighbouringReconstructions.length)'),false);
run('suspectAudit.tokens[0].text="<img onerror=bad> Basic"');
assert.match(run('earningsLabelSuspectsHtml(suspectAudit,suspectWords)'),/&lt;img/);
assert.ok(!run('earningsLabelSuspectsHtml(suspectAudit,suspectWords)').includes('<img onerror'));
// Report-shaped SYNTHETIC fixture: the counts/headings are reported facts, but
// body text, confidence and geometry are not captured device evidence. Two
// different upstream causes deliberately give the same 1411/178/0 summary.
ctx.reportShape=[];
for(let row=0;row<178;row++){
 const texts=row===0?['HOURS','WORKED','SESSIONS','UNITS','PAID','RATE','AMOUNT','noise']:row===1?['Ba','sic','Pay','noise','noise','noise','noise','noise']:Array(row<165?8:7).fill('noise');
 texts.forEach((text,col)=>ctx.reportShape.push(token(text,col*100,row*30)));
}
run('reportRows=spatialRows(reportShape)');
assert.equal(ctx.reportShape.length,1411);
assert.equal(run('reportRows.length'),178);
assert.equal(run('reportRows.filter(r=>kindFromSpatialRow(r)).length'),0);
assert.equal(run('fuzzyLabel(reportRows[1].text).startsWith("ba sic pay")'),true);
assert.equal(run('adaptiveHeaderGeometry(reportShape).reason'),'No labelled earnings rows');
assert.equal(run('earningsRegionAnchor(reportRows).reason'),'Printed earnings-region heading not proved');
// Header recognition cannot satisfy the required body-description predicate.
assert.equal(run('kindFromSpatialRow(reportRows[0])'),null);
// A confidence-filtered whole Basic token yields the very same summary. These
// counts cannot establish which upstream cause occurred on the actual phone.
ctx.confidenceShape=ctx.reportShape.map(w=>({...w,bbox:{...w.bbox}}));
ctx.confidenceShape[8].text='Basic';ctx.confidenceShape[8].conf=19;
ctx.confidenceShape[9].text='noise';
run('confidenceRows=spatialRows(confidenceShape)');
assert.equal(ctx.confidenceShape.length,1411);
assert.equal(run('confidenceRows.length'),178);
assert.equal(run('confidenceRows.filter(r=>kindFromSpatialRow(r)).length'),0);
assert.equal(run('adaptiveHeaderGeometry(confidenceShape).reason'),'No labelled earnings rows');
assert.ok(!run('confidenceRows.some(r=>r.words.some(w=>w.text==="Basic"))'));
console.log('PASS: header early exit, synthetic 1411/178/0 summaries with distinct upstream causes, fragmented/stacked reconstruction, per-heading confidence/17px/regex/region/520px gate ledger, column ambiguity, unchanged evidence/acceptance, escaped diagnostics and PAYE lineage.');
