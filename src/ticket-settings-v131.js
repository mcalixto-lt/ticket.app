/* Ticket. 1.0.35 — Jornada Semanal em página própria e máscara de CPF */
'use strict';

(function(){
  let settingsSnapshot='';
  let weeklyPageOpen=false;

  function weeklyPage(){
    return `<section class="settings-full v131-weekly-page">
      <div class="settings-page-intro v131-weekly-page-intro">
        <button type="button" class="v131-back-button" id="v131WeeklyBack">${icon('back',18)}<span>Configurações</span></button>
        <span class="settings-kicker">PREFERÊNCIAS</span>
        <h2>Jornada Semanal</h2>
        <p>Configure os dias de trabalho e as horas previstas. As alterações são aplicadas à jornada utilizada nos registros.</p>
      </div>
      <div class="settings-stack v131-weekly-stack">
        <article class="settings-section-card v131-weekly-card">
          ${weeklyScheduleCard()}
        </article>
      </div>
    </section>`;
  }

  function openWeeklyPage(){
    if(weeklyPageOpen)return;
    const app=document.querySelector('#app');
    if(!app)return;
    settingsSnapshot=app.innerHTML;
    weeklyPageOpen=true;
    app.innerHTML=weeklyPage();
    document.body.classList.add('v131-page-open');
    document.querySelector('#v131WeeklyBack')?.addEventListener('click',closeWeeklyPage,{once:true});
    try{ bindSettings(); }catch(error){ console.warn('Ticket. jornada: não foi possível religar configurações',error); }
    window.scrollTo({top:0,behavior:'instant'});
  }

  function closeWeeklyPage(){
    const app=document.querySelector('#app');
    if(!app)return;
    app.innerHTML=settingsSnapshot;
    settingsSnapshot='';
    weeklyPageOpen=false;
    document.body.classList.remove('v131-page-open');
    try{ bindSettings(); }catch(error){ console.warn('Ticket. configurações: não foi possível religar controles',error); }
    window.scrollTo({top:0,behavior:'instant'});
  }

  function renderResources(){
    const card=document.querySelector('.v130-resources-card');
    if(!card)return;
    const grid=card.querySelector('.v105-resource-grid');
    if(!grid)return;
    grid.innerHTML=`
      <button type="button" data-resource-view="storage">
        <span class="resource-icon blue">${v105DatabaseGlyph(21)}</span>
        <strong>Armazenamento</strong>
        <small>Cópias das imagens, backup local e futura sincronização em nuvem.</small>
      </button>
      <button type="button" data-resource-view="weekly-schedule" class="v131-resource-button">
        <span class="resource-icon purple">${v105DatabaseGlyph(21)}</span>
        <strong>Jornada Semanal</strong>
        <small>Configure os dias e as horas previstas.</small>
      </button>`;
    grid.querySelector('[data-resource-view="weekly-schedule"]')?.addEventListener('click',openWeeklyPage);
  }

  function maskCpfDisplay(){
    const cpfPattern=/\b(\d{3})\.?\d{3}\.?\d{3}-?(\d{2})\b/g;
    const maskedPattern=/\*{3}\.\d{3}\.\d{3}-?\d{0,2}\b/g;
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    const nodes=[];
    let node;
    while(node=walker.nextNode()){
      if(node.parentElement?.closest('input,textarea,select,script,style'))continue;
      if(cpfPattern.test(node.nodeValue)||maskedPattern.test(node.nodeValue))nodes.push(node);
      cpfPattern.lastIndex=0; maskedPattern.lastIndex=0;
    }
    nodes.forEach(textNode=>{
      let value=textNode.nodeValue;
      value=value.replace(cpfPattern,(_,a,b)=>`***.***.***-${b}`);
      value=value.replace(maskedPattern,'***.***.***-00');
      textNode.nodeValue=value;
      cpfPattern.lastIndex=0; maskedPattern.lastIndex=0;
    });
  }

  function bind(){
    if(weeklyPageOpen)return;
    renderResources();
    maskCpfDisplay();
  }

  const previousBind=typeof bindSettings==='function'?bindSettings:null;
  if(previousBind){
    bindSettings=function(...args){
      const result=previousBind.apply(this,args);
      setTimeout(bind,0);
      return result;
    };
  }

  const observer=new MutationObserver(()=>{
    if(!weeklyPageOpen)bind();
  });
  observer.observe(document.body,{childList:true,subtree:true});

  document.addEventListener('DOMContentLoaded',()=>setTimeout(bind,250));
})();
