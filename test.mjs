import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {readFileSync} from 'node:fs';
import * as engine from './docs/engine.mjs';
import {server} from './server.mjs';
const fixture=()=>JSON.parse(readFileSync(new URL('./docs/example.json',import.meta.url)));
test('blind replay duplicates 80 units; new keys cannot protect old writes',()=>{
  const d=fixture();for(const recovery of ['blind','idempotent']){
    const r=engine.evaluate({...d,recovery});assert.equal(r.decision,'blocked');assert.equal(r.rows[1].delta,80);
  }
  assert.equal(engine.evaluate({...d,recovery:'reconcile'}).decision,'ready');
});
test('preexisting duplicates cannot be erased by future reconciliation',()=>{
  const d=fixture();d.attempts.push({...d.attempts[1],id:'another'});d.recovery='reconcile';
  assert.equal(engine.evaluate(d).decision,'blocked');
});
test('a conflicting key or excluded missing transfer blocks recovery',()=>{
  const d=fixture();assert.equal(engine.evaluate({...d,recovery:'reconcile',selection:[]}).decision,'blocked');
  d.attempts.push({...d.attempts[1],id:'different',units:3});assert.throws(()=>engine.evaluate(d),/Conflicting/);
});
test('HTTP review agrees with the browser engine and rejects invalid data',async()=>{
  const app=server();app.listen(0,'127.0.0.1');await once(app,'listening');
  try{
    const url='http://127.0.0.1:'+app.address().port+'/api/evaluate';
    const post=body=>fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body});
    const r=await post(JSON.stringify(fixture()));assert.equal(r.status,200);assert.deepEqual(await r.json(),await engine.evaluate(fixture()));
    assert.equal((await post('{}')).status,400);
  }finally{await new Promise(done=>app.close(done));}
});
