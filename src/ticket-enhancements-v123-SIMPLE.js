/* Ticket. 1.0.32 — VERSÃO SIMPLES E GARANTIDA */
'use strict';

(function(){
  console.log('[Ticket.] Carregando versão SIMPLES de verificação de atualizações');
  
  const APP_VERSION = '1.0.32';
  let checking = false;

  // Versão simples de comparação
  function compareVersions(a, b) {
    const av = a.split('.').map(Number);
    const bv = b.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      if (bv[i] > av[i]) return 1;
      if (bv[i] < av[i]) return -1;
    }
    return 0;
  }

  // Hora atual
  function getTime() {
    return new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
  }

  // Função PRINCIPAL de verificação
  async function checkForUpdates() {
    if (checking) {
      console.log('[Ticket.] Já verificando, ignorando...');
      return;
    }
    
    checking = true;
    console.log('[Ticket.] Iniciando verificação...');
    
    const button = document.querySelector('#ticketCheckUpdates');
    const status = document.querySelector('#ticketUpdateStatus');
    
    if (button) {
      button.disabled = true;
      button.innerHTML = '⏳ Procurando...';
    }
    
    if (status) {
      status.className = 'v121-update-status checking';
      status.textContent = 'Procurando atualizações...';
    }
    
    try {
      console.log('[Ticket.] Fazendo fetch...');
      
      // TENTAR 3 FONTES
      const urls = [
        'https://cdn.jsdelivr.net/gh/mcalixto-lt/ticket.app@main/public/version.json?t=' + Date.now(),
        'https://raw.githubusercontent.com/mcalixto-lt/ticket.app/main/public/version.json?t=' + Date.now(),
        'https://api.github.com/repos/mcalixto-lt/ticket.app/contents/public/version.json?ref=main&t=' + Date.now()
      ];
      
      let latest = null;
      let usedSource = null;
      
      for (let i = 0; i < urls.length; i++) {
        console.log(`[Ticket.] Tentando fonte ${i + 1}: ${urls[i].substring(0, 50)}...`);
        
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(urls[i], {
            method: 'GET',
            cache: 'no-store',
            credentials: 'omit',
            headers: { 'Accept': 'application/json' },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            console.log(`[Ticket.] Fonte ${i + 1} falhou: HTTP ${response.status}`);
            continue;
          }
          
          const text = await response.text();
          
          if (text.includes('<!doctype') || text.includes('<html')) {
            console.log(`[Ticket.] Fonte ${i + 1} retornou HTML, pulando...`);
            continue;
          }
          
          let data;
          if (i === 2) { // GitHub API
            const api = JSON.parse(text);
            if (!api?.content) throw new Error('Sem conteúdo');
            const decoded = atob(api.content.replace(/\s/g, ''));
            data = JSON.parse(decoded);
          } else {
            data = JSON.parse(text);
          }
          
          latest = data.version;
          usedSource = ['jsDelivr', 'GitHub Raw', 'GitHub API'][i];
          console.log(`[Ticket.] ✓ Sucesso via ${usedSource}: ${latest}`);
          break;
          
        } catch (error) {
          console.log(`[Ticket.] Fonte ${i + 1} falhou: ${error.message}`);
        }
      }
      
      if (!latest) {
        throw new Error('Todas as fontes falharam');
      }
      
      console.log(`[Ticket.] Versão encontrada: ${latest}`);
      console.log(`[Ticket.] Comparando com APP_VERSION: ${APP_VERSION}`);
      
      const comparison = compareVersions(latest, APP_VERSION);
      console.log(`[Ticket.] Comparação: ${comparison > 0 ? 'NOVA' : comparison === 0 ? 'IGUAL' : 'ANTIGA'}`);
      
      if (comparison > 0) {
        // NOVA VERSÃO
        if (status) {
          status.className = 'v121-update-status success';
          status.innerHTML = `<strong>✅ NOVA VERSÃO DISPONÍVEL!</strong><br>
            De: ${APP_VERSION}<br>
            Para: ${latest}<br>
            <small>Encontrada às ${getTime()} via ${usedSource}</small>`;
        }
        
        // Tentar instalar
        console.log('[Ticket.] Tentando instalar atualização...');
        try {
          if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
              await registration.update();
              console.log('[Ticket.] SW atualizado, pedindo reinício...');
              
              if (status) {
                status.innerHTML += `<br><br><button id="ticketRestartNow" class="v121-restart-button" style="margin-top:10px;padding:8px 16px;background:#6f46c4;color:white;border:none;border-radius:8px;cursor:pointer">🔄 Reiniciar Ticket.</button>`;
                document.getElementById('ticketRestartNow').addEventListener('click', () => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('ticketRestart', Date.now());
                  window.location.replace(url.toString());
                });
              }
            }
          }
        } catch (swError) {
          console.log('[Ticket.] Erro ao atualizar SW:', swError);
        }
        
      } else if (comparison === 0) {
        // MESMA VERSÃO
        if (status) {
          status.className = 'v121-update-status success';
          status.textContent = `✓ Sistema atualizado. Você está na versão mais recente: Ticket. ${APP_VERSION} · verificado às ${getTime()}.`;
        }
      } else {
        // VERSÃO MAIS ANTIGA
        if (status) {
          status.className = 'v121-update-status warning';
          status.textContent = `⚠ Versão publicada (${latest}) é mais antiga que a instalada (${APP_VERSION}). Use a versão local.`;
        }
      }
      
    } catch (error) {
      console.error('[Ticket.] ERRO na verificação:', error);
      if (status) {
        status.className = 'v121-update-status error';
        status.innerHTML = `✗ Não foi possível verificar atualizações.<br>
          <small>${error.message}</small><br>
          <small>Tente novamente às ${getTime()}.</small>`;
      }
    }
    
    if (button) {
      button.disabled = false;
      button.innerHTML = '🔍 Procurar atualizações';
    }
    
    checking = false;
    console.log('[Ticket.] Verificação concluída');
  }

  // Vincular botão
  function bindButton() {
    const button = document.querySelector('#ticketCheckUpdates');
    if (button) {
      console.log('[Ticket.] Botão encontrado, vinculando...');
      button.addEventListener('click', checkForUpdates);
      console.log('[Ticket()] Botão vinculado com sucesso');
    } else {
      console.log('[Ticket.] Botão NÃO encontrado no DOM');
    }
  }

  // Verificar periodicamente
  setInterval(() => {
    const button = document.querySelector('#ticketCheckUpdates');
    if (button && !button.dataset.bound) {
      console.log('[Ticket.] Vinculando botão (intervalo)');
      button.dataset.bound = '1';
      bindButton();
    }
  }, 1000);

  // Verificar no DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('[Ticket.] DOMContentLoaded, verificando botão...');
      setTimeout(bindButton, 500);
    });
  } else {
    console.log('[Ticket.] DOM já carregado, verificando botão...');
    setTimeout(bindButton, 100);
  }

  // Verificar após window load
  window.addEventListener('load', () => {
    console.log('[Ticket.] Window load, verificando botão...');
    setTimeout(bindButton, 200);
  });
  
  console.log('[Ticket.] Script SIMPLES carregado e configurado');
  console.log('[Ticket.] Versão do app:', APP_VERSION);
})();
