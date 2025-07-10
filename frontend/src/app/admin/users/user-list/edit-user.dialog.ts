import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'edit-user-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './edit-user.dialog.html',
  styleUrls: ['../../../../styles/admin-theme.scss']

})
export class EditUserDialog {
  form: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public user: any,
    private dialogRef: MatDialogRef<EditUserDialog>,
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.form = this.fb.group({
      firstname: [user.firstname, Validators.required],
      lastname: [user.lastname, Validators.required],
      email: [user.email, [Validators.required, Validators.email]]
    });
  }

  getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('adminToken') || '';
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  save() {
    if (this.form.invalid) return;

    this.http.put(`/api/admin/users/${this.user._id}`, this.form.value, {
      headers: this.getAuthHeaders()
    }).subscribe(() => {
      this.dialogRef.close(true);
    });
  }
}
