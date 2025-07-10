import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';                    // ✅ 加这一行
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '@env/environment';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  token = '';
  newPassword = '';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
  }

  submit() {
    this.http.post(`${environment.apiUrl}/auth/reset-password`, {
      token: this.token,
      newPassword: this.newPassword
    }).subscribe({
      next: () => {
        alert('Password reset successful!');
        this.router.navigate(['/auth']);
      },
      error: (err) => {
        console.error('Reset error:', err);
        alert(err.error?.message || 'Reset failed');
      }
    });
  }
}
