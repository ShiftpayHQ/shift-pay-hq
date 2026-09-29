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
for(const name of ['earningsStructureAudit','earningsStructureAuditHtml','teachingPayeFocusedHtml','spatialRows','kindFromSpatialRow','wordCenterX','earningsRegionAnchor','rowInsideEarningsRegion','adaptiveHeaderGeometry','teachingSpatialModel','teachingPhysicalOccurrences','teachingSamePhysical','teachingExactOccurrences','teachingCandidateReason','wordBox','normalizeTeachingNumber','fuzzyLabel','ocrNormalise','escDbg'])run(source(name));
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
console.log('PASS: header early exit, 1411-token fragmented/stacked reconstruction, confidence loss, fixed-pixel gates, column ambiguity, unchanged evidence/acceptance, escaped diagnostics and PAYE lineage.');
