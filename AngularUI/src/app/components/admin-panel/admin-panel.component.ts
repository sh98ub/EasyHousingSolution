// ============================================================================
// Document: admin-panel.component.ts
// Project:  Easy Housing Solutions (EHS)
// Module:   Administrator Dashboard
// Purpose:  Dedicated dashboard for system administrators.
// Description:
//   Fulfills Capgemini Administrator Requirements:
//   - Req 7: View properties by Region (State and City filter)
//   - Req 8: View properties by Owner (Seller ID search)
//   - Req 9: Verify properties, or Deactivate with a mandatory reason
//   - View registered users (Buyers & Sellers)
// ============================================================================

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PropertyService } from '../../services/property.service';
import { UserService } from '../../services/user.service';
import { Property, City, State, UserSummary } from '../../models/models';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-panel.component.html',
  styleUrl: './admin-panel.component.css'
})
export class AdminPanelComponent implements OnInit {
  // Navigation tab inside Admin dashboard: 'properties' or 'users'
  activeTab: 'properties' | 'users' = 'properties';

  // Master lists
  states: State[] = [];
  cities: City[] = [];
  filteredCities: City[] = [];
  allProperties: Property[] = [];
  allUsers: UserSummary[] = [];

  // Loading & Alert state
  loading: boolean = false;
  alertMessage: string | null = null;
  alertType: 'success' | 'error' = 'success';

  // Req 7: Region Filters (State & City)
  selectedStateId: number | null = null;
  selectedCityId: number | null = null;

  // Req 8: Owner Filter (Seller ID)
  searchSellerId: number | null = null;

  // Status Filter: 'all', 'pending', 'verified', 'deactivated'
  statusFilter: string = 'all';

  // Req 9: Deactivate with Reason Modal State
  deactivatingPropertyId: number | null = null;
  deactivateReason: string = '';
  showDeactivateModal: boolean = false;

  constructor(
    private propertyService: PropertyService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadStatesAndCities();
    this.loadAllProperties();
    this.loadAllUsers();
  }

  // Load States and Cities for Region filters (Req 7)
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

  // Filter city options when state changes
  onStateChange(): void {
    if (!this.selectedStateId) {
      this.filteredCities = this.cities;
    } else {
      this.filteredCities = this.cities.filter(c => c.stateId === Number(this.selectedStateId));
    }
    this.selectedCityId = null;
  }

  // Load all properties for admin review
  loadAllProperties(): void {
    this.loading = true;
    this.propertyService.getAllPropertiesAdmin().subscribe({
      next: res => {
        this.loading = false;
        if (res.success && res.data) {
          this.allProperties = res.data;
        }
      },
      error: () => {
        this.loading = false;
        this.showAlert('Could not load properties.', 'error');
      }
    });
  }

  // Load all registered users
  loadAllUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: res => {
        if (res.success && res.data) {
          this.allUsers = res.data;
        }
      }
    });
  }

  // Filtered properties based on Region (Req 7), Owner (Req 8), and Status
  get filteredProperties(): Property[] {
    return this.allProperties.filter(p => {
      // Req 7: Region filter (City)
      if (this.selectedCityId && p.cityId !== Number(this.selectedCityId)) {
        return false;
      }
      // Req 8: Owner filter (Seller ID)
      if (this.searchSellerId && p.sellerId !== Number(this.searchSellerId)) {
        return false;
      }
      // Status filter
      if (this.statusFilter === 'verified' && !p.isActive) return false;
      if (this.statusFilter === 'deactivated' && p.isActive) return false;
      return true;
    });
  }

  // Reset all admin filters
  resetFilters(): void {
    this.selectedStateId = null;
    this.selectedCityId = null;
    this.searchSellerId = null;
    this.statusFilter = 'all';
    this.filteredCities = this.cities;
  }

  // Req 9: Verify / Approve Property
  verifyProperty(propertyId: number): void {
    this.propertyService.verifyProperty(propertyId).subscribe({
      next: res => {
        this.showAlert('Property has been successfully verified & published!', 'success');
        this.loadAllProperties();
      },
      error: err => {
        this.showAlert(err.error?.message || 'Failed to verify property.', 'error');
      }
    });
  }

  // Req 9: Open Deactivation Modal with Mandatory Reason
  openDeactivateModal(propertyId: number): void {
    this.deactivatingPropertyId = propertyId;
    this.deactivateReason = '';
    this.showDeactivateModal = true;
  }

  // Req 9: Confirm Deactivation with Reason
  confirmDeactivate(): void {
    if (!this.deactivateReason) {
      alert('Mandatory Rule: You must provide a valid reason to deactivate a property listing.');
      return;
    }
    if (!this.deactivatingPropertyId) return;

    this.propertyService.deactivateProperty(this.deactivatingPropertyId, this.deactivateReason).subscribe({
      next: res => {
        this.showAlert('Property listing has been deactivated with reason recorded.', 'success');
        this.showDeactivateModal = false;
        this.deactivatingPropertyId = null;
        this.deactivateReason = '';
        this.loadAllProperties();
      },
      error: err => {
        this.showAlert(err.error?.message || 'Failed to deactivate property.', 'error');
      }
    });
  }

  // Close Deactivation modal
  closeDeactivateModal(): void {
    this.showDeactivateModal = false;
    this.deactivatingPropertyId = null;
    this.deactivateReason = '';
  }

  // Helper to get city name by cityId
  getCityName(cityId: number): string {
    const found = this.cities.find(c => c.cityId === cityId);
    return found ? found.cityName : `City #${cityId}`;
  }

  // Show temporary alert message
  showAlert(msg: string, type: 'success' | 'error'): void {
    this.alertMessage = msg;
    this.alertType = type;
    setTimeout(() => { this.alertMessage = null; }, 4000);
  }
}
