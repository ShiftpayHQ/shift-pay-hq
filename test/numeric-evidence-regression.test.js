// Diagnostic views only; no iPhone OCR stream is embedded here.
// Run: node test/numeric-evidence-regression.test.js
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const script=fs.readFileSync(require('node:path').join(__dirname,'index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
new vm.Script(script);
function source(name){const start=script.indexOf('function '+name+'(');assert.ok(start>=0,name);for(let end=script.indexOf('}',start);end>=0;end=script.indexOf('}',end+1)){const s=script.slice(start,end+1);try{new vm.Script('('+s+')');return s}catch{}}throw Error(name)}
const ctx=vm.createContext({}),run=s=>vm.runInContext(s,ctx);
for(const name of ['teachingNumericEvidence','teachingNumericEvidenceHtml','teachingSpatialModel','teachingPhysicalOccurrences','teachingSamePhysical','teachingExactOccurrences','wordBox','normalizeTeachingNumber','escDbg'])run(source(name));
const token=(text,x=100,y=10,width=String(text).length*8,height=20,conf=95)=>({text,conf,bbox:{x0:x,y0:y,x1:x+width,y1:y+height}});
const field=(target,name='Gross')=>({field:name==='Gross'?'gross':'tax',name,manual:String(target),target,selected:null,saved:false,occurrences:[],reason:'No exact normalized numeric match'});
ctx.field=field(5349.63);
ctx.words=Array.from({length:80},(_,i)=>token((5300+i+.12).toFixed(2),100,10+i*40));
run('model=teachingSpatialModel(words);evidence=teachingNumericEvidence(field,model);lastTeachingDiagnostic={spatial:model}');
assert.equal(run('evidence.counts.physicalOccurrences'),80);
assert.equal(run('evidence.counts.exactPhysical'),0);
assert.equal(run('evidence.counts.nonExactPhysical'),80,'80 numeric locations do not imply an exact target match');
assert.equal(run('evidence.nearestCandidates.length'),10);
assert.equal(run('evidence.nearestPhysical.length'),10);
assert.equal(run('evidence.nearestPhysical[0].value'),5350.12);
assert.ok(run('evidence.nearestPhysical.every((e,i,a)=>!i||a[i-1].absoluteDifference<=e.absoluteDifference)'));
assert.ok(run('evidence.nearestCandidates.every(c=>c.raw.length&&c.tokenIds.length&&Number.isFinite(c.difference)&&c.groupId!==null&&c.b.cx>0&&c.rowId!==null)'));
assert.ok(run('evidence.searchFragments.includes("5349")&&evidence.searchFragments.includes("349")&&evidence.searchFragments.includes("49")&&evidence.searchFragments.includes("63")&&evidence.searchFragments.includes(".63")&&evidence.searchFragments.includes("534")'));
assert.equal(run('evidence.counts.representations'),run('evidence.counts.unparsed+evidence.counts.eligibleMembers+evidence.counts.provenanceOnly+evidence.counts.ungroupedNumeric'));
assert.equal(run('evidence.counts.eligibleMembers'),run('evidence.counts.physicalOccurrences+evidence.counts.collapsedMembers'));
assert.match(run('teachingNumericEvidenceHtml(field)'),/10 closest physical occurrences/);
assert.doesNotMatch(run('teachingNumericEvidenceHtml(field)'),/diagnostic unavailable/);
// Raw digit evidence without a separator; diagnostic must not create 5349.63.
ctx.words=[token('5349'),token('63',138)];
run('model=teachingSpatialModel(words);evidence=teachingNumericEvidence(field,model)');
assert.equal(run('evidence.counts.exactPhysical'),0);
assert.ok(run('evidence.digitObservations.some(o=>o.split&&!o.hasSeparator)'));
assert.ok(run('evidence.findings.some(f=>f.includes("without decimal punctuation"))'));
assert.ok(run('evidence.windows.some(w=>w.boundaries.length)'),'existing run boundary reasons retained');
assert.equal(run('model.candidates.some(c=>c.v===5349.63)'),false);
// Digit sequence is present but the existing normalizer yields a different value.
ctx.words=[token('534963')];
run('model=teachingSpatialModel(words);evidence=teachingNumericEvidence(field,model)');
assert.ok(run('evidence.findings.some(f=>f.includes("normalized to a different number"))'));
assert.equal(run('evidence.nearestCandidates[0].value'),534963);
// Separate punctuation and fragments are searchable before numeric interpretation.
ctx.words=[token('Gross 5349.63')];
run('model=teachingSpatialModel(words);evidence=teachingNumericEvidence(field,model)');
assert.ok(run('evidence.matches[0].literalTargetSubstring'));
assert.ok(run('evidence.relatedRepresentations.some(c=>c.value===null&&c.reason.includes("Label"))'),'raw digits inside unsupported text keep the actual parsing rejection');
assert.equal(run('evidence.counts.exactPhysical'),0);
ctx.words=[token('1060',100),token('.',135,25,2,5),token('07',140)];ctx.field=field(1060.07,'PAYE');
run('model=teachingSpatialModel(words);evidence=teachingNumericEvidence(field,model)');
assert.ok(run('evidence.digitObservations.some(o=>o.punctuationOnly)'));
assert.ok(run('evidence.windows.some(w=>w.tokens.some(t=>t.text==="."))'));
assert.ok(run('evidence.searchFragments.includes("1060")&&evidence.searchFragments.includes("060")&&evidence.searchFragments.includes(".07")'));
// Quarantined representations remain in both closest-candidate and raw searches.
ctx.words=[token('1060.07',200,20,70,90),token('1060',200,25,40,20),token('07',250,80,20,20)];
run('model=teachingSpatialModel(words);evidence=teachingNumericEvidence(field,model)');
assert.ok(run('evidence.exactCandidates.some(c=>c.reason.includes("quarantined"))'));
assert.equal(run('evidence.counts.exactPhysical'),0);
assert.ok(run('evidence.matches.some(t=>t.id===0&&t.exclusion)'));
assert.ok(run('evidence.findings.some(f=>f.includes("none reached an exact physical group"))'));
// A grouping invariant failure is diagnosed, never repaired by the view.
ctx.words=[token('1060.07')];
run('model=teachingSpatialModel(words);model.physical=[];evidence=teachingNumericEvidence(field,model)');
assert.ok(run('evidence.findings.some(f=>f.startsWith("Grouping gap:"))'));
assert.equal(run('model.physical.length'),0);
// Confidence remains per source token, including missing confidence.
ctx.words=[token('1060.07')];delete ctx.words[0].conf;
run('model=teachingSpatialModel(words);evidence=teachingNumericEvidence(field,model)');
assert.equal(run('evidence.nearestCandidates[0].raw[0].confidence'),null);
ctx.words=[token('88.88')];
run('model=teachingSpatialModel(words);evidence=teachingNumericEvidence(field,model)');
assert.ok(run('evidence.missingCharacters.length>0'));
assert.ok(run('evidence.findings.some(f=>f.includes("outside the collected stream"))'),'absence is qualified, not an unsupported engine claim');
// Duplicate groups keep their IDs; separate positions remain two occurrences.
ctx.words=[token('1060.07'),token('1060.07'),token('1060.07',300)];
run('model=teachingSpatialModel(words);evidence=teachingNumericEvidence(field,model)');
assert.equal(run('evidence.counts.exactPhysical'),2);
assert.ok(run('evidence.nearestPhysical.some(p=>p.collapsedIds.length>1)'));
// No edits to raw evidence, group members, reasons, exact occurrences or fields.
const before=run('JSON.stringify({words,model,field,exact:teachingExactOccurrences(model,1060.07,{x1:1000,y1:1000})})');
run('teachingNumericEvidence(field,model);teachingNumericEvidence({...field,target:5349.63,manual:"5349.63"},model);lastTeachingDiagnostic={spatial:model};teachingNumericEvidenceHtml(field)');
assert.equal(run('JSON.stringify({words,model,field,exact:teachingExactOccurrences(model,1060.07,{x1:1000,y1:1000})})'),before);
ctx.words=[token('<img onerror=bad>1060'),token('.07',300)];
run('model=teachingSpatialModel(words);lastTeachingDiagnostic={spatial:model}');
const rendered=run('teachingNumericEvidenceHtml(field)');assert.match(rendered,/&lt;img/);assert.ok(!rendered.includes('<img onerror'));
assert.equal(run('teachingNumericEvidenceHtml({...field,selected:0})'),'','selected fields do not need failure panels');
console.log('PASS: 80-to-zero stage counts, closest candidate/group ranking, raw fragment/punctuation search, exclusions, grouping gaps, literal-digit limits, provenance, confidence and read-only diagnostics.');
