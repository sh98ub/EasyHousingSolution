import { Component, input, output, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Property, PropertyImage } from '../../models/models';
import { PropertyService } from '../../services/property.service';

@Component({
  selector: 'app-property-detail-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './property-detail-modal.component.html',
  styleUrl: './property-detail-modal.component.css'
})
export class PropertyDetailModalComponent {
  private readonly propertyService = inject(PropertyService);

  readonly isOpen = input<boolean>(false);
  readonly property = input<Property | null>(null);
  readonly isBuyer = input<boolean>(false);
  readonly isSeller = input<boolean>(false);
  readonly isInCart = input<boolean>(false);

  readonly close = output<void>();
  readonly contactOwner = output<number>();
  readonly toggleCart = output<number>();
  readonly buyProperty = output<number>();

  // Multi-Photo Gallery State
  readonly galleryImages = signal<string[]>([]);
  readonly activeImageIndex = signal<number>(0);
  readonly isLoadingImages = signal<boolean>(false);

  constructor() {
    effect(() => {
      const open = this.isOpen();
      const prop = this.property();
      if (open && prop) {
        this.activeImageIndex.set(0);

        // Pre-populate instantly if images already present on property DTO (zero delay)
        const preloaded: string[] = [];
        if (prop.images && Array.isArray(prop.images) && prop.images.length > 0) {
          preloaded.push(...prop.images);
        } else if (prop.primaryImage) {
          preloaded.push(prop.primaryImage);
        }
        this.galleryImages.set(preloaded);

        // Fetch fresh full photo gallery from backend to guarantee all photos
        this.isLoadingImages.set(preloaded.length === 0);
        this.propertyService.getImages(prop.propertyId).subscribe({
          next: (res: any) => {
            this.isLoadingImages.set(false);
            const rawList: any[] = Array.isArray(res)
              ? res
              : (res && res.data && Array.isArray(res.data) ? res.data : []);

            if (rawList.length > 0) {
              const urls = rawList
                .map((i: any) => typeof i === 'string' ? i : (i.imageData || i.image || ''))
                .filter(Boolean);
              if (urls.length > 0) {
                this.galleryImages.set(urls);
              }
            }
          },
          error: (err) => {
            console.warn('[PropertyDetailModal] Failed to load images:', err);
            this.isLoadingImages.set(false);
          }
        });
      } else {
        this.galleryImages.set([]);
        this.activeImageIndex.set(0);
      }
    });
  }

  prevImage(): void {
    const total = this.galleryImages().length;
    if (total <= 1) return;
    this.activeImageIndex.update(idx => (idx - 1 + total) % total);
  }

  nextImage(): void {
    const total = this.galleryImages().length;
    if (total <= 1) return;
    this.activeImageIndex.update(idx => (idx + 1) % total);
  }

  selectImage(index: number): void {
    this.activeImageIndex.set(index);
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
