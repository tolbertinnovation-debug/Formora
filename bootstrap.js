// crypto.getRandomValues remains available in HTTP development previews.
// The managed Auth SDK calls randomUUID during module initialization.
if (!crypto.randomUUID) {
  crypto.randomUUID = () => {
    const b=crypto.getRandomValues(new Uint8Array(16));b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;
    const x=Array.from(b,v=>v.toString(16).padStart(2,'0')).join('');
    return `${x.slice(0,8)}-${x.slice(8,12)}-${x.slice(12,16)}-${x.slice(16,20)}-${x.slice(20)}`;
  };
}
await import('./app.js');
