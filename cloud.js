import { createAuthClient } from '@neondatabase/auth';
export const auth = createAuthClient(`${location.origin}/api/auth`);
export async function request(path, method='GET',data){
  const response=await fetch('/api/'+path,{method,credentials:'same-origin',headers:{'Content-Type':'application/json'},...(data?{body:JSON.stringify(data)}:{})});
  let body;try{body=await response.json();}catch{throw new Error('Cloud service is not available. Please try again later.');}
  if(!response.ok){const error=new Error(body.error||'Request failed.');error.status=response.status;error.details=body.details;throw error;}return body;
}
export class CloudWorkspace {
  constructor(onStatus){this.queues=new Map();this.pending=new Map();this.inFlight=0;this.failure=null;this.onStatus=onStatus;}
  save(form){
    if(this.failure)return Promise.reject(this.failure);
    this.onStatus('Waiting to save…');
    const previous=this.pending.get(form.id);if(previous)clearTimeout(previous.timer);
    const pending={form,snapshot:JSON.parse(JSON.stringify(form)),waiters:previous?.waiters||[]};
    const result=new Promise((resolve,reject)=>pending.waiters.push({resolve,reject}));
    pending.timer=setTimeout(()=>this.enqueue(form.id),450);this.pending.set(form.id,pending);return result;
  }
  enqueue(id){
    const pending=this.pending.get(id);if(!pending)return;
    clearTimeout(pending.timer);this.pending.delete(id);const {form,snapshot,waiters}=pending;
    const queue=(this.queues.get(form.id)||Promise.resolve()).then(async()=>{
      if(this.failure)throw this.failure;
      this.inFlight++;this.onStatus('Saving to cloud…');
      const result=await request('forms',form.version?'PUT':'POST',{...snapshot,version:form.version});
      form.version=result.form.version;form.updatedAt=result.form.updatedAt;
      this.onStatus('Saved to your account.');for(const waiter of waiters)waiter.resolve();
    }).catch(error=>{this.failure=error;this.onStatus('Not saved: '+error.message);for(const waiter of waiters)waiter.reject(error);throw error;}).finally(()=>{this.inFlight=Math.max(0,this.inFlight-1);});
    this.queues.set(form.id,queue);queue.catch(()=>{});
  }
  async flush(){for(const id of [...this.pending.keys()])this.enqueue(id);await Promise.all(this.queues.values());if(this.failure)throw this.failure;}
}
