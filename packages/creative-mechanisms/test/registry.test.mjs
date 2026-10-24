import test from 'node:test';
import assert from 'node:assert/strict';
import {loadRegistry,validateRegistry,compileTruchetSvg,resolveMechanism} from '../scripts/registry.mjs';

test('catalog reconciles every reviewed mechanism and has unique pinned links', () => {
  const data=loadRegistry();
  const report=validateRegistry(data);
  assert.equal(report.sourceLinks,128);
  assert.equal(report.reviewed,6);
  assert.equal(report.linkedOnly,122);
  assert.equal(report.candidates,6);
  assert.match(report.registrySha256,/^[a-f0-9]{64}$/);
});

test('duplicate canonical node ID is rejected',()=>{
  const data=structuredClone(loadRegistry());
  data.registry.records.push(structuredClone(data.registry.records[0]));
  assert.throws(()=>validateRegistry(data), /duplicate canonical ID/);
});

test('unreviewed source cannot masquerade as reviewed',()=>{
  const data=structuredClone(loadRegistry());
  const rec=data.registry.records[0];
  data.catalog.links.find(x=>x.url===rec.source.url).status='linked-only';
  assert.throws(()=>validateRegistry(data), /review claim lacks inspected source|reviewed source count/);
});

test('external URL injection is rejected',()=>{
  const data=structuredClone(loadRegistry());
  data.catalog.links[0].url='https://example.com/malicious/';
  assert.throws(()=>validateRegistry(data),/untrusted catalog URL/);
});

test('render is deterministic for identical values and varies with seed',()=>{
  const a=compileTruchetSvg({seed:35,grid:12});
  const b=compileTruchetSvg({seed:35,grid:12});
  const c=compileTruchetSvg({seed:36,grid:12});
  assert.equal(a,b);
  assert.notEqual(a,c);
  assert.equal((a.match(/<path /g)||[]).length,144);
  assert.match(a, /<svg/);
});

test('bounded numeric and color inputs reject unsafe variants',()=>{
  assert.throws(()=>compileTruchetSvg({grid:65}),/grid/);
  assert.throws(()=>compileTruchetSvg({seed:0.5}),/seed/);
  assert.throws(()=>compileTruchetSvg({tile:256}),/tile/);
  assert.throws(()=>compileTruchetSvg({strokeWidth:100}),/strokeWidth/);
  assert.throws(()=>compileTruchetSvg({ink:'"><script>alert(1)<\/script>'}),/ink/);
});

test('translation remains blocked when adapter has not been implemented',()=>{
  assert.equal(resolveMechanism('pattern.truchet','web-svg').executable,true);
  const candidate=resolveMechanism('field.reaction-diffusion','webgl2');
  assert.equal(candidate.executable,false);
  assert.equal(candidate.requiresNativeVerification,true);
  const unknown=resolveMechanism('mesh.custom-shader-deformer','svg');
  assert.equal(unknown.status,'unsupported');
  assert.equal(unknown.executable,false);
});
