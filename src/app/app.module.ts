import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ButtonModule } from 'primeng/button';
import { SidebarModule } from 'primeng/sidebar';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DetailsService } from './services/details.service';
import { ImageProxyService } from './services/image-proxy.service';

import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatPseudoCheckboxModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { AddPlaceModalComponent } from './components/add-place-modal/add-place-modal.component';
import { PlacesComponent } from './components/places/places.component';
import { PlaceDetailsComponent } from './components/place-details/place-details.component';
import { AgencyDetailsComponent } from './components/agency-details/agency-details.component';
import { TableModule } from 'primeng/table';
import { SelectButtonModule } from 'primeng/selectbutton';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { RatingModule } from 'primeng/rating';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { CustomersComponent } from './components/customers/customers.component';
import { ActivitiesComponent } from './components/activities/activities.component';
import { ActivityDetailsComponent } from './components/activity-details/activity-details.component';
import { TravelAgenciesComponent } from './components/travel-agencies/travel-agencies.component';
import { PascalCasePipe } from './pascal-case.pipe';
import { AuthLayoutComponent } from './components/layouts/auth-layout/auth-layout.component';
import { MainLayoutComponent } from './components/layouts/main-layout/main-layout.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    SidebarComponent,
    NavbarComponent,
    AddPlaceModalComponent,
    PlacesComponent,
    PlaceDetailsComponent,
    PascalCasePipe,
    AuthLayoutComponent,
    MainLayoutComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    HttpClientModule,
    MatIconModule,
    MatPaginatorModule,
    MatSortModule,
    MatPseudoCheckboxModule,
    MatTableModule,
    MatButtonModule,
    BrowserAnimationsModule,
    ToastModule,
    ConfirmDialogModule,
    ButtonModule,
    CheckboxModule,
    SidebarModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    InputTextareaModule,
    MatDialogModule,
    TableModule,
    SelectButtonModule,
    AvatarModule,
    AvatarGroupModule,
    RatingModule,
    TooltipModule,
    RippleModule,
    AgencyDetailsComponent,
    TravelAgenciesComponent,
    CustomersComponent,
    ActivitiesComponent,
  ],
  providers: [
    ConfirmationService, 
    MessageService,
    DetailsService,
    ImageProxyService,
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
