import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, UserSummary } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly baseUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<ApiResponse<UserSummary[]>> {
    return this.http.get<ApiResponse<UserSummary[]>>(`${this.baseUrl}/admin/users`);
  }

  getUserById(id: number): Observable<ApiResponse<UserSummary>> {
    return this.http.get<ApiResponse<UserSummary>>(`${this.baseUrl}/admin/users/${id}`);
  }

  getMyProfile(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/users/profile`);
  }

  updateProfile(dto: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.baseUrl}/users/profile`, dto);
  }

  activateUser(userId: number, reason?: string): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.baseUrl}/admin/users/${userId}/activate`, { isActive: true, reason });
  }

  deactivateUser(userId: number, reason?: string): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.baseUrl}/admin/users/${userId}/deactivate`, { isActive: false, reason });
  }

  changeUserRole(userId: number, newRole: string, reason?: string): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.baseUrl}/admin/users/${userId}/role`, { newRole, reason });
  }

  deleteUser(userId: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/admin/users/${userId}`);
  }
}
