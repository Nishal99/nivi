import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupplierService } from '../../services/supplier.service';
import { SupplierFormModalComponent } from './supplier-form-modal.component';

@Component({
  selector: 'app-supplier-details',
  standalone: true,
  imports: [CommonModule, FormsModule, SupplierFormModalComponent],
  templateUrl: './supplier-details.component.html',
  styleUrls: ['./supplier-details.component.scss']
})
export class SupplierDetailsComponent implements OnInit {
  suppliers: any[] = [];
  selectedSupplier: any = null;
  isEditing: boolean = false;
  searchQuery: string = '';
  isModalOpen: boolean = false;

  constructor(private supplierService: SupplierService) {}

  ngOnInit() {
    this.loadSuppliers();
  }

  loadSuppliers() {
    this.supplierService.getAllSuppliers().subscribe({
      next: (data) => {
        this.suppliers = data;
      },
      error: (error) => {
        console.error('Error loading suppliers:', error);
      }
    });
  }

  openAddModal() {
    this.isEditing = false;
    this.selectedSupplier = null;
    this.isModalOpen = true;
  }

  editSupplier(supplier: any) {
    this.selectedSupplier = supplier;
    this.isEditing = true;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedSupplier = null;
    this.isEditing = false;
  }

  saveSupplier(supplierData: any) {
    if (this.isEditing && this.selectedSupplier) {
      this.supplierService.updateSupplier(this.selectedSupplier.id, supplierData)
        .subscribe({
          next: () => {
            this.loadSuppliers();
            this.closeModal();
          },
          error: (error) => {
            console.error('Error updating supplier:', error);
          }
        });
    } else {
      this.supplierService.createSupplier(supplierData)
        .subscribe({
          next: () => {
            this.loadSuppliers();
            this.closeModal();
          },
          error: (error) => {
            console.error('Error creating supplier:', error);
          }
        });
    }
  }

  deleteSupplier(id: number) {
    if (confirm('Are you sure you want to delete this supplier?')) {
      this.supplierService.deleteSupplier(id).subscribe({
        next: () => {
          this.loadSuppliers();
        },
        error: (error) => {
          console.error('Error deleting supplier:', error);
        }
      });
    }
  }

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
      this.loadSuppliers();
    }
  }
}