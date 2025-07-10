import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { AuthComponent } from './pages/auth/auth.component';
import { VerifyEmailComponent } from './pages/auth/verify-email/verify-email.component';
import { ResetPasswordComponent } from './pages/auth/reset-password/reset-password.component';
import { CheckoutComponent } from './pages/checkout/checkout.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { AdminLoginComponent } from './admin/login/login.component';
import { AdminDashboardComponent } from './admin/dashboard/dashboard.component';


export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'auth', component: AuthComponent },
  { path: 'verify-email', component: VerifyEmailComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'checkout', component: CheckoutComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'admin',
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule) 
  },
  { path: '**', redirectTo: '' }
];
