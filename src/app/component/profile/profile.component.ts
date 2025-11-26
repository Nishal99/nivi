import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule]
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  newUserForm: FormGroup;
  currentUser: {
    id?: string;
    name?: string;
    username?: string;
    email?: string;
    role?: string;
  } | null = null;
  isAdmin: boolean = false;
  users: any[] = [];
  userStatusFilter: 'all' | 'active' | 'inactive' = 'all';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.passwordMatchValidator });

    this.newUserForm = this.fb.group({
      fullname: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.pattern(/^[a-zA-Z\s]*$/)
      ]],
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.pattern(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)
      ]],
      username: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.pattern(/^[a-zA-Z0-9_]*$/)
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/)
      ]],
      role: ['user', [Validators.required]],
      status: ['active', [Validators.required]]
    });

    console.log(this.newUserForm);
    
  }

  ngOnInit() {
    this.loadUserProfile();
    // Check role from both localStorage and current user data
    this.checkAdminStatus();
  }

  private checkAdminStatus() {
    const storedRole = localStorage.getItem('role');
    console.log('Profile Component - Role Check:', {
      storedRole,
      localStorageItems: {
        role: localStorage.getItem('role'),
        userId: localStorage.getItem('userId'),
        userName: localStorage.getItem('userName'),
        token: localStorage.getItem('token') ? 'present' : 'missing'
      },
      currentUser: this.currentUser
    });
    
    this.isAdmin = storedRole?.toLowerCase() === 'admin';
    console.log('Is admin?', this.isAdmin, 'Role comparison:', `"${storedRole}" === "admin"`);
    
    if (this.isAdmin) {
      console.log('Loading users for admin...');
      this.loadUsers();
    }
  }

  loadUsers() {
    this.authService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
      },
      error: (error) => {
        Swal.fire('Error', 'Failed to load users', 'error');
      }
    });
  }

  toggleUserStatus(userId: string, currentStatus: string) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    this.authService.updateUserStatus(userId, newStatus).subscribe({
      next: () => {
        Swal.fire('Success', 'User status updated successfully', 'success');
        this.loadUsers(); // Reload the users list
      },
      error: (error) => {
        Swal.fire('Error', 'Failed to update user status', 'error');
      }
    });
  }

  deleteUser(userId: string) {
    Swal.fire({
      title: 'Delete User',
      text: 'Are you sure you want to delete this user? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.authService.deleteUser(userId).subscribe({
          next: () => {
            Swal.fire('Deleted', 'User deleted successfully', 'success');
            this.loadUsers();
          },
          error: (error) => {
            Swal.fire('Error', error.error?.message || 'Failed to delete user', 'error');
          }
        });
      }
    });
  }

  // In ProfileComponent class
trackByUserId(index: number, user: any): string {
  return user.id;
}

  filterUsers() {
    if (this.userStatusFilter === 'all') {
      return this.users;
    }
    return this.users.filter(user => user.status === this.userStatusFilter);
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { 'mismatch': true };
  }

  loadUserProfile() {
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.authService.getUserProfile(userId).subscribe({
        next: (user) => {
          this.currentUser = {
            id: user.id,
            name: user.name || user.username,
            username: user.username,
            email: user.email,
            role: user.role
          };
          
          // Update local storage with latest role
          if (user.role) {
            localStorage.setItem('role', user.role);
            this.isAdmin = user.role === 'admin';
            if (this.isAdmin) {
              this.loadUsers();
            }
          }
          
          this.profileForm.patchValue({
            username: user.username,
            email: user.email
          });
        },
        error: (error) => {
          console.error('Profile load error:', error); // Debug log
          Swal.fire('Error', 'Failed to load profile', 'error');
        }
      });
    } else {
      // Fallback to stored values if API call isn't available yet
      const storedRole = localStorage.getItem('role');
      this.currentUser = {
        name: localStorage.getItem('userName') || 'User',
        role: storedRole || 'user'
      };
      this.isAdmin = storedRole === 'admin';
      if (this.isAdmin) {
        this.loadUsers();
      }
    }
  }

  updateProfile() {
    if (this.profileForm.valid) {
      this.authService.updateProfile(this.profileForm.value).subscribe({
        next: () => {
          Swal.fire('Success', 'Profile updated successfully', 'success');
        },
        error: (error) => {
          Swal.fire('Error', error.error.message || 'Failed to update profile', 'error');
        }
      });
    }
  }

  changePassword() {
    if (this.passwordForm.valid) {
      this.authService.changePassword(this.passwordForm.value).subscribe({
        next: () => {
          Swal.fire('Success', 'Password changed successfully', 'success');
          this.passwordForm.reset();
        },
        error: (error) => {
          Swal.fire('Error', error.error.message || 'Failed to change password', 'error');
        }
      });
    }
  }

  createNewUser() {
    if (this.newUserForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.newUserForm.controls).forEach(key => {
        const control = this.newUserForm.get(key);
        control?.markAsTouched();
      });

      // Find the first error message to display
      let errorMessage = '';
      for (const controlName of Object.keys(this.newUserForm.controls)) {
        const message = this.getErrorMessage(controlName);
        if (message) {
          errorMessage = message;
          break;
        }
      }

      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: errorMessage || 'Please fill in all required fields correctly.',
        showConfirmButton: true
      });
      return;
    }

    // Create a copy of the form value to ensure we send the right fields
    const userData = {
      fullname: this.newUserForm.get('fullname')?.value.trim(),
      email: this.newUserForm.get('email')?.value.trim().toLowerCase(),
      username: this.newUserForm.get('username')?.value.trim(),
      password: this.newUserForm.get('password')?.value,
      role: this.newUserForm.get('role')?.value,
      status: this.newUserForm.get('status')?.value || 'active'
    };

    // Log the request data (excluding sensitive info)
    console.log('Creating new user:', {
      ...userData,
      password: '[HIDDEN]'
    });

    Swal.fire({
      title: 'Creating User',
      text: 'Please wait...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.authService.createUser(userData).subscribe({
      next: (response) => {
        console.log('User created successfully:', response);
        
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'New user has been created successfully',
          showConfirmButton: true
        }).then(() => {
          this.resetForm();
          this.loadUsers(); // Reload the users list
        });
      },
      error: (error) => {
        console.error('Error creating user:', error);
        
        let errorMessage = 'Failed to create user.';
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.error?.errors && Array.isArray(error.error.errors)) {
          errorMessage = error.error.errors.map((e: any) => e.msg).join('\n');
        }

        Swal.fire({
          icon: 'error',
          title: 'Error Creating User',
          text: errorMessage,
          showConfirmButton: true
        });
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  showuser() {
    console.log('Current User:', this.currentUser);
    console.log('Is Admin?', this.isAdmin);
    console.log('Stored Role:', localStorage.getItem('role'));
  }

  // Form validation helper methods
  getErrorMessage(controlName: string): string {
    const control = this.newUserForm.get(controlName);
    if (!control) return '';
    
    if (control.hasError('required')) {
      return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} is required`;
    }

    if (control.hasError('minlength')) {
      const minLength = control.errors?.['minlength'].requiredLength;
      return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} must be at least ${minLength} characters`;
    }

    if (control.hasError('pattern')) {
      switch (controlName) {
        case 'fullname':
          return 'Full name can only contain letters and spaces';
        case 'username':
          return 'Username can only contain letters, numbers, and underscores';
        case 'email':
          return 'Please enter a valid email address';
        case 'password':
          return 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
        default:
          return 'Invalid format';
      }
    }

    if (control.hasError('email')) {
      return 'Please enter a valid email address';
    }

    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.newUserForm.get(fieldName);
    return field ? (field.invalid && (field.dirty || field.touched)) : false;
  }

  resetForm() {
    this.newUserForm.reset({
      role: 'user',
      status: 'active'
    });
    Object.keys(this.newUserForm.controls).forEach(key => {
      const control = this.newUserForm.get(key);
      control?.markAsUntouched();
      control?.markAsPristine();
    });
  }
}
