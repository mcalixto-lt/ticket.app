import express from 'express';
import { GoogleGenAI } from '@google/genai';

const app=express();
app.set('trust proxy',1);
app.use(express.json({limit:'200kb'}));

const PORT=Number(process.env.PORT||10000);
const MODEL=process.env.GEMINI_MODEL||'gemini-3.5-flash';
const explicitOrigins=String(process.env.ALLOWED_ORIGINS||'').split(',').map(v=>v.trim()).filter(Boolean);
const usage=new Map();

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
  const max=30;
  const item=usage.get(key)||{start:now,count:0};
  if(now-item.start>windowMs){item.start=now;item.count=0;}
  item.count++;
  usage.set(key,item);
  if(item.count>max)return res.status(429).json({error:'Muitas solicitações. Aguarde alguns minutos.'});
  next();
}

app.get('/health',(req,res)=>res.json({
  ok:true,
  service:'ticket-app-ai',
  provider:'gemini',
  model:MODEL,
  configured:Boolean(process.env.GEMINI_API_KEY),
  mode:'general-assistant'
}));

app.post('/api/chat',rateLimit,async(req,res)=>{
  try{
    if(!process.env.GEMINI_API_KEY){
      return res.status(503).json({error:'GEMINI_API_KEY não configurada no servidor.'});
    }

    const message=String(req.body?.message||'').trim();
    if(!message)return res.status(400).json({error:'Mensagem vazia.'});
    if(message.length>4000)return res.status(400).json({error:'Mensagem muito longa.'});

    const history=Array.isArray(req.body?.history)?req.body.history.slice(-14):[];
    const context=req.body?.context||{};
    const transcript=history
      .map(item=>`${item.role==='assistant'?'Assistente':'Usuário'}: ${String(item.content||'').slice(0,2400)}`)
      .join('\n');

    const systemInstruction=`Você é o Assistente Ticket. IA, um assistente geral e também especialista no aplicativo Ticket. de controle de jornada. Responda sempre em português do Brasil, a menos que o usuário peça outro idioma. Sua função é ajudar amplamente em tarefas legítimas: dúvidas gerais, tecnologia, informática, programação, escrita e revisão de textos, cálculos, explicações, estudos, planejamento, produtividade, ideias, organização, suporte técnico e também tudo relacionado ao Ticket. Quando o assunto for o Ticket., conheça registro de ponto, comprovantes, fotos, análise de qualidade, alto contraste, registros imutáveis, jornada semanal, saldo anterior, período de fechamento, banco de horas, calendário, relatórios, PWA e armazenamento local/Google Drive/OneDrive. Seja útil, prático e preciso. Não invente que executou ações que não foram realmente executadas. Não diga que alterou registros bloqueados. Nunca peça senhas, tokens, chaves secretas ou credenciais. Não solicite CPF ou conteúdo privado sem necessidade clara. Se o usuário pedir uma ação dentro do Ticket que ainda não possui uma ferramenta de execução disponível, explique o que pode ser feito e que a automação dessa ação exige uma função específica do sistema. Para informações que dependem de dados em tempo real ou pesquisa na internet, deixe claro quando você não tiver acesso a dados ao vivo em vez de inventar. Contexto técnico do aplicativo: versão ${String(context.version||'1.0.8')}, tela atual ${String(context.view||'desconhecida')}, plataforma ${String(context.platform||'Web/PWA')}.`;

    const prompt=`${transcript?`Histórico recente:\n${transcript}\n\n`:''}Pergunta atual do usuário: ${message}`;

    const ai=new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY});
    const response=await ai.models.generateContent({
      model:MODEL,
      contents:prompt,
      config:{
        systemInstruction,
        temperature:0.45,
        maxOutputTokens:1800
      }
    });

    const answer=String(response.text||'').trim();
    return res.json({
      answer:answer||'Não consegui gerar uma resposta agora.',
      provider:'gemini',
      model:MODEL,
      mode:'general-assistant'
    });
  }catch(error){
    console.error('Ticket Gemini AI error',error);
    const status=Number(error?.status||error?.code||0);
    if(status===429){
      return res.status(429).json({error:'O limite gratuito do Gemini foi atingido temporariamente. Aguarde um pouco e tente novamente.'});
    }
    return res.status(500).json({error:'Falha ao consultar o Assistente Gemini.'});
  }
});

app.listen(PORT,'0.0.0.0',()=>console.log(`Ticket Gemini AI API listening on ${PORT} with ${MODEL}`));
