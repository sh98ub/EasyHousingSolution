import { Component, input, output, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { PropertyService } from '../../services/property.service';
import { State, City, Property, PropertyImage } from '../../models/models';
import { extractErrorMessage } from '../../utils/error.utils';

@Component({
  selector: 'app-seller-portal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './seller-portal.component.html',
  styleUrl: './seller-portal.component.css'
})
export class SellerPortalComponent {
  readonly isOpen = input<boolean>(true);
  readonly isDashboard = input<boolean>(false);
  readonly initialTab = input<'post' | 'listings'>('listings');
  readonly sellerId = input<number>(0);
  readonly states = input<State[]>([]);
  readonly cities = input<City[]>([]);

  readonly close = output<void>();
  readonly propertyCreated = output<void>();
  readonly switchView = output<void>();
  readonly viewProperty = output<Property>();

  openPropertyPreview(prop: Property): void {
    this.viewProperty.emit(prop);
  }

  readonly activeTab = signal<'post' | 'listings'>('listings');
  listingFilter: 'all' | 'verified' | 'deactivated' | 'sold' = 'all';

  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  sellerProperties = signal<Property[]>([]);

  readonly activeCount = computed(() => this.sellerProperties().filter(p => p.isActive).length);
  readonly soldCount = computed(() => this.sellerProperties().filter(p => !p.isActive && p.deactivationReason?.startsWith('Sold')).length);
  readonly soldRevenue = computed(() => this.sellerProperties().filter(p => !p.isActive && p.deactivationReason?.startsWith('Sold')).reduce((acc, p) => acc + (p.priceRange || 0), 0));

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

  formSubmitted = signal<boolean>(false);
  editFormSubmitted = signal<boolean>(false);

  // Post form fields
  propertyName = '';
  propertyOption = 'Sell';
  propertyType = 'Apartment';
  selectedStateId: number | null = null;
  selectedCityId: number | null = null;
  priceRange: number = 0;
  initialDeposit: number = 0;
  landmark = '';
  address = '';
  description = '';
  readonly imagePreviews = signal<string[]>([]);
  readonly photoUrlInput = signal<string>('');
  readonly isDragging = signal<boolean>(false);
  readonly isProcessingImages = signal<boolean>(false);

  availableCities: City[] = [];

  // Edit Listing state
  readonly editingProperty = signal<Property | null>(null);
  readonly isEditModalOpen = computed(() => this.editingProperty() !== null);

  editPropertyName = '';
  editPropertyOption = 'Sell';
  editPropertyType = 'Apartment';
  editSelectedStateId: number | null = null;
  editSelectedCityId: number | null = null;
  editPriceRange: number = 0;
  editInitialDeposit: number = 0;
  editLandmark = '';
  editAddress = '';
  editDescription = '';
  editAvailableCities: City[] = [];

  readonly editExistingImages = signal<PropertyImage[]>([]);
  readonly editDeletedImageIds = signal<number[]>([]);
  readonly editNewImagePreviews = signal<string[]>([]);

  readonly editActiveExistingImages = computed(() =>
    this.editExistingImages().filter(img => !this.editDeletedImageIds().includes(img.imageId))
  );

  readonly editTotalPhotos = computed(() =>
    this.editActiveExistingImages().length + this.editNewImagePreviews().length
  );

  readonly editRemainingSlots = computed(() =>
    Math.max(0, 6 - this.editTotalPhotos())
  );

  editLoading = signal<boolean>(false);
  editErrorMessage = signal<string | null>(null);
  editSuccessMessage = signal<string | null>(null);

  constructor(private propertyService: PropertyService) {
    effect(() => {
      this.activeTab.set(this.initialTab());
    });

    effect(() => {
      const allCities = this.cities();
      if (this.selectedStateId && allCities.length > 0) {
        this.availableCities = allCities.filter(c => c.stateId === Number(this.selectedStateId));
      }
    });

    effect(() => {
      if (this.isOpen()) {
        this.fetchSellerProperties(this.listingFilter);
      }
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }

  onStateChange(stateId?: number | null): void {
    const sId = (stateId !== undefined && stateId !== null) ? Number(stateId) : (this.selectedStateId ? Number(this.selectedStateId) : null);
    this.selectedStateId = sId;
    if (!sId) {
      this.availableCities = [];
      this.selectedCityId = null;
    } else {
      this.availableCities = this.cities().filter(c => c.stateId === sId);
      if (!this.availableCities.some(c => c.cityId === Number(this.selectedCityId))) {
        this.selectedCityId = null;
      }
    }
  }

  switchToListings(): void {
    this.activeTab.set('listings');
    this.fetchSellerProperties(this.listingFilter);
  }

  fetchSellerProperties(type: 'all' | 'verified' | 'deactivated' | 'sold'): void {
    this.listingFilter = type;
    const effectiveSellerId = this.sellerId() > 0 ? this.sellerId() : 0;

    if (type === 'sold') {
      this.propertyService.getSellerSoldProperties(effectiveSellerId).subscribe({
        next: res => {
          if (res.success && res.data) {
            this.sellerProperties.set(res.data);
          }
        }
      });
      return;
    }

    this.propertyService.getSellerProperties(effectiveSellerId, type).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.sellerProperties.set(res.data);
        }
      }
    });
  }

  /**
   * Safely triggers native file picker activation from UI buttons or dropzone.
   */
  triggerFileInput(inputElement?: HTMLInputElement): void {
    if (inputElement) {
      try {
        inputElement.click();
        return;
      } catch (err) {
        console.warn('[SellerPortal] Could not trigger file input click:', err);
      }
    }
    const fallback = document.getElementById('sellerPostFileInput') as HTMLInputElement;
    if (fallback) {
      try {
        fallback.click();
      } catch (err) {
        console.warn('[SellerPortal] Fallback file input click failed:', err);
      }
    }
  }

  /**
   * Compresses an image file using an HTML5 canvas down to a max bounding box
   * and JPEG quality, drastically reducing base64 payload size from ~5-15MB to ~100-250KB.
   * Includes a 5-second timeout safeguard to prevent hanging on unsupported or corrupted files.
   */
  private compressImage(file: File, maxWidth = 1280, maxHeight = 1280, quality = 0.82): Promise<string> {
    return new Promise<string>((resolve) => {
      let isResolved = false;
      const safeResolve = (val: string) => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timer);
          resolve(val);
        }
      };

      // 5-second fallback: resolve with raw DataURL if canvas or image load hangs
      const timer = setTimeout(() => {
        try {
          const fallbackReader = new FileReader();
          fallbackReader.onload = e => safeResolve((e.target?.result as string) || '');
          fallbackReader.onerror = () => safeResolve('');
          fallbackReader.readAsDataURL(file);
        } catch {
          safeResolve('');
        }
      }, 5000);

      const isRecognizedImage = !file.type || file.type.toLowerCase().startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|svg|jfif)$/i.test(file.name);
      if (!isRecognizedImage) {
        safeResolve('');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (!dataUrl) {
          safeResolve('');
          return;
        }

        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            safeResolve(dataUrl);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          safeResolve(compressed);
        };

        img.onerror = () => safeResolve(dataUrl);
        img.src = dataUrl;
      };

      reader.onerror = () => safeResolve('');
      reader.readAsDataURL(file);
    });
  }

  async processFiles(fileList: FileList | File[]): Promise<void> {
    const rawFiles = Array.from(fileList);
    if (!rawFiles || rawFiles.length === 0) return;

    const currentPreviews = this.imagePreviews();
    const remainingSlots = 6 - currentPreviews.length;
    if (remainingSlots <= 0) {
      this.errorMessage.set('Maximum 6 photos allowed. Remove a photo to add a new one.');
      return;
    }

    if (rawFiles.length > remainingSlots) {
      this.errorMessage.set(`Only ${remainingSlots} more photo(s) could be added (maximum 6 photos allowed).`);
    }

    this.isProcessingImages.set(true);
    const filesToProcess = rawFiles.slice(0, remainingSlots);

    try {
      const compressionPromises = filesToProcess.map(file => this.compressImage(file));
      const compressedImages = await Promise.all(compressionPromises);
      const valid = compressedImages.filter(img => Boolean(img && img.length > 0));

      if (valid.length === 0) {
        this.errorMessage.set('Please select valid image files (JPG, PNG, WebP, etc.).');
        return;
      }

      this.imagePreviews.update(prev => [...prev, ...valid].slice(0, 6));
      this.errorMessage.set(null);
    } catch (err) {
      console.error('[SellerPortal] Error compressing photos:', err);
      this.errorMessage.set('Could not process some photos. Please try another image.');
    } finally {
      this.isProcessingImages.set(false);
    }
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    await this.processFiles(input.files);
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.processFiles(event.dataTransfer.files);
    }
  }

  addPhotoByUrl(): void {
    const url = this.photoUrlInput().trim();
    if (!url) return;

    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:image/')) {
      this.errorMessage.set('Please enter a valid image URL starting with http://, https://, or data:image/');
      return;
    }

    if (this.imagePreviews().length >= 6) {
      this.errorMessage.set('Maximum 6 photos allowed. Remove a photo to add a new one.');
      return;
    }

    this.imagePreviews.update(prev => [...prev, url].slice(0, 6));
    this.photoUrlInput.set('');
    this.errorMessage.set(null);
  }

  addSamplePhotos(): void {
    const samplePhotos = [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80'
    ];

    const remaining = 6 - this.imagePreviews().length;
    if (remaining <= 0) {
      this.errorMessage.set('Maximum 6 photos reached.');
      return;
    }

    const toAdd = samplePhotos.slice(0, remaining);
    this.imagePreviews.update(prev => [...prev, ...toAdd]);
    this.errorMessage.set(null);
  }

  removeImage(index: number): void {
    this.imagePreviews.update(prev => prev.filter((_, i) => i !== index));
    this.errorMessage.set(null);
  }

  async handleCreateProperty(): Promise<void> {
    this.formSubmitted.set(true);

    if (this.isProcessingImages()) {
      this.errorMessage.set('Please wait for photo processing to finish before publishing.');
      this.scrollToFeedback();
      return;
    }

    if (!this.propertyName || !this.propertyName.trim()) {
      this.errorMessage.set('Property name / headline is required.');
      this.scrollToFeedback();
      return;
    }
    if (!this.selectedStateId) {
      this.errorMessage.set('Please select a State.');
      this.scrollToFeedback();
      return;
    }
    if (!this.selectedCityId) {
      this.errorMessage.set('Please select a City.');
      this.scrollToFeedback();
      return;
    }
    if (!this.priceRange || this.priceRange <= 0) {
      this.errorMessage.set('Price must be greater than 0.');
      this.scrollToFeedback();
      return;
    }
    if (!this.landmark || !this.landmark.trim()) {
      this.errorMessage.set('Landmark is required.');
      this.scrollToFeedback();
      return;
    }
    if (!this.address || !this.address.trim()) {
      this.errorMessage.set('Address is required.');
      this.scrollToFeedback();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const effectiveSellerId = this.sellerId() > 0 ? this.sellerId() : 0;

    const payload = {
      propertyName: this.propertyName.trim(),
      propertyOption: this.propertyOption,
      propertyType: this.propertyType,
      address: this.address.trim(),
      landmark: this.landmark.trim(),
      priceRange: Number(this.priceRange),
      initialDeposit: Number(this.initialDeposit || 0),
      description: this.description ? this.description.trim() : '',
      cityId: Number(this.selectedCityId),
      sellerId: effectiveSellerId,
      images: this.imagePreviews()
    };

    console.log('[SellerPortal] Submitting property payload:', payload);

    try {
      // 1. Create property core entity
      const res: any = await firstValueFrom(this.propertyService.createProperty(payload));
      console.log('[SellerPortal] Create property response:', res);
      const property = (res && res.data) ? res.data : (res && res.propertyId ? res : null);
      const newPropertyId = property?.propertyId;

      if (!newPropertyId) {
        throw new Error(res?.message || 'Failed to obtain created property identifier.');
      }

      // Photos are saved as part of the create request.
      this.completeSuccess();
    } catch (err: any) {
      console.error('[SellerPortal] Error submitting property:', err);
      this.loading.set(false);
      this.errorMessage.set(extractErrorMessage(err, 'Failed to submit property.'));
    }
  }

  private completeSuccess(): void {
    this.loading.set(false);
    this.successMessage.set('🎉 Property listed successfully! Pending admin verification.');
    this.errorMessage.set(null);
    this.resetForm();
    this.propertyCreated.emit();

    // Auto-switch to My Listings tab so the seller immediately sees their newly posted property!
    setTimeout(() => {
      this.activeTab.set('listings');
      this.fetchSellerProperties(this.listingFilter);
    }, 1200);
  }

  private scrollToFeedback(): void {
    // Defer execution slightly to allow Angular signals and @if DOM elements to render
    setTimeout(() => {
      try {
        // 1. Focus and scroll to the first invalid input directly
        const firstInvalid = document.querySelector<HTMLElement>(
          '.post-form .is-invalid, .post-form input:invalid, .post-form select:invalid'
        );
        if (firstInvalid) {
          firstInvalid.focus();
          firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }

        // 2. Otherwise scroll smoothly to the top banner
        const banner = document.getElementById('sellerPortalTopBanner') || document.querySelector('.post-form');
        if (banner) {
          banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } catch (e) {
        console.warn('[SellerPortal] Scroll feedback notice:', e);
      }
    }, 60);
  }

  private resetForm(): void {
    this.formSubmitted.set(false);
    this.propertyName = '';
    this.propertyOption = 'Sell';
    this.propertyType = 'Apartment';
    this.selectedStateId = null;
    this.selectedCityId = null;
    this.availableCities = [];
    this.priceRange = 0;
    this.initialDeposit = 0;
    this.landmark = '';
    this.address = '';
    this.description = '';
    this.imagePreviews.set([]);
    this.photoUrlInput.set('');
    this.isDragging.set(false);
    this.isProcessingImages.set(false);
  }

  // =========================================================================
  // EDIT PROPERTY WORKFLOW
  // =========================================================================

  openEditProperty(prop: Property): void {
    this.editingProperty.set(prop);
    this.editErrorMessage.set(null);
    this.editSuccessMessage.set(null);
    this.editLoading.set(false);

    this.editPropertyName = prop.propertyName;
    this.editPropertyOption = prop.propertyOption;
    this.editPropertyType = prop.propertyType;
    this.editPriceRange = prop.priceRange;
    this.editInitialDeposit = prop.initialDeposit || 0;
    this.editLandmark = prop.landmark;
    this.editAddress = prop.address;
    this.editDescription = prop.description || '';

    const allCities = this.cities();
    const city = allCities.find(c => c.cityId === prop.cityId);
    if (city) {
      this.editSelectedStateId = city.stateId;
      this.editAvailableCities = allCities.filter(c => c.stateId === city.stateId);
      this.editSelectedCityId = city.cityId;
    } else {
      this.editSelectedStateId = null;
      this.editSelectedCityId = prop.cityId;
      this.editAvailableCities = allCities;
    }

    this.editExistingImages.set([]);
    this.editDeletedImageIds.set([]);
    this.editNewImagePreviews.set([]);

    // Fetch existing images for this property
    this.propertyService.getImages(prop.propertyId).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.editExistingImages.set(res.data);
        }
      }
    });
  }

  closeEditProperty(): void {
    this.editingProperty.set(null);
    this.editErrorMessage.set(null);
    this.editSuccessMessage.set(null);
    this.editFormSubmitted.set(false);
    this.editExistingImages.set([]);
    this.editDeletedImageIds.set([]);
    this.editNewImagePreviews.set([]);
  }

  onEditStateChange(stateId?: number | null): void {
    const sId = (stateId !== undefined && stateId !== null) ? Number(stateId) : (this.editSelectedStateId ? Number(this.editSelectedStateId) : null);
    this.editSelectedStateId = sId;
    if (!sId) {
      this.editAvailableCities = [];
      this.editSelectedCityId = null;
    } else {
      this.editAvailableCities = this.cities().filter(c => c.stateId === sId);
      if (!this.editAvailableCities.some(c => c.cityId === Number(this.editSelectedCityId))) {
        this.editSelectedCityId = null;
      }
    }
  }

  removeExistingImage(imageId: number): void {
    this.editDeletedImageIds.update(ids => [...ids, imageId]);
    this.editErrorMessage.set(null);
  }

  async onEditFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const remaining = this.editRemainingSlots();
    if (remaining <= 0) {
      this.editErrorMessage.set('Maximum 6 photos reached. Remove existing photos to add new ones.');
      input.value = '';
      return;
    }

    if (input.files.length > remaining) {
      this.editErrorMessage.set(`You can only add up to ${remaining} more photo(s). Maximum 6 total photos allowed.`);
    }

    const filesToRead = Array.from(input.files).slice(0, remaining);
    const compressionPromises = filesToRead.map(file => this.compressImage(file));
    const results = await Promise.all(compressionPromises);
    const valid = results.filter(r => Boolean(r && r.length > 0));
    this.editNewImagePreviews.update(prev => [...prev, ...valid].slice(0, remaining));
    input.value = '';
  }

  removeNewImage(index: number): void {
    this.editNewImagePreviews.update(prev => prev.filter((_, i) => i !== index));
    this.editErrorMessage.set(null);
  }

  private scrollToEditFeedback(): void {
    setTimeout(() => {
      try {
        const firstInvalid = document.querySelector<HTMLElement>(
          '.edit-form .is-invalid, .edit-form input:invalid, .edit-form select:invalid'
        );
        if (firstInvalid) {
          firstInvalid.focus();
          firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }

        const modal = document.querySelector('.edit-modal-card') || document.querySelector('.edit-modal-body');
        if (modal) {
          modal.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } catch {}
    }, 60);
  }

  async handleUpdateProperty(): Promise<void> {
    const prop = this.editingProperty();
    if (!prop) return;

    this.editFormSubmitted.set(true);

    if (!this.editPropertyName || !this.editPropertyName.trim()) {
      this.editErrorMessage.set('Property name / headline is required.');
      this.scrollToEditFeedback();
      return;
    }
    if (!this.editSelectedStateId) {
      this.editErrorMessage.set('Please select a State.');
      this.scrollToEditFeedback();
      return;
    }
    if (!this.editSelectedCityId) {
      this.editErrorMessage.set('Please select a City.');
      this.scrollToEditFeedback();
      return;
    }
    if (!this.editPriceRange || this.editPriceRange <= 0) {
      this.editErrorMessage.set('Price must be greater than 0.');
      this.scrollToEditFeedback();
      return;
    }
    if (!this.editLandmark || !this.editLandmark.trim()) {
      this.editErrorMessage.set('Landmark is required.');
      this.scrollToEditFeedback();
      return;
    }
    if (!this.editAddress || !this.editAddress.trim()) {
      this.editErrorMessage.set('Address is required.');
      this.scrollToEditFeedback();
      return;
    }

    this.editLoading.set(true);
    this.editErrorMessage.set(null);
    this.editSuccessMessage.set(null);

    const payload = {
      propertyName: this.editPropertyName.trim(),
      propertyOption: this.editPropertyOption,
      propertyType: this.editPropertyType,
      address: this.editAddress.trim(),
      landmark: this.editLandmark.trim(),
      priceRange: Number(this.editPriceRange),
      initialDeposit: Number(this.editInitialDeposit || 0),
      description: this.editDescription ? this.editDescription.trim() : '',
      cityId: Number(this.editSelectedCityId),
      sellerId: prop.sellerId
    };

    try {
      // 1. Update property core data
      await firstValueFrom(this.propertyService.updateProperty(prop.propertyId, payload));

      // 2. Delete marked images
      const toDelete = this.editDeletedImageIds();
      for (const imgId of toDelete) {
        try {
          await firstValueFrom(this.propertyService.deletePropertyImage(prop.propertyId, imgId));
        } catch (e) {
          console.warn('[SellerPortal] Could not delete image', imgId, e);
        }
      }

      // 3. Upload new images
      const toUpload = this.editNewImagePreviews();
      if (toUpload.length > 0) {
        await firstValueFrom(this.propertyService.uploadImages(prop.propertyId, toUpload));
      }

      this.editLoading.set(false);
      this.editSuccessMessage.set('🎉 Property updated successfully!');
      this.fetchSellerProperties(this.listingFilter);

      setTimeout(() => {
        this.closeEditProperty();
      }, 1000);
    } catch (err: any) {
      console.error('[SellerPortal] Error updating property:', err);
      this.editLoading.set(false);
      this.editErrorMessage.set(extractErrorMessage(err, 'Failed to update property.'));
    }
  }
}
