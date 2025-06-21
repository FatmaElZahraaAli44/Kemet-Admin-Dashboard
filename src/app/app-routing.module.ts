import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { PlacesComponent } from './components/places/places.component';
import { ActivitiesComponent } from './components/activities/activities.component';
import { CustomersComponent } from './components/customers/customers.component';
import { TravelAgenciesComponent } from './components/travel-agencies/travel-agencies.component';
import { ReviewsComponent } from './components/reviews/reviews.component';
import { AuthLayoutComponent } from './components/layouts/auth-layout/auth-layout.component';
import { MainLayoutComponent } from './components/layouts/main-layout/main-layout.component';
import { AuthGuard } from './components/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: 'login', component: LoginComponent },
      { path: '', redirectTo: '/login', pathMatch: 'full' }
    ]
  },
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: 'places', component: PlacesComponent , canActivate: [AuthGuard]  },
      { path: 'activities', component: ActivitiesComponent , canActivate: [AuthGuard] },
      { path: 'customers', component: CustomersComponent, canActivate: [AuthGuard] },
      { path: 'reviews', component: ReviewsComponent, canActivate: [AuthGuard] },
      { path: 'travel-agencies', component: TravelAgenciesComponent, canActivate: [AuthGuard] },
    ]
  },
  { path: '**', redirectTo: '/Places' } 
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
