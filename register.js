const crypto=require('crypto');const {sb,res,parse}=require('./_lib');
exports.handler=async e=>{
  if(e.httpMethod!=='POST')return res(405,{error:'Método no permitido'});
  const b=parse(e),name=String(b.name||'').trim().slice(0,80),email=String(b.email||'').trim().toLowerCase().slice(0,120),consent=b.consent===true;
  if(name.length<2||!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))return res(400,{error:'Revisá tu nombre y tu email.'});
  try{
    const ex=(await sb(`leads?email=eq.${encodeURIComponent(email)}&select=id,marketing_consent`))[0],now=new Date().toISOString();let id;
    if(ex){id=ex.id;const p={name};if(consent&&!ex.marketing_consent){p.marketing_consent=true;p.consent_at=now}await sb(`leads?id=eq.${id}`,{method:'PATCH',body:p})}
    else{id=(await sb('leads',{method:'POST',prefer:'return=representation',body:{name,email,marketing_consent:consent,consent_at:consent?now:null,unsub_token:crypto.randomBytes(16).toString('hex')}}))[0].id}
    if(consent&&process.env.BREVO_API_KEY&&process.env.BREVO_LIST_ID){
      await fetch('https://api.brevo.com/v3/contacts',{method:'POST',headers:{'api-key':process.env.BREVO_API_KEY,'content-type':'application/json'},body:JSON.stringify({email,attributes:{FIRSTNAME:name},listIds:[Number(process.env.BREVO_LIST_ID)],updateEnabled:true})}).catch(()=>{});
    }
    return res(200,{id,name});
  }catch{return res(500,{error:'No pudimos registrarte. Probá de nuevo en un momento.'})}
};
