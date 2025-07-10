import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { EditProductDialog } from '../edit-product.dialog/edit-product.dialog.component';
import { ProductDetailDialog } from '../product-detail.dialog/product-detail.dialog.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-listing-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, EditProductDialog, ProductDetailDialog],
  templateUrl: './listing-list.component.html',
  styleUrls: ['./listing-list.component.scss']
})
export class ListingListComponent implements OnInit, OnDestroy {
  listings: any[] = [];
  search = '';
  loading = false;
  page = 1;
  totalPages = 1;
  pageJump = 1;
  limit = 20;
  sortOption: string = 'name-asc';

  constructor(private http: HttpClient, private dialog: MatDialog, private router: Router) {}

  ngOnInit() {
    this.fetchListings();
  }

  ngOnDestroy() {}

  getAuthHeaders() {
    const token = localStorage.getItem('adminToken') || '';
    return { headers: new HttpHeaders().set('Authorization', `Bearer ${token}`) };
  }

  fetchListings(page: number = 1) {
    this.loading = true;
    this.http.get<any>(`/api/admin/products?page=${page}&limit=${this.limit}&keyword=${this.search}`,
      this.getAuthHeaders())
      .subscribe({
        next: res => {
          this.listings = res.data || res;
          this.page = res.pagination?.page || 1;
          this.totalPages = res.pagination?.totalPages || 1;
          this.applySort();
          this.loading = false;
        },
        error: err => {
          console.error('loading failed', err);
          this.loading = false;
        }
      });
  }

  applySort() {
    if (this.sortOption === 'name-asc') {
      this.listings.sort((a, b) => a.title.localeCompare(b.title));
    } else if (this.sortOption === 'name-desc') {
      this.listings.sort((a, b) => b.title.localeCompare(a.title));
    } else if (this.sortOption === 'price-desc') {
      this.listings.sort((a, b) => b.price - a.price);
    } else if (this.sortOption === 'price-asc') {
      this.listings.sort((a, b) => a.price - b.price);
    }
  }

  onSortChange() {
    this.applySort();
  }

  searchListings() {
    this.page = 1;
    this.fetchListings(1);
  }

  goToPage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.fetchListings(p);
  }

  jumpToPage() {
    const target = Number(this.pageJump);
    if (!isNaN(target)) {
      this.goToPage(target);
    }
  }

  openEdit(product: any) {
    const ref = this.dialog.open(EditProductDialog, { data: product });
    ref.afterClosed().subscribe((updated: any) => {
      if (updated) this.fetchListings();
    });
  }

  openDetail(product: any) {
    this.dialog.open(ProductDetailDialog, { data: product });
  }

  disableProduct(id: string) {
    this.http.put(`/api/admin/products/${id}/disable`, {}, this.getAuthHeaders())
      .subscribe(() => this.fetchListings());
  }

  deleteProduct(id: string) {
    if (!confirm('Make sure delete this item？')) return;
    this.http.delete(`/admin/products/${id}`, this.getAuthHeaders())
      .subscribe(() => this.fetchListings());
  }

  deleteListing(id: string) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    this.http.delete(`/api/admin/products/${id}`, this.getAuthHeaders())
      .subscribe(() => this.fetchListings());
  }

  toggleListingDisabled(item: any) {
    const id = item._id;
    const isDisabling = !item.disabled;
    const url = `/api/admin/products/${id}/${isDisabling ? 'disable' : 'enable'}`;
    this.http.put(url, {}, this.getAuthHeaders())
      .subscribe(() => {
        if (isDisabling) {
          window.alert('Product disabled successfully!');
        } else {
          window.alert('Product enabled successfully!');
        }
        this.fetchListings();
      });
  }

  goToDashboard() {
    this.router.navigate(['/admin/dashboard']);
  }
}
