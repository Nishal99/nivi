import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-supplier-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-semibold text-gray-900">{{ isEditing ? 'Edit' : 'Add' }} Supplier</h3>
          <button 
            (click)="closeModal()"
            class="text-gray-500 hover:text-gray-700">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form [formGroup]="supplierForm" (ngSubmit)="onSubmit()" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Company Name</label>
              <input type="text" formControlName="company_name"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700">Contact </label>
              <input type="text" formControlName="contact"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" formControlName="email"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Contact person</label>
              <input type="text" formControlName="contact_person"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Contact email</label>
              <input type="text" formControlName="contact_email"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Contact Number</label>
              <input type="text" formControlName="contact_number"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Status</label>
              <select formControlName="status"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div class="flex justify-end space-x-4 pt-4">
            <button type="button" (click)="closeModal()"
              class="px-4 py-2 border rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500">
              Cancel
            </button>
            <button type="submit"
              
              class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              [ngClass]="{'opacity-50 cursor-not-allowed': !supplierForm.valid}">
              {{ isEditing ? 'Update' : 'Add' }} Supplier
            </button>
          </div>
        </form>
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