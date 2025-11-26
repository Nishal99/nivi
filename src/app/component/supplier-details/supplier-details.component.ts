import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupplierService } from '../../services/supplier.service';
import Swal from 'sweetalert2';
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
            Swal.fire('Error', error?.error?.message || 'Failed to update supplier', 'error');
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
            const msg = error?.error?.message || (error?.statusText ? `${error.status} ${error.statusText}` : 'Failed to create supplier');
            Swal.fire('Error creating supplier', msg, 'error');
          }
        });
    }
  }

  deleteSupplier(id: number) {
    const supplier = this.suppliers.find(s => (s.id ?? s.id) === id);
    const otherSuppliers = this.suppliers.filter(s => (s.id ?? s.id) !== id && (s.status ?? 'active') === 'active');
    if (otherSuppliers.length === 0) {
      alert('Please create or activate another supplier before deleting this one.');
      return;
    }

    const options = otherSuppliers.map(s => `<option value="${s.id}">${s.company_name}</option>`).join('');
    Swal.fire({
      title: 'Reassign clients before deleting supplier',
      html: `
        <p class="mb-2">Select the supplier to reassign existing clients to:</p>
        <select id="reassignSupplierSelect" class="swal2-select form-select">${options}</select>
      `,
      showCancelButton: true,
      confirmButtonText: 'Reassign & Delete',
      preConfirm: () => {
        const select = (document.getElementById('reassignSupplierSelect') as HTMLSelectElement);
        return select ? select.value : null;
      }
    }).then((result: any) => {
            if (result.isConfirmed && result.value) {
        const newSupplierId = Number(result.value);
        this.supplierService.reassignAndDelete(id, newSupplierId).subscribe({
          next: () => {
            Swal.fire('Success', 'Clients reassigned and supplier deactivated', 'success');
            this.loadSuppliers();
          },
          error: (err) => {
            console.error('Error reassigning supplier:', err);
            Swal.fire('Error', 'Failed to reassign and delete supplier', 'error');
          }
        });
      }
    });
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