import express from 'express';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const app=express();
app.set('trust proxy',1);
app.use(express.json({limit:'300kb'}));

const PORT=Number(process.env.PORT||10000);
const PRIMARY_MODEL=process.env.GEMINI_MODEL||'gemini-3.5-flash';
const MODEL_CHAIN=[PRIMARY_MODEL,'gemini-2.5-flash','gemini-3.1-flash-lite'].filter((m,i,a)=>m&&a.indexOf(m)===i);
const explicitOrigins=String(process.env.ALLOWED_ORIGINS||'').split(',').map(v=>v.trim()).filter(Boolean);
const usage=new Map();
const ai=new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY||''});

function originAllowed(origin=''){
  if(!origin)return true;
  if(explicitOrigins.includes(origin))return true;
  if(/^https:\/\/ticket-app(?:-[a-z0-9-]+)?\.onrender\.com$/i.test(origin))return true;
  if(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin))return true;
  return false;
}

app.use((req,res,next)=>{
  const origin=req.headers.origin||'';
  if(origin&&originAllowed(origin))res.setHeader('Access-Control-Allow-Origin',origin);
  res.setHeader('Vary','Origin');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  res.setHeader('Access-Control-Allow-Methods','POST,GET,OPTIONS');
  if(req.method==='OPTIONS')return originAllowed(origin)?res.sendStatus(204):res.sendStatus(403);
  if(origin&&!originAllowed(origin))return res.status(403).json({error:'Origem não autorizada.'});
  next();
});

function rateLimit(req,res,next){
  const key=req.ip||req.socket.remoteAddress||'unknown';
  const now=Date.now();
  const windowMs=10*60*1000;
  const max=40;
  const item=usage.get(key)||{start:now,count:0};
  if(now-item.start>windowMs){item.start=now;item.count=0;}
  item.count++;
  usage.set(key,item);
  if(item.count>max)return res.status(429).json({error:'Muitas solicitações. Aguarde alguns minutos.'});
  next();
}

function errorStatus(error){
  const raw=Number(error?.status||error?.code||0);
  return Number.isFinite(raw)?raw:0;
}

function modelConfig(model,systemInstruction){
  const config={systemInstruction,maxOutputTokens:1600};
  if(/^gemini-3/i.test(model)){
    config.thinkingConfig={thinkingLevel:ThinkingLevel.LOW};
  }else if(/^gemini-2\.5/i.test(model)){
    config.thinkingConfig={thinkingBudget:0};
  }
  return config;
}

async function askGemini(model,prompt,systemInstruction){
  return ai.models.generateContent({
    model,
    contents:prompt,
    config:modelConfig(model,systemInstruction)
  });
}

app.get('/health',(req,res)=>res.json({
  ok:true,
  service:'ticket-app-ai',
  provider:'gemini',
  model:PRIMARY_MODEL,
  fallbackModels:MODEL_CHAIN.slice(1),
  configured:Boolean(process.env.GEMINI_API_KEY),
  mode:'general-assistant',
  version:'1.0.9'
}));

app.post('/api/chat',rateLimit,async(req,res)=>{
  if(!process.env.GEMINI_API_KEY){
    return res.status(503).json({error:'GEMINI_API_KEY não configurada no servidor.',code:'gemini_not_configured'});
  }

  const message=String(req.body?.message||'').trim();
  if(!message)return res.status(400).json({error:'Mensagem vazia.'});
  if(message.length>5000)return res.status(400).json({error:'Mensagem muito longa.'});

  const history=Array.isArray(req.body?.history)?req.body.history.slice(-16):[];
  const context=req.body?.context||{};
  const transcript=history
    .map(item=>`${item.role==='assistant'?'Assistente':'Usuário'}: ${String(item.content||'').slice(0,2600)}`)
    .join('\n');

  const systemInstruction=`Você é o Assistente Ticket. IA, um assistente geral de propósito amplo integrado ao aplicativo Ticket. Responda diretamente ao que o usuário pedir e não limite a conversa ao Ticket. Você pode ajudar com dúvidas gerais, tecnologia, informática, programação, redes, hardware, software, escrita e revisão de textos, cálculos, estudos, planejamento, produtividade, ideias, organização, explicações, troubleshooting e outras tarefas legítimas. Quando o usuário estiver falando do Ticket., use seu conhecimento especializado do aplicativo: registro de ponto, comprovantes, fotos, análise de qualidade, alto contraste, registros imutáveis, jornada semanal, saldo anterior, período de fechamento, banco de horas, calendário, relatórios, PWA e armazenamento local/Google Drive/OneDrive. Não force o assunto de volta para o Ticket quando a pergunta for sobre outro tema. Responda em português do Brasil, salvo se o usuário pedir outro idioma. Seja útil, objetivo e suficientemente detalhado para resolver a necessidade. Não invente que executou ações, abriu sites, pesquisou a internet ou alterou dados se isso não ocorreu. Nunca peça senha, token, chave secreta ou credencial. Se uma informação depender de dados ao vivo que você não recebeu, diga isso claramente. Contexto técnico do app: versão ${String(context.version||'1.0.9')}, tela ${String(context.view||'desconhecida')}, plataforma ${String(context.platform||'Web/PWA')}.`;

  const prompt=`${transcript?`Histórico recente:\n${transcript}\n\n`:''}Mensagem atual do usuário: ${message}`;
  const attempts=[];
  let lastError=null;

  for(const model of MODEL_CHAIN){
    const started=Date.now();
    try{
      const response=await askGemini(model,prompt,systemInstruction);
      const answer=String(response.text||'').trim();
      if(!answer)throw Object.assign(new Error('Resposta vazia do modelo.'),{status:502});
      return res.json({
        answer,
        provider:'gemini',
        model,
        fallback:model!==PRIMARY_MODEL,
        latencyMs:Date.now()-started,
        mode:'general-assistant'
      });
    }catch(error){
      lastError=error;
      const status=errorStatus(error);
      attempts.push({model,status:status||null,ms:Date.now()-started});
      console.warn('Ticket Gemini model failed',model,status,error?.message||error);
      if(status===401||status===403)break;
    }
  }

  const status=errorStatus(lastError);
  if(status===401||status===403){
    return res.status(503).json({error:'A chave do Gemini foi recusada. Verifique a GEMINI_API_KEY no Render.',code:'gemini_auth',attempts});
  }
  if(status===429){
    return res.status(429).json({error:'O limite gratuito do Gemini foi atingido temporariamente. Tente novamente em alguns instantes.',code:'gemini_quota',attempts});
  }
  return res.status(503).json({error:'O Gemini não respondeu agora. O Ticket tentou automaticamente modelos alternativos.',code:'gemini_unavailable',attempts});
});

app.listen(PORT,'0.0.0.0',()=>console.log(`Ticket Gemini AI API 1.0.9 listening on ${PORT}; primary ${PRIMARY_MODEL}`));
