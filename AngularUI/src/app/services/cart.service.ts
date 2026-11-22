import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ApiResponse, EnrichedCartItem, Property } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly baseUrl = 'http://localhost:5000/api/cart';

  readonly cartItems = signal<EnrichedCartItem[]>([]);
  readonly cartCount = signal<number>(0);

  constructor(private http: HttpClient) {}

  getBuyerCart(buyerId?: number): Observable<ApiResponse<EnrichedCartItem[]>> {
    const url = (buyerId && buyerId > 0)
      ? `${this.baseUrl}/buyer/${buyerId}`
      : this.baseUrl;
    return this.http.get<ApiResponse<EnrichedCartItem[]>>(url).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.cartItems.set(res.data);
          this.cartCount.set(res.data.length);
        }
      })
    );
  }

  addToCart(buyerId: number, propertyId: number, propertyData?: Property): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/items`, { propertyId }).pipe(
      tap(() => this.getBuyerCart(buyerId).subscribe())
    );
  }

  removeFromCart(cartId: number, buyerId: number, propertyId?: number): Observable<ApiResponse<boolean>> {
    const targetPropId = (propertyId && propertyId > 0) ? propertyId : cartId;
    return this.http.delete<any>(`${this.baseUrl}/items/${targetPropId}`).pipe(
      tap(() => this.getBuyerCart(buyerId).subscribe())
    );
  }

  clearCart(): void {
    this.cartItems.set([]);
    this.cartCount.set(0);
  }
}
