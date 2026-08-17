/* Ticket. 1.0.23 — câmera maior, centralizada e sem barras pretas */
'use strict';

(function(){
  const CAMERA_MAX_WIDTH='728px';
  const CAMERA_EXTRA_WIDTH='48px';
  const CAMERA_SIDE_OFFSET='-24px';

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

    /*
       Expande a área lateralmente dentro do card. Como a altura continua
       sendo calculada pela proporção real da câmera, a imagem permanece
       proporcional, sem deformação e sem barras pretas.
    */
    stage.style.width=`calc(100% + ${CAMERA_EXTRA_WIDTH})`;
    stage.style.maxWidth=CAMERA_MAX_WIDTH;
    stage.style.height='auto';
    stage.style.aspectRatio=`${w}/${h}`;
    stage.style.marginLeft=CAMERA_SIDE_OFFSET;
    stage.style.marginRight=CAMERA_SIDE_OFFSET;
    stage.style.marginInline='0';

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
