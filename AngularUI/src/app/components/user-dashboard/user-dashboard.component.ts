// ============================================================================
// Document: user-dashboard.component.ts
// Project:  Easy Housing Solutions (EHS)
// Module:   User / Buyer Dashboard
// Purpose:  Dedicated dashboard for Buyers / Consumers.
// Description:
//   Fulfills Capgemini Buyer Requirements:
//   - Req 10: Search and sort properties by price
//   - Req 11: View details and "Get Contact Details" of property seller
//   - Req 12: Add property to cart
//   - Req 13: View cart
//   - Req 14: Delete property from cart
// ============================================================================

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PropertyService } from '../../services/property.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { Property, City, State, EnrichedCartItem, SellerContact } from '../../models/models';
import { PropertyCardComponent } from '../property-card/property-card.component';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, PropertyCardComponent],
  templateUrl: './user-dashboard.component.html',
  styleUrl: './user-dashboard.component.css'
})
export class UserDashboardComponent implements OnInit {
  // Active navigation tab inside Buyer dashboard: 'browse', 'cart', or 'purchases'
  activeTab: 'browse' | 'cart' | 'purchases' = 'browse';

  // Master lists
  states: State[] = [];
  cities: City[] = [];
  filteredCities: City[] = [];
  properties: Property[] = [];
  cartItems: EnrichedCartItem[] = [];
  purchasedProperties: Property[] = [];

  // Loading & Alert state
  loading: boolean = false;
  alertMessage: string | null = null;
  alertType: 'success' | 'error' = 'success';

  // Search & Filter Fields (Req 10)
  selectedStateId: number | null = null;
  selectedCityId: number | null = null;
  selectedType: string = '';
  selectedOption: string = ''; // Sell or Rent or empty
  selectedSort: string = 'name'; // 'name', 'price_asc', 'price_desc'

  // Contact Modal State (Req 11)
  selectedContact: SellerContact | null = null;
  showContactModal: boolean = false;

  // Property Detail Modal State
  selectedDetailProperty: Property | null = null;
  showDetailModal: boolean = false;

  constructor(
    public authService: AuthService,
    private propertyService: PropertyService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.loadStatesAndCities();
    this.loadProperties();
    this.loadCart();
  }

  // Helper to get logged-in buyer ID
  get buyerId(): number {
    return this.authService.currentUser()?.profileId || 0;
  }

  // Helper to get logged-in buyer name
  get buyerName(): string {
    return this.authService.currentUser()?.fullName || 'Buyer';
  }

  // Load States and Cities for dropdowns
  loadStatesAndCities(): void {
    this.propertyService.getStates().subscribe({
      next: res => { if (res.success) this.states = res.data; }
    });
    this.propertyService.getCities().subscribe({
      next: res => {
        if (res.success) {
          this.cities = res.data;
          this.filteredCities = res.data;
        }
      }
    });
  }

  // Filter city dropdown when user selects a State
  onStateChange(): void {
    if (!this.selectedStateId) {
      this.filteredCities = this.cities;
    } else {
      this.filteredCities = this.cities.filter(c => c.stateId === Number(this.selectedStateId));
    }
    this.selectedCityId = null;
  }

  // Load all verified, active properties (Req 10)
  loadProperties(): void {
    this.loading = true;
    this.propertyService.getVerifiedProperties().subscribe({
      next: res => {
        this.loading = false;
        if (res.success) {
          this.properties = res.data || [];
          this.applySorting();
        }
      },
      error: err => {
        this.loading = false;
        this.showAlert('Could not load properties from server.', 'error');
      }
    });
  }

  // Execute Search with Filters & Sort (Req 10)
  onSearch(): void {
    this.loading = true;
    this.propertyService.searchProperties(
      this.selectedCityId || undefined,
      this.selectedType || undefined,
      this.selectedOption || undefined,
      this.selectedSort || undefined,
      this.selectedStateId || undefined
    ).subscribe({
      next: res => {
        this.loading = false;
        if (res.success) {
          this.properties = res.data || [];
          this.applySorting();
        }
      },
      error: err => {
        this.loading = false;
        this.showAlert('Search failed. Please try again.', 'error');
      }
    });
  }

  // Reset all filters and reload default verified listings
  onResetSearch(): void {
    this.selectedStateId = null;
    this.selectedCityId = null;
    this.selectedType = '';
    this.selectedOption = '';
    this.selectedSort = 'name';
    this.filteredCities = this.cities;
    this.loadProperties();
  }

  // Sort properties locally by price or name
  applySorting(): void {
    if (this.selectedSort === 'price_asc') {
      this.properties.sort((a, b) => (a.priceRange || 0) - (b.priceRange || 0));
    } else if (this.selectedSort === 'price_desc') {
      this.properties.sort((a, b) => (b.priceRange || 0) - (a.priceRange || 0));
    } else {
      this.properties.sort((a, b) => (a.propertyName || '').localeCompare(b.propertyName || ''));
    }
  }

  // Check if a property is already in the buyer's bookmark cart
  isPropertyInCart(propertyId: number): boolean {
    return this.cartItems.some(item => item.propertyId === propertyId);
  }

  // Load buyer's bookmark cart (Req 13)
  loadCart(): void {
    if (!this.buyerId) return;
    this.cartService.getBuyerCart(this.buyerId).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.cartItems = res.data;
        }
      }
    });
  }

  // Toggle Cart: Add or Remove (Req 12, 14)
  onToggleCart(propertyId: number): void {
    const existing = this.cartItems.find(i => i.propertyId === propertyId);
    if (existing) {
      this.onRemoveFromCart(propertyId);
    } else {
      this.cartService.addToCart(this.buyerId, propertyId).subscribe({
        next: res => {
          this.showAlert('Property added to your wishlist cart!', 'success');
          this.loadCart();
        },
        error: err => this.showAlert('Could not add to cart.', 'error')
      });
    }
  }

  // Remove single property from cart (Req 14)
  onRemoveFromCart(propertyId: number): void {
    const item = this.cartItems.find(i => i.propertyId === propertyId);
    const cartId = item ? item.cartId : 0;
    this.cartService.removeFromCart(cartId, this.buyerId, propertyId).subscribe({
      next: () => {
        this.showAlert('Property removed from cart.', 'success');
        this.loadCart();
      },
      error: () => this.showAlert('Could not remove from cart.', 'error')
    });
  }

  // Clear all items from cart (Req 14)
  onClearCart(): void {
    if (!confirm('Are you sure you want to clear your entire cart?')) return;
    // Remove each item
    for (const item of this.cartItems) {
      this.cartService.removeFromCart(item.cartId, this.buyerId, item.propertyId).subscribe();
    }
    this.cartItems = [];
    this.showAlert('Cart cleared successfully.', 'success');
  }

  // Get Contact Details of Seller (Req 11)
  onContactOwner(sellerId: number): void {
    this.propertyService.getSellerContact(sellerId).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.selectedContact = res.data;
          this.showContactModal = true;
        } else {
          this.showAlert('Could not retrieve owner contact details.', 'error');
        }
      },
      error: () => this.showAlert('Failed to fetch contact details.', 'error')
    });
  }

  // View full property details modal
  onViewDetails(property: Property): void {
    this.selectedDetailProperty = property;
    this.showDetailModal = true;
  }

  // Buy or Rent a property
  onBuyProperty(propertyId: number): void {
    const prop = this.properties.find(p => p.propertyId === propertyId);
    const actionLabel = prop?.propertyOption === 'Rent' ? 'rent' : 'purchase';
    if (!confirm(`Are you sure you want to ${actionLabel} "${prop?.propertyName}"?`)) return;

    this.propertyService.buyProperty(propertyId, this.buyerId).subscribe({
      next: res => {
        this.showAlert(`Congratulations! You have successfully ${actionLabel}ed this property!`, 'success');
        this.loadProperties();
        this.loadPurchases();
      },
      error: err => {
        this.showAlert(err.error?.message || `Could not complete ${actionLabel}.`, 'error');
      }
    });
  }

  // Load purchase history
  loadPurchases(): void {
    this.propertyService.getMyPurchases().subscribe({
      next: res => {
        if (res.success && res.data) {
          this.purchasedProperties = res.data;
        }
      }
    });
  }

  // Show a temporary alert message
  showAlert(msg: string, type: 'success' | 'error'): void {
    this.alertMessage = msg;
    this.alertType = type;
    setTimeout(() => { this.alertMessage = null; }, 4000);
  }

  // Close modals
  closeContactModal(): void { this.showContactModal = false; }
  closeDetailModal(): void { this.showDetailModal = false; }
}
