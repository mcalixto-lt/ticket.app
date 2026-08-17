/* Ticket. 1.0.26 — câmera e verificação de atualizações */
'use strict';

(function(){
  const APP_VERSION='1.0.26';
  const VERSION_SOURCES=[
    ()=>`https://raw.githubusercontent.com/mcalixto-lt/ticket.app/main/public/version.json?check=${Date.now()}`,
    ()=>new URL('./version.json',window.location.href).href,
    ()=>new URL('./public/version.json',window.location.href).href
  ];
  const CAMERA_WIDTH=636;
  const CAMERA_HEIGHT=500;
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
    const av=normalizeVersion(a), bv=normalizeVersion(b);
    if(!av||!bv)return null;
    for(let i=0;i<3;i++){
      if(av[i]>bv[i])return 1;
      if(av[i]<bv[i])return -1;
    }
    return 0;
  }

  /* ---------- CÂMERA FINAL ---------- */
  function cameraStage(){
    return document.querySelector('#cameraStage');
  }

  function applyCameraDimensions(){
    const stage=cameraStage();
    if(!stage)return;

    /*
      Não usamos a proporção da câmera para dimensionar o container.
      O container agora tem exatamente 636 x 500 px e fica centralizado.
      Isso evita que scripts anteriores alterem a posição ou a altura.
    */
    stage.style.width=`min(${CAMERA_WIDTH}px, 100%)`;
    stage.style.maxWidth=`${CAMERA_WIDTH}px`;
    stage.style.height=`${CAMERA_HEIGHT}px`;
    stage.style.minHeight=`${CAMERA_HEIGHT}px`;
    stage.style.maxHeight=`${CAMERA_HEIGHT}px`;
    stage.style.aspectRatio='auto';
    stage.style.marginLeft='auto';
    stage.style.marginRight='auto';
    stage.style.marginInline='auto';
    stage.style.position='relative';
    stage.style.overflow='hidden';

    const sources=stage.querySelectorAll('video,img');
    sources.forEach(source=>{
      source.style.width='100%';
      source.style.height='100%';
      source.style.minWidth='0';
      source.style.minHeight='0';
      source.style.maxWidth='none';
      source.style.maxHeight='none';
      source.style.objectFit='cover';
      source.style.objectPosition='center center';
      source.style.margin='0';
    });
  }

  function bindCamera(){
    applyCameraDimensions();
    const video=document.querySelector('#cameraVideo');
    const image=document.querySelector('#cameraStage img');

    video?.addEventListener('loadedmetadata',applyCameraDimensions);
    video?.addEventListener('canplay',applyCameraDimensions);
    video?.addEventListener('resize',applyCameraDimensions);
    image?.addEventListener('load',applyCameraDimensions);

    [0,50,150,350,700,1200].forEach(ms=>setTimeout(applyCameraDimensions,ms));
  }

  /* ---------- CONFIGURAÇÕES: ORDEM FINAL ---------- */
  function settingsRoot(){
    return document.querySelector('.settings-full');
  }

  function textOf(el){
    return String(el?.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
  }

  function findCardByTitle(root, terms){
    const cards=[...root.querySelectorAll('.settings-section-card')];
    return cards.find(card=>{
      const heading=card.querySelector('h3');
      const text=textOf(heading||card);
      return terms.some(term=>text.includes(term));
    })||null;
  }

  function ensureFinalSettingsOrder(){
    const root=settingsRoot();
    if(!root)return;
    const stack=root.querySelector('.settings-stack');
    if(!stack)return;

    let finalGrid=root.querySelector('.v122-settings-final-grid');
    if(!finalGrid){
      finalGrid=document.createElement('div');
      finalGrid.className='v122-settings-final-grid';
      stack.appendChild(finalGrid);
    }

    let version=finalGrid.querySelector('.v121-version-card');
    if(!version){
      version=document.createElement('article');
      version.className='settings-section-card compact-setting-card v121-version-card';
    }

    const install=findCardByTitle(root,['instalação no celular','definir instalação']);
    const account=findCardByTitle(root,['sessão da conta']);
    const reset=findCardByTitle(root,['redefinir instalação']);

    if(install){
      const heading=install.querySelector('h3');
      if(heading)heading.textContent='Definir Instalação';
    }

    /*
      O grupo é reconstruído sempre na mesma ordem.
      Os cards originais são movidos, não clonados, preservando seus eventos.
    */
    [version,install,account].filter(Boolean).forEach(card=>{
      if(card.parentElement!==finalGrid)finalGrid.appendChild(card);
    });

    if(reset){
      let resetGrid=root.querySelector('.v122-reset-grid');
      if(!resetGrid){
        resetGrid=document.createElement('div');
        resetGrid.className='v122-reset-grid';
        stack.appendChild(resetGrid);
      }
      if(reset.parentElement!==resetGrid)resetGrid.appendChild(reset);
    }

    /*
      Tudo que já foi colocado no grupo final deixa de permanecer no stack
      original, evitando uma segunda camada visual.
    */
    if(finalGrid.parentElement!==stack)stack.appendChild(finalGrid);
  }

  function versionCard(){
    return document.querySelector('.v121-version-card');
  }

  function ensureVersionCard(){
    if(typeof state==='undefined'||state.view!=='settings')return;
    const card=versionCard();
    if(!card)return;

    card.classList.add('v121-version-card');
    card.id='v122-system-version';
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

  /* ---------- ATUALIZAÇÃO: somente se existir versão superior ---------- */
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

  async function fetchPublishedVersion(){
    let lastError=null;
    for(const makeUrl of VERSION_SOURCES){
      try{
        const url=makeUrl();
        const response=await fetch(url,{
          method:'GET',
          cache:'no-store',
          credentials:'omit',
          headers:{'Accept':'application/json','Cache-Control':'no-cache','Pragma':'no-cache'}
        });
        if(!response.ok)throw new Error(`HTTP ${response.status}`);
        const contentType=(response.headers.get('content-type')||'').toLowerCase();
        const text=await response.text();
        if(contentType.includes('text/html')||/^\s*<!doctype html/i.test(text))throw new Error('O servidor devolveu HTML em vez do arquivo de versão.');
        const data=JSON.parse(text);
        const version=String(data?.version||'').trim();
        if(!normalizeVersion(version))throw new Error('Versão publicada inválida.');
        return {version,source:url};
      }catch(error){
        lastError=error;
        console.warn('Ticket. versão: fonte indisponível',makeUrl.toString(),error);
      }
    }
    throw lastError||new Error('Nenhuma fonte de versão disponível.');
  }

  async function forceReload(statusEl,latest){
    if(statusEl){
      statusEl.className='v121-update-status success';
      statusEl.textContent=`Nova versão ${escVersion(latest)} encontrada. Atualizando o Ticket.…`;
    }
    await refreshServiceWorker();
    await clearCaches();
    setTimeout(()=>location.reload(),220);
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
      status.textContent='Procurando uma versão publicada…';
    }

    try{
      const published=await fetchPublishedVersion();
      const latest=published.version;
      const comparison=compareVersions(latest,APP_VERSION);

      if(comparison===null)throw new Error('Não foi possível comparar as versões.');

      if(comparison>0){
        await forceReload(status,latest);
        return;
      }

      /*
        Versão igual ou inferior: somente informa o resultado.
        NÃO recarrega, NÃO limpa cache e NÃO força atualização.
      */
      if(status){
        status.className='v121-update-status success';
        status.textContent=`Você já está na versão mais recente: Ticket. ${escVersion(APP_VERSION)}.`;
      }
      resetUpdateButton();
      checking=false;
    }catch(error){
      console.error('Ticket. atualização:',error);
      if(status){
        status.className='v121-update-status warning';
        status.textContent='Não foi possível verificar a atualização agora. Verifique sua conexão e tente novamente.';
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

  /* ---------- RENDER / OBSERVAÇÃO ---------- */
  const previousRender=typeof renderView==='function'?renderView:null;
  if(previousRender){
    renderView=function(...args){
      const result=previousRender.apply(this,args);
      requestAnimationFrame(()=>{
        if(typeof state!=='undefined'&&state.view==='capture')bindCamera();
        if(typeof state!=='undefined'&&state.view==='settings'){
          ensureFinalSettingsOrder();
          ensureVersionCard();
        }
      });
      setTimeout(()=>{
        if(typeof state!=='undefined'&&state.view==='capture')bindCamera();
        if(typeof state!=='undefined'&&state.view==='settings'){
          ensureFinalSettingsOrder();
          ensureVersionCard();
        }
      },180);
      return result;
    };
  }

  const previousStart=typeof startCamera==='function'?startCamera:null;
  if(previousStart){
    startCamera=async function(...args){
      const result=await previousStart.apply(this,args);
      bindCamera();
      return result;
    };
  }

  let queued=false;
  const observer=new MutationObserver(()=>{
    if(queued)return;
    if(typeof state==='undefined')return;
    if(state.view!=='capture'&&state.view!=='settings')return;
    queued=true;
    setTimeout(()=>{
      queued=false;
      if(state.view==='capture')bindCamera();
      if(state.view==='settings'){
        ensureFinalSettingsOrder();
        ensureVersionCard();
      }
    },80);
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});

  document.addEventListener('DOMContentLoaded',()=>{
    setTimeout(()=>{
      if(typeof state==='undefined')return;
      if(state.view==='capture')bindCamera();
      if(state.view==='settings'){
        ensureFinalSettingsOrder();
        ensureVersionCard();
      }
    },250);
    setTimeout(()=>{
      if(typeof state==='undefined')return;
      if(state.view==='capture')bindCamera();
      if(state.view==='settings'){
        ensureFinalSettingsOrder();
        ensureVersionCard();
      }
    },700);
  });
})();
