import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Property, City } from '../../models/models';
import { PropertyCardComponent } from '../property-card/property-card.component';

@Component({
  selector: 'app-property-list',
  standalone: true,
  imports: [CommonModule, PropertyCardComponent],
  templateUrl: './property-list.component.html',
  styleUrl: './property-list.component.css'
})
export class PropertyListComponent {
  // --- Data received from Parent (app.ts) ---
  readonly properties = input<Property[]>([]);       // List of verified properties to display
  readonly activeCity = input<City | null>(null);     // Currently filtered city (or null if all cities)
  readonly isBuyer = input<boolean>(false);           // True if current user is logged in as Buyer
  readonly cartPropertyIds = input<number[]>([]);     // IDs of properties currently saved in user's cart
  readonly isLoading = input<boolean>(false);         // Shows loading spinner while data is fetching
  readonly currentSort = input<string>('');           // Current active sort criteria ('', 'price_asc', 'price_desc')
  readonly comparedPropertyIds = input<number[]>([]); // IDs of properties currently selected for comparison

  // --- Events sent to Parent (app.ts) ---
  readonly clearCity = output<void>();                // Emits when user clicks "View All Cities"
  readonly resetAll = output<void>();                 // Emits when user clicks "Reset All Filters"
  readonly sortChange = output<string>();             // Emits when user selects a new sort option
  readonly openContact = output<number>();            // Emits propertyId to view seller phone/email
  readonly toggleCart = output<number>();             // Emits propertyId to save/unsave to cart
  readonly viewDetails = output<Property>();          // Emits property object to open full details modal
  readonly toggleCompare = output<Property>();        // Emits property to add/remove from comparison tray

  // Checks whether a given property is already saved in the buyer's cart
  isCartItem(propertyId: number): boolean {
    return this.cartPropertyIds().includes(propertyId);
  }

  // Checks whether a given property is selected for comparison
  isPropertyCompared(propertyId: number): boolean {
    return this.comparedPropertyIds().includes(propertyId);
  }

  // Clears the city location filter
  onClearLocation(): void {
    this.clearCity.emit();
  }

  // Handles sort dropdown changes
  onSortSelected(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.sortChange.emit(value);
  }

  // Resets all filters back to default
  resetFilters(): void {
    this.resetAll.emit();
  }
}
