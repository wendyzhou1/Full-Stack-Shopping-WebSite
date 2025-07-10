import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {
  users: any[] = [];
  search = '';
  page = 1;
  totalPages = 1;
  loading = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchUsers();
  }

  getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('adminToken') || '';
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  fetchUsers(): void {
    this.loading = true;
    this.http.get<any>(`/api/admin/users?page=${this.page}&keyword=${this.search}`, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: res => {
        this.users = res.users;
        this.totalPages = res.totalPages;
        this.loading = false;
      },
      error: err => {
        console.error('loading failed', err);
        this.loading = false;
      }
    });
  }

  searchUsers(): void {
    this.page = 1;
    this.fetchUsers();
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.fetchUsers();
  }

  openDetail(user: any): void {
    // your dialog logic
  }

  openEdit(user: any): void {
    // your dialog logic
  }

  toggleUserDisabled(user: any): void {
    const newStatus = !user.disabled;
    this.http.patch(`/api/admin/users/${user._id}/disable`, 
      { disabled: newStatus }, 
      { headers: this.getAuthHeaders() }
    ).subscribe({
      next: () => this.fetchUsers(),
      error: err => console.error('Change to disabled failed', err)
    });
  }

  deleteUser(userId: string): void {
    if (!confirm('Are you sure to delete this user?')) return;
    this.http.delete(`/api/admin/users/${userId}`, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: () => this.fetchUsers(),
      error: err => console.error('Delet failed', err)
    });
  }
}
