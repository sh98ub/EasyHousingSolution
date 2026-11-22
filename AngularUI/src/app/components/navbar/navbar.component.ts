import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  readonly currentView = input<'landing' | 'marketplace' | 'admin-dashboard' | 'seller-dashboard'>('landing');

  openAuth = output<void>();
  openCart = output<void>();
  openPurchases = output<void>();
  openPostProperty = output<void>();
  openSellerDashboard = output<void>();
  openAdminPanel = output<void>();
  viewMarketplace = output<void>();
  viewAdminDashboard = output<void>();
  viewSellerDashboard = output<void>();
  resetHome = output<void>();

  constructor(
    public authService: AuthService,
    public cartService: CartService
  ) {}

  logout(): void {
    this.authService.logout();
    this.cartService.clearCart();
    this.resetHome.emit();
  }

  // Handles brand logo and home button clicks
  onHomeClick(): void {
    if (this.authService.isLoggedIn()) {
      // If logged in, navigate to the user's role-specific dashboard
      const role = this.authService.userRole();
      if (role === 'Admin') {
        this.viewAdminDashboard.emit();
      } else if (role === 'Seller') {
        this.viewSellerDashboard.emit();
      } else {
        this.viewMarketplace.emit();
      }
    } else {
      // If guest (not logged in), return to landing login page
      this.resetHome.emit();
    }
  }
}
