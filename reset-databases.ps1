# Easy Housing Solutions (EHS) - Clean Slate Database Reset Script
# Usage: .\reset-databases.ps1

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Easy Housing Solutions (EHS) - Database Reset Tool" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$server = "(localdb)\mssqllocaldb"
$sqlScriptPath = Join-Path $PSScriptRoot "reset-databases.sql"

if (-not (Test-Path $sqlScriptPath)) {
    Write-Error "Could not find reset-databases.sql at $sqlScriptPath"
    exit 1
}

Write-Host "`n[1/5] Dropping existing EHS databases on $server..." -ForegroundColor Yellow
sqlcmd -S $server -E -i $sqlScriptPath
if ($LASTEXITCODE -ne 0) {
    Write-Warning "SQL drop script encountered warnings or LocalDB was not running. Attempting migrations..."
}

Write-Host "`n[2/5] Creating clean IdentityDb (Users, Roles)..." -ForegroundColor Yellow
dotnet ef database update --project IdentityService\EasyHousingSolution.IdentityService.Infrastructure --startup-project IdentityService\EasyHousingSolution.IdentityService.API --no-build

Write-Host "`n[3/5] Creating clean UserDb (Buyers, Sellers)..." -ForegroundColor Yellow
dotnet ef database update --project UserService\EasyHousingSolution.UserService.Infrastructure --startup-project UserService\EasyHousingSolution.UserService.API --no-build

Write-Host "`n[4/5] Creating clean PropertyDb (States, Cities, Properties, Images)..." -ForegroundColor Yellow
dotnet ef database update --project PropertyService\EasyHousingSolution.PropertyService.Infrastructure --startup-project PropertyService\EasyHousingSolution.PropertyService.API --no-build

Write-Host "`n[5/5] Creating clean CartDb (Empty Cart table)..." -ForegroundColor Yellow
dotnet ef database update --project CartService\EasyHousingSolution.CartService.Infrastructure --startup-project CartService\EasyHousingSolution.CartService.API --no-build

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "  SUCCESS: All databases reset to factory clean slate!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Metrics summary:"
sqlcmd -S $server -E -Q "SELECT 'Cart Count' AS Metric, COUNT(*) AS Val FROM EHS_CartDb.dbo.Cart UNION ALL SELECT 'Properties Total', COUNT(*) FROM EHS_PropertyDb.dbo.Property UNION ALL SELECT 'Properties Sold', COUNT(*) FROM EHS_PropertyDb.dbo.Property WHERE DeactivationReason LIKE 'Sold%' UNION ALL SELECT 'Buyers Count', COUNT(*) FROM EHS_UserDb.dbo.Buyer UNION ALL SELECT 'Users Count', COUNT(*) FROM EHS_IdentityDb.dbo.Users"
