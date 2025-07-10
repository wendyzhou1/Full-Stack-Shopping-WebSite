import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'edit-product-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './edit-product.dialog.component.html',
  styleUrls: ['./edit-product.dialog.component.scss']
})
export class EditProductDialog {
  form: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public product: any,
    private dialogRef: MatDialogRef<EditProductDialog>,
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.form = this.fb.group({
      title: [product.title, Validators.required],
      brand: [product.brand, Validators.required],
      price: [product.price, [Validators.required, Validators.min(0)]],
      stock: [product.stock, [Validators.required, Validators.min(0)]]
    });
  }

  getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('adminToken') || '';
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  save() {
    if (this.form.invalid) return;

    this.http.put(`/api/admin/products/${this.product._id}`, this.form.value, {
      headers: this.getAuthHeaders()
    }).subscribe(() => {
      this.dialogRef.close(true);
    });
  }
}
