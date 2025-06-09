@echo off
echo Installation de Stripe CLI pour Windows...
echo.

echo 1. Tentative d'installation via Chocolatey...
where choco >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Chocolatey trouve, installation de Stripe CLI...
    choco install stripe-cli -y
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Stripe CLI installe avec succes via Chocolatey!
        goto :success
    )
)

echo.
echo 2. Chocolatey non disponible ou echec, installation manuelle requise...
echo.
echo 📥 Veuillez telecharger Stripe CLI manuellement depuis :
echo https://github.com/stripe/stripe-cli/releases/latest
echo.
echo Ou installer Chocolatey d'abord :
echo https://chocolatey.org/install
echo.
echo Puis executer : choco install stripe-cli
echo.
pause
goto :end

:success
echo.
echo 🎉 Installation terminee!
echo.
echo Prochaines etapes :
echo 1. stripe login
echo 2. stripe listen --forward-to localhost:3000/api/stripe/webhook
echo.
pause

:end 