const {sb,res,parse,esc}=require('./_lib');const {CATS,Q}=require('../../public/questions.js');
exports.handler=async e=>{
  if(e.httpMethod!=='POST')return res(405,{error:'Método no permitido'});
  const b=parse(e),a=b.answers;
  if(!Array.isArray(a)||a.length!==20||!a.every(v=>[0,2.5,5].includes(v))||!/^[0-9a-f-]{36}$/.test(b.leadId||''))return res(400,{error:'Datos inválidos'});
  const score=Math.round(a.reduce((s,v)=>s+v,0)),cats=CATS.map((n,c)=>({n,p:Math.round(a.slice(c*4,c*4+4).reduce((s,v)=>s+v,0)*5)}));
  const problems=a.map((v,i)=>[v,i]).sort((x,y)=>x[0]-y[0]||x[1]-y[1]).filter(x=>x[0]<5).slice(0,3).map(x=>x[1]);
  const scan=b.scan&&typeof b.scan==='object'&&JSON.stringify(b.scan).length<4000?b.scan:null;
  try{
    const lead=(await sb(`leads?id=eq.${b.leadId}&select=name,email`))[0];if(!lead)return res(404,{error:'Registro no encontrado'});
    await sb('audits',{method:'POST',body:{lead_id:b.leadId,url:String(b.url||'').slice(0,300),answers:a,score,categories:cats,problems,scan}});
    let emailSent=false;
    if(process.env.BREVO_API_KEY&&process.env.BREVO_SENDER_EMAIL){
      const html=`<div style="font-family:Arial,sans-serif;color:#241a3b;max-width:560px"><h2 style="color:#3d1f7a">Tu diagnóstico PAGE CHECK</h2><p>Hola ${esc(lead.name)}, este es el resultado de tu auditoría de <b>${esc(b.url||'tu página')}</b>.</p><p style="font-size:32px;margin:8px 0"><b>${score}/100</b></p><ul>${cats.map(c=>`<li>${esc(c.n)}: <b>${c.p}/100</b></li>`).join('')}</ul>${problems.length?`<h3>Tus principales problemas</h3><ol>${problems.map(i=>`<li><b>${esc(Q[i][0])}</b><br>${esc(Q[i][1])}</li>`).join('')}</ol>`:''}<p>Podés ver el informe completo y descargarlo en PDF en <a href="${esc(process.env.URL||'#')}">PAGE CHECK</a>.</p><p style="color:#6b6285;font-size:12px">Recibís este correo porque pediste tu diagnóstico en PAGE CHECK.</p></div>`;
      const r=await fetch('https://api.brevo.com/v3/smtp/email',{method:'POST',headers:{'api-key':process.env.BREVO_API_KEY,'content-type':'application/json'},body:JSON.stringify({sender:{email:process.env.BREVO_SENDER_EMAIL,name:process.env.BREVO_SENDER_NAME||'PAGE CHECK'},to:[{email:lead.email,name:lead.name}],subject:`Tu diagnóstico PAGE CHECK: ${score}/100`,htmlContent:html})}).catch(()=>null);
      emailSent=!!(r&&r.ok);
    }
    return res(200,{score,emailSent});
  }catch{return res(500,{error:'No pudimos guardar tu informe.'})}
};
