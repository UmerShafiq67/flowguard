const http=require("http");
const fs=require("fs");
const path=require("path");
const PORT=Number(process.env.PORT||8080),ROOT=__dirname,MAX_REQUEST_BYTES=12_000_000,MAX_ATTACHMENT_BYTES=8_000_000;
const AI_PROVIDER=String(process.env.AI_PROVIDER||"ollama").toLowerCase();
const OLLAMA_BASE_URL=String(process.env.OLLAMA_BASE_URL||"http://localhost:11434").replace(/\/$/,"");
const OLLAMA_MODEL=String(process.env.OLLAMA_MODEL||"gemma3:1b");
const MIME={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8",".svg":"image/svg+xml",".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",".webp":"image/webp",".ico":"image/x-icon"};
function send(res,status,data,type="application/json"){res.writeHead(status,{"Content-Type":type,"Cache-Control":"no-store"});res.end(type.startsWith("application/json")?JSON.stringify(data):data)}
function readBody(req){return new Promise((resolve,reject)=>{let body="",size=0,failed=false;req.on("data",chunk=>{if(failed)return;size+=chunk.length;if(size>MAX_REQUEST_BYTES){failed=true;reject(Object.assign(new Error("Request too large. Keep attachments under 8 MB."),{status:413}));req.destroy();return}body+=chunk});req.on("end",()=>{if(!failed)resolve(body)});req.on("error",reject)})}
function cleanText(value,max=4000){return String(value??"").trim().slice(0,max)}
function validateAttachment(att){
  if(att==null)return null;
  if(typeof att!=="object"||typeof att.data!=="string")throw Object.assign(new Error("The attachment could not be read."),{status:400});
  const match=att.data.match(/^data:([^;,]+);base64,([A-Za-z0-9+/=\r\n]+)$/);
  if(!match)throw Object.assign(new Error("Unsupported attachment format."),{status:400});
  const mime=match[1].toLowerCase(),raw=match[2].replace(/\s/g,""),bytes=Math.floor(raw.length*3/4);
  if(!(mime==="application/pdf"||mime.startsWith("image/")))throw Object.assign(new Error("StudySprint currently accepts images and PDFs."),{status:415});
  if(bytes>MAX_ATTACHMENT_BYTES)throw Object.assign(new Error("Attachment is too large. Maximum size is 8 MB."),{status:413});
  return {name:cleanText(att.name||"attachment",120)||"attachment",type:mime,data:att.data};
}
function compactContext(context){return {subjects:Array.isArray(context?.subjects)?context.subjects.slice(0,30).map(s=>({name:cleanText(s?.name,120),topics:Array.isArray(s?.topics)?s.topics.slice(0,40).map(t=>({name:cleanText(t?.name,160),confidence:Number(t?.confidence)||0})):[]})):[],exams:Array.isArray(context?.exams)?context.exams.slice(0,20).map(e=>({name:cleanText(e?.name,160),date:cleanText(e?.date,30),subjectId:cleanText(e?.subjectId,80)})):[],currentTask:context?.currentTask?{subject:cleanText(context.currentTask.subject,120),topic:cleanText(context.currentTask.topic,160),examDate:cleanText(context.currentTask.examDate,30),minutes:Number(context.currentTask.minutes)||0}:null}}
function tutorSystem(mode){return ["You are StudySprint Tutor, an exam-study coach.","Your goal is learning, not merely completing homework.","Teach step by step, use simple language, and adapt to the student's level.","For problem-solving, guide the student and include a short check question when useful instead of blindly dumping an answer.","Use the student's StudySprint context only when relevant.","If an uploaded image or PDF is unclear, say what is unclear instead of guessing.","Never invent sources, facts, or what is inside an attachment.","Do not claim to have read an attachment if it was not supplied.","Current mode: "+mode+"."].join(" ")}
function buildTutorInput(body){
  const mode=cleanText(body.mode||"Explain simply",40)||"Explain simply",attachment=validateAttachment(body.attachment),context=compactContext(body.context||{});
  const text=(cleanText(body.message,5000)||"Please help me understand the attached study material.")+"\n\nStudySprint context:\n"+JSON.stringify(context);
  const content=[{type:"input_text",text}];
  if(attachment?.type.startsWith("image/"))content.push({type:"input_image",image_url:attachment.data});
  if(attachment?.type==="application/pdf")content.push({type:"input_file",filename:attachment.name,file_data:attachment.data});
  const input=[{role:"system",content:tutorSystem(mode)}];
  for(const item of (Array.isArray(body.history)?body.history:[]).slice(-8)){const role=item?.role==="assistant"?"assistant":"user",historyText=cleanText(item?.text,2500);if(historyText)input.push({role,content:[{type:"input_text",text:historyText}]})}
  input.push({role:"user",content});return {input,mode,attachment};
}
function buildOllamaMessages(body){
  const {input,attachment}=buildTutorInput(body);
  if(attachment?.type==="application/pdf")throw Object.assign(new Error("Local AI currently supports text and images. PDF tutoring needs the local document-extraction layer, which is not enabled yet."),{status:415});
  return input.map(item=>({role:item.role==="system"?"system":item.role,content:Array.isArray(item.content)?item.content.filter(x=>x.type==="input_text").map(x=>x.text).join("\n"):String(item.content||"")})).map((message,index)=>{
    if(index===input.length-1&&attachment?.type?.startsWith("image/"))message.images=[attachment.data.split(",")[1]];
    return message;
  });
}
async function openAI(body){
  if(!process.env.OPENAI_API_KEY||!process.env.OPENAI_MODEL)throw Object.assign(new Error("OpenAI is not configured."),{status:503});
  const {input}=buildTutorInput(body);
  const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Authorization":"Bearer "+process.env.OPENAI_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.OPENAI_MODEL,input,max_output_tokens:900})});
  let data;try{data=await response.json()}catch{throw Object.assign(new Error("The AI provider returned an invalid response."),{status:502})}
  if(!response.ok){const message=cleanText(data?.error?.message,500);throw Object.assign(new Error(message||"The AI provider could not answer right now."),{status:response.status===429?429:502})}
  const text=cleanText(data?.output_text,12000);if(!text)throw Object.assign(new Error("The AI returned an empty answer. Please try again."),{status:502});return {text,provider:"openai"};
}
async function ollama(body){
  const messages=buildOllamaMessages(body);
  let response;try{response=await fetch(OLLAMA_BASE_URL+"/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:OLLAMA_MODEL,messages,stream:false,options:{temperature:0.2}})});}catch{throw Object.assign(new Error("Local AI is not running. Start Ollama with 'ollama serve' and make sure the model is installed."),{status:503})}
  let data;try{data=await response.json()}catch{throw Object.assign(new Error("Local AI returned an invalid response."),{status:502})}
  if(!response.ok){throw Object.assign(new Error(cleanText(data?.error,500)||"Local AI could not answer right now."),{status:502})}
  const text=cleanText(data?.message?.content,12000);if(!text)throw Object.assign(new Error("Local AI returned an empty answer. Please try again."),{status:502});return {text,provider:"ollama",model:OLLAMA_MODEL};
}
async function tutor(body){
  if(AI_PROVIDER==="openai")return openAI(body);
  return ollama(body);
}
function safeStaticPath(urlPath){const pathname=decodeURIComponent(urlPath),relative=pathname==="/"?"index.html":pathname.replace(/^\/+/, ""),file=path.resolve(ROOT,relative),root=path.resolve(ROOT)+path.sep;if(file!==path.resolve(ROOT)&&!file.startsWith(root))return null;return file}
function createServer(){return http.createServer(async(req,res)=>{try{
  const url=new URL(req.url,"http://localhost");
  if(req.method==="GET"&&url.pathname==="/health")return send(res,200,{ok:true,service:"StudySprint",aiProvider:AI_PROVIDER,aiConfigured:AI_PROVIDER==="ollama"||Boolean(process.env.OPENAI_API_KEY&&process.env.OPENAI_MODEL),ollamaModel:AI_PROVIDER==="ollama"?OLLAMA_MODEL:undefined});
  if(req.method==="POST"&&url.pathname==="/api/tutor"){let body;try{body=JSON.parse(await readBody(req))}catch{return send(res,400,{error:"Invalid JSON request."})}if(!body||typeof body!=="object")return send(res,400,{error:"Invalid request."});if(!cleanText(body.message,5000)&&!body.attachment)return send(res,400,{error:"Add a question or attach study material."});return send(res,200,await tutor(body))}
  if(req.method!=="GET"&&req.method!=="HEAD")return send(res,405,{error:"Method not allowed."});
  const file=safeStaticPath(url.pathname);if(!file)return send(res,403,{error:"Forbidden"});if(!fs.existsSync(file)||fs.statSync(file).isDirectory())return send(res,404,{error:"Not found"});
  const ext=path.extname(file).toLowerCase();if(req.method==="HEAD"){res.writeHead(200,{"Content-Type":MIME[ext]||"application/octet-stream","Cache-Control":"no-store"});return res.end()}return send(res,200,fs.readFileSync(file),MIME[ext]||"application/octet-stream");
}catch(error){const status=Number(error?.status)||500;return send(res,status>=400&&status<600?status:500,{error:error?.message||"Server error."})}})}
if(require.main===module)createServer().listen(PORT,"0.0.0.0",()=>console.log(`StudySprint running on http://0.0.0.0:${PORT} (AI: ${AI_PROVIDER})`));
module.exports={buildTutorInput,buildOllamaMessages,validateAttachment,createServer};
