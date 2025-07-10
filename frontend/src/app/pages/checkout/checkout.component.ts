import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { environment } from '@env/environment';

@Component({
  standalone: true,
  selector: 'app-checkout',
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {
  cart: any[] = [];
  userId: string = '';
  user: any = {};
  totalPrice: number = 0;

  constructor(private http: HttpClient, private router: Router) { }

  ngOnInit(): void {
    const stored = localStorage.getItem('user');
    if (!stored) {
      alert('Please sign in first.');
      this.router.navigate(['/auth']);
      return;
    }

    const parsed = JSON.parse(stored);
    this.user = parsed.user || parsed;
    this.userId = this.user._id || this.user.id || '';

    if (!this.userId) {
      alert('Invalid user session. Please log in again.');
      return;
    }

    this.getCart();
  }

  getCart() {
    this.http.get<any[]>(`${environment.apiUrl}/users/${this.userId}/cart`).subscribe({
      next: (res) => {
        this.cart = res.map(i => ({ ...i, newQuantity: i.quantity })) || [];
        this.calculateTotal();
      },
      error: (err) => {
        console.error('Failed to load cart', err);
        alert('Failed to load cart');
      }
    });
  }

  submitQuantity(item: any) {
    const quantity = Number(item.newQuantity);
    const stock = item.stock;

    if (isNaN(quantity) || quantity < 0) {
      alert('Invalid quantity.');
      return;
    }

    if (quantity > stock) {
      alert(`Quantity exceeds available stock.\nMaximum allowed: ${stock}`);
      item.newQuantity = stock;
      return;
    }

    const productId = item._id || item.productId || item.product?._id;

    if (quantity === 0) {
      this.removeFromCart(item);
      return;
    }

    this.http.patch(`${environment.apiUrl}/users/${this.userId}/cart/${productId}`, {
      quantity
    }).subscribe({
      next: () => {
        this.getCart();
      },
      error: (err) => {
        console.error('Update failed', err);
        alert('Update failed.');
      }
    });
  }

  removeFromCart(item: any) {
    const productId = item._id || item.productId || item.product?._id;
    this.http.delete(`${environment.apiUrl}/users/${this.userId}/cart/${productId}`).subscribe(() => {
      this.getCart();
    });
  }

  calculateTotal() {
    this.totalPrice = this.cart.reduce((sum, item) => {
      return sum + (item.price || 0) * item.quantity;
    }, 0);
  }

  confirmPurchase() {
    this.http.post(`${environment.apiUrl}/users/${this.userId}/checkout`, {}).subscribe({
      next: () => {
        alert('Purchase successful!');
        this.cart = [];
        this.totalPrice = 0;
        this.router.navigate(['/home']);
      },
      error: (err) => {
        const msg = err?.error?.message || err?.error?.error || 'Checkout failed';
        alert(` ${msg}`);
      }
    });
  }


  goBack() {
    this.router.navigate(['/home']);
  }
}
