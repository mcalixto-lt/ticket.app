// Debug script para testar o sistema de atualizações
async function testUpdateCheck() {
  console.log('=== TESTE DE ATUALIZAÇÃO ===');
  
  const APP_VERSION = '1.0.31';
  
  const VERSION_SOURCES = [
    {
      label: 'jsDelivr',
      makeUrl: () => `https://cdn.jsdelivr.net/gh/mcalixto-lt/ticket.app@main/public/version.json?check=${Date.now()}`,
      remote: true,
      kind: 'json'
    },
    {
      label: 'GitHub Raw',
      makeUrl: () => `https://raw.githubusercontent.com/mcalixto-lt/ticket.app/main/public/version.json?check=${Date.now()}`,
      remote: true,
      kind: 'json'
    },
    {
      label: 'GitHub API',
      makeUrl: () => `https://api.github.com/repos/mcalixto-lt/ticket.app/contents/public/version.json?ref=main&check=${Date.now()}`,
      remote: true,
      kind: 'github-api'
    }
  ];

  function normalizeVersion(value) {
    const match = String(value ?? '').trim().replace(/^v/i, '').match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:[-+].*)?$/);
    if (!match) return null;
    return [Number(match[1] || 0), Number(match[2] || 0), Number(match[3] || 0)];
  }

  async function fetchPublishedVersion() {
    let lastError = null;

    for (const source of VERSION_SOURCES) {
      console.log(`\nTestando fonte: ${source.label}`);
      console.log(`URL: ${source.makeUrl()}`);
      
      try {
        const url = source.makeUrl();
        const response = await fetch(url, {
          method: 'GET',
          cache: 'no-store',
          credentials: 'omit',
          headers: { 'Accept': 'application/json', 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        });
        
        console.log(`Status: ${response.status} ${response.statusText}`);
        console.log(`Content-Type: ${response.headers.get('content-type')}`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} ${response.statusText}`);
        }
        
        const contentType = (response.headers.get('content-type') || '').toLowerCase();
        const text = await response.text();
        
        console.log(`Texto recebido: ${text}`);
        
        if (contentType.includes('text/html') || /^\s*<!doctype html/i.test(text)) {
          throw new Error('A fonte devolveu HTML em vez do arquivo de versão.');
        }

        let data;
        if (source.kind === 'github-api') {
          const api = JSON.parse(text);
          if (!api?.content) throw new Error('Conteúdo da versão não encontrado na API do GitHub.');
          const decoded = atob(String(api.content).replace(/\s/g, ''));
          data = JSON.parse(decoded);
          console.log(`Dados decodificados (GitHub API):`, data);
        } else {
          data = JSON.parse(text);
          console.log(`Dados parseados (JSON direto):`, data);
        }

        const version = String(data?.version || '').trim();
        const normalized = normalizeVersion(version);
        console.log(`Versão encontrada: ${version} (normalizada: ${JSON.stringify(normalized)})`);
        
        if (!normalized) {
          throw new Error('Versão publicada inválida.');
        }
        
        return { version, source: source.label, remote: true };
      } catch (error) {
        console.error(`ERRO na fonte ${source.label}:`, error.message);
        lastError = error;
      }
    }

    throw lastError || new Error('Nenhuma fonte de versão disponível.');
  }

  try {
    console.log(`\nVersão instalada: ${APP_VERSION}`);
    const published = await fetchPublishedVersion();
    console.log(`\n=== RESULTADO ===`);
    console.log(`Versão publicada: ${published.version}`);
    console.log(`Fonte: ${published.source}`);
    
    const av = normalizeVersion(APP_VERSION);
    const bv = normalizeVersion(published.version);
    console.log(`Comparação: ${JSON.stringify(av)} vs ${JSON.stringify(bv)}`);
    
    let comparison = 0;
    for (let i = 0; i < 3; i++) {
      if (bv[i] > av[i]) { comparison = 1; break; }
      if (bv[i] < av[i]) { comparison = -1; break; }
    }
    
    console.log(`Comparação final: ${comparison > 0 ? 'NOVA VERSÃO DISPONÍVEL' : comparison < 0 ? 'VERSÃO MAIS ANTIGA' : 'MESMA VERSÃO'}`);
    
  } catch (error) {
    console.error(`\n=== ERRO FINAL ===`);
    console.error(error.message);
    console.error(error);
  }
}

testUpdateCheck();
