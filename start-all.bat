@echo off
echo ===================================================
echo Starting Easy Housing Solutions (EHS) Services
echo ===================================================

echo Starting ApiGateway on http://localhost:5000 ...
start "EHS - ApiGateway (5000)" cmd /k "dotnet run --project ApiGateway\EasyHousingSolution.ApiGateway"

echo Starting IdentityService on http://localhost:5001 ...
start "EHS - IdentityService (5001)" cmd /k "dotnet run --project IdentityService\EasyHousingSolution.IdentityService.API"

echo Starting PropertyService on http://localhost:5002 ...
start "EHS - PropertyService (5002)" cmd /k "dotnet run --project PropertyService\EasyHousingSolution.PropertyService.API"

echo Starting UserService on http://localhost:5003 ...
start "EHS - UserService (5003)" cmd /k "dotnet run --project UserService\EasyHousingSolution.UserService.API"

echo Starting CartService on http://localhost:5004 ...
start "EHS - CartService (5004)" cmd /k "dotnet run --project CartService\EasyHousingSolution.CartService.API"

echo Starting Angular Frontend on http://localhost:4200 ...
cd AngularUI
start "EHS - Angular Frontend (4200)" cmd /k "npm start"
cd ..

echo ===================================================
echo All services launched!
echo - Gateway & Swagger: http://localhost:5000/swagger
echo - Frontend UI:       http://localhost:4200
echo ===================================================
pause
