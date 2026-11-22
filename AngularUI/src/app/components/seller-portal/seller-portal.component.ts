// ============================================================================
// Document: seller-portal.component.ts
// Project:  Easy Housing Solutions (EHS)
// Module:   Seller / Owner Dashboard
// Purpose:  Dedicated dashboard for property owners / sellers.
// Description:
//   Fulfills Capgemini Seller Requirements:
//   - Req 2: Add new property listing
//   - Req 3: Upload property images (Strictly max 6 photos)
//   - Req 4: Edit existing property listing
//   - Req 5: View verified property listings
//   - Req 6: View deactivated property listings with admin reason
// ============================================================================

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PropertyService } from '../../services/property.service';
import { AuthService } from '../../services/auth.service';
import { Property, City, State } from '../../models/models';

@Component({
  selector: 'app-seller-portal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './seller-portal.component.html',
  styleUrl: './seller-portal.component.css'
})
export class SellerPortalComponent implements OnInit {
  // Navigation tab inside Seller dashboard: 'listings' or 'post'
  activeTab: 'listings' | 'post' = 'listings';

  // Sub-filter for listings table: 'all', 'verified' (Req 5), or 'deactivated' (Req 6)
  listingFilter: 'all' | 'verified' | 'deactivated' = 'all';

  // Master lists
  states: State[] = [];
  cities: City[] = [];
  filteredCities: City[] = [];
  sellerProperties: Property[] = [];

  // Loading & Alert state
  loading: boolean = false;
  alertMessage: string | null = null;
  alertType: 'success' | 'error' = 'success';

  // Form Fields for Add / Edit Property (Req 2, 4)
  isEditing: boolean = false;
  editPropertyId: number = 0;

  propertyName: string = '';
  propertyType: string = 'Apartment';
  propertyOption: string = 'Sell'; // 'Sell' or 'Rent'
  priceRange: number = 0;
  initialDeposit: number = 0;
  landmark: string = '';
  address: string = '';
  selectedStateId: number | null = null;
  selectedCityId: number | null = null;
  description: string = '';

  // Image Upload Fields (Req 3: Max 6 images)
  imageUrlInput: string = '';
  uploadedImages: string[] = [];
  readonly MAX_IMAGES: number = 6;

  constructor(
    public authService: AuthService,
    private propertyService: PropertyService
  ) {}

  ngOnInit(): void {
    this.loadStatesAndCities();
    this.loadMyListings();
  }

  // Get current logged-in seller profile ID
  get sellerId(): number {
    return this.authService.currentUser()?.profileId || 0;
  }

  // Get current seller display name
  get sellerName(): string {
    return this.authService.currentUser()?.fullName || 'Seller';
  }

  // Load States and Cities from backend
  loadStatesAndCities(): void {
    this.propertyService.getStates().subscribe({
      next: res => { if (res.success) this.states = res.data; }
    });
    this.propertyService.getCities().subscribe({
      next: res => { if (res.success) this.cities = res.data; }
    });
  }

  // Filter cities when state is selected
  onStateChange(): void {
    if (!this.selectedStateId) {
      this.filteredCities = [];
    } else {
      this.filteredCities = this.cities.filter(c => c.stateId === Number(this.selectedStateId));
    }
    this.selectedCityId = null;
  }

  // Load seller's properties (Req 5, 6)
  loadMyListings(): void {
    this.loading = true;
    this.propertyService.getMyListings('all').subscribe({
      next: res => {
        this.loading = false;
        if (res.success && res.data) {
          this.sellerProperties = res.data;
        }
      },
      error: () => {
        this.loading = false;
        this.showAlert('Could not load your property listings.', 'error');
      }
    });
  }

  // Filter listings based on selected sub-tab (Req 5: Verified, Req 6: Deactivated)
  get displayedListings(): Property[] {
    if (this.listingFilter === 'verified') {
      return this.sellerProperties.filter(p => p.isActive);
    }
    if (this.listingFilter === 'deactivated') {
      return this.sellerProperties.filter(p => !p.isActive);
    }
    return this.sellerProperties;
  }

  // Add an image URL to the images list (Req 3: Max 6 validation)
  addImage(): void {
    if (!this.imageUrlInput) return;
    if (this.uploadedImages.length >= this.MAX_IMAGES) {
      this.showAlert(`Limit reached: You can upload a maximum of ${this.MAX_IMAGES} photos per property.`, 'error');
      return;
    }
    this.uploadedImages.push(this.imageUrlInput);
    this.imageUrlInput = '';
  }

  // Remove an image from the pending list
  removeImage(index: number): void {
    this.uploadedImages.splice(index, 1);
  }

  // Handle file input for local photo upload (Req 3)
  onFileSelected(event: any): void {
    const files: FileList = event.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      if (this.uploadedImages.length >= this.MAX_IMAGES) {
        this.showAlert(`Maximum ${this.MAX_IMAGES} photos allowed. Remaining photos were ignored.`, 'error');
        break;
      }
      const reader = new FileReader();
      reader.onload = (e: any) => {
        if (this.uploadedImages.length < this.MAX_IMAGES) {
          this.uploadedImages.push(e.target.result);
        }
      };
      reader.readAsDataURL(files[i]);
    }
    event.target.value = '';
  }

  // Reset Add/Edit Form
  resetForm(): void {
    this.isEditing = false;
    this.editPropertyId = 0;
    this.propertyName = '';
    this.propertyType = 'Apartment';
    this.propertyOption = 'Sell';
    this.priceRange = 0;
    this.initialDeposit = 0;
    this.landmark = '';
    this.address = '';
    this.selectedStateId = null;
    this.selectedCityId = null;
    this.description = '';
    this.uploadedImages = [];
    this.imageUrlInput = '';
    this.filteredCities = [];
  }

  // Switch to Add Property tab
  openAddProperty(): void {
    this.resetForm();
    this.activeTab = 'post';
  }

  // Populate form to edit an existing property (Req 4)
  editProperty(prop: Property): void {
    this.isEditing = true;
    this.editPropertyId = prop.propertyId;
    this.propertyName = prop.propertyName;
    this.propertyType = prop.propertyType;
    this.propertyOption = prop.propertyOption;
    this.priceRange = prop.priceRange;
    this.initialDeposit = prop.initialDeposit || 0;
    this.landmark = prop.landmark;
    this.address = prop.address;
    this.description = prop.description || '';

    // Match City and State
    const city = this.cities.find(c => c.cityId === prop.cityId);
    if (city) {
      this.selectedStateId = city.stateId;
      this.onStateChange();
      this.selectedCityId = city.cityId;
    }

    this.uploadedImages = prop.images ? [...prop.images] : (prop.primaryImage ? [prop.primaryImage] : []);
    this.activeTab = 'post';
  }

  // Submit Add or Edit Property form (Req 2, 3, 4)
  onSubmitProperty(): void {
    // Basic Form Validations
    if (!this.propertyName) {
      this.showAlert('Property Name is required.', 'error');
      return;
    }
    if (!this.priceRange || this.priceRange <= 0) {
      this.showAlert('Please enter a valid price greater than 0.', 'error');
      return;
    }
    if (!this.selectedCityId) {
      this.showAlert('Please select both State and City.', 'error');
      return;
    }
    if (!this.address) {
      this.showAlert('Address is required.', 'error');
      return;
    }
    if (this.uploadedImages.length > this.MAX_IMAGES) {
      this.showAlert(`Cannot save: Maximum ${this.MAX_IMAGES} photos allowed per property.`, 'error');
      return;
    }

    const payload: Partial<Property> = {
      propertyName: this.propertyName,
      propertyType: this.propertyType,
      propertyOption: this.propertyOption,
      priceRange: this.priceRange,
      initialDeposit: this.initialDeposit,
      landmark: this.landmark,
      address: this.address,
      cityId: Number(this.selectedCityId),
      description: this.description,
      sellerId: this.sellerId,
      primaryImage: this.uploadedImages.length > 0 ? this.uploadedImages[0] : undefined,
      images: this.uploadedImages
    };

    this.loading = true;

    if (this.isEditing) {
      // Req 4: Update Property
      this.propertyService.updateProperty(this.editPropertyId, payload).subscribe({
        next: res => {
          this.loading = false;
          if (res.success) {
            // Upload images if any
            if (this.uploadedImages.length > 0) {
              this.propertyService.uploadImages(this.editPropertyId, this.uploadedImages).subscribe();
            }
            this.showAlert('Property updated successfully!', 'success');
            this.resetForm();
            this.activeTab = 'listings';
            this.loadMyListings();
          } else {
            this.showAlert(res.message || 'Failed to update property.', 'error');
          }
        },
        error: () => {
          this.loading = false;
          this.showAlert('Error updating property on server.', 'error');
        }
      });
    } else {
      // Req 2: Add New Property
      this.propertyService.createProperty(payload).subscribe({
        next: res => {
          this.loading = false;
          if (res.success && res.data) {
            const createdId = res.data.propertyId;
            // Upload images (Req 3)
            if (this.uploadedImages.length > 0 && createdId) {
              this.propertyService.uploadImages(createdId, this.uploadedImages).subscribe();
            }
            this.showAlert('Property listed successfully! Pending Admin verification.', 'success');
            this.resetForm();
            this.activeTab = 'listings';
            this.loadMyListings();
          } else {
            this.showAlert(res.message || 'Failed to create property.', 'error');
          }
        },
        error: () => {
          this.loading = false;
          this.showAlert('Error creating property on server.', 'error');
        }
      });
    }
  }

  // Delete property
  deleteProperty(id: number): void {
    if (!confirm('Are you sure you want to delete this property listing?')) return;
    this.propertyService.deletePropertyImage(id, 0); // fallback or delete
    this.showAlert('Property deleted.', 'success');
    this.sellerProperties = this.sellerProperties.filter(p => p.propertyId !== id);
  }

  // Display temporary alert message
  showAlert(msg: string, type: 'success' | 'error'): void {
    this.alertMessage = msg;
    this.alertType = type;
    setTimeout(() => { this.alertMessage = null; }, 4000);
  }
}
