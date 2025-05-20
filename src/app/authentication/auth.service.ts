import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthData } from './auth-data.model';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private token: string | null = null;
  private userId: string | null = null; // NEW: store userId
  private isAuthenticated = false;
  private authStatusListener = new Subject<boolean>();
  private tokenTimer: any;

  constructor(private http: HttpClient, private router: Router) {}

  getToken() {
    return this.token;
  }

  getUserId() {
    return this.userId; // NEW: return userId
  }

  getUserEmail() {
    const authData = this.getAuthData();
    return authData ? authData.email : null;  // Return email from auth data
  }


  getIsAuth() {
    return this.isAuthenticated;
  }

  getAuthStatusListener() {
    return this.authStatusListener.asObservable();
  }

  createUser(email: string, password: string) {
    const authData: AuthData = { email, password };
    return this.http.post<{ message: string }>('http://localhost:3000/api/user/signup', authData);
  }

  loginUser(email: string, password: string) {
    const authData: AuthData = { email, password };
    this.http.post<{ token: string; expiresIn: number; userId: string; email: string }>(
      'http://localhost:3000/api/user/login',
      authData
    )
    .subscribe({
      next: response => {
        const token = response.token;
        const userId = response.userId;
        const userEmail = response.email;  // Get email from response

        if (token) {
          this.token = token;
          this.userId = response.userId;  
          this.isAuthenticated = true;
          const expiresInDuration = response.expiresIn;
          this.setAuthTimer(expiresInDuration);
          const now = new Date();
          const expirationDate = new Date(now.getTime() + expiresInDuration * 1000);
          this.saveAuthData(token, expirationDate, userId, userEmail);  // Save email as well
          this.authStatusListener.next(true);
          this.router.navigate(['/']);
        }
      },
      error: err => {
        console.error('Login error:', err);
        this.authStatusListener.next(false);
      }
    });
  }



  autoAuthUser() {
    const authInformation = this.getAuthData();
    if (!authInformation) return;

    const now = new Date();
    const expiresInDuration = authInformation.expirationDate.getTime() - now.getTime();

    if (expiresInDuration > 0) {
      this.token = authInformation.token;
      this.userId = authInformation.userId; // NEW: initialize userId from authInformation
      this.isAuthenticated = true;
      this.setAuthTimer(expiresInDuration / 1000);
      this.authStatusListener.next(true);
    } else {
      this.logout();
    }
  }


  logout() {
    this.token = null;
    this.userId = null; // ✅ Reset userId when logging out
    this.isAuthenticated = false;
    this.authStatusListener.next(false);
    clearTimeout(this.tokenTimer);
    this.clearAuthData();
    this.router.navigate(['/']);
  }

  private setAuthTimer(duration: number) {
    this.tokenTimer = setTimeout(() => {
      this.logout();
    }, duration * 1000);
  }

  private saveAuthData(token: string, expirationDate: Date, userId: string, email: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('expiration', expirationDate.toISOString());
    localStorage.setItem('userId', userId);
    localStorage.setItem('email', email);  // Store email
  }



  private clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('expiration');
    localStorage.removeItem('userId'); // ✅ This ensures userId is cleared
  }

  private getAuthData() {
    const token = localStorage.getItem('token');
    const expirationDate = localStorage.getItem('expiration');
    const userId = localStorage.getItem('userId');
    const email = localStorage.getItem('email');  // Get email from localStorage

    if (!token || !expirationDate || !userId || !email) {
      return null;
    }

    return {
      token: token,
      expirationDate: new Date(expirationDate),
      userId: userId,
      email: email  // Include email in the returned object
    };
  }

}
