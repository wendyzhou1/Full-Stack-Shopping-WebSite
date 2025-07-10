import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

function showAutoLogoutModal() {
  // Remove any existing modal
  const old = document.getElementById('auto-logout-modal-root');
  if (old) old.remove();
  // Create modal
  const modal = document.createElement('div');
  modal.innerHTML = `
    <div style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.35);z-index:9999;display:flex;align-items:center;justify-content:center;">
      <div style="background:#fff;padding:32px 28px 18px 28px;border-radius:16px;min-width:340px;max-width:95vw;box-shadow:0 8px 32px rgba(0,0,0,0.18);font-family:sans-serif;">
        <h2 style="margin-top:0;margin-bottom:18px;text-align:center;color:#d32f2f;">Session Expired</h2>
        <div style='margin-bottom:18px;text-align:center;'>You have been automatically logged out due to inactivity.</div>
        <div style="display:flex;justify-content:center;">
          <button type="button" id="al-close" style="padding:8px 32px;border:none;border-radius:5px;background:#1976d2;color:#fff;font-weight:600;cursor:pointer;">OK</button>
        </div>
      </div>
    </div>
  `;
  modal.id = 'auto-logout-modal-root';
  document.body.appendChild(modal);
  (modal.querySelector('#al-close') as HTMLElement).onclick = () => modal.remove();
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit() {}

  ngOnDestroy() {}

  logout() {
    localStorage.removeItem('adminToken');
    this.router.navigate(['/admin']);
  }

  navigate(path: string) {
    this.router.navigate([path]);
  }

  exportAdminLogs() {
    const token = localStorage.getItem('adminToken') || '';
    this.http.get('/api/admin/audit/log', {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob'
    }).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'audit_log.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    }, err => {
      alert('Failed to export admin operation log.');
    });
  }
}
