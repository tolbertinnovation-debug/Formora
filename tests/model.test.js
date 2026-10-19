import test from 'node:test';
import assert from 'node:assert/strict';
import { makeForm, addResponse, csv, validWorkspace } from '../model.js';

test('template instances have independent fields, IDs and responses', () => {
  const first=makeForm('training'), second=makeForm('training');
  assert.notEqual(first.id,second.id);
  assert.notEqual(first.fields[0].id,second.fields[0].id);
  first.fields[3].options.push('New session');
  assert.equal(second.fields[3].options.includes('New session'),false);
  assert.equal(validWorkspace([first,second]),true);
});
test('invalid answers do not create a response', () => {
  const f=makeForm('training');
  assert.equal(Object.keys(addResponse(f,{}).errors).length,3);
  const answers=Object.fromEntries(f.fields.map(q=>[q.id,'']));
  answers[f.fields[0].id]='Samuel';answers[f.fields[1].id]='not-an-email';answers[f.fields[3].id]='invented';
  assert.equal(Object.keys(addResponse(f,answers).errors).length,2);
  assert.equal(f.responses.length,0);
});
test('valid response trims values, drops unknown keys and survives serialization', () => {
  const f=makeForm('training');
  const answers={ [f.fields[0].id]:' Samuel ',[f.fields[1].id]:'samuel@example.com',[f.fields[3].id]:'Morning',unknown:'discard' };
  const result=addResponse(f,answers);
  assert.equal(Object.keys(result.errors).length,0);
  assert.equal(f.responses[0].answers[f.fields[0].id],'Samuel');
  assert.equal('unknown' in result.response.answers,false);
  assert.equal(validWorkspace(JSON.parse(JSON.stringify([f]))),true);
});
test('CSV escapes quotes and newlines and neutralizes spreadsheet formulas', () => {
  const f=makeForm('feedback');f.fields[0].label='=DANGEROUS()';
  addResponse(f,{[f.fields[0].id]:' +cmd()',[f.fields[1].id]:'Good',[f.fields[2].id]:'One "quote"\nand another line'});
  const out=csv(f);
  assert.ok(out.includes('"\'=DANGEROUS()"'));
  assert.ok(out.includes('"\'+cmd()"'));
  assert.ok(out.includes('"One ""quote""\nand another line"'));
});
test('malformed saved workspaces are rejected', () => {
  assert.equal(validWorkspace({forms:[]}),false);
  assert.equal(validWorkspace([{id:'bad'}]),false);
  const f=makeForm();f.fields[0].type='script';assert.equal(validWorkspace([f]),false);
});
