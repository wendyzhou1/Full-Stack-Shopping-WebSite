import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from '@env/environment';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  wishlist: any[] = [];
  groupedComments: any[] = [];
  activeTab: string = 'edit';
  user: any = {};
  userId: string = '';
  editForm!: FormGroup;
  passwordForm!: FormGroup;
  newListingForm!: FormGroup;
  listings: any[] = [];
  comments: any[] = [];
  loading = false;

  brands = ['Samsung', 'Apple', 'HTC', 'Huawei', 'Nokia', 'LG', 'Motorola', 'Sony', 'BlackBerry'];

  constructor(private http: HttpClient, private fb: FormBuilder, private router: Router) { }

  ngOnInit(): void {
    this.initForms();


    const stored = localStorage.getItem('user');
    if (!stored) {
      this.router.navigate(['/home']);
      return;
    }

    const parsed = JSON.parse(stored);
    this.user = parsed.user || parsed;
    this.userId = this.user._id || this.user.id || '';

    if (!this.userId) {
      alert('Invalid session. Please login again.');
      this.router.navigate(['/auth']);
      return;
    }

    this.loadUserInfo();

    this.loadWishlist();
    this.loadListings();
    this.loadComments();
  }

  initForms() {
    this.editForm = this.fb.group({
      firstname: ['', Validators.required],
      lastname: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [
        Validators.required,
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/)
      ]],
    });


    this.newListingForm = this.fb.group({
      title: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(1)]],
      brand: ['', Validators.required],
      stock: ['', [Validators.required, Validators.min(0)]]
    });
  }
  loadUserInfo() {
    this.http.get<any>(`${environment.apiUrl}/profile/profile/${this.userId}`).subscribe({
      next: (res) => {
        this.user = res.data;
        localStorage.setItem('user', JSON.stringify(this.user));
        this.editForm.patchValue({
          firstname: this.user.firstname,
          lastname: this.user.lastname,
          email: this.user.email
        });
      },
      error: () => {
        alert('Failed to refresh user info');
      }
    });
  }
  goToItem(phone: any) {
    this.router.navigate(['/home']).then(() => {
      localStorage.setItem('selectedPhone', JSON.stringify(phone));
      this.router.navigate(['/home']);
    });
  }


  loadWishlist() {
    if (!this.userId) {
      console.error('User ID not found, cannot load wishlist');
      return;
    }

    this.http.get<any>(`${environment.apiUrl}/users/${this.userId}/wishlist`).subscribe({
      next: (res) => {
        console.log('[Wishlist API response]', res);
        this.wishlist = Array.isArray(res) ? res : [];
      },
      error: (err) => {
        console.error('Failed to load wishlist', err);
        this.wishlist = [];
      }
    });
  }


  updateProfile() {
    if (this.editForm.invalid) return;
    const data = {
      ...this.editForm.value,
      currentPassword: this.editForm.value.password
    };

    this.loading = true;

    this.http.patch(`${environment.apiUrl}/profile/update-profile/${this.userId}`, data).subscribe({
      next: () => {
        alert('Profile updated!');
        this.loadUserInfo();
        this.loading = false;
      },
      error: err => {
        alert(err.error?.message || 'Update failed');
        this.loading = false;
      }
    });
  }


  changePassword() {
    const data = this.passwordForm.value;

    this.loading = true;

    this.http.post(`${environment.apiUrl}/profile/${this.userId}/change-password`, {
      oldPassword: data.currentPassword,
      newPassword: data.newPassword
    }).subscribe({
      next: () => {
        alert('Password changed. Email sent.');
        this.loading = false;
      },
      error: err => {
        alert(err.error?.message || 'Change password failed');
        this.loading = false;
      }
    });
  }


  loadListings(): void {
    this.http.get<any>(`${environment.apiUrl}/profile/lists/${this.userId}/getList`).subscribe({
      next: (res) => {
        this.listings = Array.isArray(res.products) ? res.products : [];
      },
      error: (err) => {
        console.error('❌ Failed to load listings', err);
        this.listings = [];
      }
    });
  }
  groupCommentsByProduct() {
    const groupedMap = new Map<string, any>();

    for (const comment of this.comments) {
      const key = comment.productId;
      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          productId: comment.productId,
          productTitle: comment.productTitle,
          brand: comment.brand,
          comments: []
        });
      }
      groupedMap.get(key).comments.push(comment);
    }

    this.groupedComments = Array.from(groupedMap.values());
  }
  loadComments(): void {
    this.http.get<any>(`${environment.apiUrl}/profile/comments/${this.userId}`).subscribe({
      next: (res) => {
        this.comments = Array.isArray(res.comments) ? res.comments : [];
        this.groupCommentsByProduct();
      },
      error: (err) => {
        console.error('Failed to load comments', err);
        this.comments = [];
      }
    });
  }

  deleteListing(id: string) {
    this.http.delete(`${environment.apiUrl}/profile/lists/${this.userId}/${id}`).subscribe({
      next: () => this.loadListings(),
      error: (err) => {
        console.error('Failed to delete listing:', err);
        alert('Delete failed');
      }
    });
  }


  addListing() {
    const data = this.newListingForm.value;
    if (this.newListingForm.invalid) {
      alert('Please fill in all fields correctly');
      return;
    }

    const payload = {
      ...data,
      seller: this.userId
    };

    this.http.post(`${environment.apiUrl}/profile/lists/${this.userId}`, payload).subscribe({
      next: () => {
        alert('Listing added!');
        this.newListingForm.reset();
        this.loadListings();
      },
      error: (err) => {
        console.error('Failed to add listing:', err);
        alert(err.error?.message || 'Failed to add listing');
      }
    });
  }

  toggleListingStatus(listing: any) {
    const payload = { disabled: !listing.disabled };
    this.http.patch(`${environment.apiUrl}/profile/lists/${this.userId}/${listing._id}/status`, payload).subscribe({
      next: () => this.loadListings(),
      error: (err) => {
        console.error('Failed to update status', err);
        alert('Failed to update listing status');
      }
    });
  }


  toggleCommentVisibility(c: any) {
    const payload = {
      reviewer: c.reviewerId,
      comment: c.comment,
      hidden: !c.hidden
    };

    this.http.patch(`${environment.apiUrl}/profile/comments/${this.userId}/${c.productId}`, payload).subscribe({
      next: () => this.loadComments(),
      error: err => {
        console.error('Failed to toggle visibility', err);
        alert('Failed to toggle comment visibility');
      }
    });
  }

  goHome() {
    this.router.navigate(['/home']);
  }


  signOut() {
    localStorage.removeItem('user');
    this.user = {};
    this.userId = '';
    this.listings = [];
    this.comments = [];
    this.router.navigate(['/home']);
  }
}