import { Component, input, output } from '@angular/core';
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
  readonly property = input.required<Property>();
  readonly isBuyer = input<boolean>(false);
  readonly isInCart = input<boolean>(false);
  readonly isCompared = input<boolean>(false);

  readonly getContact = output<number>();
  readonly toggleCart = output<number>();
  readonly viewDetails = output<Property>();
  readonly toggleCompare = output<Property>();

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

  onContactClick(): void {
    this.getContact.emit(this.property().sellerId);
  }

  onCartClick(): void {
    this.toggleCart.emit(this.property().propertyId);
  }

  onCompareClick(event: Event): void {
    event.stopPropagation();
    this.toggleCompare.emit(this.property());
  }

  onViewDetails(): void {
    this.viewDetails.emit(this.property());
  }
}
