import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

let lastOrderLogId: string | null = null;

function showOrderNotification(log: any) {
  // Remove any existing notification
  const old = document.getElementById('order-notification-root');
  if (old) old.remove();
  // Create notification
  const notif = document.createElement('div');
  notif.innerHTML = `
    <div style="position:fixed;bottom:32px;right:32px;z-index:9999;min-width:260px;max-width:90vw;background:#fff;border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,0.18);padding:18px 28px 14px 22px;display:flex;align-items:center;gap:12px;font-family:sans-serif;animation:fadeInNotif 0.3s;">
      <span style="font-size:1.7em;color:#1976d2;">🛎️</span>
      <div style="flex:1;">
        <div style="font-weight:600;margin-bottom:2px;">New Order Placed</div>
        <div style="font-size:0.98em;color:#444;">Order by: <b>${log.buyer?.firstname || ''} ${log.buyer?.lastname || ''}</b></div>
        <div style="font-size:0.95em;color:#666;">Total: ¥${log.total}</div>
      </div>
      <button id="order-notif-close" style="background:none;border:none;font-size:1.2em;color:#888;cursor:pointer;">×</button>
    </div>
  `;
  notif.id = 'order-notification-root';
  document.body.appendChild(notif);
  (notif.querySelector('#order-notif-close') as HTMLElement).onclick = () => notif.remove();
  setTimeout(() => notif.remove(), 6000);
}

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss']
})
export class LogsComponent implements OnInit, OnDestroy {
  logs: any[] = [];
  loading = false;
  adminLogs: any[] = [];
  adminLogsLoading = false;

  constructor(private http: HttpClient, private router: Router) {}

  getAuthHeaders() {
    const token = localStorage.getItem('adminToken') || '';
    return { headers: new HttpHeaders().set('Authorization', `Bearer ${token}`) };
  }

  ngOnInit() {
    this.fetchLogs();
    this.fetchAdminLogs();
    this.startOrderNotificationPolling();
  }

  ngOnDestroy() {}

  fetchLogs() {
    this.loading = true;
    this.http.get<any[]>('/api/admin/sales/logs', this.getAuthHeaders())
      .subscribe({
        next: data => {
          if (Array.isArray(data)) {
            this.logs = data;
          } else {
            this.logs = [];
            console.error('Sales log API did not return an array:', data);
          }
          this.loading = false;
        },
        error: err => {
          this.logs = [];
          console.error('Failed to load sales logs', err);
          this.loading = false;
        }
      });
  }

  fetchAdminLogs() {
    this.adminLogsLoading = true;
    this.http.get<any[]>('/api/admin/logs/notifications', this.getAuthHeaders())
      .subscribe({
        next: data => {
          if (Array.isArray(data)) {
            this.adminLogs = data;
          } else {
            this.adminLogs = [];
            console.error('Admin log API did not return an array:', data);
          }
          this.adminLogsLoading = false;
        },
        error: err => {
          this.adminLogs = [];
          console.error('Failed to load admin logs', err);
          this.adminLogsLoading = false;
        }
      });
  }

  startOrderNotificationPolling() {
    setInterval(() => {
      this.http.get<any[]>('/api/admin/sales/logs', this.getAuthHeaders())
        .subscribe({
          next: data => {
            if (Array.isArray(data) && data.length > 0) {
              const latest = data[0];
              if (latest && latest.id && latest.id !== lastOrderLogId) {
                if (lastOrderLogId !== null) {
                  showOrderNotification(latest);
                }
                lastOrderLogId = latest.id;
              }
            }
          }
        });
    }, 5000); // Poll every 5 seconds
  }

  downloadJSON() {
    this.http.get('/api/admin/sales/export', {
      ...this.getAuthHeaders(),
      responseType: 'blob'
    }).subscribe(blob => this.saveFile(blob, 'sales-log.json'));
  }

  downloadCSV() {
    this.http.get('/api/admin/sales/export/csv', {
      ...this.getAuthHeaders(),
      responseType: 'blob'
    }).subscribe(blob => this.saveFile(blob, 'sales-log.csv'));
  }

  saveFile(data: Blob, filename: string) {
    const url = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  goToDashboard() {
    this.router.navigate(['/admin/dashboard']);
  }
}
