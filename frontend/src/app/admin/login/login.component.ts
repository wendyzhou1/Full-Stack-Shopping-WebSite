import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class AdminLoginComponent implements OnInit, OnDestroy {
  errorMsg = '';
  loginForm!: FormGroup;

  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  ngOnInit() {
  }

  ngOnDestroy() {
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    const { email, password } = this.loginForm.value;

    this.http.post<any>('/api/admin/login', { email, password }, {
      headers: { 'Content-Type': 'application/json' }
    }).subscribe({
      next: (res) => {
        localStorage.setItem('adminToken', res.data.token);
        this.router.navigate(['/admin/dashboard']);
      },
      error: () => {
        this.errorMsg = 'Invalid admin credentials.';
      }
    });
  }

  goToDashboard(): void {
    this.router.navigate(['/admin/dashboard']);
  }
}
