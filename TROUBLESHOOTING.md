# Troubleshooting - Sistema de Atualizações Ticket.

## Problema Relatado
Usuário reporta que ao clicar em "Procurar atualizações", aparece o erro:
"Não foi possível procurar atualizações agora. Verifique sua conexão e tente novamente · 12:57."

## Análise do Problema

### Possíveis Causas:

1. **Service Worker em cache**
   - O SW está servindo uma versão antiga do código
   - O version.json está sendo cacheado
   - O ticket-enhancements-v123.js está sendo servido do cache

2. **Problema de rede/CORS**
   - Bloqueio de requisições cross-origin
   - Firewall bloqueando access a GitHub/jsDelivr
   - Problema de DNS

3. **Problema no código**
   - Erro de JavaScript não tratado
   - Variável `checking` travada como `true`
   - Botão não está sendo vinculado corretamente

4. **Problema de timing**
   - Código executando antes do DOM estar pronto
   - `state` não definido quando o botão é clicado
   - MutationObserver não detectando a mudança de view

## Soluções Implementadas

### 1. Código Atualizado (ticket-enhancements-v123.js)
- ✅ Timeout de 5 segundos para cada requisição
- ✅ Teste paralelo de múltiplas fontes
- ✅ Melhor tratamento de erros com mensagens detalhadas
- ✅ Timestamp dinâmico em todas as mensagens
- ✅ Fallback automático entre fontes

### 2. Versão Atualizada
- ✅ version.json atualizado para 1.0.32
- ✅ index.html atualizado para v=130
- ✅ Changelog adicionado

## Passos para Testar

### Passo 1: Forçar atualização do Service Worker
1. Abra o navegador em modo anônimo/incógnito
2. Ou desabilite o cache: DevTools > Network > Disable cache
3. Ou desinstale o SW: DevTools > Application > Service Workers > Unregister

### Passo 2: Verificar o console
1. Abra DevTools (F12)
2. Vá para a aba Console
3. Clique em "Procurar atualizações"
4. Verifique se há erros JavaScript

### Passo 3: Testar com os arquivos de diagnóstico
Abra no navegador:
- `simple-test.html` - Testa o fetch diretamente
- `diagnostic-update.html` - Diagnóstico completo
- `simulate-error.html` - Simula o comportamento

### Passo 4: Verificar rede
1. DevTools > Network
2. Filtre por "version.json"
3. Verifique se as requisições estão sendo feitas
4. Verifique os status codes (200 = sucesso)

## Comandos para Debug

### Verificar se o version.json está acessível:
```bash
curl -I https://raw.githubusercontent.com/mcalixto-lt/ticket.app/main/public/version.json
curl -I https://cdn.jsdelivr.net/gh/mcalixto-lt/ticket.app@main/public/version.json
```

### Verificar resposta:
```bash
curl https://raw.githubusercontent.com/mcalixto-lt/ticket.app/main/public/version.json
```

## Mensagens de Erro Comuns

### "Não foi possível procurar atualizações agora"
**Causa:** Falha em todas as fontes de versão
**Solução:** Verificar conexão com internet, desabilitar adblockers, verificar firewall

### "Versão publicada inválida"
**Causa:** JSON retornado não contém campo "version" válido
**Solução:** Verificar se o version.json está correto no repositório

### "A fonte devolveu HTML em vez do arquivo de versão"
**Causa:** CDN ou proxy retornando página de erro HTML
**Solução:** Tentar outra fonte, verificar URL

## Checklist de Verificação

- [ ] Version.json está acessível via curl/wget
- [ ] Todas as 3 fontes respondem corretamente
- [ ] Console do navegador não mostra erros
- [ ] Service Worker está atualizado
- [ ] Cache está desabilitado ou limpo
- [ ] Código JavaScript está sendo carregado (v=130)
- [ ] Botão "Procurar atualizações" existe no DOM
- [ ] Função `bindUpdateButton()` está sendo chamada
- [ ] Variável `checking` começa como `false`

## Próximos Passos

Se o problema persistir:
1. Enviar screenshot do console com erros
2. Verificar versão exata do código carregado
3. Testar em outro navegador
4. Verificar configurações de rede/proxy
