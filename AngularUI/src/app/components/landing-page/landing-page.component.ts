// ============================================================================
// Document: landing-page.component.ts
// Project:  Easy Housing Solutions (EHS)
// Module:   Authentication & Landing Page
// Purpose:  Beginner-friendly Login and Registration (Buyer & Seller) component.
// Description:
//   Provides a simple tabbed interface to:
//   1. Log in with existing credentials (Buyer, Seller, Admin)
//   2. Register a new Buyer account
//   3. Register a new Seller account with address and city selection
// ============================================================================

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { State, City, UserSession } from '../../models/models';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.css'
})
export class LandingPageComponent {
  // Input: Lists of states and cities for seller registration dropdowns
  @Input() states: State[] = [];
  @Input() cities: City[] = [];

  // Output: Emitted when login or registration succeeds
  @Output() authSuccess = new EventEmitter<UserSession>();

  // Currently active tab: 'login', 'buyer', or 'seller'
  activeTab: 'login' | 'buyer' | 'seller' = 'login';
  
  // Status flags
  loading: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // 1. Login Form Fields
  loginEmail = '';
  loginPassword = '';

  // 2. Buyer Registration Fields
  buyerName = '';
  buyerEmail = '';
  buyerPhone = '';
  buyerPassword = '';
  buyerDob = '';

  // 3. Seller Registration Fields
  sellerName = '';
  sellerEmail = '';
  sellerPhone = '';
  sellerPassword = '';
  sellerDob = '';
  sellerAddress = '';
  sellerStateId: number | null = null;
  sellerCityId: number | null = null;

  // Maximum allowed Date of Birth (must be at least 18 years old)
  readonly maxDobDate: string = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split('T')[0];
  })();

  // Filtered cities based on selected seller state
  filteredSellerCities: City[] = [];

  constructor(private authService: AuthService) {}

  // Switch between Login, Buyer Register, and Seller Register tabs
  setTab(tab: 'login' | 'buyer' | 'seller'): void {
    this.activeTab = tab;
    this.errorMessage = null;
    this.successMessage = null;
  }

  // Filter cities when seller changes state
  onSellerStateChange(): void {
    if (!this.sellerStateId) {
      this.filteredSellerCities = [];
    } else {
      this.filteredSellerCities = this.cities.filter(c => c.stateId === Number(this.sellerStateId));
    }
  }

  // One-click demo credentials fill for quick testing / viva demo
  fillDemo(role: 'admin' | 'buyer' | 'seller'): void {
    if (role === 'admin') {
      this.loginEmail = 'admin@easysolution.com';
      this.loginPassword = 'AdminPassword123!';
    } else if (role === 'buyer') {
      this.loginEmail = 'buyer@demo.com';
      this.loginPassword = 'BuyerPassword123!';
    } else if (role === 'seller') {
      this.loginEmail = 'seller@demo.com';
      this.loginPassword = 'SellerPassword123!';
    }
  }

  // Handle user login (Buyer, Seller, or Admin)
  handleLogin(): void {
    if (!this.loginEmail || !this.loginPassword) {
      this.errorMessage = 'Please enter both email and password.';
      return;
    }
    this.errorMessage = null;
    this.loading = true;

    this.authService.login({
      emailId: this.loginEmail,
      password: this.loginPassword
    }).subscribe({
      next: res => {
        this.loading = false;
        if (res.success && res.data) {
          this.authSuccess.emit(res.data);
        } else {
          this.loginPassword = '';
          this.errorMessage = res.message || 'Invalid email or password.';
        }
      },
      error: err => {
        this.loading = false;
        this.loginPassword = '';
        this.errorMessage = err.error?.message || 'Invalid email or password. Please verify credentials.';
      }
    });
  }

  // Handle Buyer registration
  handleRegisterBuyer(): void {
    if (!this.buyerName) {
      this.errorMessage = 'Full name is required.';
      return;
    }
    if (!this.buyerEmail) {
      this.errorMessage = 'Email address is required.';
      return;
    }
    if (!this.buyerDob) {
      this.errorMessage = 'Date of birth is required.';
      return;
    }
    if (!/^[6-9]\d{9}$/.test(this.buyerPhone)) {
      this.errorMessage = 'Mobile number must be 10 digits starting with 6, 7, 8, or 9.';
      return;
    }
    if (!this.buyerPassword || this.buyerPassword.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters.';
      return;
    }

    this.errorMessage = null;
    this.loading = true;

    this.authService.registerBuyer({
      fullName: this.buyerName,
      emailId: this.buyerEmail,
      password: this.buyerPassword,
      dob: this.buyerDob,
      mobileNo: this.buyerPhone
    }).subscribe({
      next: res => {
        this.loading = false;
        if (res.success && res.data) {
          this.authSuccess.emit(res.data);
        } else {
          this.errorMessage = res.message || 'Registration failed.';
        }
      },
      error: err => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Failed to register buyer.';
      }
    });
  }

  // Handle Seller registration
  handleRegisterSeller(): void {
    if (!this.sellerName) {
      this.errorMessage = 'Seller name is required.';
      return;
    }
    if (!this.sellerEmail) {
      this.errorMessage = 'Email address is required.';
      return;
    }
    if (!this.sellerDob) {
      this.errorMessage = 'Date of birth is required.';
      return;
    }
    if (!/^[6-9]\d{9}$/.test(this.sellerPhone)) {
      this.errorMessage = 'Mobile number must be 10 digits starting with 6, 7, 8, or 9.';
      return;
    }
    if (!this.sellerStateId || !this.sellerCityId) {
      this.errorMessage = 'Please select both State and City.';
      return;
    }
    if (!this.sellerAddress) {
      this.errorMessage = 'Address is required.';
      return;
    }
    if (!this.sellerPassword || this.sellerPassword.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters.';
      return;
    }

    this.errorMessage = null;
    this.loading = true;

    this.authService.registerSeller({
      fullName: this.sellerName,
      emailId: this.sellerEmail,
      password: this.sellerPassword,
      phoneNo: this.sellerPhone,
      address: this.sellerAddress,
      stateId: Number(this.sellerStateId),
      cityId: Number(this.sellerCityId),
      dateofBirth: this.sellerDob
    }).subscribe({
      next: res => {
        this.loading = false;
        if (res.success && res.data) {
          this.authSuccess.emit(res.data);
        } else {
          this.errorMessage = res.message || 'Seller registration failed.';
        }
      },
      error: err => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Failed to register seller.';
      }
    });
  }
}
