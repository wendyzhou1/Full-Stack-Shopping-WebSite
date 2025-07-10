import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminDashboardComponent } from './dashboard/dashboard.component';
import { AdminLoginComponent } from './login/login.component';
import { UserListComponent } from './users/user-list/user-list.component';
import { ListingListComponent } from './listings/listing-list/listing-list.component';
import { ReviewListComponent } from './reviews/review-list/review-list.component';
import { AuthGuard } from './auth.guard';
import { LogsComponent } from './logs/logs/logs.component';
const routes: Routes = [
  { path: '', component: AdminLoginComponent },
  { path: 'dashboard', component: AdminDashboardComponent, canActivate: [AuthGuard] },
  { path: 'users', component: UserListComponent, canActivate: [AuthGuard] },
  { path: 'listings', component: ListingListComponent },
  { path: 'reviews', component: ReviewListComponent },
  { path: 'logs', component: LogsComponent, canActivate: [AuthGuard] }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule {}
