import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { PropertyService } from './services/property.service';
import { CartService } from './services/cart.service';
import { City, State, Property, SellerContact, UserSession, PropertyFilterCriteria, EnrichedCartItem } from './models/models';
import { extractErrorMessage } from './utils/error.utils';

import { NavbarComponent } from './components/navbar/navbar.component';
import { HeroSearchComponent } from './components/hero-search/hero-search.component';
import { PropertyListComponent } from './components/property-list/property-list.component';
import { AuthModalComponent } from './components/auth-modal/auth-modal.component';
import { CartModalComponent } from './components/cart-modal/cart-modal.component';
import { ContactModalComponent } from './components/contact-modal/contact-modal.component';
import { SellerPortalComponent } from './components/seller-portal/seller-portal.component';
import { AdminPanelComponent } from './components/admin-panel/admin-panel.component';
import { PropertyDetailModalComponent } from './components/property-detail-modal/property-detail-modal.component';
import { PropertyCompareModalComponent } from './components/property-compare-modal/property-compare-modal.component';
import { LandingPageComponent } from './components/landing-page/landing-page.component';
import { ToastComponent } from './components/toast/toast.component';
import { CommonErrorComponent } from './components/common-error/common-error.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    LandingPageComponent,
    HeroSearchComponent,
    PropertyListComponent,
    AuthModalComponent,
    CartModalComponent,
    ContactModalComponent,
    SellerPortalComponent,
    AdminPanelComponent,
    PropertyDetailModalComponent,
    PropertyCompareModalComponent,
    ToastComponent,
    CommonErrorComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  // Application View & Navigation State
  readonly currentView = signal<'landing' | 'marketplace' | 'admin-dashboard' | 'seller-dashboard'>('landing');
  readonly sellerPortalTab = signal<'post' | 'listings'>('listings');

  // Application Data Signals
  readonly cities = signal<City[]>([]);
  readonly states = signal<State[]>([]);
  readonly properties = signal<Property[]>([]);
  readonly allVerifiedProperties = signal<Property[]>([]);
  readonly purchasedProperties = signal<Property[]>([]);
  readonly isLoadingProperties = signal<boolean>(false);

  // Modal Signals
  readonly isAuthOpen = signal<boolean>(false);
  readonly isCartOpen = signal<boolean>(false);
  readonly cartInitialTab = signal<'cart' | 'purchases'>('cart');
  readonly isSellerPortalOpen = signal<boolean>(false);
  readonly isAdminPanelOpen = signal<boolean>(false);
  readonly isContactOpen = signal<boolean>(false);
  readonly isDetailOpen = signal<boolean>(false);
  readonly isCompareOpen = signal<boolean>(false);

  // Property Comparison Signals
  readonly comparedProperties = signal<Property[]>([]);
  readonly comparedPropertyIds = computed(() => this.comparedProperties().map(p => p.propertyId));

  // Detail Modal Selection
  readonly selectedDetailProperty = signal<Property | null>(null);

  // Active Seller Contact
  readonly selectedContact = signal<SellerContact | null>(null);
  readonly isLoadingContact = signal<boolean>(false);

  // Toast Notification Signals
  readonly toastMessage = signal<string | null>(null);
  readonly toastType = signal<'success' | 'error' | 'info'>('success');
  private toastTimer: any = null;

  // Central Reactive Filter State
  readonly activeFilter = signal<PropertyFilterCriteria>({
    propertyOption: 'Sell'
  });

  // Active City Computed
  readonly activeCity = computed(() => {
    const cid = this.activeFilter().cityId;
    return cid ? this.cities().find(c => c.cityId === Number(cid)) ?? null : null;
  });

  // Computeds
  readonly isBuyer = computed(() => this.authService.userRole() === 'Buyer');
  readonly cartPropertyIds = computed(() => this.cartService.cartItems().map(i => i.propertyId));

  constructor(
    public authService: AuthService,
    public propertyService: PropertyService,
    public cartService: CartService
  ) {
    effect(() => {
      const user = this.authService.currentUser();
      if (!user && (this.currentView() === 'admin-dashboard' || this.currentView() === 'seller-dashboard')) {
        this.currentView.set('landing');
      }
    });
  }

  ngOnInit(): void {
    this.loadLocations();
    this.loadAllVerifiedMaster();
    this.loadProperties();
    this.refreshUserCart();
  }

  syncRoleView(): void {
    const role = this.authService.userRole();
    if (role === 'Admin') {
      this.currentView.set('admin-dashboard');
    } else if (role === 'Seller') {
      this.currentView.set('seller-dashboard');
    } else {
      this.currentView.set('marketplace');
    }
  }

  loadLocations(): void {
    this.propertyService.getCities().subscribe({
      next: res => {
        if (res.success && res.data) {
          this.cities.set(res.data);
        }
      }
    });

    this.propertyService.getStates().subscribe({
      next: res => {
        if (res.success && res.data) {
          this.states.set(res.data);
        }
      }
    });
  }

  loadAllVerifiedMaster(): void {
    this.propertyService.getVerifiedProperties().subscribe({
      next: res => {
        if (res.success && res.data) {
          this.allVerifiedProperties.set(res.data);
        }
      }
    });
  }

  // Loads properties from backend using filters: City, Property Type, Purpose, and Sort Order
  loadProperties(): void {
    this.isLoadingProperties.set(true);
    const filter = this.activeFilter();
    this.propertyService.searchProperties(
      filter.cityId ? Number(filter.cityId) : undefined,
      filter.propertyType,
      filter.propertyOption,
      filter.sortBy
    ).subscribe({
      next: res => {
        this.isLoadingProperties.set(false);
        if (res.success && res.data) {
          this.properties.set(res.data);
        }
      },
      error: () => {
        this.isLoadingProperties.set(false);
      }
    });
  }

  refreshUserCart(): void {
    const user = this.authService.currentUser();
    if (user && user.userType === 'Buyer' && user.profileId) {
      this.cartService.getBuyerCart(user.profileId).subscribe();
      this.loadBuyerPurchases();
    } else {
      this.cartService.clearCart();
      this.purchasedProperties.set([]);
    }
  }

  loadBuyerPurchases(): void {
    const user = this.authService.currentUser();
    if (user && user.userType === 'Buyer' && user.profileId) {
      this.propertyService.getBuyerPurchases(user.profileId).subscribe({
        next: res => {
          if (res.success && res.data) {
            this.purchasedProperties.set(res.data);
          }
        }
      });
    } else {
      this.purchasedProperties.set([]);
    }
  }

  openBuyerCart(tab: 'cart' | 'purchases' = 'cart'): void {
    this.cartInitialTab.set(tab);
    this.loadBuyerPurchases();
    this.isCartOpen.set(true);
  }

  handleBuyProperty(propertyId: number): void {
    const user = this.authService.currentUser();
    if (!user) {
      this.isAuthOpen.set(true);
      this.showToast('Please login as a Buyer to purchase or rent properties', 'info');
      return;
    }
    if (user.userType === 'Seller') {
      this.showToast('Sellers are not permitted to buy or rent properties. Please login with a Buyer account.', 'error');
      return;
    }
    if (user.userType !== 'Buyer' || !user.profileId) {
      this.showToast('Only registered Buyers can buy or rent properties', 'error');
      return;
    }

    const prop = this.properties().find(p => p.propertyId === propertyId)
              || this.allVerifiedProperties().find(p => p.propertyId === propertyId);
    const isRent = prop?.propertyOption === 'Rent';
    const actionLabel = isRent ? 'rented' : 'purchased';

    const buyerId = user.profileId;
    this.propertyService.buyProperty(propertyId, buyerId).subscribe({
      next: res => {
        if (res.success) {
          this.showToast(`🎉 Property ${actionLabel} successfully! Added to your purchases.`, 'success');
          const inCart = this.cartService.cartItems().find(i => i.propertyId === propertyId);
          if (inCart) {
            this.cartService.removeFromCart(inCart.cartId, buyerId, inCart.propertyId).subscribe({
              error: () => {}
            });
          }
          this.loadProperties();
          this.loadAllVerifiedMaster();
          this.loadBuyerPurchases();
          this.isDetailOpen.set(false);
        } else {
          this.showToast(res.message || 'Transaction failed', 'error');
        }
      },
      error: err => {
        this.showToast(err.error?.message || 'Could not complete transaction.', 'error');
      }
    });
  }

  handleBuyCartItem(item: EnrichedCartItem): void {
    this.handleBuyProperty(item.propertyId);
  }

  // Called when user clicks "SEARCH PROPERTIES" or toggles BUY/RENT
  onSearchTriggered(params: PropertyFilterCriteria): void {
    this.activeFilter.update(curr => ({
      ...curr,
      ...params
    }));
    this.loadProperties();
  }

  // Updates sort selection (e.g., price_asc, price_desc) and refreshes property list
  onSortChange(sortBy: string): void {
    this.activeFilter.update(curr => ({
      ...curr,
      sortBy: sortBy || undefined
    }));
    this.loadProperties();
  }

  // Removes city filter when user clicks "View All Cities"
  onClearCity(): void {
    this.activeFilter.update(curr => ({
      ...curr,
      cityId: null
    }));
    this.loadProperties();
  }

  // Resets filters back to default (Purpose: Sell, City: All, Type: All, Sort: Default)
  onResetFilters(): void {
    this.activeFilter.set({
      propertyOption: 'Sell',
      cityId: null,
      propertyType: '',
      sortBy: undefined
    });
    this.loadProperties();
  }

  // Called when user clicks the logo: goes to role dashboard if logged in, or landing if guest
  onHomeReset(): void {
    this.activeFilter.set({ propertyOption: 'Sell' });
    this.loadProperties();
    if (this.authService.isLoggedIn()) {
      this.syncRoleView();
    } else {
      this.currentView.set('landing');
    }
  }

  onAuthSuccess(session: UserSession): void {
    this.refreshUserCart();
    if (session.userType === 'Admin') {
      this.currentView.set('admin-dashboard');
    } else if (session.userType === 'Seller') {
      this.currentView.set('seller-dashboard');
    } else {
      this.currentView.set('marketplace');
    }
    this.showToast(`Welcome, ${session.fullName}! (${session.userType})`, 'success');
  }

  setView(view: 'landing' | 'marketplace' | 'admin-dashboard' | 'seller-dashboard'): void {
    if (view === 'landing' && this.authService.isLoggedIn()) {
      this.syncRoleView();
      return;
    }
    if (view === 'admin-dashboard' && this.authService.userRole() !== 'Admin') {
      this.showToast('Access denied: Admin credentials required', 'error');
      this.syncRoleView();
      return;
    }
    if (view === 'seller-dashboard' && this.authService.userRole() !== 'Seller') {
      this.showToast('Access denied: Seller credentials required', 'error');
      this.syncRoleView();
      return;
    }
    if (view === 'seller-dashboard') {
      this.sellerPortalTab.set('listings');
    }
    this.currentView.set(view);
  }

  onLandingSearch(criteria: PropertyFilterCriteria): void {
    this.activeFilter.update(curr => ({
      ...curr,
      ...criteria
    }));
    this.loadProperties();
    this.currentView.set('marketplace');
  }

  onLandingBrowseAll(): void {
    this.currentView.set('marketplace');
  }

  handleOpenPostProperty(): void {
    const role = this.authService.userRole();
    if (role !== 'Seller') {
      this.showToast('Please login as a Seller to post properties', 'info');
      this.isAuthOpen.set(true);
      return;
    }
    this.sellerPortalTab.set('post');
    this.currentView.set('seller-dashboard');
  }

  openPropertyDetails(property: Property): void {
    this.selectedDetailProperty.set(property);
    this.isDetailOpen.set(true);
  }

  // Handles adding/removing properties from the 2-property comparison tray
  handleToggleCompare(property: Property): void {
    const current = this.comparedProperties();
    const exists = current.some(p => p.propertyId === property.propertyId);
    if (exists) {
      this.comparedProperties.set(current.filter(p => p.propertyId !== property.propertyId));
      this.showToast(`Removed "${property.propertyName}" from comparison`, 'info');
    } else {
      if (current.length >= 2) {
        this.showToast('You can compare up to 2 properties at a time. Remove one to add another.', 'info');
        return;
      }
      this.comparedProperties.set([...current, property]);
      const count = current.length + 1;
      this.showToast(
        count === 2
          ? '2 properties selected! Click "Compare Now" in the bottom bar to compare side-by-side.'
          : '1 property added to comparison. Select 1 more property to compare.',
        'success'
      );
    }
  }

  handleRemoveCompare(propertyId: number): void {
    this.comparedProperties.update(list => list.filter(p => p.propertyId !== propertyId));
    if (this.comparedProperties().length === 0) {
      this.isCompareOpen.set(false);
    }
  }

  handleClearCompare(): void {
    this.comparedProperties.set([]);
    this.isCompareOpen.set(false);
    this.showToast('Comparison cleared', 'info');
  }

  handleOpenCompareModal(): void {
    if (this.comparedProperties().length === 0) {
      this.showToast('Select at least 1 property to compare', 'info');
      return;
    }
    this.isCompareOpen.set(true);
  }

  openOwnerContact(sellerId: number): void {
    this.isContactOpen.set(true);
    this.isLoadingContact.set(true);
    this.selectedContact.set(null);

    this.propertyService.getSellerContact(sellerId).subscribe({
      next: res => {
        this.isLoadingContact.set(false);
        if (res.success && res.data) {
          this.selectedContact.set(res.data);
        } else {
          this.selectedContact.set({
            sellerId: sellerId,
            fullName: 'Verified Property Owner',
            emailId: `seller.${sellerId}@easyhousing.com`,
            phoneNo: '+91 98765 43210'
          });
        }
      },
      error: () => {
        this.isLoadingContact.set(false);
        this.selectedContact.set({
          sellerId: sellerId,
          fullName: 'Verified Property Owner',
          emailId: `seller.${sellerId}@easyhousing.com`,
          phoneNo: '+91 98765 43210'
        });
      }
    });
  }

  onToggleCart(propertyId: number): void {
    const user = this.authService.currentUser();
    if (!user) {
      this.isAuthOpen.set(true);
      this.showToast('Please login to bookmark properties', 'info');
      return;
    }
    if (user.userType !== 'Buyer' || !user.profileId) {
      this.showToast('Only registered Buyers can add properties to cart', 'info');
      return;
    }

    const prop = this.properties().find(p => p.propertyId === propertyId);
    const existing = this.cartService.cartItems().find(i => i.propertyId === propertyId);
    if (existing) {
      this.cartService.removeFromCart(existing.cartId, user.profileId).subscribe({
        next: () => {
          this.showToast('Property removed from your cart', 'info');
        },
        error: err => {
          this.showToast(extractErrorMessage(err, 'Failed to remove property from cart.'), 'error');
        }
      });
    } else {
      this.cartService.addToCart(user.profileId, propertyId, prop).subscribe({
        next: () => {
          this.showToast('Added property to your saved list', 'success');
        },
        error: err => {
          this.showToast(extractErrorMessage(err, 'Failed to add property to cart.'), 'error');
        }
      });
    }
  }

  onRemoveCartItem(cartId: number): void {
    const user = this.authService.currentUser();
    if (user && user.profileId) {
      const item = this.cartService.cartItems().find(i => i.cartId === cartId);
      const propId = item?.propertyId || cartId;
      this.cartService.removeFromCart(cartId, user.profileId, propId).subscribe({
        next: () => {
          this.showToast('Property removed from cart', 'info');
        },
        error: err => {
          this.showToast(extractErrorMessage(err, 'Failed to remove property from cart.'), 'error');
        }
      });
    }
  }

  showToast(msg: string, type: 'success' | 'error' | 'info' = 'success'): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastMessage.set(msg);
    this.toastType.set(type);

    this.toastTimer = setTimeout(() => {
      this.toastMessage.set(null);
    }, 3500);
  }
}
