import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SellerContact } from '../../models/models';

@Component({
  selector: 'app-contact-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contact-modal.component.html',
  styleUrl: './contact-modal.component.css'
})
export class ContactModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly contact = input<SellerContact | null>(null);
  readonly loading = input<boolean>(false);

  readonly close = output<void>();

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }
}
