import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { environment } from '@env/environment';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  state: 'home' | 'search' | 'item' = 'home';
  sortOrder: '' | 'asc' | 'desc' = '';
  soldOutSoon: any[] = [];
  bestSellers: any[] = [];
  lastWishlistAction: string = '';
  isInWishlist: boolean = false;
  searchTerm = '';
  filterBrand = '';
  filterPriceMax = 1000;
  searchResults: any[] = [];
  brands: string[] = ['Samsung', 'Apple', 'HTC', 'Huawei', 'Nokia', 'LG', 'Motorola', 'Sony', 'BlackBerry'];

  selectedPhone: any = null;
  selectedQuantity = 1;
  showQuantity = false;
  showCartModal = false;

  reviews: any[] = [];
  reviewLimit = 3;
  newComment = '';
  newRating = 5;
  hideComment: boolean = false;
  reviewPage = 1;
  reviewPageSize = 3;
  hasMoreReviews = true;
  isLoadingReviews = false;
  user: any = {};
  currentUserId: string = '';
  isLoggedIn = false;
  cartTabOpen: boolean = false;

  cart: any[] = [];
  Phone: any;

  constructor(private http: HttpClient, private router: Router) { }

  ngOnInit(): void {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        this.user = parsed.user || parsed;
        this.currentUserId = this.user._id || this.user.id || '';
        this.isLoggedIn = !!this.currentUserId;
      } catch {
        console.error('Invalid user data');
      }
    }

    this.fetchLowStockProducts();
    this.fetchBestRatedProducts();

    if (this.isLoggedIn) {
      this.getCart();
    }

    const selectedPhone = localStorage.getItem('selectedPhone');
    if (selectedPhone) {
      try {
        const parsed = JSON.parse(selectedPhone);
        if (parsed && parsed._id) {
          this.selectPhone(parsed);
          localStorage.removeItem('selectedPhone');
        }
      } catch (e) {
        console.error('Failed to parse selectedPhone from localStorage', e);
      }
    }

    const selectedPhoneId = localStorage.getItem('selectedPhoneId');
    if (selectedPhoneId) {
      this.selectPhoneById(selectedPhoneId);
      localStorage.removeItem('selectedPhoneId');
    }



  }

  checkWishlistStatus(productId: string) {
    this.http.get(`${environment.apiUrl}/users/${this.currentUserId}/wishlist/${productId}`)
      .subscribe({
        next: (res: any) => {
          this.isInWishlist = res?.inWishlist === true;
        },
        error: () => {
          this.isInWishlist = false;
        }
      });
  }

  fetchLowStockProducts() {
    this.http.get<any[]>(`${environment.apiUrl}/products/low-stock`).subscribe({
      next: (res) => (this.soldOutSoon = res),
      error: (err) => console.error('❌ Failed to fetch low stock:', err)
    });
  }

  fetchBestRatedProducts() {
    this.http.get<any[]>(`${environment.apiUrl}/products/best-rated`).subscribe({
      next: (res) => (this.bestSellers = res),
      error: (err) => console.error('❌ Failed to fetch best sellers:', err)
    });
  }
  selectPhoneById(id: string) {
    this.http.get<any>(`${environment.apiUrl}/products/${id}`).subscribe(full => {
      this.selectedPhone = full;
      this.selectedQuantity = 1;
      this.showQuantity = false;
      this.state = 'item';
      this.cartTabOpen = false;

      this.loadReviews(id, true);
      this.getCart();
      if (this.isLoggedIn) {
        this.checkWishlistStatus(id);
      }
    });
  }

  search() {
    this.state = 'search';
    const query: any = {
      title: this.searchTerm,
      brand: this.filterBrand,
      maxPrice: this.filterPriceMax
    };

    if (this.sortOrder) {
      query.sort = this.sortOrder;
    };

    this.http.get<any[]>(`${environment.apiUrl}/products/search`, { params: query }).subscribe({
      next: (res) => (this.searchResults = res),
      error: (err) => console.error('Search failed:', err)
    });
  }

  selectPhone(phone: any) {
    this.http.get<any>(`${environment.apiUrl}/products/${phone._id}`).subscribe(full => {
      this.selectedPhone = full;
      this.selectedQuantity = 1;
      this.showQuantity = false;
      this.state = 'item';
      this.cartTabOpen = false;

      this.loadReviews(full._id, true);

      this.getCart();
      if (this.isLoggedIn) {
        this.checkWishlistStatus(full._id);
      }
    });
  }

  loadReviews(phoneId: string, reset = true) {
    if (reset) {
      this.reviews = [];
      this.reviewPage = 1;
      this.hasMoreReviews = true;
    }

    const currentPage = this.reviewPage;

    this.http.get<any>(`${environment.apiUrl}/products/${phoneId}/reviews`, {
      params: { page: this.reviewPage }
    }).subscribe({
      next: (res) => {
        const newReviews = res.reviews.map((r: any) => ({ ...r, showFull: false }));
        this.reviews = [...this.reviews, ...newReviews];

        if (this.reviews.length >= res.totalCount) {
          this.hasMoreReviews = false;
        }

        this.isLoadingReviews = false;
      },
      error: (err) => {
        console.error('Failed to load reviews:', err);
        this.isLoadingReviews = false;
      }
    });

  }



  showMoreReviews() {
    this.reviewPage++;
    this.isLoadingReviews = true;
    this.loadReviews(this.selectedPhone._id, false);
  }






  canViewComment(review: any): boolean {
    const isAuthor = review.reviewer === this.currentUserId;
    const isSeller = this.selectedPhone?.seller === this.currentUserId;
    return !review.hidden || isAuthor || isSeller;
  }

  postReview() {
    if (!this.newComment || !this.newRating || !this.currentUserId) {
      alert('Please enter comment, rating, and make sure you are logged in.');
      return;
    }

    const body = {
      reviewer: this.currentUserId,
      comment: this.newComment,
      rating: this.newRating,
      hidden: !!this.hideComment
    };

    console.log('[Review Submit Body]', body);

    this.http.post(`${environment.apiUrl}/products/${this.selectedPhone._id}/reviews`, body)
      .subscribe({
        next: () => {
          this.newComment = '';
          this.newRating = 5;
          this.hideComment = false;
          this.loadReviews(this.selectedPhone._id);
        },
        error: (err) => {
          console.error('❌ Failed to post review:', err);
          alert('Failed to submit review: ' + (err?.error?.error || 'Unknown error'));
        }
      });
  }




  canToggleComment(review: any): boolean {
    return review.reviewerId === this.currentUserId || this.selectedPhone?.seller?._id === this.currentUserId;
  }

  toggleCommentVisibility(reviewId: string) {
    this.http.patch(`${environment.apiUrl}/products/${this.selectedPhone._id}/reviews/${reviewId}/toggle`, {}).subscribe({
      next: () => this.loadReviews(this.selectedPhone._id)
    });
  }

  getCommentText(comment: string, full: boolean): string {
    return full || comment.length <= 200 ? comment : comment.substring(0, 200) + '...';
  }

  confirmAddToCart() {
    if (!this.isLoggedIn) {
      alert('Please sign in to add items to your cart.');
      this.goToAuth();
      return;
    }

    const alreadyInCart = this.getCartQuantity(this.selectedPhone.title);
    const stock = this.selectedPhone.stock;
    const total = alreadyInCart + this.selectedQuantity;

    if (total > stock) {
      const remaining = stock - alreadyInCart;
      alert(
        `You already have ${alreadyInCart} of this item in your cart.\n` +
        `Only ${remaining > 0 ? remaining : 0} more can be added (stock: ${stock}).`
      );
      return;
    }

    this.http.post(`${environment.apiUrl}/users/${this.currentUserId}/cart`, {
      productId: this.selectedPhone._id,
      quantity: this.selectedQuantity
    }).subscribe({
      next: () => {
        this.showCartModal = false;
        this.getCart();
        alert('Added to cart!');
      },
      error: () => alert('Add to cart failed')
    });
  }



  getCart() {
    if (!this.currentUserId) return;

    this.http.get<any[]>(`${environment.apiUrl}/users/${this.currentUserId}/cart`).subscribe({
      next: (res) => {
        console.log('[Cart Loaded]', res);
        this.cart = res || [];
      },
      error: err => console.error('Failed to load cart', err)
    });

  }

  getTotalCartQuantity(): number {
    return this.cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }


  backToHome() {
    this.state = 'home';
    this.selectedPhone = null;
  }

  goToAuth() {
    this.router.navigate(['/auth']);
  }
  onAddToCartClick() {
    if (!this.isLoggedIn) {
      alert('Please sign in to add items to your cart.');
      this.goToAuth();
      return;
    }

    this.showCartModal = true;
  }

  signOut() {
    localStorage.removeItem('user');
    this.isLoggedIn = false;
    this.user = {};
    this.currentUserId = '';
    this.cart = [];
    this.router.navigate(['/home']).then(() => {
      this.state = 'home';
    });
  }


  goToCheckout() {
    this.router.navigate(['/checkout']);
  }

  showWishlistAlert() {
    alert('Added to wishlist (mock)');
  }

  increaseReviewLimit() {
    this.reviewLimit += 3;
  }
  toggleWishlist(phone: any) {
    if (!this.currentUserId) {
      alert('Please log in to use wishlist');
      this.goToAuth();
      return;
    }

    this.http.post(`${environment.apiUrl}/users/${this.currentUserId}/wishlist`, {
      productId: phone._id
    }).subscribe({
      next: () => {
        this.isInWishlist = true;
        alert('✅ Added to wishlist!');
      },
      error: (err) => {
        const errorMsg = err?.error?.error;

        if (errorMsg === 'Product already in wishlist.') {
          const confirmRemove = confirm('This item is already in your wishlist.\nDo you want to remove it?');
          if (confirmRemove) {
            this.removeFromWishlist(phone._id);
          }
        } else {
          alert('❌ Failed to add to wishlist: ' + (errorMsg || 'Unknown error'));
        }
      }
    });
  }


  removeFromWishlist(productId: string) {
    this.http.delete(`${environment.apiUrl}/users/${this.currentUserId}/wishlist/${productId}`).subscribe({
      next: () => {
        this.isInWishlist = false;
        alert('❎ Removed from wishlist');
      },
      error: () => alert('Failed to remove from wishlist')
    });
  }

  toggleCartTab() {
    this.cartTabOpen = !this.cartTabOpen;
  }
  getCartTotalPrice(): number {
    return this.cart.reduce((sum, item) => {
      const price = item.price || 0;
      return sum + price * item.quantity;
    }, 0);
  }

  getCartQuantity(title: string): number {
    return this.cart.find(p => p.title === title)?.quantity || 0;
  }
  getTotalQuantity(): number {
    return this.cart.reduce((sum, item) => sum + item.quantity, 0);
  }


  increaseQuantity(item: any) {
    if (item.quantity < item.stock) {
      item.quantity++;
      this.updateQuantity(item);
    } else {
      alert('Cannot add more than stock');
    }
  }


  decreaseQuantity(item: any) {
    if (item.quantity > 1) {
      item.quantity--;
      this.updateQuantity(item);
    }
  }

  updateQuantity(item: any) {
    if (item.quantity > item.stock) {
      alert('Requested quantity exceeds available stock!');
      item.quantity = item.stock;
      return;
    }

    const userId = this.currentUserId;
    this.http.patch(`${environment.apiUrl}/users/${userId}/cart/${item.productId}`, {
      quantity: item.quantity
    }).subscribe(() => {
      console.log('Quantity updated');
      this.getCart();
    });
  }

  removeFromCart(item: any) {
    const userId = this.currentUserId;
    this.http.delete(`${environment.apiUrl}/users/${userId}/cart/${item.productId}`)
      .subscribe(() => {
        console.log('Item removed');
        this.getCart();
      });
  }





}
