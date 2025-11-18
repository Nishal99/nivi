import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupplierService } from '../../services/supplier.service';

@Component({
  selector: 'app-supplier-search-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-semibold text-gray-900">Select Supplier</h3>
          <button 
            (click)="closeModal()"
            class="text-gray-500 hover:text-gray-700">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Search Input -->
        <div class="mb-4">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (input)="searchSuppliers()"
            placeholder="Search suppliers..."
            class="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
        </div>

        <!-- Suppliers List -->
        <div class="max-h-96 overflow-y-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Person</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let supplier of suppliers" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">{{ supplier.company_name }}</td>
                <td class="px-6 py-4 whitespace-nowrap">{{ supplier.contact_person }}</td>
                <td class="px-6 py-4 whitespace-nowrap">{{ supplier.contact_email }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <button
                    (click)="selectSupplier(supplier)"
                    class="text-blue-600 hover:text-blue-900">
                    Select
                  </button>
                </td>
              </tr>
              <tr *ngIf="suppliers.length === 0">
                <td colspan="4" class="px-6 py-4 text-center text-gray-500">
                  No suppliers found
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class SupplierSearchModalComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() select = new EventEmitter<any>();

  suppliers: any[] = [];
  searchQuery: string = '';

  constructor(private supplierService: SupplierService) {}

  searchSuppliers() {
    if (this.searchQuery.trim()) {
      this.supplierService.searchSuppliers(this.searchQuery).subscribe({
        next: (data) => {
          this.suppliers = data;
        },
        error: (error) => {
          console.error('Error searching suppliers:', error);
        }
      });
    } else {
      this.suppliers = [];
    }
  }

  selectSupplier(supplier: any) {
    this.select.emit(supplier);
    this.closeModal();
  }

  closeModal() {
    this.searchQuery = '';
    this.suppliers = [];
    this.close.emit();
  }
}