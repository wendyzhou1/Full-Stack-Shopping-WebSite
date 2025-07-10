import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';

@Component({
  selector: 'app-verify-email',
  template: `<p>Verifying email, please wait...</p>`
})
export class VerifyEmailComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) { }

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.http.get(`${environment.apiUrl}/auth/verify?token=${token}`)
        .subscribe({
          next: () => {
            alert('Email verified successfully!');
            this.router.navigate(['/auth']);
          },
          error: () => {
            alert('Email verification failed or link expired.');
            this.router.navigate(['/auth']);
          }
        });
    }
  }
}
