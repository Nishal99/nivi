import { Routes } from '@angular/router';
import { LoginComponent } from './component/login/login.component';
import { HomeComponent } from './component/home/home.component';
import { ClientDetailsComponent } from './component/client-details/client-details.component';
import { AgentDetailsComponent } from './component/agent-details/agent-details.component';
import { ReportsComponent } from './component/reports/reports.component';
import { ResetPasswordComponent } from './component/reset-password/reset-password.component';
import { DashboardComponent } from './component/dashboard/dashboard.component';
import { SupplierDetailsComponent } from './component/supplier-details/supplier-details.component';
import { AuthGuard } from './guards/auth.guard';
import { ProfileComponent } from './component/profile/profile.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'reset-password', component: ResetPasswordComponent },
    { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
    { path: 'client-details', component: ClientDetailsComponent, canActivate: [AuthGuard] },
    { path: 'agent-details', component: AgentDetailsComponent, canActivate: [AuthGuard] },
    { path: 'supplier-details', component: SupplierDetailsComponent, canActivate: [AuthGuard] },
    { path: 'reports', component: ReportsComponent, canActivate: [AuthGuard] },
    { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
    { path: 'reset-password', component: ResetPasswordComponent },
    { path: '', component: HomeComponent },
    { path: '**', redirectTo: '' }
];
