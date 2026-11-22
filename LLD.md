# Low Level Design (LLD)
## Easy Housing Solutions (EHS) - Backend Microservices
**.NET 8.0 Web API | Ocelot API Gateway | Entity Framework Core | SQL Server**

---

## 1. System Architecture

The backend consists of **4 decoupled microservices** fronted by a centralized **Ocelot API Gateway** on port 5000. Each microservice follows Clean Architecture and owns an independent database (**Database-per-Service**).

```mermaid
flowchart TD
    Client["Client App / Swagger (:4200 / :5000)"]
    Gateway["API Gateway (Ocelot :5000)\nReverse Proxy & JWT Routing"]

    subgraph Microservices [Core Microservices]
        Identity["IdentityService (:5001)\nAuth, PBKDF2, JWT Issuance"]
        Property["PropertyService (:5002)\nListings, Images (Max 6), Search, Moderation"]
        User["UserService (:5003)\nBuyer / Seller Profiles, Admin Moderation"]
        Cart["CartService (:5004)\nBuyer Bookmarks & Enrichment"]
    end

    subgraph Databases [Isolated SQL Server LocalDB Instances]
        DbIdentity[("EHS_IdentityDb")]
        DbProperty[("EHS_PropertyDb")]
        DbUser[("EHS_UserDb")]
        DbCart[("EHS_CartDb")]
    end

    Client --> Gateway
    Gateway -->|/api/identity/*| Identity
    Gateway -->|/api/properties/*, /api/states/*, /api/cities/*| Property
    Gateway -->|/api/users/*, /api/admin/*| User
    Gateway -->|/api/cart/*| Cart

    Identity -.->|Provision Profile| User
    Cart -.->|Enrich Details| Property

    Identity --> DbIdentity
    Property --> DbProperty
    User --> DbUser
    Cart --> DbCart
```

---

## 2. Entity-Relationship (ER) Diagram — Peter Chen Notation

```mermaid
flowchart TD
    %% Styling Classes
    classDef entity fill:#f0f9ff,stroke:#0284c7,stroke-width:2px,color:#0369a1,font-weight:bold;
    classDef weakEntity fill:#f0f9ff,stroke:#0284c7,stroke-width:3.5px,color:#0369a1,font-weight:bold;
    classDef rel fill:#fffbeb,stroke:#d97706,stroke-width:2px,color:#b45309,font-weight:bold;
    classDef idRel fill:#fffbeb,stroke:#d97706,stroke-width:3px,color:#b45309,font-weight:bold;
    classDef attr fill:#ffffff,stroke:#64748b,stroke-width:1.2px,color:#1e293b,font-size:11px;
    classDef pk fill:#fef9c3,stroke:#ca8a04,stroke-width:1.8px,color:#854d0e,font-weight:bold,font-size:11px;

    %% Entities
    STATE["STATE"]:::entity
    CITY["CITY"]:::entity
    APP_USER["APP_USER"]:::entity
    SELLER["SELLER"]:::entity
    BUYER["BUYER"]:::entity
    PROPERTY["PROPERTY"]:::entity
    IMAGES[["IMAGES\n(Weak Entity)"]]:::weakEntity
    CART[["CART\n(Weak Entity)"]]:::weakEntity

    %% Relationships
    R_CONTAINS{"CONTAINS"}:::rel
    R_STATE_OF{"STATE_OF"}:::rel
    R_CITY_OF{"CITY_OF"}:::rel
    R_LOCATED_IN{"LOCATED_IN"}:::rel
    R_LOGS_S{"LOGS_IN"}:::rel
    R_LOGS_B{"LOGS_IN"}:::rel
    R_LISTS{"LISTS"}:::rel
    R_BUY{"PURCHASES"}:::rel
    R_CART{"BOOKMARKS"}:::rel
    R_INCL{"INCLUDES"}:::idRel
    R_REF{"REFERENCES"}:::rel

    %% Attributes - State
    PK_SId(["StateId (PK)"]):::pk
    A_SName(["StateName"]):::attr
    STATE --- PK_SId
    STATE --- A_SName

    %% Attributes - City
    PK_CId(["CityId (PK)"]):::pk
    A_CName(["CityName"]):::attr
    CITY --- PK_CId
    CITY --- A_CName

    %% Attributes - User
    PK_UId(["UserId (PK)"]):::pk
    A_Pass(["PasswordHash"]):::attr
    A_Role(["Role"]):::attr
    APP_USER --- PK_UId
    APP_USER --- A_Pass
    APP_USER --- A_Role

    %% Attributes - Seller
    PK_SelId(["SellerId (PK)"]):::pk
    A_SelName(["UserName"]):::attr
    A_SelPhone(["PhoneNo"]):::attr
    A_SelEmail(["EmailId"]):::attr
    A_SelAddr(["Address"]):::attr
    SELLER --- PK_SelId
    SELLER --- A_SelName
    SELLER --- A_SelPhone
    SELLER --- A_SelEmail
    SELLER --- A_SelAddr

    %% Attributes - Buyer
    PK_BuyId(["BuyerId (PK)"]):::pk
    A_BuyName(["FirstName"]):::attr
    A_BuyPhone(["PhoneNo"]):::attr
    A_BuyEmail(["EmailId"]):::attr
    BUYER --- PK_BuyId
    BUYER --- A_BuyName
    BUYER --- A_BuyPhone
    BUYER --- A_BuyEmail

    %% Attributes - Property
    PK_PId(["PropertyId (PK)"]):::pk
    A_PName(["PropertyName"]):::attr
    A_PType(["PropertyType"]):::attr
    A_POpt(["PropertyOption"]):::attr
    A_PPrice(["PriceRange"]):::attr
    A_PActive(["IsActive"]):::attr
    A_PReason(["DeactivationReason"]):::attr
    PROPERTY --- PK_PId
    PROPERTY --- A_PName
    PROPERTY --- A_PType
    PROPERTY --- A_POpt
    PROPERTY --- A_PPrice
    PROPERTY --- A_PActive
    PROPERTY --- A_PReason

    %% Attributes - Images & Cart
    PK_ImgId(["ImageId (PK)"]):::pk
    A_Img(["Image"]):::attr
    IMAGES --- PK_ImgId
    IMAGES --- A_Img

    PK_CartId(["CartId (PK)"]):::pk
    CART --- PK_CartId

    %% Connections with Cardinality (1, N)
    STATE ---|"1"| R_CONTAINS
    R_CONTAINS ---|"N"| CITY

    STATE ---|"1"| R_STATE_OF
    R_STATE_OF ---|"N"| SELLER

    CITY ---|"1"| R_CITY_OF
    R_CITY_OF ---|"N"| SELLER

    CITY ---|"1"| R_LOCATED_IN
    R_LOCATED_IN ---|"N"| PROPERTY

    APP_USER ---|"1"| R_LOGS_S
    R_LOGS_S ---|"1"| SELLER

    APP_USER ---|"1"| R_LOGS_B
    R_LOGS_B ---|"1"| BUYER

    SELLER ---|"1"| R_LISTS
    R_LISTS ---|"N"| PROPERTY

    BUYER ---|"1"| R_BUY
    R_BUY ---|"N"| PROPERTY

    BUYER ---|"1"| R_CART
    R_CART ---|"N"| CART

    PROPERTY ---|"1"| R_INCL
    R_INCL ---|"0..6"| IMAGES

    PROPERTY ---|"1"| R_REF
    R_REF ---|"N"| CART
```

---

## 3. Database Schema (Tables & Keys)

| Database | Table | Columns & Data Types | Primary / Foreign Keys | Description |
| :--- | :--- | :--- | :--- | :--- |
| **`EHS_IdentityDb`** | `Users` | `UserName` VARCHAR(25)<br>`Password` VARCHAR(25)<br>`UserType` VARCHAR(15) | **PK**: `UserName` | Stores credentials & role (`Admin`, `Buyer`, `Seller`). Passwords hashed via PBKDF2. |
| **`EHS_UserDb`** | `Buyer` | `BuyerId` INT (IDENTITY)<br>`FirstName` VARCHAR(25)<br>`LastName` VARCHAR(25)<br>`DateOfBirth` DATE<br>`PhoneNo` VARCHAR(10)<br>`EmailId` VARCHAR(50)<br>`UserName` VARCHAR(25) | **PK**: `BuyerId`<br>**UK**: `EmailId` | Stores Buyer profiles. Validates Age >= 18 and 10-digit mobile format. |
| | `Seller` | `SellerId` INT (IDENTITY)<br>`UserName` VARCHAR(25)<br>`FirstName` VARCHAR(25)<br>`LastName` VARCHAR(25)<br>`DateofBirth` DATE<br>`PhoneNo` VARCHAR(10)<br>`Address` VARCHAR(250)<br>`StateId` INT, `CityId` INT<br>`EmailId` VARCHAR(50) | **PK**: `SellerId`<br>**UK**: `EmailId` | Stores Seller profiles and contact information. |
| **`EHS_PropertyDb`** | `State` | `StateId` INT (IDENTITY)<br>`StateName` VARCHAR(30) | **PK**: `StateId` | Master state lookup table. |
| | `City` | `CityId` INT (IDENTITY)<br>`CityName` VARCHAR(50)<br>`StateId` INT | **PK**: `CityId`<br>**FK**: `StateId` -> `State(StateId)` | Master city lookup linked to state. |
| | `Property` | `PropertyId` INT (IDENTITY)<br>`PropertyName` VARCHAR(50)<br>`PropertyType` VARCHAR(15)<br>`PropertyOption` VARCHAR(10)<br>`Description` VARCHAR(250)<br>`Address` VARCHAR(250)<br>`PriceRange` MONEY<br>`InitialDeposit` MONEY<br>`Landmark` VARCHAR(25)<br>`IsActive` BIT<br>`DeactivationReason` VARCHAR(250)<br>`SellerId` INT<br>`CityId` INT | **PK**: `PropertyId`<br>**FK**: `CityId` -> `City(CityId)`<br>**Logical FK**: `SellerId` | Property listings. Initial `IsActive = false` until admin approves. |
| | `Images` | `ImageId` INT (IDENTITY)<br>`PropertyId` INT<br>`Image` VARCHAR(MAX) | **PK**: `ImageId`<br>**FK**: `PropertyId` -> `Property` | Photos for property. **Max 6 images per property enforced**. |
| **`EHS_CartDb`** | `Cart` | `CartId` INT (IDENTITY)<br>`BuyerId` INT<br>`PropertyId` INT | **PK**: `CartId`<br>**UK**: `(BuyerId, PropertyId)` | Buyer bookmark shortlists. Composite unique constraint prevents duplicate adds. |

---

## 4. Class Design (Core Interfaces & Services)

```mermaid
classDiagram
    %% Identity Service
    class AuthController {
        +RegisterBuyer(RegisterBuyerDto) Task~IActionResult~
        +RegisterSeller(RegisterSellerDto) Task~IActionResult~
        +Login(LoginDto) Task~IActionResult~
    }
    class AuthService {
        +RegisterBuyerAsync()
        +RegisterSellerAsync()
        +LoginAsync()
    }
    AuthController --> AuthService

    %% Property Service
    class PropertiesController {
        +CreateProperty(CreatePropertyDto) Task~IActionResult~
        +SearchProperties(cityId, type, option, sortBy) Task~IActionResult~
        +ApproveProperty(id) Task~IActionResult~
        +RejectProperty(id, RejectPropertyDto) Task~IActionResult~
        +BuyProperty(id) Task~IActionResult~
    }
    class PropertyAppService {
        +CreatePropertyAsync()
        +SearchPropertiesAsync()
        +VerifyPropertyAsync()
        +DeactivatePropertyAsync()
        +BuyPropertyAsync()
    }
    class ImageAppService {
        +UploadImagesAsync(propertyId, images)
    }
    PropertiesController --> PropertyAppService

    %% User Service
    class UsersController {
        +GetMyProfile() Task~IActionResult~
        +UpdateMyProfile(UpdateUserProfileDto) Task~IActionResult~
        +GetAllUsers(role, isActive) Task~IActionResult~
        +ActivateUser(id) Task~IActionResult~
        +DeactivateUser(id) Task~IActionResult~
    }
    class UserAppService {
        +GetAllUsersAsync()
        +UpdateUserStatusAsync()
        +ChangeUserRoleAsync()
    }
    UsersController --> UserAppService

    %% Cart Service
    class CartController {
        +AddToCart(AddToCartDto) Task~IActionResult~
        +GetMyCart() Task~IActionResult~
        +RemovePropertyFromCart(id) Task~IActionResult~
        +ClearMyCart() Task~IActionResult~
    }
    class CartAppService {
        +AddToCartAsync(buyerId, propertyId)
        +GetBuyerCartAsync(buyerId)
        +RemovePropertyFromCartAsync(buyerId, id)
    }
    CartController --> CartAppService
```

---

## 5. Key Workflows (Sequence Diagrams)

### 5.1 User Registration & Login (JWT Flow)
```mermaid
sequenceDiagram
    autonumber
    actor User as User (Buyer/Seller)
    participant Gateway as API Gateway (:5000)
    participant Identity as IdentityService (:5001)
    participant UserSvc as UserService (:5003)
    participant DbIdentity as IdentityDb

    %% Registration
    User ->> Gateway: POST /api/identity/register-buyer (FullName, Email, Pass, Dob, Phone)
    Gateway ->> Identity: Forward Request
    Identity ->> Identity: Validate Dob (Age >= 18) & Phone (10 digits)
    Identity ->> UserSvc: HTTP POST /api/buyers (Create Buyer Profile)
    UserSvc -->> Identity: Created (BuyerId = 101)
    Identity ->> DbIdentity: Save User (Email, PBKDF2 PasswordHash, Role)
    Identity ->> Identity: Generate HMAC-SHA256 JWT (with role, profileId)
    Identity -->> Gateway: 200 OK { token, userType: "Buyer", profileId: 101 }
    Gateway -->> User: 200 OK with JWT Token

    %% Login
    User ->> Gateway: POST /api/identity/login (Email, Password)
    Gateway ->> Identity: Verify credentials against IdentityDb
    Identity -->> Gateway: 200 OK { token, role, profileId }
    Gateway -->> User: 200 OK
```

---

### 5.2 Property Creation & 6-Image Validation Workflow
```mermaid
sequenceDiagram
    autonumber
    actor Seller as Seller
    participant Gateway as API Gateway (:5000)
    participant PropertySvc as PropertyService (:5002)
    participant DbProperty as PropertyDb

    %% Add Property
    Seller ->> Gateway: POST /api/properties [Bearer Token]
    Gateway ->> PropertySvc: Create Property (Inject SellerId from JWT)
    PropertySvc ->> DbProperty: Save Property (Initial IsActive = false)
    DbProperty -->> PropertySvc: Saved (PropertyId = 55)
    PropertySvc -->> Seller: 201 Created (Pending Admin Verification)

    %% Upload Images
    Seller ->> Gateway: POST /api/properties/55/images { images: [img1, img2, ...] }
    Gateway ->> PropertySvc: Forward Upload Request
    PropertySvc ->> DbProperty: Get current image count for Property #55
    alt (Current Count + New Count) > 6
        PropertySvc -->> Seller: 400 Bad Request ("Max 6 images allowed per property")
    else Valid Count (<= 6)
        PropertySvc ->> DbProperty: Insert Images
        PropertySvc -->> Seller: 200 OK (Images Uploaded)
    end
```

---

### 5.3 Admin Moderation (Approve vs Deactivate with Reason)
```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin
    participant Gateway as API Gateway (:5000)
    participant PropertySvc as PropertyService (:5002)
    participant DbProperty as PropertyDb

    alt Approve Listing
        Admin ->> Gateway: PUT /api/properties/55/approve [Bearer Admin-Token]
        Gateway ->> PropertySvc: Approve
        PropertySvc ->> DbProperty: UPDATE Property SET IsActive = true, DeactivationReason = NULL
        PropertySvc -->> Admin: 200 OK ("Property approved and active")
    else Deactivate Listing
        Admin ->> Gateway: PUT /api/properties/55/reject { reason: "Incomplete title deed" }
        Gateway ->> PropertySvc: Deactivate
        PropertySvc ->> PropertySvc: Validate reason is NOT empty
        PropertySvc ->> DbProperty: UPDATE Property SET IsActive = false, DeactivationReason = reason
        PropertySvc -->> Admin: 200 OK ("Property deactivated with reason")
    end
```

---

### 5.4 Buyer Cart & Purchase Workflow
```mermaid
sequenceDiagram
    autonumber
    actor Buyer as Buyer
    participant Gateway as API Gateway (:5000)
    participant CartSvc as CartService (:5004)
    participant PropertySvc as PropertyService (:5002)
    participant DbProperty as PropertyDb

    %% Add to Cart
    Buyer ->> Gateway: POST /api/cart/items { propertyId: 55 } [Bearer Buyer-Token]
    Gateway ->> CartSvc: Add to Cart (BuyerId from Token)
    CartSvc ->> PropertySvc: GET /api/properties/55 (Verify Active & not Seller's own)
    CartSvc ->> CartSvc: Save CartItem (Prevent duplicate bookmark)
    CartSvc -->> Buyer: 200 OK (Added to Cart)

    %% View Enriched Cart
    Buyer ->> Gateway: GET /api/cart
    Gateway ->> CartSvc: Get Cart Items
    CartSvc ->> PropertySvc: Fetch real-time property details (Name, Price, Status)
    CartSvc -->> Buyer: 200 OK (Cart items with property details)

    %% Purchase Property
    Buyer ->> Gateway: POST /api/properties/55/buy [Bearer Buyer-Token]
    Gateway ->> PropertySvc: Buy Property #55
    PropertySvc ->> DbProperty: UPDATE Property SET IsActive = false, DeactivationReason = "Sold to Buyer #101"
    PropertySvc -->> Buyer: 200 OK ("Property purchased successfully")
```

---

## 6. API Canvas (All Endpoints Summary)

All endpoints route through the **Ocelot API Gateway** on port 5000 (`http://localhost:5000`).

| Service | Method | Route | Access | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Identity** | `POST` | `/api/identity/register-buyer` | Public | Register new buyer (Validates Age >= 18) |
| | `POST` | `/api/identity/register-seller` | Public | Register new seller (Validates Age >= 18) |
| | `POST` | `/api/identity/login` | Public | Authenticate user & issue signed JWT token |
| **Property** | `GET` | `/api/properties/verified` | Public | Get all active approved listings |
| | `GET` | `/api/properties/{id}` | Public | Get single property with photos |
| | `GET` | `/api/properties/search` | Public | Multi-filter by State, City, Type & Sort by Price |
| | `POST` | `/api/properties` | Seller | Add property (Default `IsActive = false`) |
| | `PUT` | `/api/properties/{id}` | Seller, Admin | Edit owned listing |
| | `DELETE`| `/api/properties/{id}` | Seller, Admin | Delete property listing |
| | `GET` | `/api/properties/my-properties`| Seller | View logged-in seller listings |
| | `PUT` | `/api/properties/{id}/approve` | Admin | Approve property (`IsActive = true`) |
| | `PUT` | `/api/properties/{id}/reject` | Admin | Deactivate listing with mandatory reason |
| | `POST` | `/api/properties/{id}/buy` | Buyer | Buy property (`Sold to Buyer #{id}`) |
| | `GET` | `/api/verifications/sales-report` | Admin | Sales & property inventory valuation report |
| | `POST` | `/api/properties/{id}/images` | Seller | Upload photos (**Max 6 limit enforced**) |
| | `DELETE`| `/api/properties/{id}/images/{imgId}` | Seller | Delete a specific property photo |
| | `GET` | `/api/states`, `/api/cities` | Public | Geographic hierarchy master lookup |
| **User** | `GET` | `/api/users/profile` | Authenticated | View current logged-in profile |
| | `PUT` | `/api/users/profile` | Authenticated | Update self contact details |
| | `GET` | `/api/sellers/{id}/contact` | Public | Expose owner contact details (Phone, Email, Address) |
| | `GET` | `/api/admin/users` | Admin | View all users with role/status filters |
| | `PUT` | `/api/admin/users/{id}/activate` | Admin | Activate suspended user account |
| | `PUT` | `/api/admin/users/{id}/deactivate` | Admin | Deactivate user account |
| | `PUT` | `/api/admin/users/{id}/role` | Admin | Update role (`Admin`, `Buyer`, `Seller`) |
| **Cart** | `POST` | `/api/cart/items` | Buyer | Bookmark property to cart |
| | `GET` | `/api/cart` | Buyer | Get buyer's cart with enriched property details |
| | `DELETE`| `/api/cart/items/{id}` | Buyer | Remove single item from cart |
| | `DELETE`| `/api/cart` | Buyer | Clear buyer's entire cart |

---

## 7. Business Rules & Invariant Matrix

| Business Rule | Condition / Validation Rule | Error Response |
| :--- | :--- | :--- |
| **Age >= 18** | Registration parses DOB. Age must be at least 18 years. Future dates prohibited. | `400 Bad Request` ("Buyer must be at least 18 years old") |
| **Phone Format** | Exactly 10 digits starting with 6, 7, 8, or 9 (`^[6-9][0-9]{9}$`). | `400 Bad Request` ("Mobile number must be exactly 10 digits") |
| **Max 6 Images** | `CurrentPropertyImages + NewIncomingImages <= 6`. | `400 Bad Request` ("Cannot upload X images. Max 6 allowed") |
| **Admin Reason** | Admin deactivating property must provide non-empty reason string. | `400 Bad Request` ("Proper reason must be provided") |
| **Cart Duplication**| Cannot add the same property to the cart more than once. | `400 Bad Request` ("Property is already in buyer's cart") |
| **Self-Purchase** | A seller cannot buy or add their own property to cart (`SellerId == BuyerId`). | `400 Bad Request` ("Sellers cannot buy or rent their own properties") |
| **Token RBAC** | Protected endpoints check `[Authorize(Roles = "...")]` against JWT claims. | `401 Unauthorized` / `403 Forbidden` |

---

## 8. Unit Testing Summary

Tested in `EasyHousingSolution.Tests` using **NUnit 4.1.0** and **Moq 4.20.70**:

| Test ID | Scenario | Verification | Result |
| :--- | :--- | :--- | :--- |
| `TC-AUTH-01` | Valid Buyer Registration | Validates Dob >= 18, provisions profile in UserService, issues JWT token | **Passed** |
| `TC-AUTH-02` | Underage Registration | Rejects registration when Dob < 18 years with `400 Bad Request` | **Passed** |
| `TC-AUTH-03` | Valid Login | Verifies PBKDF2 hash, issues HMAC-SHA256 JWT with role & profile claims | **Passed** |
| `TC-PROP-01` | Property Initial State | Newly posted property is saved with `IsActive = false` | **Passed** |
| `TC-PROP-02` | **Max 6 Images Limit** | Rejects upload of 3 images if listing already has 4 images (`4 + 3 > 6`) | **Passed** |
| `TC-PROP-03` | Admin Approval | Admin verifies property; `IsActive` sets to `true`, reason cleared | **Passed** |
| `TC-PROP-04` | Admin Deactivation Reason | Rejects empty reason string `""` with `400 Bad Request` | **Passed** |
| `TC-PROP-05` | Price Sorting | `GET /api/properties/search?sortBy=price` sorts ascending by `PriceRange` | **Passed** |
| `TC-CART-01` | Cart Addition & Duplication | Prevents duplicate bookmarks with composite key `(BuyerId, PropertyId)` | **Passed** |
| `TC-CART-02` | Cart Enrichment | Enriches cart items with real-time property title, price, and status | **Passed** |
| `TC-USER-01` | Owner Contact Disclosure | Returns owner Phone, Email, and Address for verified listings | **Passed** |
