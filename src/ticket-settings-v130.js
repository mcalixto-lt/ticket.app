/* Ticket. 1.0.35 — jornada semanal organizada em painel */
'use strict';

function v130ResourcesWithScheduleCard(){
  return `<article class="settings-section-card v130-resources-card">
    <div class="settings-card-head">
      <div>
        <h3>Recursos do Ticket.</h3>
        <p>Gerencie as cópias, o backup e os recursos de configuração da jornada.</p>
      </div>
      <span class="settings-card-icon blue">${v105DatabaseGlyph(22)}</span>
    </div>
    <div class="v105-resource-grid v106-resource-single">
      <button type="button" data-resource-view="storage">
        <span class="resource-icon blue">${v105DatabaseGlyph(21)}</span>
        <strong>Armazenamento</strong>
        <small>Cópias das imagens, backup local e futura sincronização em nuvem.</small>
      </button>
      <button type="button" data-resource-view="weekly-schedule" class="v130-resource-action">
        <span class="resource-icon purple">${v105DatabaseGlyph(21)}</span>
        <strong>Jornada Semanal</strong>
        <small>Configure os dias de trabalho e as horas previstas.</small>
      </button>
    </div>
  </article>`;
}

function v130OpenWeeklySchedule(){
  if(document.querySelector('#v130WeeklyScheduleOverlay'))return;
  const overlay=document.createElement('div');
  overlay.id='v130WeeklyScheduleOverlay';
  overlay.className='v130-schedule-overlay';
  overlay.innerHTML=`
    <div class="v130-schedule-dialog" role="dialog" aria-modal="true" aria-labelledby="v130WeeklyScheduleTitle">
      <div class="v130-schedule-dialog-head">
        <div>
          <span class="settings-kicker">PREFERÊNCIAS</span>
          <h2 id="v130WeeklyScheduleTitle">Jornada Semanal</h2>
          <p>Configure os dias e as horas da sua jornada.</p>
        </div>
        <button type="button" class="v130-schedule-close" id="v130CloseSchedule" aria-label="Fechar">×</button>
      </div>
      <div class="v130-schedule-dialog-body">${weeklyScheduleCard()}</div>
    </div>`;
  document.body.appendChild(overlay);
  const close=()=>overlay.remove();
  overlay.querySelector('#v130CloseSchedule')?.addEventListener('click',close);
  overlay.addEventListener('click',event=>{if(event.target===overlay)close();});
  const esc=event=>{if(event.key==='Escape'){close();document.removeEventListener('keydown',esc);}};
  document.addEventListener('keydown',esc);
}

settingsView=function(){
  return `<section class="settings-full">
    <div class="settings-page-intro">
      <span class="settings-kicker">PREFERÊNCIAS</span>
      <h2>Configurações</h2>
      <p>Defina a jornada, o saldo anterior e o período mensal de fechamento. Registros já confirmados permanecem bloqueados.</p>
    </div>
    <div class="settings-stack">
      ${identificationCard()}
      ${v106HowToSettingsCard()}
      ${balanceCard()}
      ${closingCard()}
      ${v130ResourcesWithScheduleCard()}
      ${deviceCards()}
    </div>
  </section>`;
};

const v130BindSettingsBefore=bindSettings;
bindSettings=function(){
  v130BindSettingsBefore();
  document.querySelectorAll('[data-resource-view]').forEach(btn=>{
    if(btn.dataset.v130Bound==='1')return;
    btn.dataset.v130Bound='1';
    btn.addEventListener('click',()=>{
      const view=btn.dataset.resourceView;
      if(view==='weekly-schedule')v130OpenWeeklySchedule();
      else navigate(view);
    });
  });
};
