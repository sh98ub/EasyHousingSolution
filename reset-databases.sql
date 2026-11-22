USE master;
GO

-- 1. Drop CartDb
IF EXISTS (SELECT name FROM sys.databases WHERE name = 'EHS_CartDb')
BEGIN
    ALTER DATABASE [EHS_CartDb] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE [EHS_CartDb];
    PRINT 'EHS_CartDb dropped successfully.';
END
GO

-- 2. Drop PropertyDb
IF EXISTS (SELECT name FROM sys.databases WHERE name = 'EHS_PropertyDb')
BEGIN
    ALTER DATABASE [EHS_PropertyDb] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE [EHS_PropertyDb];
    PRINT 'EHS_PropertyDb dropped successfully.';
END
GO

-- 3. Drop UserDb
IF EXISTS (SELECT name FROM sys.databases WHERE name = 'EHS_UserDb')
BEGIN
    ALTER DATABASE [EHS_UserDb] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE [EHS_UserDb];
    PRINT 'EHS_UserDb dropped successfully.';
END
GO

-- 4. Drop IdentityDb
IF EXISTS (SELECT name FROM sys.databases WHERE name = 'EHS_IdentityDb')
BEGIN
    ALTER DATABASE [EHS_IdentityDb] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE [EHS_IdentityDb];
    PRINT 'EHS_IdentityDb dropped successfully.';
END
GO

-- 5. Drop legacy databases if present
IF EXISTS (SELECT name FROM sys.databases WHERE name = 'EHS_BuyerDB')
BEGIN
    ALTER DATABASE [EHS_BuyerDB] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE [EHS_BuyerDB];
    PRINT 'Legacy EHS_BuyerDB dropped.';
END
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = 'EHS_SellerDB')
BEGIN
    ALTER DATABASE [EHS_SellerDB] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE [EHS_SellerDB];
    PRINT 'Legacy EHS_SellerDB dropped.';
END
GO
