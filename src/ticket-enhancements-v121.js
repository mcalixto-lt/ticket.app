/* Ticket. 1.0.23 — versão dinâmica e verificação real de atualizações */
'use strict';

(function(){
  const APP_VERSION='1.0.23';
  const VERSION_URL='./public/version.json';
  let checking=false;

  function escVersion(value=''){
    return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  }

  function normalizeVersion(value){
    const match=String(value??'').trim().replace(/^v/i,'').match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:[-+].*)?$/);
    if(!match)return null;
    return [Number(match[1]||0),Number(match[2]||0),Number(match[3]||0)];
  }

  function compareVersions(a,b){
    const av=normalizeVersion(a);
    const bv=normalizeVersion(b);
    if(!av||!bv)return null;
    for(let i=0;i<3;i++){
      if(av[i]>bv[i])return 1;
      if(av[i]<bv[i])return -1;
    }
    return 0;
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

  async function forceReload(statusEl,latest){
    if(statusEl){
      statusEl.className='v121-update-status success';
      statusEl.textContent=`Nova versão ${escVersion(latest)} encontrada. Atualizando o Ticket.…`;
    }
    await refreshServiceWorker();
    await clearCaches();
    setTimeout(()=>location.reload(),180);
  }

  function resetUpdateButton(){
    const button=document.querySelector('#ticketCheckUpdates');
    if(!button)return;
    button.disabled=false;
    button.classList.remove('is-checking');
    const label=button.querySelector('span');
    if(label)label.textContent='Procurar atualizações';
  }

  async function checkForUpdates(){
    if(checking)return;
    checking=true;
    const button=document.querySelector('#ticketCheckUpdates');
    const status=document.querySelector('#ticketUpdateStatus');
    if(button){
      button.disabled=true;
      button.classList.add('is-checking');
      const label=button.querySelector('span');
      if(label)label.textContent='Procurando…';
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
      const latest=String(remote?.version||'').trim();
      const comparison=compareVersions(latest,APP_VERSION);

      if(comparison===null){
        throw new Error('Versão publicada inválida.');
      }

      if(comparison>0){
        /* Só limpa cache e recarrega quando existe uma versão realmente nova. */
        await forceReload(status,latest);
        return;
      }

      /*
         Não existe atualização necessária. Neste caso NÃO limpamos cache,
         NÃO atualizamos o Service Worker e NÃO recarregamos a página.
      */
      if(status){
        status.className='v121-update-status';
        status.textContent=`Você já está na versão mais recente: Ticket. ${escVersion(APP_VERSION)}.`;
      }
      resetUpdateButton();
      checking=false;
    }catch(error){
      console.error('Ticket. atualização:',error);
      if(status){
        status.className='v121-update-status warning';
        status.textContent='Não foi possível verificar agora. Tente novamente.';
      }
      resetUpdateButton();
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
