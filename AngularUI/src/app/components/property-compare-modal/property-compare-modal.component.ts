import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Property, City } from '../../models/models';

@Component({
  selector: 'app-property-compare-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './property-compare-modal.component.html',
  styleUrl: './property-compare-modal.component.css'
})
export class PropertyCompareModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly properties = input<Property[]>([]);
  readonly cities = input<City[]>([]);
  readonly isBuyer = input<boolean>(false);
  readonly isSeller = input<boolean>(false);

  readonly close = output<void>();
  readonly removeProperty = output<number>();
  readonly viewDetails = output<Property>();
  readonly contactOwner = output<number>();
  readonly buyProperty = output<number>();

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

  getCityName(cityId: number): string {
    const found = this.cities().find(c => c.cityId === cityId);
    return found ? found.cityName : 'Unknown City';
  }

  getCheaperIndex(): number {
    const list = this.properties();
    if (list.length < 2) return -1;
    if (list[0].priceRange < list[1].priceRange) return 0;
    if (list[1].priceRange < list[0].priceRange) return 1;
    return -1; // equal
  }

  getPriceDifference(): string {
    const list = this.properties();
    if (list.length < 2) return '';
    const diff = Math.abs(list[0].priceRange - list[1].priceRange);
    if (diff === 0) return 'Both properties have identical pricing';
    return `${this.formatPrice(diff)} difference`;
  }
}
