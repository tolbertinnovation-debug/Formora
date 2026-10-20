import { mock, test } from 'node:test';
import assert from 'node:assert/strict';
import { makeForm } from '../model.js';
import { HttpError } from '../server/validation.js';
let query;
mock.module('../server/db.js',{namedExports:{database:()=>({query:(...args)=>query(...args)})}});
mock.module('../server/auth.js',{namedExports:{requireUser:async req=>{if(!req.actor)throw new HttpError(401,'Sign in.');return{id:req.actor,emailVerified:req.verified===true};}}});
const forms=(await import('../api/forms.js')).default;
const responses=(await import('../api/responses.js')).default;
const publicForms=(await import('../api/public.js')).default;
function res(){return{statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.statusCode=n;return this;},json(value){this.body=value;}};}
function req(method,actor,body={},url='/api/forms'){return{method,actor,body,url,headers:{host:'localhost:4173','content-type':'application/json'}};}

test('private endpoints reject unauthenticated requests before querying data',async()=>{
  query=()=>assert.fail('An unauthenticated request reached the database');
  for(const handler of [forms,responses]){const response=res();await handler(req('GET'),response);assert.equal(response.statusCode,401);}
});
test('workspace listing is bound to the server-authenticated owner',async()=>{
  query=async(sql,params)=>{assert.match(sql,/owner_id=\$1/);assert.deepEqual(params,['owner-a']);return{rows:[]};};
  const response=res();await forms(req('GET','owner-a'),response);assert.equal(response.statusCode,200);assert.deepEqual(response.body.forms,[]);
});
test('a second owner cannot edit or remove a foreign form',async()=>{
  const f=makeForm('training');
  query=async(sql,params)=>{assert.match(sql,/owner_id=\$2/);assert.equal(params[1],'owner-b');return{rows:[]};};
  for(const method of ['PUT','DELETE']){const response=res();await forms(req(method,'owner-b',{...f,version:1}),response);assert.equal(response.statusCode,409);assert.equal('form' in response.body,false);}
});
test('a foreign owner cannot read a response table',async()=>{
  query=async(sql,params)=>{assert.match(sql,/owner_id=\$2/);assert.equal(params[1],'owner-b');return{rows:[]};};
  const response=res();await responses(req('GET','owner-b',{},'/api/responses?id='+crypto.randomUUID()),response);assert.equal(response.statusCode,404);
});
test('unverified owners cannot publish',async()=>{
  query=()=>assert.fail('Unverified publishing reached the database');
  const response=res();await forms(req('PUT','owner-a',{id:crypto.randomUUID(),version:1,action:'publish'}),response);assert.equal(response.statusCode,403);
});
test('public links reveal only a published form snapshot',async()=>{
  const f=makeForm('training');delete f.responses;
  query=async(sql)=>{assert.match(sql,/published_document IS NOT NULL/);assert.match(sql,/deleted_at IS NULL/);return{rows:[{id:f.id,published_document:f,published_at:'2026-10-20T00:00:00.000Z',owner_id:'secret-owner',responses:['secret']} ]};};
  const response=res();await publicForms(req('GET',null,{},'/api/public?id=abcdefghijklmnopqrstuvwx'),response);assert.equal(response.statusCode,200);assert.deepEqual(Object.keys(response.body),['form','publishedAt']);assert.equal('owner_id' in response.body,false);
});
test('unpublished links return 404 and reject new submissions',async()=>{
  query=async()=>({rows:[]});for(const method of ['GET','POST']){const response=res();await publicForms(req(method,null,{},'/api/public?id=abcdefghijklmnopqrstuvwx'),response);assert.equal(response.statusCode,404);}
});
