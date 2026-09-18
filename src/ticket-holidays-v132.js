/* Ticket. 1.0.32 — Feriados, folgas e jornadas compensatórias */
'use strict';
(function(){
  const APP_HOLIDAY_VERSION='1.0.33';
  const DEFAULT_HOLIDAYS=[
    {id:'2026-01-01-national',date:'2026-01-01',name:'Confraternização Universal',scope:'Nacional',type:'holiday',workMode:'off',compensationType:'none',compensationDate:'',note:''},
    {id:'2026-04-03-maceio',date:'2026-04-03',name:'Sexta-feira da Paixão',scope:'Municipal',type:'holiday',workMode:'off',compensationType:'none',compensationDate:'',note:''},
    {id:'2026-05-01-national',date:'2026-05-01',name:'Dia Mundial do Trabalho',scope:'Nacional',type:'holiday',workMode:'off',compensationType:'none',compensationDate:'',note:''},
    {id:'2026-06-04-maceio',date:'2026-06-04',name:'Corpus Christi',scope:'Municipal',type:'holiday',workMode:'off',compensationType:'none',compensationDate:'',note:''},
    {id:'2026-06-24-al',date:'2026-06-24',name:'São João',scope:'Estadual',type:'holiday',workMode:'off',compensationType:'none',compensationDate:'',note:''},
    {id:'2026-06-29-maceio',date:'2026-06-29',name:'Marechal Floriano Peixoto',scope:'Municipal',type:'holiday',workMode:'off',compensationType:'none',compensationDate:'',note:''},
    {id:'2026-08-27-maceio',date:'2026-08-27',name:'Nossa Senhora dos Prazeres',scope:'Municipal',type:'holiday',workMode:'saturday',compensationType:'compensatory_day_off',compensationDate:'',note:'Feriado municipal trabalhado com jornada equivalente à de sábado.'},
    {id:'2026-09-07-national',date:'2026-09-07',name:'Independência do Brasil',scope:'Nacional',type:'holiday',workMode:'off',compensationType:'none',compensationDate:'',note:''},
    {id:'2026-09-16-al',date:'2026-09-16',name:'Emancipação Política de Alagoas',scope:'Estadual',type:'holiday',workMode:'off',compensationType:'none',compensationDate:'',note:''},
    {id:'2026-10-12-national',date:'2026-10-12',name:'Nossa Senhora Aparecida',scope:'Nacional',type:'holiday',workMode:'off',compensationType:'none',compensationDate:'',note:''},
    {id:'2026-11-02-national',date:'2026-11-02',name:'Finados',scope:'Nacional',type:'holiday',workMode:'off',compensationType:'none',compensationDate:'',note:''},
    {id:'2026-11-15-national',date:'2026-11-15',name:'Proclamação da República',scope:'Nacional',type:'holiday',workMode:'off',compensationType:'none',compensationDate:'',note:''},
    {id:'2026-11-20-national',date:'2026-11-20',name:'Dia Nacional de Zumbi e da Consciência Negra',scope:'Nacional',type:'holiday',workMode:'off',compensationType:'none',compensationDate:'',note:''},
    {id:'2026-11-30-al',date:'2026-11-30',name:'Dia Estadual do Evangélico',scope:'Estadual',type:'holiday',workMode:'off',compensationType:'none',compensationDate:'',note:''},
    {id:'2026-12-08-maceio',date:'2026-12-08',name:'Nossa Senhora da Conceição',scope:'Municipal',type:'holiday',workMode:'off',compensationType:'none',compensationDate:'',note:''},
    {id:'2026-12-25-national',date:'2026-12-25',name:'Natal',scope:'Nacional',type:'holiday',workMode:'off',compensationType:'none',compensationDate:'',note:''}
  ];

  const clone=o=>JSON.parse(JSON.stringify(o));
  const safeEsc=v=>typeof esc==='function'?esc(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  function holidayList(){return Array.isArray(state.holidays)?state.holidays:[];}
  function holidayForDate(iso){return holidayList().find(h=>h.date===iso)||null;}
  function holidayScheduleForDate(iso,schedule){
    const h=holidayForDate(iso);
    if(!h)return structuredClone(schedule[new Date(`${iso}T12:00:00`).getDay()] || DEFAULT_SCHEDULE[new Date(`${iso}T12:00:00`).getDay()]);
    if(h.workMode==='saturday')return structuredClone(schedule[6]||DEFAULT_SCHEDULE[6]);
    if(h.workMode==='custom')return {...structuredClone(schedule[6]||DEFAULT_SCHEDULE[6]),...(h.customSchedule||{})};
    return {active:false,requiredPunches:0,expectedMinutes:0};
  }
  function effectiveScheduleForDate(iso,schedule){return holidayScheduleForDate(iso,schedule);}

  // O calendário de feriados passa a prevalecer sobre a jornada semanal.
  if(typeof window!=='undefined'){
    window.ticketHolidayForDate=holidayForDate;
    window.ticketEffectiveScheduleForDate=effectiveScheduleForDate;
    window.scheduleForDate=function(iso,schedule){return effectiveScheduleForDate(iso,schedule||state.schedule);};
  }

  function holidayStatus(h,record){
    if(!h)return '';
    if(h.type==='day_off')return 'Folga';
    if(h.workMode==='saturday')return record?'Feriado trabalhado':'Feriado · jornada de sábado';
    if(h.workMode==='custom')return record?'Feriado trabalhado':'Feriado · jornada personalizada';
    return 'Feriado · folga';
  }

  function holidayForm(){
    const today=todayIso();
    return `<form id="holidayForm" class="stack">
      <div class="two-col">
        <label class="field"><span>Data</span><input name="date" type="date" value="${today}" required></label>
        <label class="field"><span>Nome do feriado/folga</span><input name="name" placeholder="Ex.: Feriado municipal" required></label>
      </div>
      <div class="two-col">
        <label class="field"><span>Tipo</span><select name="type"><option value="holiday">Feriado</option><option value="day_off">Folga</option></select></label>
        <label class="field"><span>Abrangência</span><select name="scope"><option>Municipal</option><option>Estadual</option><option>Nacional</option><option>Empresa</option></select></label>
      </div>
      <label class="field"><span>Como será a jornada?</span><select name="workMode"><option value="off">Não trabalhar</option><option value="saturday">Trabalhar com jornada de sábado</option><option value="custom">Trabalhar com jornada personalizada</option></select></label>
      <label class="field"><span>Compensação</span><select name="compensationType"><option value="none">Sem compensação registrada</option><option value="bank">Lançar no banco de horas</option><option value="compensatory_day_off">Gerar direito a folga compensatória</option></select></label>
      <label class="field"><span>Data da folga compensatória (opcional)</span><input name="compensationDate" type="date"></label>
      <label class="field"><span>Observação</span><textarea name="note" placeholder="Ex.: Trabalhado com jornada igual à de sábado; folga a compensar posteriormente."></textarea></label>
      <button class="primary" type="submit">Salvar feriado/folga</button>
    </form>`;
  }

  function holidaySettings(){
    const list=holidayList().slice().sort((a,b)=>a.date.localeCompare(b.date));
    return `<div class="ticket-holiday-settings"><h3>Feriados e folgas</h3><p class="muted">Cadastre feriados, dias de folga e os dias em que você trabalha com jornada compensatória. O dia 27/08/2026 já está configurado como feriado municipal trabalhado com jornada de sábado.</p>${holidayForm()}<div class="ticket-holiday-list"><h3>Calendário cadastrado</h3>${list.map(h=>{const r=state.records.find(x=>x.date===h.date);const status=holidayStatus(h,r);return `<article class="ticket-holiday-item ${h.workMode==='off'?'is-off':'is-work'}"><div><strong>${safeEsc(formatDateBr(h.date))} · ${safeEsc(h.name)}</strong><small>${safeEsc(h.scope)} · ${safeEsc(status)}</small>${h.compensationType==='compensatory_day_off'?`<small>Compensação: ${h.compensationDate?`folga em ${safeEsc(formatDateBr(h.compensationDate))}`:'folga pendente'}</small>`:''}${h.note?`<small>${safeEsc(h.note)}</small>`:''}</div><button type="button" class="secondary ticket-holiday-delete" data-holiday-id="${safeEsc(h.id)}">Excluir</button></article>`}).join('')||'<p class="muted">Nenhum feriado ou folga cadastrado.</p>'}</div></div>`;
  }

  function renderHolidayCalendarDetails(iso){
    const h=holidayForDate(iso); const r=state.records.find(x=>x.date===iso);
    const c=r?calculateRecord(r,state.schedule):null;
    if(!h && !r){toast(`${formatDateBr(iso)}: sem registro`);return;}
    const lines=[];
    if(h){lines.push(`${h.name} · ${h.scope}`);lines.push(holidayStatus(h,r));if(h.compensationType==='compensatory_day_off')lines.push(h.compensationDate?`Folga compensatória: ${formatDateBr(h.compensationDate)}`:'Folga compensatória pendente');}
    if(r){const map={};(r.punches||[]).forEach(p=>map[p.type]=p.time);lines.push(`Entrada ${map.entry||'--:--'} · Almoço ${map.lunch||'--:--'} · Retorno ${map.return||'--:--'} · Saída ${map.exit||'--:--'}`);lines.push(`Total: ${formatDuration(c.workedMinutes)}`);}
    toast(lines.join(' | '));
  }

  // Substitui o calendário mantendo o layout existente e acrescentando a identificação do evento.
  const originalCalendarView=calendarView;
  calendarView=function(){
    const [y,m]=state.calendarMonth.split('-').map(Number);const first=new Date(y,m-1,1,12);const last=new Date(y,m,0,12);const lead=(first.getDay()+6)%7;const cells=[];for(let i=0;i<lead;i++)cells.push(null);for(let d=1;d<=last.getDate();d++)cells.push(`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`);while(cells.length%7)cells.push(null);
    const months=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const years=Array.from({length:201},(_,i)=>1900+i);
    if(!years.includes(y))years.push(y);
    const nav=`<div class="calendar-selectors-v161"><label><span>Mês</span><select id="calMonthSelect" aria-label="Selecionar mês">${months.map((name,i)=>`<option value="${i+1}" ${m===i+1?'selected':''}>${name}</option>`).join('')}</select></label><span class="calendar-divider-v161" aria-hidden="true">|</span><label><span>Ano</span><select id="calYearSelect" aria-label="Selecionar ano">${years.sort((a,b)=>a-b).map(year=>`<option value="${year}" ${year===y?'selected':''}>${year}</option>`).join('')}</select></label></div>`;
    return `${head('Calendário','Feriados, folgas, jornadas compensatórias e registros do ponto.',nav)}<article class="calendar-card"><div class="calendar-week"><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span><span>Dom</span></div><div class="calendar-grid">${cells.map(iso=>{if(!iso)return'<div></div>';const r=state.records.find(x=>x.date===iso);const c=r?calculateRecord(r,state.schedule):null;const h=holidayForDate(iso);const sch=effectiveScheduleForDate(iso,state.schedule);const dots=[];if(r){dots.push(`<i class="dot ${c.complete?'complete':'pending'}"></i>`);if(c.complete&&c.balanceMinutes>0)dots.push('<i class="dot positive"></i>');if(c.complete&&c.balanceMinutes<0)dots.push('<i class="dot negative"></i>');}if(h)dots.push(`<i class="dot holiday-dot"></i>`);return `<button class="day ${!sch.active&&!h?'off':''} ${h?'holiday-day':''} ${iso===todayIso()?'today':''}" data-day="${iso}" title="${safeEsc(h?`${h.name} — ${holidayStatus(h,r)}`:'')}"><b>${Number(iso.slice(8))}</b><div class="dots">${dots.join('')}</div>${h?`<small class="holiday-label">${safeEsc(h.workMode==='saturday'?'Sáb':'Folga')}</small>`:''}</button>`;}).join('')}</div></article><div class="ticket-holiday-legend"><span><i class="dot holiday-dot"></i> Feriado/folga</span><span><i class="dot complete"></i> Ponto registrado</span><span><i class="dot positive"></i> Saldo positivo</span></div>`;
  };

  const originalBindCalendar=bindCalendar;
  bindCalendar=function(){
    const month=document.querySelector('#calMonthSelect'),year=document.querySelector('#calYearSelect');
    const update=()=>{state.calendarMonth=`${year.value}-${month.value.padStart(2,'0')}`;renderView();};
    month.onchange=update;year.onchange=update;
    document.querySelectorAll('[data-day]').forEach(b=>b.onclick=()=>renderHolidayCalendarDetails(b.dataset.day));
  };

  const originalSettingsView=settingsView;
  // v1.0.33: configurações voltam ao fluxo vertical original, sem menu horizontal.
  // Todas as seções permanecem organizadas em uma única coluna rolável, incluindo Feriados e Folgas.
  settingsView=function(){
    return `<section class="settings-full">
      <div class="settings-page-intro">
        <span class="settings-kicker">PREFERÊNCIAS</span>
        <h2>Configurações</h2>
        <p>Defina a jornada, saldo, fechamento, feriados e folgas. Registros já confirmados permanecem bloqueados.</p>
      </div>
      <div class="settings-stack">
        ${identificationCard()}
        ${weeklyScheduleCard()}
        ${balanceCard()}
        ${closingCard()}
        <article class="settings-section-card ticket-holiday-settings-card">
          ${holidaySettings()}
        </article>
        <article class="settings-section-card"><h3>Armazenamento</h3><button class="secondary" data-resource-view="storage">Gerenciar armazenamento</button></article>
        ${v106HowToSettingsCard()}
        ${deviceCards()}
      </div>
    </section>`;
  };

  const originalBindSettings=bindSettings;
  bindSettings=function(){
    document.querySelectorAll('[data-setting]').forEach(b=>b.onclick=()=>{state.settingsTab=b.dataset.setting;renderView();});
    originalBindSettings();
    document.querySelector('#holidayForm')?.addEventListener('submit',async e=>{
      e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget));
      const item={id:`${d.date}-${Date.now()}`,date:d.date,name:d.name.trim(),scope:d.scope,type:d.type,workMode:d.workMode,compensationType:d.compensationType,compensationDate:d.compensationDate||'',note:d.note||''};
      state.holidays=[...holidayList().filter(h=>h.date!==item.date),item];await saveSetting(state.profile.cpf,'holidays',state.holidays);toast('Feriado/folga salvo.');renderView();
    });
    document.querySelectorAll('.ticket-holiday-delete').forEach(b=>b.onclick=async()=>{state.holidays=holidayList().filter(h=>h.id!==b.dataset.holidayId);await saveSetting(state.profile.cpf,'holidays',state.holidays);toast('Registro removido.');renderView();});
  };

  // Garante que a configuração seja carregada depois do boot assíncrono existente.
  async function hydrateHolidays(){
    if(!state.profile)return;
    let saved=await getSetting(state.profile.cpf,'holidays',null);
    if(!Array.isArray(saved)){
      saved=clone(DEFAULT_HOLIDAYS);
      await saveSetting(state.profile.cpf,'holidays',saved);
    }
    state.holidays=saved;
    if(typeof renderView==='function' && document.querySelector('#content'))renderView();
  }
  state.holidays=clone(DEFAULT_HOLIDAYS);
  setTimeout(()=>hydrateHolidays().catch(()=>{}),0);

  // Novo registro herda a jornada do feriado; isso é o que permite trabalhar como sábado no dia 27/08.
  const originalSubmitCapture=submitCapture;
  submitCapture=async function(e){
    const form=e.currentTarget;const date=form?.querySelector('[name="date"]')?.value||todayIso();
    const h=holidayForDate(date);
    if(h && h.workMode==='saturday')toast(`Feriado trabalhado: ${h.name}. Jornada de sábado aplicada.`);
    return originalSubmitCapture(e);
  };

  // Exportação passa a incluir os feriados/folgas para backup e restauração futura.
  const originalExportData=exportData;
  exportData=function(){
    const payload={version:2,exportedAt:new Date().toISOString(),profile:state.profile,records:state.records,schedule:state.schedule,balance:state.balance,closing:state.closing,holidays:holidayList()};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`ticket-backup-${todayIso()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),500);
  };
})();
