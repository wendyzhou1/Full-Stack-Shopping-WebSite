import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-review-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './review-list.component.html',
  styleUrls: ['./review-list.component.scss']
})
export class ReviewListComponent implements OnInit, OnDestroy {
  reviews: any[] = [];
  search = '';
  loading = false;
  page = 1;
  totalPages = 1;
  pageJump = 1;
  limit = 20;
  sortOption: string = 'name-asc';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.fetchReviews();
  }

  ngOnDestroy() {}

  getAuthHeaderObj(): HttpHeaders {
    const token = localStorage.getItem('adminToken') || '';
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  fetchReviews(page: number = 1): void {
    this.loading = true;
    const isSearching = !!this.search;
    const url = isSearching
      ? `/api/admin/reviews/search?page=${page}&limit=${this.limit}&keyword=${this.search}`
      : `/api/admin/reviews?page=${page}&limit=${this.limit}`;
    this.http.get<any>(url, { headers: this.getAuthHeaderObj() })
      .subscribe({
        next: res => {
          this.reviews = res.data || res;
          this.page = res.pagination?.page || 1;
          this.totalPages = res.pagination?.totalPages || 1;
          this.applySort();
          this.loading = false;
        },
        error: err => {
          console.error('加载失败', err);
          this.loading = false;
        }
      });
  }

  applySort() {
    if (this.sortOption === 'name-asc') {
      this.reviews.sort((a, b) => (a.product?.title || '').localeCompare(b.product?.title || ''));
    } else if (this.sortOption === 'name-desc') {
      this.reviews.sort((a, b) => (b.product?.title || '').localeCompare(a.product?.title || ''));
    } else if (this.sortOption === 'rating-desc') {
      this.reviews.sort((a, b) => b.rating - a.rating);
    } else if (this.sortOption === 'rating-asc') {
      this.reviews.sort((a, b) => a.rating - b.rating);
    }
  }

  onSortChange() {
    this.applySort();
  }

  searchReviews(): void {
    this.page = 1;
    this.fetchReviews(1);
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.fetchReviews(p);
  }

  jumpToPage(): void {
    const target = Number(this.pageJump);
    if (!isNaN(target)) {
      this.goToPage(target);
    }
  }

  toggleVisibility(review: any): void {
    const payload = {
      productId: review.product?._id,
      reviewerId: review.user?._id,
      comment: review.comment,
      hidden: !review.hidden
    };
    this.http.patch('/api/admin/reviews/toggle-visibility', payload, { headers: this.getAuthHeaderObj() })
      .subscribe({
        next: () => {
          window.alert(payload.hidden ? 'Hide function successful!' : 'Show function successful!');
          this.fetchReviews(this.page);
        },
        error: err => {
          window.alert('Failed to toggle review visibility: ' + (err?.error?.error || 'Unknown error'));
        }
      });
  }

  goToDashboard() {
    this.router.navigate(['/admin/dashboard']);
  }
}
