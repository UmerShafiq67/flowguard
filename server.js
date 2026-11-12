const http=require("http"),fs=require("fs"),path=require("path");
const PORT=Number(process.env.PORT||8080);
const ROOT=__dirname;
const MIME={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8",".svg":"image/svg+xml",".png":"image/png",".jpg":"image/jpeg"};

function send(res,status,data,type="application/json"){res.writeHead(status,{"Content-Type":type,"Cache-Control":"no-store"});res.end(type.startsWith("application/json")?JSON.stringify(data):data)}
function readBody(req){return new Promise((resolve,reject)=>{let b="";req.on("data",c=>{b+=c;if(b.length>12_000_000){req.destroy();reject(new Error("Request too large"))}});req.on("end",()=>resolve(b));req.on("error",reject)})}

async function tutor(body){
  if(!process.env.OPENAI_API_KEY) throw Object.assign(new Error("AI is not connected yet. The app is ready, but a server-side AI key still needs to be configured by the product owner."),{status:503});
  const content=[{type:"input_text",text:body.message||""}];
  if(body.image?.startsWith("data:image/")) content.push({type:"input_image",image_url:body.image});
  const system="You are StudySprint Tutor. Teach students instead of doing the learning for them. Start with a short hint or question when appropriate, then explain step by step. Be accurate, age-appropriate, encouraging, and concise. If an image is provided, inspect it carefully. If you are unsure, say so. Never invent a source or claim certainty you do not have.";
  const input=[{role:"system",content:system}];
  for(const m of (body.history||[]).slice(-8)) input.push({role:m.role==="assistant"?"assistant":"user",content:[{type:"input_text",text:String(m.text||"")}]});
  input.push({role:"user",content});
  const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Authorization":"Bearer "+process.env.OPENAI_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.OPENAI_MODEL||"gpt-6-luna",input,max_output_tokens:900})});
  const data=await r.json();
  if(!r.ok) throw Object.assign(new Error(data.error?.message||"AI request failed"),{status:r.status});
  return {text:data.output_text||"I couldn't produce an answer this time."};
}

const server=http.createServer(async(req,res)=>{
  try{
    if(req.method==="POST"&&req.url==="/api/tutor"){
      const body=JSON.parse(await readBody(req));
      if(!body.message?.trim()) return send(res,400,{error:"Message is required."});
      return send(res,200,await tutor(body));
    }
    let u=new URL(req.url,"http://localhost");
    let file=path.normalize(path.join(ROOT,u.pathname==="/"?"/index.html":u.pathname));
    if(!file.startsWith(ROOT)) return send(res,403,{error:"Forbidden"});
    if(!fs.existsSync(file)||fs.statSync(file).isDirectory()) return send(res,404,{error:"Not found"});
    const ext=path.extname(file).toLowerCase();
    send(res,200,fs.readFileSync(file),MIME[ext]||"application/octet-stream");
  }catch(e){send(res,e.status||500,{error:e.message||"Server error"})}
});
server.listen(PORT,"0.0.0.0",()=>console.log(`StudySprint running on http://0.0.0.0:${PORT}`));