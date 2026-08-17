/* Ticket. 1.0.22 — versão dinâmica e atualização manual */
'use strict';

(function(){
  const APP_VERSION='1.0.22';
  const VERSION_URL='./public/version.json';
  let checking=false;

  function escVersion(value=''){
    return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  }

  function versionCard(){
    return document.querySelector('.v119-version-card') || document.querySelector('#v118-system-version');
  }

  function ensureVersionCard(){
    if(typeof state==='undefined'||state.view!=='settings')return;
    const card=versionCard();
    if(!card)return;
    card.classList.add('v121-version-card');
    card.id='v121-system-version';
    card.innerHTML=`
      <div class="settings-card-head">
        <div>
          <h3>Versão do Ticket.</h3>
          <p>Versão atualmente instalada neste sistema.</p>
          <strong class="v121-version-number">Ticket. ${escVersion(APP_VERSION)}</strong>
          <small class="settings-help v121-version-help">A versão é conferida pelo sistema e pode ser verificada manualmente a qualquer momento.</small>
          <div class="v121-version-actions">
            <button id="ticketCheckUpdates" type="button" class="secondary v121-update-button">${icon('search',17)}<span>Procurar atualizações</span></button>
          </div>
          <small id="ticketUpdateStatus" class="v121-update-status" aria-live="polite">Pronto para verificar atualizações.</small>
        </div>
        <span class="settings-card-icon purple">✓</span>
      </div>`;
    bindUpdateButton();
  }

  async function clearCaches(){
    if(!('caches' in window))return;
    try{
      const keys=await caches.keys();
      await Promise.all(keys.map(key=>caches.delete(key)));
    }catch(error){
      console.warn('Ticket. cache clear:',error);
    }
  }

  async function refreshServiceWorker(){
    if(!('serviceWorker' in navigator))return;
    try{
      const registration=await navigator.serviceWorker.getRegistration();
      if(registration)await registration.update();
    }catch(error){
      console.warn('Ticket. service worker update:',error);
    }
  }

  async function forceReload(statusEl){
    if(statusEl){
      statusEl.className='v121-update-status success';
      statusEl.textContent='Atualização preparada. Recarregando o Ticket.…';
    }
    await refreshServiceWorker();
    await clearCaches();
    setTimeout(()=>location.reload(),180);
  }

  async function checkForUpdates(){
    if(checking)return;
    checking=true;
    const button=document.querySelector('#ticketCheckUpdates');
    const status=document.querySelector('#ticketUpdateStatus');
    if(button){
      button.disabled=true;
      button.classList.add('is-checking');
      button.querySelector('span').textContent='Procurando…';
    }
    if(status){
      status.className='v121-update-status';
      status.textContent='Verificando a versão mais recente…';
    }

    try{
      const response=await fetch(`${VERSION_URL}?check=${Date.now()}`,{
        method:'GET',
        cache:'no-store',
        headers:{'Cache-Control':'no-cache','Pragma':'no-cache'}
      });
      if(!response.ok)throw new Error(`HTTP ${response.status}`);
      const remote=await response.json();
      const latest=String(remote?.version||APP_VERSION);

      if(latest!==APP_VERSION){
        if(status){
          status.className='v121-update-status success';
          status.textContent=`Nova versão ${latest} encontrada. Atualizando…`;
        }
        await forceReload(status);
        return;
      }

      /* Mesmo quando não há versão nova, o botão força uma nova leitura dos
         arquivos publicados, limpando o cache local antes de recarregar. */
      await forceReload(status);
    }catch(error){
      console.error('Ticket. atualização:',error);
      if(status){
        status.className='v121-update-status warning';
        status.textContent='Não foi possível verificar agora. Tente novamente.';
      }
      if(button){
        button.disabled=false;
        button.classList.remove('is-checking');
        button.querySelector('span').textContent='Procurar atualizações';
      }
      checking=false;
    }
  }

  function bindUpdateButton(){
    const button=document.querySelector('#ticketCheckUpdates');
    if(!button||button.dataset.bound==='1')return;
    button.dataset.bound='1';
    button.addEventListener('click',checkForUpdates);
  }

  const previousRender=typeof renderView==='function'?renderView:null;
  if(previousRender){
    renderView=function(...args){
      const result=previousRender.apply(this,args);
      if(typeof state!=='undefined'&&state.view==='settings'){
        requestAnimationFrame(ensureVersionCard);
        setTimeout(ensureVersionCard,100);
        setTimeout(ensureVersionCard,350);
      }
      return result;
    };
  }

  const observer=new MutationObserver(()=>{
    if(typeof state!=='undefined'&&state.view==='settings'){
      if(!document.querySelector('#ticketCheckUpdates'))setTimeout(ensureVersionCard,0);
    }
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});

  document.addEventListener('DOMContentLoaded',()=>{
    setTimeout(ensureVersionCard,250);
    setTimeout(ensureVersionCard,700);
  });
})();
