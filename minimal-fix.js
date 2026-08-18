// VERSÃO MÍNIMA E DIRETA - Testar se o problema é no código complexo

(function() {
  console.log('[Ticket.] Script de atualização carregado');
  
  const APP_VERSION = '1.0.32';
  let checking = false;
  
  // Função simples de comparação de versões
  function compareVersions(a, b) {
    const av = a.split('.').map(Number);
    const bv = b.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      if (bv[i] > av[i]) return 1;
      if (bv[i] < av[i]) return -1;
    }
    return 0;
  }
  
  // Função simples para obter hora atual
  function getTime() {
    return new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
  }
  
  // Função principal de verificação
  async function checkForUpdates() {
    if (checking) {
      console.log('[Ticket.] Já está verificando...');
      return;
    }
    
    checking = true;
    console.log('[Ticket.] Iniciando verificação...');
    console.log('[Ticket.] Versão instalada:', APP_VERSION);
    
    const button = document.querySelector('#ticketCheckUpdates');
    const status = document.querySelector('#ticketUpdateStatus');
    
    if (button) {
      button.disabled = true;
      button.innerHTML = '⏳ Procurando...';
    }
    
    if (status) {
      status.textContent = 'Procurando atualizações...';
      status.style.color = '#6f46c4';
    }
    
    try {
      console.log('[Ticket.] Fazendo fetch do version.json...');
      
      // Tentar a fonte mais simples primeiro
      const response = await fetch('https://raw.githubusercontent.com/mcalixto-lt/ticket.app/main/public/version.json?t=' + Date.now(), {
        cache: 'no-store'
      });
      
      console.log('[Ticket.] Status da resposta:', response.status);
      
      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }
      
      const text = await response.text();
      console.log('[Ticket.] Texto recebido:', text);
      
      const data = JSON.parse(text);
      const latest = data.version;
      console.log('[Ticket.] Versão encontrada:', latest);
      
      const comparison = compareVersions(latest, APP_VERSION);
      console.log('[Ticket.] Comparação:', comparison);
      
      if (comparison > 0) {
        console.log('[Ticket.] NOVA VERSÃO DISPONÍVEL!');
        if (status) {
          status.innerHTML = '<strong>✅ NOVA VERSÃO DISPONÍVEL!</strong><br>De ' + APP_VERSION + ' para ' + latest;
          status.style.color = '#155724';
        }
      } else if (comparison === 0) {
        console.log('[Ticket.] MESMA VERSÃO');
        if (status) {
          status.textContent = '✓ Sistema atualizado. Versão: ' + APP_VERSION + ' · ' + getTime();
          status.style.color = '#155724';
        }
      } else {
        console.log('[Ticket.] VERSÃO MAIS ANTIGA');
        if (status) {
          status.textContent = '⚠ Versão publicada (' + latest + ') é mais antiga que a instalada (' + APP_VERSION + ')';
          status.style.color = '#856404';
        }
      }
      
    } catch (error) {
      console.error('[Ticket.] ERRO:', error);
      if (status) {
        status.innerHTML = '✗ Erro: ' + error.message + '<br><small>Tente novamente às ' + getTime() + '</small>';
        status.style.color = '#721c24';
      }
    }
    
    if (button) {
      button.disabled = false;
      button.innerHTML = '🔍 Procurar atualizações';
    }
    
    checking = false;
    console.log('[Ticket.] Verificação concluída');
  }
  
  // Vincular botão quando disponível
  function bindButton() {
    const button = document.querySelector('#ticketCheckUpdates');
    if (button) {
      console.log('[Ticket.] Botão encontrado, vinculando...');
      button.addEventListener('click', checkForUpdates);
      console.log('[Ticket.] Botão vinculado com sucesso');
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
  
  console.log('[Ticket.] Script minimal-fix.js carregado e configurado');
})();
