import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  imports: [ReactiveFormsModule, NgIf],
  standalone: true
})
export class ResetPasswordComponent {
  resetForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  token: string | null = null;
  mode: 'request' | 'reset' = 'request';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Initialize form based on mode
    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    // Check for reset token in URL
    this.route.queryParams.subscribe(params => {
      if (params['token']) {
        this.token = params['token'];
        this.mode = 'reset';
        this.resetForm = this.fb.group({
          password: ['', [Validators.required, Validators.minLength(6)]],
          confirmPassword: ['', [Validators.required]]
        }, { validator: this.passwordMatchValidator });
      }
    });
  }

  // Custom validator to check if passwords match
  private passwordMatchValidator(g: FormGroup) {
    const password = g.get('password')?.value;
    const confirmPassword = g.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  async onSubmit() {
    if (this.resetForm.invalid) return;
    
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      if (this.mode === 'request') {
        // Request password reset
        const response = await this.authService.requestPasswordReset(this.resetForm.value.email).toPromise();
        this.successMessage = 'If an account exists with this email, you will receive password reset instructions.';
      } else {
        // Reset password with token
        const response = await this.authService.resetPassword(
          this.token!,
          this.resetForm.value.password
        ).toPromise();
        this.successMessage = 'Password successfully reset. You can now login with your new password.';
        setTimeout(() => this.router.navigate(['/login']), 2000);
      }
    } catch (error: any) {
      this.errorMessage = error.error?.message || 'An error occurred. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }
}