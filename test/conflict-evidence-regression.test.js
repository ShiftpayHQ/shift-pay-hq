// Run: node test/conflict-evidence-regression.test.js
// Reported device identity is preserved; conflicting counterparts below are synthetic.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const script=fs.readFileSync(require('node:path').join(__dirname,'index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];new vm.Script(script);
function source(name){const start=script.indexOf('function '+name+'(');assert.ok(start>=0,name);for(let end=script.indexOf('}',start);end>=0;end=script.indexOf('}',end+1)){const s=script.slice(start,end+1);try{new vm.Script('('+s+')');return s}catch{}}throw Error(name)}
const ctx=vm.createContext({fixture:require('./iphone-teaching-fixture.json')}),run=s=>vm.runInContext(s,ctx);
for(const name of ['teachingConflictEvidence','teachingConflictEvidenceHtml','teachingSpatialModel','teachingPhysicalOccurrences','teachingSamePhysical','teachingExactOccurrences','wordBox','normalizeTeachingNumber','escDbg'])run(source(name));
run(`function fixtureModel(extras=[],recovery=''){
 const candidate=r=>{const w={text:r.text,bbox:r.bbox},p=normalizeTeachingNumber(r.text);return {id:r.id,w,b:wordBox(w),source:r.source,parts:r.parts,v:p.value,normalized:p.normalized,rowId:54,reason:''}};
 const candidates=fixture.representations.map(candidate);if(recovery)candidates[0].recovery=recovery;
 const rawToken=(id,w)=>({id,w,b:wordBox(w),excluded:''});
 // These label glyph IDs/boxes are synthetic; only the reported text is reproduced.
 const labels=fixture.reportedLabel.split(' ').map((text,id)=>rawToken(id,{text,bbox:{x0:3100+id*15,y0:541,x1:3110+id*15,y1:587}}));
 const raw=[...labels,rawToken(687,candidates[0].w)];
 for(const e of extras){const r={id:e.id??500,parts:[e.tokenId??688],text:e.text,bbox:e.bbox,source:e.source??'word'},c=candidate(r);if(e.valueOverride!==undefined)c.v=e.valueOverride;candidates.push(c);raw.push(rawToken(r.parts[0],c.w))}
 const model={raw,rows:[{id:54,h:46,tokens:raw}],candidates};model.physical=teachingPhysicalOccurrences(model);
 for(const c of candidates)if(c.physicalId!==c.id&&!c.reason)c.reason='Same physical numeric occurrence as candidate '+c.physicalId;
 return model;
}
function inspect(model){const occurrences=teachingExactOccurrences(model,1060.07,fixture.bounds);const selected=occurrences.length===1&&!occurrences[0].problem?occurrences[0].id:null;const field={field:'tax',name:'PAYE',target:1060.07,occurrences,selected,saved:false,reason:occurrences[0]?.problem||'Selected unique trustworthy exact occurrence'};return {field,audit:teachingConflictEvidence(field,model)}}`);
run('model=fixtureModel();result=inspect(model);lastTeachingDiagnostic={spatial:model}');
assert.equal(run('model.physical.length'),1);
assert.equal(run('result.field.occurrences.length'),1);
assert.equal(run('result.field.occurrences[0].problem'),'','equal duplicate representations alone cannot produce the reported conflict');
assert.equal(run('result.field.occurrences[0].label'),'c m t a x');
assert.equal(run('result.field.selected'),44,'fragmented label is not a unique exact-occurrence rejection');
assert.equal(run('result.audit.exactGroups[0].targetGroup.candidateIds.join(",")'),'44,357');
assert.equal(run('result.audit.exactGroups[0].targetGroup.sourceTokenIds.join(",")'),'687');
assert.equal(run('result.audit.exactGroups[0].targetGroup.rowId'),54);
assert.equal(run('result.audit.exactGroups[0].targetGroup.b.cx'),3394.5);
assert.equal(run('result.audit.exactGroups[0].targetGroup.b.cy'),564);
assert.equal(run('result.audit.exactGroups[0].witnesses.length'),0);
assert.equal(run('result.audit.exactGroups[0].nearby[0].firstFailedCondition'),'z.v === c.v');
assert.equal(run('result.audit.exactGroups[0].pairs[0].differences.join(",")'),'id,source,reason');
assert.match(run('result.audit.exactGroups[0].pairs[0].interpretation'),/NOT two independent OCR readings/);
assert.match(run('teachingConflictEvidenceHtml(result.field)'),/Label text did not cause this numeric conflict/);
// The report alone omits any counterpart. Diagnostics must flag a mismatched snapshot,
// not fabricate another OCR reading from the word/run IDs.
run('result.field.occurrences[0].problem=fixture.reportedFinalReason;result.field.reason=fixture.reportedFinalReason;result.field.selected=null;incomplete=teachingConflictEvidence(result.field,model)');
assert.equal(run('incomplete.exactGroups[0].replayAgrees'),false);
assert.match(run('incomplete.exactGroups[0].consistencyNote'),/cannot be reproduced/);
assert.equal(run('incomplete.exactGroups[0].firstRejectingGroupId'),null);
// A genuinely different complete decimal at equivalent bounds remains a conflict.
run('model=fixtureModel([{text:"1060.01",bbox:fixture.representations[0].bbox}]);result=inspect(model)');
assert.equal(run('result.field.occurrences[0].problem'),'Conflicting numeric OCR at the same position');
assert.equal(run('result.audit.exactGroups[0].firstRejectingGroupId'),500);
assert.equal(run('result.audit.exactGroups[0].witnesses[0].otherGroup.sourceTokenIds.join(",")'),'688');
assert.equal(run('result.audit.exactGroups[0].witnesses[0].otherGroup.value'),1060.01);
assert.equal(run('result.audit.exactGroups[0].witnesses[0].conditions.differentValue'),true);
assert.equal(run('result.audit.exactGroups[0].witnesses[0].conditions.overlapPass'),true);
assert.equal(run('result.audit.exactGroups[0].replayAgrees'),true);
assert.match(run('result.audit.exactGroups[0].decisionChain'),/trustworthy filter excludes/);
// Actual builder reproduction: a contained numeric glyph can survive as a word.
// This is a demonstrated mechanism, not the unidentified device counterpart.
ctx.fragmentWords=[{text:'1060.07',bbox:{x0:3275,y0:541,x1:3514,y1:587},conf:95},{text:'1',bbox:{x0:3280,y0:550,x1:3288,y1:570},conf:95}];
run('model=teachingSpatialModel(fragmentWords);result=inspect(model)');
assert.equal(run('result.field.occurrences[0].problem'),'Conflicting numeric OCR at the same position');
assert.equal(run('result.audit.exactGroups[0].witnesses[0].otherGroup.value'),1);
assert.equal(run('result.audit.exactGroups[0].witnesses[0].overlapOfSmaller'),1);
assert.ok(run('result.audit.exactGroups[0].witnesses[0].overlapOfLarger<.85'));
assert.match(run('result.audit.exactGroups[0].witnesses[0].relation'),/independence not established/);
assert.equal(run('result.audit.exactGroups[0].witnesses[0].conditions.recoveryExemption'),false);
// Existing recovered-parent exception remains exactly as implemented.
run('model=fixtureModel([{text:"1",bbox:{x0:3280,y0:550,x1:3288,y1:570}}],"existing recovery flag");result=inspect(model)');
assert.equal(run('result.field.occurrences[0].problem'),'');
assert.ok(run('result.audit.exactGroups[0].nearby.some(z=>z.conditions.recoveryExemption&&!z.rejects)'));
run('model=fixtureModel([{text:"1060.01",bbox:fixture.representations[0].bbox}],"existing recovery flag");result=inspect(model)');
assert.equal(run('result.audit.exactGroups[0].witnesses.length'),1,'complete contradictory decimals are not exempted');
// Source and geometry branches are visible: run-only evidence cannot satisfy word;
// spatially separate evidence cannot satisfy the overlap branch.
run('model=fixtureModel([{text:"1060.01",source:"run",bbox:fixture.representations[0].bbox}]);result=inspect(model)');
assert.equal(run('result.audit.exactGroups[0].witnesses.length'),0);
assert.ok(run('result.audit.exactGroups[0].nearby.some(z=>z.firstFailedCondition==="z.source !== word")'));
run('model=fixtureModel([{text:"1060.01",bbox:{x0:3600,y0:541,x1:3839,y1:587}}]);result=inspect(model)');
assert.equal(run('result.field.occurrences[0].problem'),'');
assert.equal(run('result.audit.exactGroups[0].nonOverlappingGroupsOmitted'),1);
// Numeric types are recorded to expose inconsistent snapshots; the actual normalizer
// always emits numbers, so this is a deliberately corrupted state, not a device claim.
run('model=fixtureModel([{text:"1060.07",valueOverride:"1060.07",bbox:fixture.representations[0].bbox}]);result=inspect(model)');
assert.equal(run('result.audit.exactGroups[0].witnesses[0].otherGroup.valueType'),'string');
assert.equal(run('result.audit.exactGroups[0].witnesses[0].otherGroup.representations[0].valueConsistentWithText'),false);
// Audit parity over different values, box sizes, sources and recovery flags.
for(const text of ['1060.07','1060.01','1','7'])for(const source of ['word','run'])for(const recovery of ['', 'recovered'])for(const x of [3280,3500,3700]){
 ctx.variant={text,source,bbox:{x0:x,y0:550,x1:x+20,y1:570}};ctx.recovery=recovery;
 run('model=fixtureModel([variant],recovery);result=inspect(model)');
 assert.ok(run('result.audit.exactGroups.every(g=>g.replayAgrees===true)'),'diagnostic must replay the exact production predicate');
}
run('model=fixtureModel();result=inspect(model);lastTeachingDiagnostic={spatial:model}');
const before=run('JSON.stringify({model,field:result.field})');
run('teachingConflictEvidence(result.field,model);teachingConflictEvidenceHtml(result.field)');
assert.equal(run('JSON.stringify({model,field:result.field})'),before,'audit cannot mutate candidates, physical groups or decisions');
run('model.candidates[0].priorReason="<img onerror=bad>"');
assert.match(run('teachingConflictEvidenceHtml(result.field)'),/&lt;img/);
assert.ok(!run('teachingConflictEvidenceHtml(result.field)').includes('<img onerror'));
assert.equal(run('teachingConflictEvidence(result.field,{...model,physical:undefined}).available'),false,'audit never recomputes or mutates grouping');
console.log('PASS: device 44/357 → token 687 is one non-conflicting occurrence; exact conflict witnesses, contained-fragment reproduction, label independence, predicate parity and immutable diagnostics.');
