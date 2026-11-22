import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, Property, City, State, PropertyImage, SellerContact } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class PropertyService {
  private readonly gatewayUrl = 'http://localhost:5000/api';
  

  constructor(private http: HttpClient) {}

  getVerifiedProperties(): Observable<ApiResponse<Property[]>> {
    return this.http.get<ApiResponse<Property[]>>(`${this.gatewayUrl}/properties/verified`);
  }

  searchProperties(cityId?: number, propertyType?: string, propertyOption?: string, sortBy?: string, stateId?: number): Observable<ApiResponse<Property[]>> {
    let params = new HttpParams();
    if (cityId) params = params.set('cityId', cityId.toString());
    if (stateId) params = params.set('stateId', stateId.toString());
    if (propertyType) params = params.set('propertyType', propertyType);
    if (propertyOption) params = params.set('propertyOption', propertyOption);
    if (sortBy) params = params.set('sortBy', sortBy);

    return this.http.get<ApiResponse<Property[]>>(`${this.gatewayUrl}/properties/search`, { params });
  }

  getPropertyById(id: number): Observable<ApiResponse<Property>> {
    return this.http.get<ApiResponse<Property>>(`${this.gatewayUrl}/properties/${id}`);
  }

  createProperty(payload: Partial<Property>): Observable<ApiResponse<Property>> {
    return this.http.post<ApiResponse<Property>>(`${this.gatewayUrl}/properties`, payload);
  }

  updateProperty(id: number, payload: Partial<Property>): Observable<ApiResponse<Property>> {
    return this.http.put<ApiResponse<Property>>(`${this.gatewayUrl}/properties/${id}`, payload);
  }

  deletePropertyImage(propertyId: number, imageId: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.gatewayUrl}/properties/${propertyId}/images/${imageId}`);
  }

  getMyListings(type: 'all' | 'verified' | 'deactivated' = 'all'): Observable<ApiResponse<Property[]>> {
    return this.getSellerProperties(0, type);
  }

  getSellerProperties(sellerId?: number, type: 'all' | 'verified' | 'deactivated' = 'all'): Observable<ApiResponse<Property[]>> {
    let url = (!sellerId || sellerId <= 0)
      ? `${this.gatewayUrl}/properties/my-properties`
      : `${this.gatewayUrl}/properties/seller/${sellerId}`;

    if (type === 'verified') url += '?isActive=true';
    else if (type === 'deactivated') url += '?isActive=false';

    return this.http.get<ApiResponse<Property[]>>(url);
  }

  getAllPropertiesAdmin(): Observable<ApiResponse<Property[]>> {
    return this.http.get<ApiResponse<Property[]>>(`${this.gatewayUrl}/properties/admin/all`);
  }

  verifyProperty(id: number): Observable<ApiResponse<Property>> {
    return this.http.put<ApiResponse<Property>>(`${this.gatewayUrl}/properties/${id}/approve`, {});
  }

  deactivateProperty(id: number, reason: string): Observable<ApiResponse<Property>> {
    return this.http.put<ApiResponse<Property>>(`${this.gatewayUrl}/properties/${id}/reject`, { reason });
  }

  uploadImages(propertyId: number, images: string[]): Observable<ApiResponse<PropertyImage[]>> {
    return this.http.post<ApiResponse<PropertyImage[]>>(`${this.gatewayUrl}/properties/${propertyId}/images`, { images });
  }

  getImages(propertyId: number): Observable<ApiResponse<PropertyImage[]>> {
    return this.http.get<ApiResponse<PropertyImage[]>>(`${this.gatewayUrl}/properties/${propertyId}/images`);
  }

  getCities(): Observable<ApiResponse<City[]>> {
    return this.http.get<ApiResponse<City[]>>(`${this.gatewayUrl}/cities`);
  }

  getStates(): Observable<ApiResponse<State[]>> {
    return this.http.get<ApiResponse<State[]>>(`${this.gatewayUrl}/states`);
  }

  getSellerContact(sellerId: number): Observable<ApiResponse<SellerContact>> {
    return this.http.get<ApiResponse<SellerContact>>(`${this.gatewayUrl}/sellers/${sellerId}/contact`);
  }

  buyProperty(propertyId: number, buyerId: number): Observable<ApiResponse<Property>> {
    return this.http.post<ApiResponse<Property>>(`${this.gatewayUrl}/properties/${propertyId}/buy`, { buyerId });
  }

  getMyPurchases(): Observable<ApiResponse<Property[]>> {
    return this.getBuyerPurchases(0);
  }

  getBuyerPurchases(buyerId?: number): Observable<ApiResponse<Property[]>> {
    const url = (!buyerId || buyerId <= 0)
      ? `${this.gatewayUrl}/properties/my-purchases`
      : `${this.gatewayUrl}/properties/buyer/${buyerId}/purchases`;
    return this.http.get<ApiResponse<Property[]>>(url);
  }

  getMySoldProperties(): Observable<ApiResponse<Property[]>> {
    return this.getSellerSoldProperties();
  }

  getSellerSoldProperties(sellerId?: number): Observable<ApiResponse<Property[]>> {
    return this.http.get<ApiResponse<Property[]>>(`${this.gatewayUrl}/properties/my-sold`);
  }

  getAdminSalesReport(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.gatewayUrl}/verifications/sales-report`);
  }
}
