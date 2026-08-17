/* Ticket. 1.0.20 — versão e organização final das configurações */
'use strict';

(function(){
  const VERSION='1.0.20';

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
    if(!root) return;
    const stack=root.querySelector('.settings-stack');
    if(!stack) return;

    /* Remove qualquer versão criada por uma execução anterior para evitar duplicação. */
    root.querySelectorAll('#v119-system-version').forEach(el=>el.remove());

    let finalGrid=root.querySelector('.v119-settings-final-grid');
    if(!finalGrid){
      finalGrid=document.createElement('div');
      finalGrid.className='v119-settings-final-grid';
      stack.appendChild(finalGrid);
    }

    const install=findCardByTitle(root,['instalação no celular','definir instalação']);
    const account=findCardByTitle(root,['sessão da conta']);
    const reset=findCardByTitle(root,['redefinir instalação']);

    /* Os cards originais saem do grid antigo. */
    [install,account,reset].forEach(card=>{
      if(card&&card.parentElement!==finalGrid) card.remove();
    });

    let version=finalGrid.querySelector('.v119-version-card');
    if(!version){
      version=document.createElement('article');
      version.className='settings-section-card compact-setting-card v119-version-card';
    }
    version.innerHTML=`
      <div class="settings-card-head">
        <div>
          <h3>Versão do Ticket.</h3>
          <p>Versão atualmente instalada neste sistema.</p>
          <strong class="v119-version-number">Ticket. ${VERSION}</strong>
          <small class="settings-help v119-version-help">Atualizada automaticamente a cada nova versão publicada.</small>
        </div>
        <span class="settings-card-icon purple">✓</span>
      </div>`;

    /* Ordem EXATA solicitada: Versão do Ticket. → Definir Instalação → Sessão da Conta. */
    const ordered=[version,install,account].filter(Boolean);
    ordered.forEach(card=>finalGrid.appendChild(card));

    /* Redefinir instalação continua disponível, mas fica depois do grupo solicitado. */
    if(reset){
      let resetGrid=root.querySelector('.v119-reset-grid');
      if(!resetGrid){
        resetGrid=document.createElement('div');
        resetGrid.className='v119-reset-grid';
        stack.appendChild(resetGrid);
      }
      resetGrid.appendChild(reset);
    }

    /* Renomeia a instalação para exatamente o texto pedido. */
    if(install){
      const heading=install.querySelector('h3');
      if(heading) heading.textContent='Definir Instalação';
    }
  }

  function fitCameraToSource(){
    const stage=document.querySelector('#cameraStage');
    if(!stage) return;
    const video=document.querySelector('#cameraVideo');
    const image=stage.querySelector('img');
    const source=video&&!video.classList.contains('hidden')&&video.videoWidth>0?video:image;
    if(!source) return;

    const w=Number(source.videoWidth||source.naturalWidth||0);
    const h=Number(source.videoHeight||source.naturalHeight||0);
    if(w>0&&h>0){
      stage.style.aspectRatio='auto';
      stage.style.height='auto';
      stage.style.width='min(100%, 520px)';
      stage.style.marginInline='auto';
      source.style.width='100%';
      source.style.height='auto';
      source.style.objectFit='contain';
      source.style.objectPosition='center center';
    }
  }

  function bindCameraSizing(){
    const video=document.querySelector('#cameraVideo');
    if(video){
      video.addEventListener('loadedmetadata',fitCameraToSource,{once:false});
      if(video.readyState>=1) fitCameraToSource();
    }
    const image=document.querySelector('#cameraStage img');
    image?.addEventListener('load',fitCameraToSource,{once:false});
    setTimeout(fitCameraToSource,60);
    setTimeout(fitCameraToSource,250);
    setTimeout(fitCameraToSource,700);
  }

  const originalStartCamera=typeof startCamera==='function'?startCamera:null;
  if(originalStartCamera){
    startCamera=async function(...args){
      const result=await originalStartCamera.apply(this,args);
      bindCameraSizing();
      return result;
    };
  }

  const originalRender=typeof renderView==='function'?renderView:null;
  if(originalRender){
    renderView=function(...args){
      const result=originalRender.apply(this,args);
      requestAnimationFrame(()=>{
        if(state.view==='settings') ensureFinalSettingsOrder();
        if(state.view==='capture') bindCameraSizing();
      });
      setTimeout(()=>{
        if(state.view==='settings') ensureFinalSettingsOrder();
        if(state.view==='capture') fitCameraToSource();
      },120);
      setTimeout(()=>{
        if(state.view==='settings') ensureFinalSettingsOrder();
        if(state.view==='capture') fitCameraToSource();
      },500);
      return result;
    };
  }

  let queued=false;
  const observer=new MutationObserver(()=>{
    if(queued) return;
    if(!settingsRoot()&&state?.view!=='capture') return;
    queued=true;
    setTimeout(()=>{
      queued=false;
      if(state?.view==='settings') ensureFinalSettingsOrder();
      if(state?.view==='capture') fitCameraToSource();
    },80);
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});

  document.addEventListener('DOMContentLoaded',()=>{
    setTimeout(()=>{if(state?.view==='settings')ensureFinalSettingsOrder();},100);
    setTimeout(()=>{if(state?.view==='settings')ensureFinalSettingsOrder();if(state?.view==='capture')bindCameraSizing();},400);
    setTimeout(()=>{if(state?.view==='settings')ensureFinalSettingsOrder();if(state?.view==='capture')fitCameraToSource();},900);
  });
})();
