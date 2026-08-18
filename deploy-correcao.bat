@echo off
chcp 65001 >nul
echo ========================================
echo   DEPLOY - Correcao Sistema de Atualizacoes
echo ========================================
echo.

cd /d "C:\Users\MAURO FILHO\.agnes\temporary\2026-08-18\20260818_2\work\ticket.app"

echo [1/5] Verificando status do Git...
git status --short

echo.
echo [2/5] Adicionando arquivos modificados...
git add -A

echo.
echo [3/5] Criando commit...
git commit -m "Fix: Correcao do sistema de verificacao de atualizacoes

- Timeout de 5 segundos para cada fonte de versao
- Teste paralelo de multiplas fontes (jsDelivr, GitHub Raw, GitHub API)
- Melhor tratamento de erros com mensagens detalhadas
- Timestamp dinamico em todas as mensagens
- Fallback automatico se uma fonte falhar
- Atualizacao da versao para 1.0.32

Issue: Botao 'Procurar atualizacoes' mostrava erro genérico"

if %ERRORLEVEL% neq 0 (
    echo.
    echo ERRO: Falha no commit. Verifique se ha mudancas para commitar.
    pause
    exit /b 1
)

echo.
echo [4/5] Fazendo push para o repositorio...
git push origin main

if %ERRORLEVEL% neq 0 (
    echo.
    echo ERRO: Falha no push. Verifique sua conexao e permissoes.
    pause
    exit /b 1
)

echo.
echo [5/5] Atualizando versao no version.json...
echo Versao atual no repositorio: 1.0.32
echo.

echo ========================================
echo   DEPLOY CONCLUIDO COM SUCESSO!
echo ========================================
echo.
echo Proximos passos:
echo 1. Aguarde o deploy automatico no Render (2-5 minutos)
echo 2. Teste o sistema em modo anônimo (sem cache)
echo 3. Clique em "Procurar atualizações" nas configuracoes
echo.
echo Link do repositorio:
echo https://github.com/mcalixto-lt/ticket.app
echo.
pause
