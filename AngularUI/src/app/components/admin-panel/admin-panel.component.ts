import { Component, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PropertyService } from '../../services/property.service';
import { UserService } from '../../services/user.service';
import { CartService } from '../../services/cart.service';
import { Property, City, UserSummary, EnrichedCartItem } from '../../models/models';
import { extractErrorMessage } from '../../utils/error.utils';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-panel.component.html',
  styleUrl: './admin-panel.component.css'
})
export class AdminPanelComponent {
  readonly isOpen = input<boolean>(true);
  readonly isDashboard = input<boolean>(false);
  readonly cities = input<City[]>([]);

  readonly close = output<void>();
  readonly propertyStatusChanged = output<void>();
  readonly switchView = output<void>();

  activeTab: 'properties' | 'users' | 'sales' = 'properties';
  propFilter: 'all' | 'pending' | 'verified' | 'sold' = 'all';

  allProperties = signal<Property[]>([]);
  allUsers = signal<UserSummary[]>([]);
  salesReport = signal<any | null>(null);

  alertMessage = signal<string | null>(null);
  alertType = signal<'success' | 'error'>('success');

  deactivatingPropertyId: number | null = null;
  deactivateReason: string = '';

  inspectingBuyer = signal<UserSummary | null>(null);
  inspectedCart = signal<EnrichedCartItem[]>([]);

  constructor(
    private propertyService: PropertyService,
    private userService: UserService,
    private cartService: CartService
  ) {
    effect(() => {
      if (this.isOpen()) {
        this.loadProperties();
      }
    });
  }

  inspectBuyerCart(buyer: UserSummary): void {
    this.inspectingBuyer.set(buyer);
    this.inspectedCart.set([]);
    this.cartService.getBuyerCart(buyer.profileId).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.inspectedCart.set(res.data);
        } else {
          this.inspectedCart.set([]);
        }
      },
      error: () => this.inspectedCart.set([])
    });
  }

  closeCartInspection(): void {
    this.inspectingBuyer.set(null);
    this.inspectedCart.set([]);
  }

  deactivateUser(user: UserSummary): void {
    const userId = user.profileId || 1;
    this.userService.deactivateUser(userId, 'Deactivated by administrator').subscribe({
      next: () => {
        user.isActive = false;
        this.alertMessage.set(`User #${userId} deactivated successfully.`);
        this.alertType.set('success');
      },
      error: err => {
        this.alertMessage.set(extractErrorMessage(err, 'Could not deactivate user.'));
        this.alertType.set('error');
      }
    });
  }

  deleteUser(user: UserSummary): void {
    if (!confirm(`Are you sure you want to permanently delete user ${user.fullName || user.userName}?`)) {
      return;
    }
    const userId = user.profileId || 1;
    this.userService.deleteUser(userId).subscribe({
      next: () => {
        this.allUsers.set(this.allUsers().filter(u => u !== user));
        this.alertMessage.set(`User #${userId} deleted successfully.`);
        this.alertType.set('success');
      },
      error: err => {
        this.alertMessage.set(extractErrorMessage(err, 'Could not delete user.'));
        this.alertType.set('error');
      }
    });
  }

  get filteredProperties(): Property[] {
    if (this.propFilter === 'verified') {
      return this.allProperties().filter(p => p.isActive);
    }
    if (this.propFilter === 'sold') {
      return this.allProperties().filter(p => !p.isActive && p.deactivationReason?.startsWith('Sold'));
    }
    if (this.propFilter === 'pending') {
      return this.allProperties().filter(p => !p.isActive && !p.deactivationReason?.startsWith('Sold'));
    }
    return this.allProperties();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }

  switchToUsers(): void {
    this.activeTab = 'users';
    this.loadUsers();
  }

  switchToSales(): void {
    this.activeTab = 'sales';
    this.loadSalesReport();
  }

  loadSalesReport(): void {
    this.propertyService.getAdminSalesReport().subscribe({
      next: res => {
        if (res.success && res.data) {
          this.salesReport.set(res.data);
        }
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

  loadProperties(): void {
    this.propertyService.getAllPropertiesAdmin().subscribe({
      next: res => {
        if (res.success && res.data) {
          this.allProperties.set(res.data);
        }
      }
    });
  }

  loadUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: res => {
        if (res.success && res.data) {
          this.allUsers.set(res.data);
        }
      }
    });
  }

  handleVerify(propertyId: number): void {
    this.propertyService.verifyProperty(propertyId).subscribe({
      next: res => {
        if (res.success) {
          this.showAlert(`Property #${propertyId} successfully verified & published!`, 'success');
          this.loadProperties();
          this.propertyStatusChanged.emit();
        } else {
          this.showAlert(res.message || 'Verification failed.', 'error');
        }
      },
      error: err => {
        this.showAlert(extractErrorMessage(err, 'Verification failed.'), 'error');
      }
    });
  }

  openDeactivatePrompt(propertyId: number): void {
    this.deactivatingPropertyId = propertyId;
    this.deactivateReason = '';
  }

  confirmDeactivate(): void {
    if (!this.deactivatingPropertyId || !this.deactivateReason.trim()) return;

    const pid = this.deactivatingPropertyId;
    this.propertyService.deactivateProperty(pid, this.deactivateReason.trim()).subscribe({
      next: res => {
        this.deactivatingPropertyId = null;
        if (res.success) {
          this.showAlert(`Property #${pid} has been deactivated.`, 'success');
          this.loadProperties();
          this.propertyStatusChanged.emit();
        } else {
          this.showAlert(res.message || 'Failed to deactivate property.', 'error');
        }
      },
      error: err => {
        this.deactivatingPropertyId = null;
        this.showAlert(extractErrorMessage(err, 'Failed to deactivate property.'), 'error');
      }
    });
  }

  private showAlert(msg: string, type: 'success' | 'error'): void {
    this.alertMessage.set(msg);
    this.alertType.set(type);
    setTimeout(() => {
      this.alertMessage.set(null);
    }, 4000);
  }
}
