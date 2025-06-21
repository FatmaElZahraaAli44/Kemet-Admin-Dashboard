import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment'; // Import environment configuration

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private _HttpClient: HttpClient
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    const { email, password } = this.loginForm.value;

    const body = { email: email, password: password };

    // Use the apiUrl from environment configuration
    this._HttpClient.post<any>(`${environment.apiUrl}/api/Accounts/AdminLogin`, body).subscribe(
      (response: any) => {
        this.isLoading = false;
        if (response && response.token) {
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('token', response.token); 
          this.router.navigate(['/places']);
        }
        
        
      },
      (error: any) => {
        this.isLoading = false;
        if (error.status === 401) {
          this.errorMessage = 'Invalid credentials. Please try again.';
        } else {
          this.errorMessage = 'An error occurred. Please try again later.';
        }
      }
    );
  }

  get username() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }
}
