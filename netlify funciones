const U=(process.env.SUPABASE_URL||'').replace(/\/+$/,''),K=process.env.SUPABASE_SERVICE_KEY;
const res=(s,b,h={})=>({statusCode:s,headers:{'content-type':'application/json','cache-control':'no-store',...h},body:typeof b==='string'?b:JSON.stringify(b)});
async function sb(path,{method='GET',body,prefer}={}){
  if(!U||!K)throw new Error('Base de datos no configurada');
  const h={apikey:K,'content-type':'application/json'};
  if(K.startsWith('eyJ'))h.Authorization=`Bearer ${K}`;
  if(prefer)h.Prefer=prefer;
  const r=await fetch(`${U}/rest/v1/${path}`,{method,headers:h,body:body&&JSON.stringify(body)});
  const t=await r.text();
  if(!r.ok){console.error('Supabase',r.status,t.slice(0,300));throw new Error('DB '+r.status)}
  return t?JSON.parse(t):null;
}
const parse=e=>{try{return JSON.parse(e.body||'{}')}catch{return{}}};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
module.exports={sb,res,parse,esc};
