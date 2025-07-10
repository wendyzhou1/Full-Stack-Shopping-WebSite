import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '@env/environment';
import { Router } from '@angular/router';


@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent {
  mode: 'login' | 'register' | 'forgot' = 'login';

  forgotData = { email: '' };

  constructor(private http: HttpClient, public router: Router) { }



  switchMode(newMode: 'login' | 'register' | 'forgot') {
    this.mode = newMode;
  }

  submitLogin(data: any) {
    this.http.post(`${environment.apiUrl}/auth/login`, data).subscribe({
      next: (res) => {
        console.log('Login success:', res);
        alert('Login successful');
        localStorage.setItem('user', JSON.stringify(res));
        this.router.navigate(['/home']);
      },
      error: (err) => {
        console.error('Login error:', err);
        alert(err.error?.message || 'Login failed');
      }
    });
  }


  submitRegister(data: any) {
    this.http.post(`${environment.apiUrl}/auth/register`, data).subscribe({
      next: (res) => {
        console.log('Registration success:', res);
        alert('Registration successful! Please verify your email.');
      },
      error: (err) => {
        console.error('Registration error:', err);
        const msg =
          err.error?.errors?.[0]?.msg ||
          err.error?.message ||
          'Registration failed';
        alert(msg);
      }
    });
  }

  submitForgot() {
    this.http.post(`${environment.apiUrl}/auth/forgot-password`, this.forgotData).subscribe({
      next: (res) => {
        console.log('Reset link sent:', res);
        alert('Password reset link sent. Check your inbox.');
      },
      error: (err) => {
        console.error('Password reset error:', err);
        alert(err.error?.message || 'Password reset failed');
      }
    });
    console.log('Sending forgot-password request with email:', this.forgotData.email);

  }
}
