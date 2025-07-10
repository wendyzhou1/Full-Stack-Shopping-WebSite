import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'product-detail-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-detail.dialog.component.html',
  styleUrls: ['./product-detail.dialog.component.scss']
})
export class ProductDetailDialog implements OnInit {
  reviews: any[] = [];
  seller: any;
  loading = true;

  constructor(@Inject(MAT_DIALOG_DATA) public product: any, private http: HttpClient) {}

  getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('adminToken') || '';
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  ngOnInit() {
    this.http.get<any>(`/api/admin/products/${this.product._id}/details`, {
      headers: this.getAuthHeaders()
    }).subscribe((res) => {
      this.reviews = res.reviews || [];
      this.seller = res.seller;
      this.loading = false;
    });
  }
}
