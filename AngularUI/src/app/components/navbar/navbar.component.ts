// ============================================================================
// Document: navbar.component.ts
// Project:  Easy Housing Solutions (EHS)
// Module:   Top Navigation Bar
// Purpose:  Beginner-friendly navbar displaying brand logo, user role, and logout.
// ============================================================================

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  @Input() currentView: string = 'landing';
  @Output() logoutEvent = new EventEmitter<void>();
  @Output() navigateDashboard = new EventEmitter<void>();

  constructor(public authService: AuthService) {}

  get user() {
    return this.authService.currentUser();
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  onLogout(): void {
    this.authService.logout();
    this.logoutEvent.emit();
  }

  onLogoClick(): void {
    if (this.isLoggedIn) {
      this.navigateDashboard.emit();
    }
  }
}
