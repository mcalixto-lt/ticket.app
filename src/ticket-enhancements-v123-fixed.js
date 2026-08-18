/* Ticket. 1.0.31 — verificação de atualizações corrigida */
'use strict';

(function(){
  const APP_VERSION='1.0.31';
  const VERSION_SOURCES=[
    {label:'jsDelivr',makeUrl:()=>`https://cdn.jsdelivr.net/gh/mcalixto-lt/ticket.app@main/public/version.json?check=${Date.now()}`,remote:true,kind:'json'},
    {label:'GitHub Raw',makeUrl:()=>`https://raw.githubusercontent.com/mcalixto-lt/ticket.app/main/public/version.json?check=${Date.now()}`,remote:true,kind:'json'},
    {label:'GitHub API',makeUrl:()=>`https://api.github.com/repos/mcalixto-lt/ticket.app/contents/public/version.json?ref=main&check=${Date.now()}`,remote:true,kind:'github-api'}
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

    /*
      IMPORTANTE: esta função é chamada pelo MutationObserver.
      Não podemos reconstruir innerHTML a cada mutação, porque o clique em
      "Procurar atualizações" altera o próprio texto/status do card e isso
      faria o observer apagar imediatamente o resultado da verificação.
    */
    if(card.dataset.updateUiReady!=='1'){
      card.innerHTML=`
        <div class="settings-card-head">
          <div>
            <h3>Versão do Ticket.</h3>
            <p>Versão atualmente instalada neste sistema.</p>
            <strong class="v121-version-number">Ticket. ${escVersion(APP_VERSION)}</strong>
            <small class="settings-help v121-version-help">Verifique manualmente quando quiser. O sistema só atualiza quando uma versão superior for encontrada.</small>
            <div class="v121-version-actions">
              <button id="ticketCheckUpdates" type="button" class="secondary v121-update-button">${icon('search',17)}<span>Procurar atualizações</span></button>
            </div>
            <small id="ticketUpdateStatus" class="v121-update-status" aria-live="polite">Pronto para verificar atualizações.</small>
          </div>
          <span class="settings-card-icon purple">✓</span>
        </div>`;
      card.dataset.updateUiReady='1';
    }else{
      const number=card.querySelector('.v121-version-number');
      if(number)number.textContent=`Ticket. ${APP_VERSION}`;
    }
    bindUpdateButton();
  }

  /* ---------- ATUALIZAÇÃO: somente se existir versão superior ---------- */
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

    for(const source of VERSION_SOURCES){
      console.log(`[Ticket.] Tentando fonte: ${source.label}`);
      try{
        const url=source.makeUrl();
        console.log(`[Ticket.] URL: ${url}`);
        
        const response=await fetch(url,{
          method:'GET',
          cache:'no-store',
          credentials:'omit',
          headers:{'Accept':'application/json','Cache-Control':'no-cache','Pragma':'no-cache'}
        });
        
        console.log(`[Ticket.] Status: ${response.status} ${response.statusText}`);
        console.log(`[Ticket.] Content-Type: ${response.headers.get('content-type')}`);
        
        if(!response.ok)throw new Error(`HTTP ${response.status} ${response.statusText}`);
        
        const contentType=(response.headers.get('content-type')||'').toLowerCase();
        const text=await response.text();
        console.log(`[Ticket.] Texto recebido: ${text}`);
        
        if(contentType.includes('text/html')||/^\s*<!doctype html/i.test(text))throw new Error('A fonte devolveu HTML em vez do arquivo de versão.');

        let data;
        if(source.kind==='github-api'){
          const api=JSON.parse(text);
          if(!api?.content)throw new Error('Conteúdo da versão não encontrado na API do GitHub.');
          const decoded=atob(String(api.content).replace(/\s/g,''));
          data=JSON.parse(decoded);
          console.log(`[Ticket.] Dados decodificados (GitHub API):`, data);
        }else{
          data=JSON.parse(text);
          console.log(`[Ticket.] Dados parseados (JSON direto):`, data);
        }

        const version=String(data?.version||'').trim();
        console.log(`[Ticket.] Versão extraída: ${version}`);
        
        if(!normalizeVersion(version))throw new Error('Versão publicada inválida.');
        console.log(`[Ticket.] Versão normalizada:`, normalizeVersion(version));
        
        return {version,source:source.label,remote:true};
      }catch(error){
        console.error(`[Ticket.] ERRO na fonte ${source.label}:`, error.message, error);
        lastError=error;
      }
    }

    throw lastError||new Error('Nenhuma fonte de versão disponível.');
  }

  async function installUpdateAndPromptRestart(statusEl,latest){
    if(statusEl){
      statusEl.className='v121-update-status checking';
      statusEl.textContent=`Nova versão ${escVersion(latest)} encontrada. Instalando a atualização…`;
    }

    if(!('serviceWorker' in navigator)){
      throw new Error('Este navegador não oferece suporte à atualização automática do Ticket.');
    }

    const registration=await navigator.serviceWorker.getRegistration();
    if(!registration)throw new Error('O serviço de atualização do Ticket não está disponível.');

    // Solicita a instalação da versão nova sem recarregar a página.
    await registration.update();

    // Aguarda a instalação/ativação do novo Service Worker. O SW do Ticket
    // usa skipWaiting()/clients.claim(), portanto a nova versão assume o
    // controle sem reiniciar automaticamente o navegador.
    const installing=registration.installing;
    if(installing){
      await new Promise((resolve,reject)=>{
        const timeout=setTimeout(()=>resolve(),10000);
        const done=()=>{
          if(['installed','activated','redundant'].includes(installing.state)){
            clearTimeout(timeout);
            installing.removeEventListener('statechange',done);
            if(installing.state==='redundant')reject(new Error('A instalação da atualização foi interrompida.'));
            else resolve();
          }
        };
        installing.addEventListener('statechange',done);
        done();
      });
    }else{
      await new Promise(resolve=>setTimeout(resolve,900));
    }

    if(statusEl){
      statusEl.className='v121-update-status success';
      statusEl.innerHTML=`<strong>Atualização ${escVersion(latest)} instalada.</strong><br><span>Reinicie o Ticket. para aplicar a nova versão.</span><div class="v121-update-restart-wrap"><button id="ticketRestartNow" type="button" class="v121-restart-button">Reiniciar Ticket.</button></div>`;
      const restart=document.querySelector('#ticketRestartNow');
      restart?.addEventListener('click',()=>{
        restart.disabled=true;
        restart.textContent='Reiniciando…';
        const url=new URL(window.location.href);
        url.searchParams.set('ticketRestart',Date.now().toString());
        window.location.replace(url.toString());
      },{once:true});
    }
  }

  function resetUpdateButton(){
    const button=document.querySelector('#ticketCheckUpdates');
    if(!button)return;
    button.disabled=false;
    button.classList.remove('is-checking');
    const label=button.querySelector('span');
    if(label)label.textContent='Procurar atualizações';
  }

  function updateCheckTime(){
    return new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  }

  async function checkForUpdates(){
    if(checking)return;
    checking=true;

    const button=document.querySelector('#ticketCheckUpdates');
    const status=document.querySelector('#ticketUpdateStatus');

    console.log(`[Ticket.] Iniciando verificação de atualizações. Versão instalada: ${APP_VERSION}`);
    
    if(button){
      button.disabled=true;
      button.classList.add('is-checking');
      const label=button.querySelector('span');
      if(label)label.textContent='Procurando…';
    }
    if(status){
      status.className='v121-update-status checking';
      status.textContent='Procurando atualizações disponíveis…';
    }

    try{
      const published=await fetchPublishedVersion();
      console.log(`[Ticket.] Versão publicada encontrada: ${published.version} (fonte: ${published.source})`);
      
      const latest=published.version;
      const comparison=compareVersions(latest,APP_VERSION);
      console.log(`[Ticket.] Comparação: ${latest} vs ${APP_VERSION} = ${comparison}`);

      if(comparison===null){
        throw new Error('Não foi possível comparar as versões.');
      }

      if(comparison>0){
        console.log(`[Ticket.] NOVA VERSÃO DISPONÍVEL!`);
        await installUpdateAndPromptRestart(status,latest);
        return;
      }

      /*
        Versão igual ou inferior: somente informa o resultado.
        NÃO recarrega, NÃO limpa cache e NÃO força atualização.
      */
      if(status){
        status.className='v121-update-status success';
        if(comparison===0){
          status.textContent=`Sistema atualizado. Você já está na versão mais recente: Ticket. ${escVersion(APP_VERSION)} · verificado às ${updateCheckTime()}.`;
        }else{
          status.textContent=`A versão publicada (${escVersion(latest)}) é mais antiga que a instalada (${escVersion(APP_VERSION)}). Use a versão local.`;
        }
        if(!published.remote)status.className='v121-update-status success';
      }
      resetUpdateButton();
      checking=false;
    }catch(error){
      console.error('[Ticket.] ERRO na verificação de atualizações:', error);
      if(status){
        status.className='v121-update-status error';
        status.textContent=`Não foi possível procurar atualizações agora. Verifique sua conexão e tente novamente · ${updateCheckTime()}. (Erro: ${error.message})`;
      }
      resetUpdateButton();
      checking=false;
    }
  }

  function bindUpdateButton(){
    const button=document.querySelector('#ticketCheckUpdates');
    if(!button||button.dataset.bound==='1')return;
    button.dataset.bound='1';
    console.log('[Ticket.] Vinculando botão de atualização');
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
    console.log('[Ticket.] DOMContentLoaded - inicializando sistema de atualizações');
    setTimeout(()=>{
      if(typeof state==='undefined'){
        console.warn('[Ticket.] state não disponível no DOMContentLoaded');
        return;
      }
      console.log(`[Ticket.] state.view = ${state.view}`);
      if(state.view==='capture')bindCamera();
      if(state.view==='settings'){
        ensureFinalSettingsOrder();
        ensureVersionCard();
      }
    },250);
    setTimeout(()=>{
      if(typeof state==='undefined'){
        console.warn('[Ticket.] state não disponível no timeout 700ms');
        return;
      }
      console.log(`[Ticket.] state.view = ${state.view}`);
      if(state.view==='capture')bindCamera();
      if(state.view==='settings'){
        ensureFinalSettingsOrder();
        ensureVersionCard();
      }
    },700);
  });
  
  // Verificação extra após carregamento completo
  window.addEventListener('load',()=>{
    console.log('[Ticket.] Window load - verificando estado final');
    setTimeout(()=>{
      if(typeof state==='undefined'){
        console.warn('[Ticket.] state ainda não disponível após window.load');
        return;
      }
      if(state.view==='settings'){
        ensureFinalSettingsOrder();
        ensureVersionCard();
      }
    },100);
  });
})();
