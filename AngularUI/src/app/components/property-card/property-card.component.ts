// ============================================================================
// Document: property-card.component.ts
// Project:  Easy Housing Solutions (EHS)
// Module:   Property Card UI
// Purpose:  Beginner-friendly card showing a single property listing.
// Description:
//   Renders property details (name, price, photo, city, type, address).
//   Provides buttons for Buyer actions:
//   - "Contact Owner" (Req 11: Get Contact Details)
//   - "Save to Cart" (Req 12, 14: Add/Remove from Cart)
// ============================================================================

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Property } from '../../models/models';

@Component({
  selector: 'app-property-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './property-card.component.html',
  styleUrl: './property-card.component.css'
})
export class PropertyCardComponent {
  // Input: Property data to render
  @Input({ required: true }) property!: Property;
  // Input: Whether current user is logged in as a Buyer
  @Input() isBuyer: boolean = false;
  // Input: Whether this property is currently in the Buyer's cart
  @Input() isInCart: boolean = false;

  // Outputs: Events emitted back to the parent dashboard
  @Output() getContact = new EventEmitter<number>();
  @Output() toggleCart = new EventEmitter<number>();
  @Output() viewDetails = new EventEmitter<Property>();
  @Output() buy = new EventEmitter<number>();

  // Format price into Indian Rupees format (e.g. ₹50 Lakh, ₹1.2 Cr)
  formatPrice(price: number): string {
    if (!price || price <= 0) return '₹0';
    if (price >= 10000000) {
      const cr = price / 10000000;
      return `₹${cr.toFixed(2).replace(/\.00$/, '')} Cr`;
    }
    if (price >= 100000) {
      const lk = price / 100000;
      return `₹${lk.toFixed(1).replace(/\.0$/, '')} Lakh`;
    }
    return `₹${price.toLocaleString('en-IN')}`;
  }

  // Called when buyer clicks "Contact Owner"
  onContactClick(): void {
    this.getContact.emit(this.property.sellerId);
  }

  // Called when buyer clicks "Save to Cart"
  onCartClick(): void {
    this.toggleCart.emit(this.property.propertyId);
  }

  // Called when buyer clicks card to view details
  onViewDetails(): void {
    this.viewDetails.emit(this.property);
  }

  // Called when buyer clicks "Buy / Rent Now"
  onBuyClick(): void {
    this.buy.emit(this.property.propertyId);
  }
}
