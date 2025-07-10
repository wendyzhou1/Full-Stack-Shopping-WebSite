import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'user-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatDividerModule],
  templateUrl: './user-detail.dialog.html',
  styleUrls: ['./user-detail.dialog.scss']

})
export class UserDetailDialog implements OnInit {
  listings: any[] = [];
  reviews: any[] = [];
  purchased: any[] = [];
  loading = true;

  constructor(
    @Inject(MAT_DIALOG_DATA) public user: any,
    private http: HttpClient
  ) { }

  getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('adminToken') || '';
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  ngOnInit() {
    this.loading = true;

    // Step 1: 获取用户基本信息 + purchased（旧接口）
    this.http.get(`/api/admin/users/${this.user._id}`, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (res: any) => {
        this.user.email = res.email;
        this.user.lastLogin = res.lastLogin;
        this.user.firstname = res.firstname;
        this.user.lastname = res.lastname;
        this.purchased = res.purchased || [];

        // Step 2: 获取 listing + review（新接口）
        this.http.get(`/api/admin/user/${this.user._id}/activities`, {
          headers: this.getAuthHeaders()
        }).subscribe({
          next: (activityRes: any) => {
            console.log('✅ Loaded user activities:', activityRes);
            this.listings = activityRes.listings || [];
            this.reviews = activityRes.reviews || [];
            this.loading = false;
          },
          error: err => {
            console.error('Error loading activities:', err);
            this.loading = false;
          }
        });
      },
      error: err => {
        console.error('Error loading user info:', err);
        this.loading = false;
      }
    });
  }

}
