/* Ticket. 1.0.19 — versão do sistema e organização das configurações */
'use strict';

(function(){
  const VERSION='1.0.19';

  function settingsRoot(){
    return document.querySelector('.settings-full')
      || document.querySelector('.settings-detail')
      || document.querySelector('[data-view="settings"]');
  }

  function textOf(el){ return String(el?.textContent||'').replace(/\s+/g,' ').trim().toLowerCase(); }

  function findSettingCard(root, terms){
    const candidates=[...root.querySelectorAll('.settings-section-card,.compact-setting-card,.settings-bottom-grid > *,section')];
    return candidates.find(el=>terms.some(term=>textOf(el).includes(term)));
  }

  function ensureSystemVersion(){
    const root=settingsRoot();
    if(!root) return;

    let card=root.querySelector('#v119-system-version');
    if(!card){
      card=document.createElement('section');
      card.id='v119-system-version';
      card.className='settings-section-card v118-system-version';
      card.innerHTML=`<div class="v118-version-icon">✓</div><div><span>VERSÃO DO SISTEMA</span><strong>Ticket. ${VERSION}</strong><small>Versão instalada e atualizada automaticamente a cada nova atualização do sistema.</small></div>`;
      const stack=root.querySelector('.settings-stack') || root.querySelector('.settings-bottom-grid') || root;
      stack.appendChild(card);
    }else{
      const strong=card.querySelector('strong');
      if(strong) strong.textContent=`Ticket. ${VERSION}`;
    }
  }

  function reorderSettings(){
    const root=settingsRoot();
    if(!root) return;

    ensureSystemVersion();

    const versionTicket=findSettingCard(root,['versão do ticket','versao do ticket']);
    const install=findSettingCard(root,['definir instalação','definir instalacao']);
    const account=findSettingCard(root,['sessão da conta','sessao da conta']);
    const system=root.querySelector('#v119-system-version');

    const ordered=[versionTicket,install,account,system].filter(Boolean);
    if(!ordered.length) return;

    const parent=ordered[0].parentElement;
    if(!parent) return;
    if(!ordered.every(el=>el.parentElement===parent)) return;

    ordered.forEach(el=>parent.appendChild(el));
  }

  function run(){
    requestAnimationFrame(()=>{
      ensureSystemVersion();
      reorderSettings();
    });
  }

  const originalRender=typeof window.renderView==='function' ? window.renderView : null;
  if(originalRender){
    window.renderView=function(...args){
      const result=originalRender.apply(this,args);
      run();
      setTimeout(run,120);
      setTimeout(run,450);
      return result;
    };
  }

  const observer=new MutationObserver(()=>{
    if(settingsRoot()) run();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});

  document.addEventListener('DOMContentLoaded',()=>{
    run();
    setTimeout(run,250);
    setTimeout(run,800);
  });
  setTimeout(run,350);
})();
