// ============================================================================
// Document: app.ts
// Project:  Easy Housing Solutions (EHS)
// Module:   Root Application Component
// Purpose:  Clean, beginner-friendly orchestrator for the 3 distinct dashboards.
// Description:
//   Controls role-based dashboard routing:
//   - Shows Landing / Login page for guests
//   - Shows User / Buyer Dashboard when logged in as Buyer
//   - Shows Seller Dashboard when logged in as Seller
//   - Shows Admin Dashboard when logged in as Admin
// ============================================================================

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { PropertyService } from './services/property.service';
import { State, City, UserSession } from './models/models';

import { NavbarComponent } from './components/navbar/navbar.component';
import { LandingPageComponent } from './components/landing-page/landing-page.component';
import { UserDashboardComponent } from './components/user-dashboard/user-dashboard.component';
import { SellerPortalComponent } from './components/seller-portal/seller-portal.component';
import { AdminPanelComponent } from './components/admin-panel/admin-panel.component';
import { CommonErrorComponent } from './components/common-error/common-error.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    LandingPageComponent,
    UserDashboardComponent,
    SellerPortalComponent,
    AdminPanelComponent,
    CommonErrorComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  // Current active view: 'landing', 'user', 'seller', or 'admin'
  currentView: 'landing' | 'user' | 'seller' | 'admin' = 'landing';

  // Geographic data passed to registration forms
  states: State[] = [];
  cities: City[] = [];

  constructor(
    public authService: AuthService,
    private propertyService: PropertyService
  ) {}

  ngOnInit(): void {
    this.loadGeographicData();
    this.checkInitialSession();
  }

  // Load States and Cities for registration dropdowns
  loadGeographicData(): void {
    this.propertyService.getStates().subscribe({
      next: res => { if (res.success) this.states = res.data; }
    });
    this.propertyService.getCities().subscribe({
      next: res => { if (res.success) this.cities = res.data; }
    });
  }

  // Check if a user session is already saved in storage
  checkInitialSession(): void {
    if (this.authService.isLoggedIn()) {
      const role = this.authService.userRole();
      this.routeToDashboard(role);
    } else {
      this.currentView = 'landing';
    }
  }

  // Handles login or registration success from Landing Page
  onAuthSuccess(session: UserSession): void {
    this.routeToDashboard(session.userType);
  }

  // Routes user to their dedicated dashboard based on role
  routeToDashboard(role: string | null): void {
    if (role === 'Admin') {
      this.currentView = 'admin';
    } else if (role === 'Seller') {
      this.currentView = 'seller';
    } else if (role === 'Buyer') {
      this.currentView = 'user';
    } else {
      this.currentView = 'landing';
    }
  }

  // Handles logout event from Navbar
  onLogout(): void {
    this.currentView = 'landing';
  }
}
