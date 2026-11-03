const {SUPABASE_URL:U,SUPABASE_SERVICE_KEY:K}=process.env;
const res=(s,b,h={})=>({statusCode:s,headers:{'content-type':'application/json','cache-control':'no-store',...h},body:typeof b==='string'?b:JSON.stringify(b)});
async function sb(path,{method='GET',body,prefer}={}){
  if(!U||!K)throw new Error('Base de datos no configurada');
  const r=await fetch(`${U}/rest/v1/${path}`,{method,headers:{apikey:K,Authorization:`Bearer ${K}`,'content-type':'application/json',...(prefer?{Prefer:prefer}:{})},body:body&&JSON.stringify(body)});
  const t=await r.text();if(!r.ok)throw new Error('DB '+r.status);return t?JSON.parse(t):null;
}
const parse=e=>{try{return JSON.parse(e.body||'{}')}catch{return{}}};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
module.exports={sb,res,parse,esc};
