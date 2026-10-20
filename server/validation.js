import { TYPES, validateAnswers } from '../model.js';
export const isId = x => typeof x === 'string' && /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(x);
export const isPublicId = x => typeof x === 'string' && /^[A-Za-z0-9_-]{24}$/.test(x);
export class HttpError extends Error { constructor(status,message,details){super(message);this.status=status;this.details=details;} }
export function formDocument(input, publishing=false) {
  if(!input || !isId(input.id) || typeof input.title!=='string' || input.title.length>150 || typeof input.description!=='string' || input.description.length>2000 || !/^#[a-f\d]{6}$/i.test(input.color) || !Array.isArray(input.fields) || input.fields.length>50) throw new HttpError(400,'Invalid form. Use a title, description, color and at most 50 questions.');
  const ids=new Set();
  const fields=input.fields.map(q=>{
    if(!q || !isId(q.id) || ids.has(q.id) || !Object.hasOwn(TYPES,q.type) || typeof q.label!=='string' || q.label.length>250 || typeof q.required!=='boolean' || !Array.isArray(q.options) || q.options.length>100 || !q.options.every(o=>typeof o==='string'&&o.length<=250))throw new HttpError(400,'Invalid question.');
    ids.add(q.id);
    return {id:q.id,type:q.type,label:q.label.trim(),required:q.required,options:q.type==='select'?[...new Set(q.options.map(o=>o.trim()).filter(Boolean))]:[]};
  });
  const doc={id:input.id,title:input.title.trim(),description:input.description,color:input.color,fields};
  if(publishing&&(!doc.title||!fields.length||fields.some(q=>!q.label||(q.type==='select'&&!q.options.length))))throw new HttpError(400,'Add a title, question labels and dropdown options before publishing.');
  return doc;
}
export function cleanAnswers(doc, input) {
  if(!input || typeof input!=='object' || Array.isArray(input) || Object.values(input).some(v=>typeof v!=='string'))throw new HttpError(400,'Answers must be text values.');
  const errors=validateAnswers(doc,input);
  for(const q of doc.fields){const v=input[q.id];if(v && q.type==='date' && (!/^\d{4}-\d{2}-\d{2}$/.test(v)||Number.isNaN(Date.parse(v))||(!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)!==v)))errors[q.id]='Enter a valid date.';}
  if(Object.keys(errors).length)throw new HttpError(400,'Please check your answers.',errors);
  return Object.fromEntries(doc.fields.map(q=>[q.id,String(input[q.id]??'').trim()]));
}
