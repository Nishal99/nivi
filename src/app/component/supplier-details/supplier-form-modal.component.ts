import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-supplier-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 class="text-2xl font-semibold text-gray-800">{{ isEditing ? 'Edit Supplier' : 'Add New Supplier' }}</h3>
          <button type="button" (click)="closeModal()" class="p-2 rounded hover:bg-red-50 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-gray-500 hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form [formGroup]="supplierForm" (ngSubmit)="onSubmit()" class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Company Details -->
            <div class="space-y-4">
              <label class="block text-sm font-medium text-gray-700">Company Name</label>
              <input type="text" formControlName="company_name" placeholder="e.g., ABC Supplies" class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500" />

              <label class="block text-sm font-medium text-gray-700">Company Email</label>
              <input type="email" formControlName="email" placeholder="company@example.com" class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500" />

              <label class="block text-sm font-medium text-gray-700">Contact</label>
              <input type="text" formControlName="contact" placeholder="+94 112 345 678" class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500" />
            </div>

            <!-- Contact Person Details -->
            <div class="space-y-4">
              <label class="block text-sm font-medium text-gray-700">Contact Person</label>
              <input type="text" formControlName="contact_person" placeholder="John Doe" class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500" />

              <label class="block text-sm font-medium text-gray-700">Person's Email</label>
              <input type="email" formControlName="contact_email" placeholder="person@example.com" class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500" />

              <label class="block text-sm font-medium text-gray-700">Person's Phone</label>
              <input type="tel" formControlName="contact_number" placeholder="+94 777 123 456" class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div class="mt-6">
            <label class="block text-sm font-medium text-gray-700">Status</label>
            <select formControlName="status" class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </form>

        <!-- Footer Actions -->
        <div class="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button type="button" (click)="closeModal()" class="px-4 py-2 bg-gray-100 rounded-md text-gray-700 hover:bg-gray-200">Cancel</button>
          <button type="button" (click)="onSubmit()" [disabled]="supplierForm.invalid" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">{{ isEditing ? 'Update Supplier' : 'Create Supplier' }}</button>
        </div>
      </div>
    </div>
  `
})
export class SupplierFormModalComponent implements OnInit {
  @Input() isOpen = false;
  @Input() isEditing = false;
  @Input() supplierData: any = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  supplierForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.supplierForm = this.fb.group({
      company_name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      contact: ['', [Validators.required]],
      contact_person: ['', [Validators.required]],
      contact_email: ['', [Validators.required, Validators.email]],
      contact_number: ['', [Validators.required]],
      status: ['active']
    });
  }

  ngOnInit() {
    if (this.supplierData) {
      this.supplierForm.patchValue(this.supplierData);
    }
  }

  closeModal() {
    this.supplierForm.reset({ status: 'active' });
    this.close.emit();
  }

  onSubmit() {
    if (this.supplierForm.valid) {
      this.save.emit(this.supplierForm.value);
      this.closeModal();
    }
  }
}