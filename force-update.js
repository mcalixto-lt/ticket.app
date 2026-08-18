// Script para forçar atualização e limpza de cache
// Execute este código no console do navegador (F12)

(function() {
  console.log('=== FORÇANDO ATUALIZAÇÃO DO TICKET. ===');
  
  // 1. Desabilitar cache do Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/public/sw.js', { scope: '/' })
      .then(registration => {
        console.log('✅ SW registrado:', registration.scope);
        return registration.update();
      })
      .then(() => {
        console.log('✅ SW atualizado');
      })
      .catch(error => {
        console.log('⚠️ Erro ao atualizar SW:', error);
      });
  }
  
  // 2. Limpar caches
  if ('caches' in window) {
    caches.keys().then(keys => {
      console.log('🗑️ Caches encontrados:', keys);
      Promise.all(keys.map(key => caches.delete(key)))
        .then(() => console.log('✅ Caches limpos'))
        .catch(err => console.log('⚠️ Erro ao limpar caches:', err));
    });
  }
  
  // 3. Forçar reload sem cache
  console.log('🔄 Recarregando página sem cache...');
  setTimeout(() => {
    window.location.reload(true);
  }, 2000);
})();
