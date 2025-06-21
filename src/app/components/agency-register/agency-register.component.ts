import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-agency-register',
  templateUrl: './agency-register.component.html',
  styleUrls: ['./agency-register.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputTextareaModule,
    ToastModule
  ],
  providers: [MessageService]
})
export class AgencyRegisterComponent implements OnInit {
  visible: boolean = false;
  registerForm: FormGroup;
  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private http: HttpClient
  ) {
    this.registerForm = this.fb.group({
      agencyName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required, 
        Validators.minLength(6),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/)
      ]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]*$/)]],
      location: ['', Validators.required],
      description: [''],
      taxNumber: ['', [Validators.required, Validators.pattern(/^TAX-\d{6}$/)]],
      facebookURL: [''],
      instagramURL: ['']
    });
  }

  ngOnInit(): void {
  }

  showDialog(): void {
    this.visible = true;
  }

  hideDialog(): void {
    this.visible = false;
    this.registerForm.reset();
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.loading = true;
      
      // Format tax number if it doesn't have the TAX- prefix
      let taxNum = this.registerForm.value.taxNumber;
      if (!taxNum.startsWith('TAX-')) {
        taxNum = 'TAX-' + taxNum.replace(/\D/g, '');
      }
      
      // Prepare the data for the API with the exact property names expected by the server
      const agencyData = {
        userName: this.registerForm.value.agencyName,
        email: this.registerForm.value.email,
        password: this.registerForm.value.password,
        phoneNumber: this.registerForm.value.phoneNumber,
        address: this.registerForm.value.location,
        description: this.registerForm.value.description || '',
        taxNumber: taxNum,
        facebookUrl: this.registerForm.value.facebookURL || '',
        instagramUrl: this.registerForm.value.instagramURL || '',
        role: "TravelAgency",
        isActive: true,
        isEmailConfirmed: false
      };

      // Set headers for the request
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      });

      // Try the endpoint with /api prefix
      const apiUrl = `${environment.apiUrl}/api/Accounts/RegisterTravelAgency`;
      
      this.http.post(apiUrl, agencyData, { headers }).subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Travel agency registered successfully'
          });
          this.loading = false;
          this.hideDialog();
          // Optionally emit an event to refresh the agencies list
        },
        error: (error) => {
          let errorMessage = 'Failed to register travel agency. ';
          
          // Extract error message from response if available
          if (error.error) {
            if (typeof error.error === 'string') {
              errorMessage += error.error;
            } else if (error.error.message) {
              errorMessage += error.error.message;
            } else if (error.error.errors) {
              // Handle validation errors
              const validationErrors = Object.values(error.error.errors).flat();
              errorMessage += validationErrors.join('. ');
            } else {
              // Try to stringify the error object
              try {
                errorMessage += JSON.stringify(error.error);
              } catch (e) {
                errorMessage += 'An unexpected error occurred.';
              }
            }
          }
          
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: errorMessage,
            life: 5000
          });
          this.loading = false;
        }
      });
    } else {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.registerForm.controls).forEach(key => {
        const control = this.registerForm.get(key);
        control?.markAsTouched();
      });
    }
  }
} 