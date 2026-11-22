import { Component, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnrichedCartItem, Property } from '../../models/models';

@Component({
  selector: 'app-cart-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart-modal.component.html',
  styleUrl: './cart-modal.component.css'
})
export class CartModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly items = input<EnrichedCartItem[]>([]);
  readonly purchasedProperties = input<Property[]>([]);
  readonly initialTab = input<'cart' | 'purchases'>('cart');

  readonly activeTab = signal<'cart' | 'purchases'>('cart');

  readonly close = output<void>();
  readonly removeItem = output<number>();
  readonly contactOwner = output<number>();
  readonly buyItem = output<EnrichedCartItem>();

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.activeTab.set(this.initialTab());
      }
    });
  }

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

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }
}
