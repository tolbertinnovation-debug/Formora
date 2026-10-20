import { randomBytes } from 'node:crypto';
import { database } from '../server/db.js';
import { requireUser } from '../server/auth.js';
import { endpoint,guard,body,json } from '../server/http.js';
import { formDocument,HttpError,isId } from '../server/validation.js';
function serialize(row){return {...row.document,version:row.version,publicId:row.public_id,published:!!row.published_document,createdAt:row.created_at,updatedAt:row.updated_at,responseCount:Number(row.response_count||0),responses:[]};}
export default endpoint(async(req,res)=>{
  guard(req,['GET','POST','PUT','DELETE']);const user=await requireUser(req);const db=database();
  if(req.method==='GET'){
    const {rows}=await db.query('SELECT formora_forms.*, (SELECT count(*) FROM formora_responses WHERE form_id=formora_forms.id) AS response_count FROM formora_forms WHERE owner_id=$1 AND deleted_at IS NULL ORDER BY updated_at DESC LIMIT 101',[user.id]);
    return json(res,200,{forms:rows.slice(0,100).map(serialize),limit:100});
  }
  const input=body(req);if(!isId(input.id))throw new HttpError(400,'Invalid form ID.');
  if(req.method==='POST'){
    const doc=formDocument(input);
    const client=await db.connect();try{
      await client.query('BEGIN');await client.query('SELECT pg_advisory_xact_lock(hashtext($1))',[user.id]);
      const {rows}=await client.query(`INSERT INTO formora_forms(id,owner_id,document) SELECT $1,$2,$3 WHERE (SELECT count(*) FROM formora_forms WHERE owner_id=$2 AND deleted_at IS NULL)<100 ON CONFLICT(id) DO NOTHING RETURNING *`,[doc.id,user.id,doc]);
      if(!rows.length)throw new HttpError(409,'This form exists or the pilot limit of 100 forms has been reached.');
      await client.query('COMMIT');return json(res,201,{form:serialize(rows[0])});
    }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
  }
  if(!Number.isInteger(input.version)||input.version<1)throw new HttpError(400,'Form version is required.');
  let result;
  if(req.method==='DELETE')result=await db.query('UPDATE formora_forms SET deleted_at=now(),published_document=NULL,version=version+1 WHERE id=$1 AND owner_id=$2 AND version=$3 AND deleted_at IS NULL RETURNING id',[input.id,user.id,input.version]);
  else if(input.action==='publish'){
    if(!user.emailVerified)throw new HttpError(403,'Verify your email before publishing forms.');
    const current=await db.query('SELECT document FROM formora_forms WHERE id=$1 AND owner_id=$2 AND deleted_at IS NULL',[input.id,user.id]);if(!current.rows.length)throw new HttpError(404,'Form not found.');
    const doc=formDocument(current.rows[0].document,true);
    result=await db.query('UPDATE formora_forms SET published_document=$4,public_id=COALESCE(public_id,$5),published_at=now(),updated_at=now(),version=version+1 WHERE id=$1 AND owner_id=$2 AND version=$3 AND deleted_at IS NULL RETURNING *',[input.id,user.id,input.version,doc,randomBytes(18).toString('base64url')]);
  }else if(input.action==='unpublish')result=await db.query('UPDATE formora_forms SET published_document=NULL,updated_at=now(),version=version+1 WHERE id=$1 AND owner_id=$2 AND version=$3 AND deleted_at IS NULL RETURNING *',[input.id,user.id,input.version]);
  else {const doc=formDocument(input);result=await db.query('UPDATE formora_forms SET document=$4,updated_at=now(),version=version+1 WHERE id=$1 AND owner_id=$2 AND version=$3 AND deleted_at IS NULL RETURNING *',[doc.id,user.id,input.version,doc]);}
  if(!result.rows.length)throw new HttpError(409,'This form changed in another session or is unavailable. Reload before editing.');
  return json(res,200,req.method==='DELETE'?{ok:true}:{form:serialize(result.rows[0])});
});
