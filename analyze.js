const dns=require('dns').promises,net=require('net');const {res,parse}=require('./_lib');
const priv=ip=>{
  if(net.isIPv4(ip)){const [a,b]=ip.split('.').map(Number);return a===0||a===10||a===127||(a===169&&b===254)||(a===172&&b>=16&&b<=31)||(a===192&&b===168)||(a===100&&b>=64&&b<=127)||a>=224}
  const x=ip.toLowerCase();return x==='::1'||x==='::'||/^(fc|fd|fe80|::ffff:)/.test(x);
};
async function safe(u){
  const p=new URL(u);
  if(!['http:','https:'].includes(p.protocol)||p.username||p.password)throw new Error('URL no permitida');
  if(p.port&&!['80','443'].includes(p.port))throw new Error('Puerto no permitido');
  const ips=net.isIP(p.hostname)?[{address:p.hostname}]:await dns.lookup(p.hostname,{all:true});
  if(!ips.length||ips.some(i=>priv(i.address)))throw new Error('Dirección no permitida');
  return p;
}
async function get(u){
  for(let i=0;i<5;i++){
    const p=await safe(u);
    const r=await fetch(p,{redirect:'manual',signal:AbortSignal.timeout(8000),headers:{'user-agent':'PageCheckBot/1.0','accept':'text/html'}});
    const loc=r.headers.get('location');
    if(r.status>=300&&r.status<400&&loc){u=new URL(loc,p).href;continue}
    if(!(r.headers.get('content-type')||'').includes('html'))throw new Error('La dirección no devuelve una página HTML');
    let html='',n=0;const rd=r.body.getReader(),dec=new TextDecoder();
    while(n<1e6){const {done,value}=await rd.read();if(done)break;n+=value.length;html+=dec.decode(value,{stream:true})}
    rd.cancel().catch(()=>{});return {html,status:r.status,final:p.href};
  }
  throw new Error('Demasiadas redirecciones');
}
const strip=s=>s.replace(/<(script|style)[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
exports.handler=async e=>{
  if(e.httpMethod!=='POST')return res(405,{error:'Método no permitido'});
  const url=String(parse(e).url||'').trim().slice(0,300);
  try{
    const {html,status,final}=await get(url);
    const tags=re=>html.match(re)||[];
    const desc=(tags(/<meta[^>]+name=["']description["'][^>]*>/i)[0]||'').match(/content=["']([^"']*)["']/i);
    const h1=[...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map(x=>strip(x[1])).filter(Boolean);
    const imgs=tags(/<img\b[^>]*>/gi);
    return res(200,{ok:true,scan:{url:final,status,
      title:strip((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[,''])[1]).slice(0,160),
      description:desc?desc[1].trim().slice(0,300):'',
      h1Count:h1.length,h1:h1.slice(0,2).map(t=>t.slice(0,120)),h2Count:tags(/<h2\b/gi).length,
      links:tags(/<a\s/gi).length,buttons:tags(/<button\b/gi).length+tags(/<a\s[^>]*class=["'][^"']*(btn|button)[^"']*["']/gi).length,
      images:imgs.length,imagesNoAlt:imgs.filter(t=>!/\salt=["'][^"']+["']/i.test(t)).length,
      viewport:/<meta[^>]+name=["']viewport["']/i.test(html),https:final.startsWith('https:'),
      lang:/<html[^>]+lang=/i.test(html),textChars:strip(html).length}});
  }catch(err){
    const known=/URL|Puerto|Dirección|HTML|redirecciones/.test(err.message);
    return res(200,{ok:false,error:known?err.message:'No pudimos acceder al sitio (puede estar caído, bloquear robots o tardar demasiado).'});
  }
};
