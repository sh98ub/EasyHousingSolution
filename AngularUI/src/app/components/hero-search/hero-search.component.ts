import { Component, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { City } from '../../models/models';

@Component({
  selector: 'app-hero-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hero-search.component.html',
  styleUrl: './hero-search.component.css'
})
export class HeroSearchComponent {
  // --- Inputs passed from Parent (app.ts) ---
  readonly cities = input<City[]>([]);               // Dropdown list of cities
  readonly activeCityId = input<number | null>(null); // Current selected city ID (if any)
  readonly activeOption = input<string>('Sell');      // 'Sell' (Buy) or 'Rent'
  readonly activeType = input<string>('');            // Selected property type

  // --- Output: Emits when user clicks "SEARCH PROPERTIES" or switches BUY/RENT ---
  readonly searchTriggered = output<{
    cityId?: number;
    propertyType?: string;
    propertyOption?: string;
  }>();

  // --- 3 Simple Search Filters ---
  selectedOption = signal<'Sell' | 'Rent'>('Sell');  // Filter 1: Purpose (Buy vs Rent)
  selectedCityId: number | null = null;              // Filter 2: City
  selectedType: string = '';                         // Filter 3: Property Type (Apartment, Villa, Plot, Commercial)

  constructor() {
    // Keep local form selections synchronized with parent state
    effect(() => {
      this.selectedCityId = this.activeCityId() ?? null;
      const opt = this.activeOption();
      if (opt === 'Sell' || opt === 'Rent') {
        this.selectedOption.set(opt);
      }
      this.selectedType = this.activeType() || '';
    });
  }

  // Switches between BUY and RENT tabs and auto-triggers search
  setOption(opt: 'Sell' | 'Rent'): void {
    this.selectedOption.set(opt);
    this.onSearch();
  }

  // Sends the 3 filter parameters to parent component (app.ts)
  onSearch(): void {
    this.searchTriggered.emit({
      propertyOption: this.selectedOption(),
      cityId: this.selectedCityId ? Number(this.selectedCityId) : undefined,
      propertyType: this.selectedType || undefined
    });
  }
}
