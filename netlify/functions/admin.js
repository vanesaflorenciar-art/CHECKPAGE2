const crypto=require('crypto');const {sb,res}=require('./_lib');const {Q}=require('../../public/questions.js');
const cell=v=>{v=String(v??'');if(/^[=+\-@\t\r]/.test(v))v="'"+v;return '"'+v.replace(/"/g,'""')+'"'};
exports.handler=async e=>{
  const t=Buffer.from(e.headers['x-admin-token']||''),k=Buffer.from(process.env.ADMIN_TOKEN||'');
  if(!k.length||t.length!==k.length||!crypto.timingSafeEqual(t,k))return res(401,{error:'No autorizado'});
  try{
    const leads=await sb('leads?select=name,email,created_at,marketing_consent,consent_at&order=created_at.desc&limit=10000');
    if(e.queryStringParameters?.export==='csv'){
      const rows=leads.filter(l=>l.marketing_consent).map(l=>[l.name,l.email,l.consent_at,l.created_at].map(cell).join(','));
      return {statusCode:200,headers:{'content-type':'text/csv; charset=utf-8','content-disposition':'attachment; filename="contactos-autorizados.csv"','cache-control':'no-store'},body:['nombre,email,consentimiento,registro',...rows].join('\n')};
    }
    const audits=await sb('audits?select=score,problems&limit=10000'),freq={};
    audits.forEach(a=>a.problems.forEach(i=>freq[i]=(freq[i]||0)+1));
    return res(200,{registros:leads.length,auditorias:audits.length,conConsentimiento:leads.filter(l=>l.marketing_consent).length,
      puntajePromedio:audits.length?Math.round(audits.reduce((s,a)=>s+a.score,0)/audits.length):null,
      problemasFrecuentes:Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([i,n])=>({pregunta:Q[i][0],veces:n}))});
  }catch{return res(500,{error:'Error al consultar los datos'})}
};
