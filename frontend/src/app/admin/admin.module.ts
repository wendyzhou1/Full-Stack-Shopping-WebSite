import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminRoutingModule } from './admin-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AdminLoginComponent } from './login/login.component';
import { AdminDashboardComponent } from './dashboard/dashboard.component';
import { ReviewListComponent } from './reviews/review-list/review-list.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AdminRoutingModule,
    AdminLoginComponent,         
    AdminDashboardComponent,
    ReviewListComponent          
  ]
})
export class AdminModule {}
