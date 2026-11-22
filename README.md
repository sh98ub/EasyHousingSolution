# Easy Housing Solutions (EHS) - Project Overview

Welcome to **Easy Housing Solutions (EHS)**! This document provides a simple, beginner-friendly explanation of how the project is structured, how it works, and how to run it.

---

## 1. What is this Project?

**Easy Housing Solutions** is an online real-estate platform where:
- **Buyers** can search for properties to buy or rent, add them to a wishlist/cart, and view owner contact details.
- **Sellers** can list their houses or apartments, upload images (up to 6 photos), and manage their listings.
- **Administrators** can review properties, verify or reject listings, deactivate inappropriate listings with reasons, and monitor all users.

---

## 2. System Architecture

The backend is built using a **Microservices Architecture** with **ASP.NET Core (.NET 8)**. Each service has its own database and responsibility. An **API Gateway** acts as the single door for the frontend.

| Microservice | Port | Database | What it does |
| :--- | :---: | :--- | :--- |
| **ApiGateway** | `5000` | N/A | Single front door using **Ocelot**. Routes all API calls to the right microservice. |
| **IdentityService** | `5001` | `EHS_IdentityDb` | Handles user authentication, login, and generates secure JWT tokens. |
| **PropertyService** | `5002` | `EHS_PropertyDb` | Manages property listings, locations (states/cities), image uploads (up to 6), and buying/renting. |
| **UserService** | `5003` | `EHS_UserDb` | Stores user profile details for Buyers, Sellers, and Admins. |
| **CartService** | `5004` | `EHS_CartDb` | Manages the bookmark/wishlist cart for buyers. |
| **AngularUI** | `4200` | N/A | The web application frontend built with **Angular 18**. |

---

## 3. Unit Testing

Unit tests are written using **NUnit** and **Moq** in the project `Shared/EasyHousingSolution.Tests`:

- **Test Document**: `PropertyBuyerTests.cs`
- **Total Unit Tests**: **7 tests**
- **Tested Scenarios**:
  1. `GetAllPropertiesForBuyer_ReturnsVerifiedListings`: Ensures buyers only see verified, active listings.
  2. `GetPropertyById_WhenActivePropertyExists_ReturnsPropertyDto`: Verifies fetching property details by ID.
  3. `BuyPropertyAsync_WhenActive_MarksInactiveAndSetsReason`: Confirms buying a property marks it inactive with status "Sold to Buyer #ID".
  4. `BuyPropertyAsync_WhenBuyerIsSellerOfProperty_ThrowsInvalidOperationException`: Enforces the rule that sellers cannot buy their own properties.
  5. `BuyPropertyAsync_WhenPropertyOptionIsRent_SetsRentedReason`: Confirms renting a property marks it inactive with status "Rented to Buyer #ID".
  6. `GetPurchasedPropertiesByBuyerId_ReturnsBuyersProperties`: Checks retrieval of a buyer's purchase history.
  7. `GetSoldPropertiesBySellerId_ReturnsSellersSoldProperties`: Checks retrieval of a seller's sold properties history.

---

## 4. How to Run the Project

### Prerequisites
- .NET 8 SDK
- SQL Server LocalDB / SQL Server Express
- Node.js (v18+) & npm

### Starting the Backend Services
You can run all services using Visual Studio (select multiple startup projects) or using the .NET CLI:
```bash
# In separate terminal windows:
dotnet run --project ApiGateway/EasyHousingSolution.ApiGateway
dotnet run --project IdentityService/EasyHousingSolution.IdentityService.API
dotnet run --project PropertyService/EasyHousingSolution.PropertyService.API
dotnet run --project UserService/EasyHousingSolution.UserService.API
dotnet run --project CartService/EasyHousingSolution.CartService.API
```

### Running the Unit Tests
```bash
dotnet test Shared/EasyHousingSolution.Tests/EasyHousingSolution.Tests.csproj
```

### Starting the Frontend
```bash
cd AngularUI
npm install
npm start
```
The application will open at `http://localhost:4200`.

---

## 5. Coding Standards & Documentation Comments
Every major file in this solution starts with a **Document-Level Comment Header**:
- Document name
- Project and Module
- Purpose and Description in simple English
- XML documentation comments (`/// <summary>`) for classes and methods
