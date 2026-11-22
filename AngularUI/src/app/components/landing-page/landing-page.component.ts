import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { State, City, UserSession } from '../../models/models';
import { extractErrorMessage } from '../../utils/error.utils';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.css'
})
export class LandingPageComponent {
  readonly states = input<State[]>([]);
  readonly cities = input<City[]>([]);

  readonly authSuccess = output<UserSession>();
  readonly browseMarketplace = output<void>();

  activeTab: 'login' | 'buyer' | 'seller' = 'login';
  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Login form
  loginEmail = '';
  loginPassword = '';

  // Buyer form
  buyerName = '';
  buyerEmail = '';
  buyerPhone = '';
  buyerPassword = '';
  buyerDob = '';

  // Seller form
  sellerName = '';
  sellerEmail = '';
  sellerPhone = '';
  sellerPassword = '';
  sellerDob = '';
  sellerAddress = '';
  sellerStateId: number | null = null;
  sellerCityId: number | null = null;

  readonly maxDobDate: string = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split('T')[0];
  })();

  filteredSellerCities: City[] = [];

  constructor(private authService: AuthService) {}

  setTab(tab: 'login' | 'buyer' | 'seller'): void {
    this.activeTab = tab;
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  onSellerStateChange(): void {
    if (!this.sellerStateId) {
      this.filteredSellerCities = [];
    } else {
      this.filteredSellerCities = this.cities().filter(c => c.stateId === Number(this.sellerStateId));
    }
  }

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

  handleLogin(): void {
    if (!this.loginEmail.trim() || !this.loginPassword.trim()) {
      this.errorMessage.set('Please enter both email and password.');
      return;
    }
    this.errorMessage.set(null);
    this.loading.set(true);

    this.authService.login({
      emailId: this.loginEmail,
      password: this.loginPassword
    }).subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.authSuccess.emit(res.data);
        } else {
          this.loginPassword = '';
          this.errorMessage.set(res.message || 'Invalid email or password. Please check your credentials.');
        }
      },
      error: err => {
        this.loading.set(false);
        this.loginPassword = '';
        this.errorMessage.set(extractErrorMessage(err, 'Invalid email or password. Please verify your credentials.'));
      }
    });
  }

  handleRegisterBuyer(): void {
    if (!this.buyerName.trim()) {
      this.errorMessage.set('Full name is required.');
      return;
    }
    if (!this.buyerEmail.trim()) {
      this.errorMessage.set('Email address is required.');
      return;
    }
    if (!this.buyerDob) {
      this.errorMessage.set('Date of birth is required.');
      return;
    }
    const buyerBirth = new Date(this.buyerDob);
    const today = new Date();
    if (buyerBirth > today) {
      this.errorMessage.set('Date of birth cannot be in the future.');
      return;
    }
    const bAgeDiff = today.getFullYear() - buyerBirth.getFullYear();
    const bMonthDiff = today.getMonth() - buyerBirth.getMonth();
    const bDayDiff = today.getDate() - buyerBirth.getDate();
    const buyerAge = (bMonthDiff < 0 || (bMonthDiff === 0 && bDayDiff < 0)) ? bAgeDiff - 1 : bAgeDiff;
    if (buyerAge < 18) {
      this.errorMessage.set('Buyer must be at least 18 years old to register.');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(this.buyerPhone.trim())) {
      this.errorMessage.set('Mobile number must be exactly 10 digits starting with 6, 7, 8, or 9.');
      return;
    }

    if (!this.buyerPassword || this.buyerPassword.length < 6) {
      this.errorMessage.set('Password must be at least 6 characters.');
      return;
    }

    this.errorMessage.set(null);
    this.loading.set(true);

    this.authService.registerBuyer({
      fullName: this.buyerName,
      emailId: this.buyerEmail,
      password: this.buyerPassword,
      dob: this.buyerDob,
      mobileNo: this.buyerPhone
    }).subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.authSuccess.emit(res.data);
        } else {
          this.buyerPassword = '';
          this.errorMessage.set(res.message || 'Registration failed.');
        }
      },
      error: err => {
        this.loading.set(false);
        this.buyerPassword = '';
        this.errorMessage.set(extractErrorMessage(err, 'Failed to register buyer. Please check your details.'));
      }
    });
  }

  handleRegisterSeller(): void {
    if (!this.sellerName.trim()) {
      this.errorMessage.set('Seller / Company name is required.');
      return;
    }
    if (!this.sellerEmail.trim()) {
      this.errorMessage.set('Email address is required.');
      return;
    }
    if (!this.sellerDob) {
      this.errorMessage.set('Date of birth is required for seller registration.');
      return;
    }
    const sellerBirth = new Date(this.sellerDob);
    const today = new Date();
    if (sellerBirth > today) {
      this.errorMessage.set('Date of birth cannot be in the future.');
      return;
    }
    const sAgeDiff = today.getFullYear() - sellerBirth.getFullYear();
    const sMonthDiff = today.getMonth() - sellerBirth.getMonth();
    const sDayDiff = today.getDate() - sellerBirth.getDate();
    const sellerAge = (sMonthDiff < 0 || (sMonthDiff === 0 && sDayDiff < 0)) ? sAgeDiff - 1 : sAgeDiff;
    if (sellerAge < 18) {
      this.errorMessage.set('Seller must be at least 18 years old to register.');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(this.sellerPhone.trim())) {
      this.errorMessage.set('Mobile number must be exactly 10 digits starting with 6, 7, 8, or 9.');
      return;
    }

    if (!this.sellerStateId || !this.sellerCityId) {
      this.errorMessage.set('Please select both State and City.');
      return;
    }

    if (!this.sellerAddress.trim()) {
      this.errorMessage.set('Address is required.');
      return;
    }

    if (!this.sellerPassword || this.sellerPassword.length < 6) {
      this.errorMessage.set('Password must be at least 6 characters.');
      return;
    }

    this.errorMessage.set(null);
    this.loading.set(true);

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
        this.loading.set(false);
        if (res.success && res.data) {
          this.authSuccess.emit(res.data);
        } else {
          this.sellerPassword = '';
          this.errorMessage.set(res.message || 'Seller registration failed.');
        }
      },
      error: err => {
        this.loading.set(false);
        this.sellerPassword = '';
        this.errorMessage.set(extractErrorMessage(err, 'Failed to register seller. Please check your details.'));
      }
    });
  }
}
