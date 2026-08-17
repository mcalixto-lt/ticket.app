/* Ticket. 1.0.21 — câmera centralizada, ampla e sem barras pretas */
'use strict';

(function(){
  function syncCameraRatio(){
    const stage=document.querySelector('#cameraStage');
    if(!stage) return;
    const video=document.querySelector('#cameraVideo');
    const image=stage.querySelector('img');
    const source=video&&!video.classList.contains('hidden')&&video.videoWidth>0?video:image;
    if(!source) return;

    const w=Number(source.videoWidth||source.naturalWidth||0);
    const h=Number(source.videoHeight||source.naturalHeight||0);
    if(!(w>0&&h>0)) return;

    /* O palco passa a ter exatamente a mesma proporção da fonte.
       Com object-fit:cover não haverá barras nem corte, porque as proporções coincidem. */
    stage.style.width='100%';
    stage.style.maxWidth='620px';
    stage.style.height='auto';
    stage.style.aspectRatio=`${w}/${h}`;
    stage.style.marginLeft='auto';
    stage.style.marginRight='auto';
    stage.style.marginInline='auto';

    source.style.width='100%';
    source.style.height='100%';
    source.style.objectFit='cover';
    source.style.objectPosition='center center';
  }

  function bind(){
    const video=document.querySelector('#cameraVideo');
    if(video){
      video.addEventListener('loadedmetadata',syncCameraRatio);
      video.addEventListener('canplay',syncCameraRatio);
      if(video.readyState>=1) syncCameraRatio();
    }
    const image=document.querySelector('#cameraStage img');
    image?.addEventListener('load',syncCameraRatio);
    syncCameraRatio();
    [80,250,700,1200].forEach(ms=>setTimeout(syncCameraRatio,ms));
  }

  const previousStart=typeof startCamera==='function'?startCamera:null;
  if(previousStart){
    startCamera=async function(...args){
      const result=await previousStart.apply(this,args);
      bind();
      return result;
    };
  }

  const previousRender=typeof renderView==='function'?renderView:null;
  if(previousRender){
    renderView=function(...args){
      const result=previousRender.apply(this,args);
      if(typeof state!=='undefined'&&state.view==='capture'){
        requestAnimationFrame(bind);
        setTimeout(bind,180);
      }
      return result;
    };
  }

  const observer=new MutationObserver(()=>{
    if(typeof state!=='undefined'&&state.view==='capture') bind();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});

  document.addEventListener('DOMContentLoaded',()=>{
    setTimeout(bind,200);
    setTimeout(bind,700);
  });
})();
