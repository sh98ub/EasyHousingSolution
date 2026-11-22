import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ApiResponse, UserSession } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly baseUrl = 'http://localhost:5000/api/identity';
  private readonly storageKey = 'ehs_user_session';

  // Reactive state for current user
  readonly currentUser = signal<UserSession | null>(this.loadSession());
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  readonly userRole = computed(() => this.currentUser()?.userType ?? null);

  constructor(private http: HttpClient) {}

  login(credentials: { emailId: string; password: string }): Observable<ApiResponse<UserSession>> {
    return this.http.post<ApiResponse<UserSession>>(`${this.baseUrl}/login`, credentials).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.setSession(res.data);
        }
      })
    );
  }

  registerBuyer(payload: { fullName: string; emailId: string; password: string; dob: string; mobileNo: string }): Observable<ApiResponse<UserSession>> {
    return this.http.post<ApiResponse<UserSession>>(`${this.baseUrl}/register-buyer`, payload).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.setSession(res.data);
        }
      })
    );
  }

  registerSeller(payload: { emailId: string; password: string; fullName: string; phoneNo: string; address: string; stateId: number; cityId: number; dateofBirth?: string }): Observable<ApiResponse<UserSession>> {
    return this.http.post<ApiResponse<UserSession>>(`${this.baseUrl}/register-seller`, payload).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.setSession(res.data);
        }
      })
    );
  }

  logout(): void {
    try {
      sessionStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.storageKey);
    } catch {}
    this.currentUser.set(null);
  }

  getToken(): string | null {
    return this.currentUser()?.token ?? null;
  }

  private setSession(session: UserSession): void {
    if (session.userType === 'Seller' && (!session.profileId || session.profileId <= 0)) {
      session.profileId = 1;
    } else if (session.userType === 'Buyer' && (!session.profileId || session.profileId <= 0)) {
      session.profileId = 1;
    }
    try {
      sessionStorage.setItem(this.storageKey, JSON.stringify(session));
      localStorage.removeItem(this.storageKey);
    } catch {}
    this.currentUser.set(session);
  }

  private loadSession(): UserSession | null {
    try {
      let raw = sessionStorage.getItem(this.storageKey);
      if (!raw) {
        raw = localStorage.getItem(this.storageKey);
        if (raw) {
          sessionStorage.setItem(this.storageKey, raw);
          localStorage.removeItem(this.storageKey);
        }
      }
      if (!raw) return null;

      const session = JSON.parse(raw) as UserSession;
      if (session) {
        if (session.userType === 'Seller' && (!session.profileId || session.profileId <= 0)) {
          session.profileId = 1;
        } else if (session.userType === 'Buyer' && (!session.profileId || session.profileId <= 0)) {
          session.profileId = 1;
        }
      }
      return session;
    } catch {
      return null;
    }
  }
}
