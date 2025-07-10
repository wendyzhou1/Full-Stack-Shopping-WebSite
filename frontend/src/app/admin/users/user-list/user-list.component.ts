import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { UserDetailDialog } from './user-detail.dialog';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit, OnDestroy {
  users: any[] = [];
  search = '';
  page = 1;
  totalPages = 1;
  loading = false;
  pageJump = 1;

  constructor(private http: HttpClient, private router: Router, private dialog: MatDialog) { }

  ngOnInit(): void {
    this.fetchUsers();
  }

  ngOnDestroy(): void {}

  getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('adminToken') || '';
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  fetchUsers(): void {
    this.loading = true;
    this.http.get<any>(`/api/admin/users?page=${this.page}&limit=10&search=${this.search}`, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: res => {
        this.users = res.data || [];
        this.totalPages = res.pagination?.totalPages || 1;
        this.loading = false;
      },
      error: err => {
        console.error('Failed to load users', err);
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

  jumpToPage(): void {
    const target = Number(this.pageJump);
    if (!isNaN(target)) {
      this.goToPage(target);
    }
  }
  openDetail(user: any): void {
    this.dialog.open(UserDetailDialog, {
      data: user,
      width: '600px',
      disableClose: false
    });
  }


  openEdit(user: any): void {
    const modal = document.createElement('div');
    modal.innerHTML = `
      <div style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.35);z-index:9999;display:flex;align-items:center;justify-content:center;">
        <form id="user-edit-modal-form" style="background:#fff;padding:32px 28px 18px 28px;border-radius:16px;min-width:340px;max-width:95vw;box-shadow:0 8px 32px rgba(0,0,0,0.18);font-family:sans-serif;">
          <h2 style="margin-top:0;margin-bottom:18px;text-align:center;color:#1976d2;">Edit User</h2>
          <label style='font-weight:500;'>First Name:</label><br>
          <input id="ue-fn" value="${user.firstname || ''}" style="width:100%;margin-bottom:10px;padding:7px 10px;border-radius:5px;border:1px solid #bbb;" required><br>
          <label style='font-weight:500;'>Last Name:</label><br>
          <input id="ue-ln" value="${user.lastname || ''}" style="width:100%;margin-bottom:10px;padding:7px 10px;border-radius:5px;border:1px solid #bbb;" required><br>
          <label style='font-weight:500;'>Email:</label><br>
          <input id="ue-email" type="email" value="${user.email || ''}" style="width:100%;margin-bottom:18px;padding:7px 10px;border-radius:5px;border:1px solid #bbb;" required><br>
          <div style="display:flex;justify-content:space-between;gap:10px;">
            <button type="button" id="ue-cancel" style="flex:1;padding:8px 0;border:none;border-radius:5px;background:#eee;color:#333;font-weight:600;cursor:pointer;">Cancel</button>
            <button type="submit" id="ue-save" style="flex:1;padding:8px 0;border:none;border-radius:5px;background:#1976d2;color:#fff;font-weight:600;cursor:pointer;">Save</button>
          </div>
        </form>
      </div>
    `;
    const old = document.getElementById('user-edit-modal-root');
    if (old) old.remove();
    modal.id = 'user-edit-modal-root';
    document.body.appendChild(modal);
    (modal.querySelector('#ue-cancel') as HTMLElement).onclick = () => modal.remove();
    (modal.querySelector('#user-edit-modal-form') as HTMLFormElement).onsubmit = (e) => {
      e.preventDefault();
      const firstname = (modal.querySelector('#ue-fn') as HTMLInputElement).value.trim();
      const lastname = (modal.querySelector('#ue-ln') as HTMLInputElement).value.trim();
      const email = (modal.querySelector('#ue-email') as HTMLInputElement).value.trim();
      if (!firstname || !lastname || !email) {
        alert('All fields are required.');
        return;
      }
      this.http.put(`/api/admin/users/${user._id}`,
        { firstname, lastname, email },
        { headers: this.getAuthHeaders() }
      ).subscribe({
        next: () => {
          modal.remove();
          this.fetchUsers();
        },
        error: err => alert('Failed to update user: ' + (err?.error?.message || err))
      });
    };
  }

  toggleUserDisabled(user: any): void {
    const newStatus = !user.disabled;
    this.http.put(`/api/admin/users/${user._id}/${newStatus ? 'disable' : 'enable'}`,
      {},
      { headers: this.getAuthHeaders() }
    ).subscribe({
      next: () => {
        if (newStatus) {
          window.alert('User disabled successfully!');
        } else {
          window.alert('User enabled successfully!');
        }
        this.fetchUsers();
      },
      error: err => window.alert('Failed to toggle user status: ' + (err?.error?.message || err))
    });
  }

  deleteUser(userId: string): void {
    if (!confirm('Are you sure you want to delete this user?')) return;
    this.http.delete(`/api/admin/users/${userId}`, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: () => this.fetchUsers(),
      error: err => console.error('Failed to delete user', err)
    });
  }

  goToDashboard() {
    this.router.navigate(['/admin/dashboard']);
  }
}
