import { database } from '../server/db.js';
import { requireUser } from '../server/auth.js';
import { endpoint,guard,json } from '../server/http.js';
import { isId,HttpError } from '../server/validation.js';
export default endpoint(async(req,res)=>{
  guard(req,['GET']);const user=await requireUser(req);const id=new URL(req.url,'https://localhost').searchParams.get('id');if(!isId(id))throw new HttpError(400,'Invalid form ID.');
  const db=database();const own=await db.query('SELECT id FROM formora_forms WHERE id=$1 AND owner_id=$2 AND deleted_at IS NULL',[id,user.id]);if(!own.rows.length)throw new HttpError(404,'Form not found.');
  const {rows}=await db.query('SELECT id,answers,question_snapshot,submitted_at FROM formora_responses WHERE form_id=$1 ORDER BY submitted_at DESC LIMIT 1000',[id]);
  return json(res,200,{responses:rows.map(r=>({id:r.id,answers:r.answers,fields:r.question_snapshot,submittedAt:r.submitted_at})),limit:1000});
});
