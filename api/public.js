import { randomUUID,createHash } from 'node:crypto';
import { database } from '../server/db.js';
import { endpoint,guard,body,json } from '../server/http.js';
import { cleanAnswers,isPublicId,isId,HttpError } from '../server/validation.js';
export default endpoint(async(req,res)=>{
  guard(req,['GET','POST']);const id=new URL(req.url,'https://localhost').searchParams.get('id');if(!isPublicId(id))throw new HttpError(404,'This form is unavailable.');
  const db=database();const {rows}=await db.query('SELECT id,published_document,published_at FROM formora_forms WHERE public_id=$1 AND published_document IS NOT NULL AND deleted_at IS NULL',[id]);if(!rows.length)throw new HttpError(404,'This form is unavailable or no longer accepting responses.');
  const f=rows[0],doc=f.published_document;
  if(req.method==='GET')return json(res,200,{form:doc,publishedAt:f.published_at});
  const input=body(req,100000);if(input.website)throw new HttpError(400,'Unable to accept this response.');if(!isId(input.submissionKey))throw new HttpError(400,'A submission identifier is required.');
  if(input.publishedAt!==new Date(f.published_at).toISOString())throw new HttpError(409,'The form has been updated. Reload and check your answers before submitting.');
  const answers=cleanAnswers(doc,input.answers);
  const client=await db.connect();try{
    await client.query('BEGIN');
    const latest=await client.query('SELECT published_at FROM formora_forms WHERE id=$1 AND deleted_at IS NULL AND published_document IS NOT NULL FOR SHARE',[f.id]);
    if(!latest.rows.length||new Date(latest.rows[0].published_at).toISOString()!==input.publishedAt)throw new HttpError(409,'The form changed. Reload before submitting.');
    const existing=await client.query('SELECT id FROM formora_responses WHERE form_id=$1 AND submission_key=$2',[f.id,input.submissionKey]);
    if(existing.rows.length){await client.query('COMMIT');return json(res,200,{ok:true});}
    const ip=String(req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0];
    const bucket=createHash('sha256').update(id+'|'+ip).digest('hex');
    const limit=await client.query(`INSERT INTO formora_rate_limits(bucket,window_start,requests) VALUES($1,date_trunc('hour',now()),1) ON CONFLICT(bucket,window_start) DO UPDATE SET requests=formora_rate_limits.requests+1 RETURNING requests`,[bucket]);
    if(limit.rows[0].requests>30)throw new HttpError(429,'Too many responses. Please try again later.');
    // Serialize per-form capacity checks and inserts, including concurrent retry requests.
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))',[f.id]);
    const count=await client.query('SELECT count(*)::int AS n FROM formora_responses WHERE form_id=$1',[f.id]);if(count.rows[0].n>=1000)throw new HttpError(409,'This form has reached its pilot response limit.');
    await client.query('INSERT INTO formora_responses(id,form_id,submission_key,answers,question_snapshot) VALUES($1,$2,$3,$4,$5) ON CONFLICT(form_id,submission_key) DO NOTHING',[randomUUID(),f.id,input.submissionKey,answers,doc.fields]);
    await client.query('COMMIT');json(res,201,{ok:true});
  }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
});
