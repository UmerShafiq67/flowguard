const http=require("http"),fs=require("fs"),path=require("path");
const PORT=Number(process.env.PORT||8080);
const ROOT=__dirname;
const MIME={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8",".svg":"image/svg+xml",".png":"image/png",".jpg":"image/jpeg"};

function send(res,status,data,type="application/json"){res.writeHead(status,{"Content-Type":type,"Cache-Control":"no-store"});res.end(type.startsWith("application/json")?JSON.stringify(data):data)}
function readBody(req){return new Promise((resolve,reject)=>{let b="";req.on("data",c=>{b+=c;if(b.length>12_000_000){req.destroy();reject(new Error("Request too large"))}});req.on("end",()=>resolve(b));req.on("error",reject)})}

async function tutor(body){
  if(!process.env.OPENAI_API_KEY||!process.env.OPENAI_MODEL) throw Object.assign(new Error("AI is not connected yet. The app is ready, but the server owner must configure the AI credentials."),{status:503});
  const mode=String(body.mode||"Explain simply");
  const context=body.context||{};
  const system="You are StudySprint Tutor. Your job is to help a student learn, not simply do the work for them. Mode: "+mode+". Teach step by step, ask a short check question when useful, keep explanations age-appropriate, and be honest when uncertain. Use the student's current study context when relevant. Never invent sources.";
  const content=[{type:"input_text",text:(body.message||"")+"\\n\\nStudy context: "+JSON.stringify({subjects:context.subjects||[],exams:context.exams||[],currentTask:context.currentTask||null})}];
  const att=body.attachment;
  if(att?.data?.startsWith("data:image/")) content.push({type:"input_image",image_url:att.data});
  else if(att?.data?.startsWith("data:application/pdf;base64,")){const fileData=att.data;content.push({type:"input_file",filename:String(att.name||"study.pdf"),file_data:fileData});}
  const input=[{role:"system",content:system}];
  for(const m of (body.history||[]).slice(-8)) input.push({role:m.role==="assistant"?"assistant":"user",content:[{type:"input_text",text:String(m.text||"")}]});
  input.push({role:"user",content});
  const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Authorization":"Bearer "+process.env.OPENAI_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.OPENAI_MODEL,input,max_output_tokens:900})});
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