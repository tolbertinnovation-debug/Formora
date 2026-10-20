import test from 'node:test';
import assert from 'node:assert/strict';
import { makeForm } from '../model.js';
import { formDocument,cleanAnswers } from '../server/validation.js';
import { guard,body } from '../server/http.js';
import { requireUser,authCookies } from '../server/auth.js';

test('server strips client-controlled ownership, response and publishing metadata',()=>{
  const draft={...makeForm('training'),owner_id:'another-user',published:true,publicId:'chosen',responses:[{answers:{}}]};
  const document=formDocument(draft,true);
  assert.deepEqual(Object.keys(document),['id','title','description','color','fields']);
  assert.equal('owner_id' in document,false);
});
test('publishing rejects empty questions and invalid dropdowns',()=>{
  const f=makeForm('training');f.fields[0].label='';assert.throws(()=>formDocument(f,true),/labels/);
  f.fields[0].label='Name';f.fields[3].options=[];assert.throws(()=>formDocument(f,true),/options/);
});
test('server rejects duplicate question IDs and unsupported fields',()=>{
  const f=makeForm('training');f.fields[1].id=f.fields[0].id;assert.throws(()=>formDocument(f),/question/);
  f.fields[1].id=crypto.randomUUID();f.fields[1].type='html';assert.throws(()=>formDocument(f),/question/);
});
test('answer validation is enforced without trusting browser validation',()=>{
  const f=makeForm('training');assert.throws(()=>cleanAnswers(f,{}),e=>e.status===400&&Object.keys(e.details).length===3);
  assert.throws(()=>cleanAnswers(f,{[f.fields[0].id]:{injection:'x'}}),/text values/);
  const answers={[f.fields[0].id]:' Learner ',[f.fields[1].id]:'learner@example.com',[f.fields[3].id]:'Evening',unknown:'ignored'};
  const result=cleanAnswers(f,answers);assert.equal(result[f.fields[0].id],'Learner');assert.equal('unknown' in result,false);
});
test('mutations reject cross-origin requests and non-JSON bodies',()=>{
  assert.throws(()=>guard({method:'PUT',headers:{host:'app.example.com',origin:'https://evil.example','content-type':'application/json'}},['PUT']),e=>e.status===403);
  assert.throws(()=>guard({method:'POST',headers:{host:'app.example.com','content-type':'text/plain'}},['POST']),e=>e.status===415);
  assert.throws(()=>body({body:'x'.repeat(100001)}),e=>e.status===413);
});
test('authentication denies missing, revoked and banned sessions',async()=>{
  await assert.rejects(()=>requireUser({headers:{}}),e=>e.status===401);
  const original=globalThis.fetch,base=process.env.NEON_AUTH_BASE_URL;process.env.NEON_AUTH_BASE_URL='https://example.neon.tech/auth';
  try{
    globalThis.fetch=async()=>Response.json(null);await assert.rejects(()=>requireUser({headers:{cookie:'__Secure-neon-auth.session_token=invalid'}}),e=>e.status===401);
    globalThis.fetch=async()=>Response.json({session:{id:'test'},user:{id:'u',banned:true}});await assert.rejects(()=>requireUser({headers:{cookie:'__Secure-neon-auth.session_token=invalid'}}),e=>e.status===401);
    globalThis.fetch=async()=>Response.json({session:{id:'test'},user:{id:'owner-1',emailVerified:true}});assert.deepEqual(await requireUser({headers:{cookie:'__Secure-neon-auth.session_token=valid'}}),{id:'owner-1',emailVerified:true});
  }finally{globalThis.fetch=original;if(base)process.env.NEON_AUTH_BASE_URL=base;else delete process.env.NEON_AUTH_BASE_URL;}
});

test('only managed-auth cookies are forwarded to the authentication service',()=>{
  assert.equal(authCookies('_vercel_jwt=private; __Secure-neon-auth.session_token=test; unrelated=secret'),'__Secure-neon-auth.session_token=test');
});
