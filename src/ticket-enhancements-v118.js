/* Ticket. 1.0.18 — câmera sem barras e versão do sistema */
'use strict';

function v118FitCameraStage(){
  const stage=document.querySelector('#cameraStage');
  const video=document.querySelector('#cameraVideo');
  const image=stage?.querySelector('img');
  if(!stage)return;
  const source=video&&!video.classList.contains('hidden')&&video.videoWidth>0?video:image;
  if(!source)return;
  const w=Number(source.videoWidth||source.naturalWidth||0);
  const h=Number(source.videoHeight||source.naturalHeight||0);
  if(w>0&&h>0){
    stage.style.aspectRatio=`${w} / ${h}`;
    stage.style.minHeight='0';
  }
}

const v118StartCameraBefore=typeof startCamera==='function'?startCamera:null;
if(v118StartCameraBefore){
  startCamera=async function(...args){
    const result=await v118StartCameraBefore.apply(this,args);
    const video=document.querySelector('#cameraVideo');
    if(video){
      video.addEventListener('loadedmetadata',v118FitCameraStage,{once:true});
      if(video.readyState>=1)v118FitCameraStage();
    }
    setTimeout(v118FitCameraStage,120);
    setTimeout(v118FitCameraStage,500);
    return result;
  };
}

const v118RenderBefore=renderView;
renderView=function(){
  const result=v118RenderBefore();
  requestAnimationFrame(()=>{
    v118FitCameraStage();
    document.querySelector('#cameraVideo')?.addEventListener('loadedmetadata',v118FitCameraStage,{once:true});
    document.querySelector('#cameraStage img')?.addEventListener('load',v118FitCameraStage,{once:true});
    v118AppendSystemVersion();
  });
  return result;
};

function v118AppendSystemVersion(){
  if(state.view!=='settings')return;
  const detail=document.querySelector('.settings-detail');
  if(!detail||detail.querySelector('#v118-system-version'))return;
  const section=document.createElement('section');
  section.id='v118-system-version';
  section.className='settings-section-card v118-system-version';
  section.innerHTML='<div class="v118-version-icon">✓</div><div><span>VERSÃO DO SISTEMA</span><strong>Ticket. 1.0.18</strong><small>Versão instalada e atualizada automaticamente a cada nova atualização do sistema.</small></div>';
  detail.appendChild(section);
}

setTimeout(v118AppendSystemVersion,350);
