import { Component, NgModule, OnInit, OnDestroy } from '@angular/core';
import { NgStyle, NgIf, NgFor, DatePipe } from "@angular/common";
import Swal from 'sweetalert2';
import { AgentSearchModalComponent } from '../../shared/agent-search-modal/agent-search-modal.component';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule} from '@angular/forms';
import { ClientService } from '../../services/client.service';
import { AgentService } from '../../services/agent.service';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { SupplierSearchModalComponent } from '../../shared/supplier-search-modal/supplier-search-modal.component';


interface client {
  first_name: string,
  last_name: string,
  image: string,
  uid:string,
  passport_no: string,
  email: string,
  visa_approved_at: string | null,
  migrated_at: string | null,
  visa_expiry_date: string | null,
  visa_extend_for: string | null,
  visa_source: string | null,
  visa_type: string | null,
  absconding_type: string | null,
  agent_id: string | null,
  CompanyName:string | null,
  supplier_id: string | null,
  SupplierCompanyName: string | null,
  comment: string | null
}

@Component({
  selector: 'app-client-details',
  imports: [
    NgStyle, 
    ReactiveFormsModule, 
    FormsModule, 
    NgFor, 
    NgIf, 
    DatePipe, 
    CommonModule, 
    SupplierSearchModalComponent, 
    AgentSearchModalComponent
  ],
  templateUrl: './client-details.component.html',
  styleUrls: ['./client-details.component.scss'],
  standalone: true
})
export class ClientDetailsComponent implements OnInit {
  // Sorting and filtering state
  currentSort: string = '';
  showExpiringOnly: boolean = false;
  
  // Search state
  searchQuery: string = '';
  searchField: string = 'all';
  private searchDebouncer: any;
  originalClients: any[] = []; // Store the original list
  
  saveClient: FormGroup;
  isVisible: boolean = false;
  isVisibleView: boolean = false;
  openModel: string = "none";
  openViewModel: string = "none"
  deleteSwal: any;
  file: File | null = null;
  currentImageName: string | null = null;
  agents: any[] = [];
  selectedAgent: any = null;
  clients: any[] = [];
  error: string = '';
  clientHistory: any[] = [];
  filteredClientHistory: any[] = [];
  activeTab: 'active' | 'history' = 'active';
  selectedHistoryStatus: string = 'all';
  get isAdmin(): boolean {
    const role = (localStorage.getItem('role') || '').toLowerCase();
    const isAdmin = role === 'admin';
    console.log('Role check:', { role, isAdmin });
    return isAdmin;
  }
  isEditMode: boolean = false;
  isViewMode: boolean = false;
  selectedClientId: number | null = null;
  person: client | undefined;
  isSupplierSearchModalOpen = false;
  selectedSupplier: any = null;
  isAgentSearchModalOpen = false;

  private apiUrl = `${environment.apiUrl}/api/clients`;
  url: string = `${environment.apiUrl}/uploads/`;
  clientData: any[] = [];
  // Use the SVG placeholder that exists under src/assets
  placeholderImage: string = 'assets/placeholder-user.svg';





  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private clientService: ClientService,
    private agentService: AgentService
  ) {
    this.saveClient = this.fb.group({
      image: ['', [Validators.required]],
      fname: ['', [Validators.required, Validators.minLength(2)]],
      lname: ['', [Validators.required, Validators.minLength(2)]],
      uid: ['', [Validators.required]],
      passport_no: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      visa_approved_at: ['', [Validators.required]],
      visa_expiry_date: ['', [Validators.required]],
      visa_extend_for: ['', [Validators.minLength(2)]],
      visa_source: ['', [Validators.required]],
      visa_type: ['', [Validators.required, Validators.minLength(3)]],
      absconding_type: ['', [Validators.required]],
      agent: ['', [Validators.minLength(1)]],
      supplier: [''],
      comment: ['']
    });
  }
  ngOnInit(): void {
    console.log('Auth Debug:', {
      token: !!localStorage.getItem('token'),
      role: localStorage.getItem('role'),
      userId: localStorage.getItem('userId')
    });
    
    this.getAllClients();
    this.getClientHistory();

    console.log(this.person);
    
  }



    // Add these validators to client-details component
  VALID_MIME_TYPES = ['image/jpeg', 'image/png'];
   MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  
  onFileSelect(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      
      // Check file type
      if (!this.VALID_MIME_TYPES.includes(file.type)) {
        Swal.fire({ 
          icon: 'error', 
          title: 'Invalid file type', 
          text: 'Please upload only JPG or PNG images' 
        });
        return;
      }
      
      // Check file size
      if (file.size > this.MAX_FILE_SIZE) {
        Swal.fire({ 
          icon: 'error', 
          title: 'File too large', 
          text: 'Please upload a file smaller than 5MB' 
        });
        return;
      }
  
      this.file = file;
      this.saveClient.patchValue({ image: file.name });
      this.currentImageName = file.name;
    }
  }

  // Create or update client method
  createClient() {

    




    // Basic client-side validation to avoid backend 400 errors
    const visaExpiryDate = this.saveClient.get('visa_expiry_date')?.value;

    if (this.saveClient.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.saveClient.controls).forEach(key => {
        this.saveClient.get(key)?.markAsTouched();
      });
      Swal.fire({ icon: 'error', title: 'Validation Error', text: 'Please fill all required fields correctly' });
      return;
    }

    // visa_expiry_date must be a valid date
    if (!visaExpiryDate || isNaN(Date.parse(visaExpiryDate))) {
      Swal.fire({ icon: 'error', title: 'Validation Error', text: 'Please provide a valid Visa Expiry date' });
      return;
    }


    // Create FormData for file upload
    const formData = new FormData();
    
    // Prepare form fields
    const formFields = {
      'first_name': this.saveClient.get('fname')?.value,
      'last_name': this.saveClient.get('lname')?.value,
      'uid': this.saveClient.get('uid')?.value,
      'passport_no': this.saveClient.get('passport_no')?.value,
      'email': this.saveClient.get('email')?.value,
      'visa_approved_at': this.saveClient.get('visa_approved_at')?.value,
      'visa_expiry_date': this.saveClient.get('visa_expiry_date')?.value,
      'visa_source': this.saveClient.get('visa_source')?.value,
      'visa_type': this.saveClient.get('visa_type')?.value?.trim().toUpperCase(),
      'absconding_type': this.saveClient.get('absconding_type')?.value,
      'visa_extend_for': this.saveClient.get('visa_extend_for')?.value || '0',
      'agent_id': this.selectedAgent ? String(this.selectedAgent.Id || this.selectedAgent.id) : '',
      'supplier_id': this.selectedSupplier ? String(this.selectedSupplier.id) : '',
      'comment': this.saveClient.get('comment')?.value || ''
    };

    // Append file if exists
    // (Image will be appended once further down — avoid duplicate appends that trigger multer "Unexpected field")

    // Append all fields to formData, converting null/undefined to empty string
    Object.entries(formFields).forEach(([key, value]) => {
      formData.append(key, value || '');
    });


    //formData.append('visa_extend_for', this.saveClient.get('visa_extend_for')?.value);
    // Use selectedAgent's Id (or id) when available, otherwise fall back to the form control value
    const selectedAgentId = this.selectedAgent
      ? (this.selectedAgent.Id ?? this.selectedAgent.id ?? this.selectedAgent)
      : (this.saveClient.get('agent')?.value ?? '');
    formData.append('agent_id', String(selectedAgentId));
    // Append file (only once) if a file was selected
    if (this.file) {
      formData.append('image', this.file, this.file.name);
    }

    // Show loading
    Swal.fire({
      title: 'Creating Client...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // If edit mode, call update endpoint, otherwise create
    if (this.isEditMode && this.selectedClientId) {
      // Update existing client
      const extendVal = this.saveClient.get('visa_extend_for')?.value;
      formData.append('visa_extend_for', (extendVal === undefined || extendVal === null || extendVal === '') ? '0' : String(extendVal));

      const token = localStorage.getItem('token');
      const headers = token ? ({ Authorization: `Bearer ${token}` } as Record<string, string>) : ({} as Record<string, string>);

      this.http.put(`${this.apiUrl}/update-client/${this.selectedClientId}`, formData, { headers }).subscribe({
        next: (response: any) => {
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Client updated successfully',
            text: response.message || 'The client has been updated',
            showConfirmButton: true,
          });
          this.saveClient.reset();
          this.selectedAgent = null;
          this.selectedSupplier = null;
          this.file = null;
          this.currentImageName = null;
          this.isEditMode = false;
          this.selectedClientId = null;
          this.handleModelClose();
          this.getAllClients();
        },
        error: (error) => {
          console.error('Error updating client', error);
          Swal.fire({ icon: 'error', title: 'Error', text: error.error?.message || 'Failed to update client.' });
        }
      });
      return;
    }

    formData.append('visa_extend_for', this.saveClient.get('visa_extend_for')?.value || '0');

    // Log the form data before sending
    const commentValue = this.saveClient.get('comment')?.value;
    console.log('Comment value:', commentValue);
    console.log('Form Data being sent:', {
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      uid: formData.get('uid'),
      passport_no: formData.get('passport_no'),
      email: formData.get('email'),
      visa_approved_at: formData.get('visa_approved_at'),
      migrated_at: formData.get('migrated_at'),
      visa_type: formData.get('visa_type'),
      visa_period: formData.get('visa_period'),
      visa_extend_for: formData.get('visa_extend_for'),
      visa_source: formData.get('visa_source'),
      absconding_type: formData.get('absconding_type'),
      agent_id: formData.get('agent_id'),
      image: formData.get('image'),
      comment: formData.get('comment'),
    });

    // Send POST request to create using the service
    this.clientService.addClient(formData).subscribe({
      next: (response: any) => {
        console.log('Client created successfully', response);

        Swal.fire({
          position: 'center',
          icon: 'success',
          title: 'Client added successfully',
          text: response.message || 'The client has been created',
          showConfirmButton: true,
        });

        // Reset form and all selections
        this.saveClient.reset();
        this.selectedAgent = null;
        this.selectedSupplier = null;
        this.file = null;
        this.currentImageName = null;
        this.handleModelClose(); // Close modal
        this.getAllClients();
      },
      error: (error) => {
        console.error('Error creating client:', error);
        console.error('Error details:', error.error);
        
        let errorMessage = 'Failed to create client. ';
        if (error.error?.message) {
          errorMessage += error.error.message;
        } else if (error.message) {
          errorMessage += error.message;
        }

        // Log the form values for debugging
        console.log('Form Values:', this.saveClient.value);

        Swal.fire({
          icon: 'error',
          title: 'Error Creating Client',
          text: errorMessage,
        });
      }
    });
  }

  clearFilters() {
    this.currentSort = '';
    this.showExpiringOnly = false;
    this.getAllClients();
  }

  onSortChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.sortClients(select.value);
  }

  onFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.showExpiringOnly = select.value === 'expiring';
    this.getAllClients();
  }

  sortClients(sortBy?: string) {
    this.currentSort = sortBy || '';
    this.getAllClients();
  }

  toggleExpiringOnly() {
    this.showExpiringOnly = !this.showExpiringOnly;
    this.getAllClients();
  }

  onSearch(query: string) {
    this.searchQuery = query;
    
    // Clear any existing timeout
    if (this.searchDebouncer) {
      clearTimeout(this.searchDebouncer);
    }
    
    // Debounce search for 300ms
    this.searchDebouncer = setTimeout(() => {
      this.applySearch();
    }, 300);
  }

  onSearchFieldChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.searchField = select.value;
    this.applySearch();
  }

  clearSearch() {
    this.searchQuery = '';
    this.clients = [...this.originalClients];
  }

  private applySearch() {
    if (!this.searchQuery.trim()) {
      this.clients = [...this.originalClients];
      return;
    }

    const query = this.searchQuery.toLowerCase().trim();
    this.clients = this.originalClients.filter(client => {
      if (this.searchField === 'all') {
        return (
          this.getClientFullName(client.First_Name, client.Last_Name).toLowerCase().includes(query) ||
          (client.Email || '').toLowerCase().includes(query) ||
          (client.uid || '').toLowerCase().includes(query) ||
          (client.passport_no || '').toLowerCase().includes(query)
        );
      } else if (this.searchField === 'name') {
        return this.getClientFullName(client.First_Name, client.Last_Name).toLowerCase().includes(query);
      } else if (this.searchField === 'email') {
        return (client.Email || '').toLowerCase().includes(query);
      } else if (this.searchField === 'uid') {
        return (client.uid || '').toLowerCase().includes(query);
      } else if (this.searchField === 'passport') {
        return (client.passport_no || '').toLowerCase().includes(query);
      }
      return false;
    });
  }

  private getClientFullName(firstName?: string, lastName?: string): string {
    return `${firstName || ''} ${lastName || ''}`.trim();
  }

  getAllClients() {
    this.clientService.getClients(this.currentSort, this.showExpiringOnly).subscribe({
      next: (data) => {
        this.clients = data;
        this.originalClients = [...data]; // Store a copy of the original data
        console.log('Sorted clients data:', data);

        this.clients = this.clients.map((client: any) => ({
          ...client,
          // Normalize known date fields to YYYY-MM-DD (strip time part) when possible
          Visa_approved_at: client.Visa_approved_at ? String(client.Visa_approved_at).split('T')[0] : null,
          migrated_at: client.migrated_at ? String(client.migrated_at).split('T')[0] : null,
          // Support both `Visa_expiry_date` (backend naming) and `visa_expiry_date` (already-normalized)
          visa_expiry_date: client.Visa_expiry_date
            ? String(client.Visa_expiry_date).split('T')[0]
            : (client.visa_expiry_date ? String(client.visa_expiry_date).split('T')[0] : null),
          // Normalize visa type and extend_for if present
          visa_type: client.Visa_type ?? client.visa_type ?? null,
          visa_extend_for: client.Visa_extend_for ?? client.visa_extend_for ?? null,
          // Normalize agent company name
          AgentCompanyName: client.AgentCompanyName || client.companyName || client.CompanyName || client.companyname || '',
          // Normalize comment field
          comment: client.Comment || client.comment || ''
        }));
        console.log(this.clients);

      },
      error: (error) => {
        this.error = error.message;
      }
    });
  }

  getClientHistory() {
    this.clientService.getClientHistory().subscribe({
      next: (data) => {
        this.clientHistory = (data || []).map((row: any) => ({
          ...row,
          visa_expiry_date: row.Visa_expiry_date ? String(row.Visa_expiry_date).split('T')[0] : (row.visa_expiry_date ? String(row.visa_expiry_date).split('T')[0] : null),
          CompanyName: row.CompanyName || row.companyName || ''
        }));
        this.applyHistoryStatusFilter();
      },
      error: (err) => {
        console.error('Error fetching client history', err);
      }
    });
  }

  async runArchive() {
    // Both admin and users can run archive
    const role = localStorage.getItem('role');
    if (role !== 'admin' && role !== 'user') {
      Swal.fire({ icon: 'error', title: 'Permission denied', text: 'Only admins and users can run the archive.' });
      return;
    }
    Swal.fire({ title: 'Running archive...', allowOutsideClick: false, didOpen() { Swal.showLoading(); } });
    this.clientService.archiveExpired().subscribe({
      next: (res: any) => {
        Swal.close();
        Swal.fire({ icon: 'success', title: 'Archive completed', text: res.message || 'Archived expired clients.' });
        // Refresh both lists
        this.getAllClients();
        this.getClientHistory();
      },
      error: (err) => {
        Swal.close();
        console.error('Archive error', err);
        Swal.fire({ icon: 'error', title: 'Archive failed', text: err.error?.message || err.message || 'Failed to run archive.' });
      }
    });
  }

  deleteFile(file: any) {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.file = null;
        this.currentImageName = null;
        this.saveClient.patchValue({ image: '' });

        Swal.fire(
          'Deleted!',
          'Your file has been removed.',
          'success'
        );
      }
    });
  }

  viewClient(clientId: number) {
    this.isViewMode = true;
    this.selectedClientId = clientId;
    // open modal
    this.isVisibleView = true;
    this.openViewModel = 'flex';

    const client = this.clients.find(c => (c.Id ?? c.id ?? c.ID) === clientId);
    if (client) {
      console.log('Client data for view:', client);
      console.log('Client comment:', client.Comment || client.comment);

      this.person = {
        first_name: client.First_Name || client.first_name || '',
        last_name: client.Last_Name || client.last_name || '',
        image: client.Image || client.image || '',
        uid: client.uid || client.Uid || '',
        passport_no: client.Passport_No || client.passport_no || '',
        email: client.Email || client.email || '',
        visa_approved_at: client.Visa_approved_at || client.visa_approved_at || '',
        migrated_at: client.Migrated_at || client.migrated_at || '',
        visa_expiry_date: client.Visa_expiry_date
          ? String(client.Visa_expiry_date).split('T')[0]
          : (client.visa_expiry_date ? String(client.visa_expiry_date).split('T')[0] : ''),
        visa_extend_for: client.Visa_extend_for || client.visa_extend_for || '',
        visa_source: client.Visa_source || client.visa_source || '',
        visa_type: client.Visa_type || client.visa_type || '',
        absconding_type: client.Absconding_type || client.absconding_type || '',
        agent_id: client.Agent_id || client.agent_id || '',
        CompanyName: client.AgentCompanyName || client.CompanyName || client.companyName || '',
        supplier_id: client.Supplier_id || client.supplier_id || '',
        SupplierCompanyName: client.SupplierCompanyName || client.supplier_company_name || '',
        comment: client.Comment || client.comment || ''
      };
      console.log(this.person.uid);
      // // set image path
      // this.clientData = this.person.image;
      // console.log('Mapped person object:', this.person);
    }


  }

  deleteClient(clientId: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: "This will permanently delete the client.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed) {
        this.clientService.deleteClient(clientId).subscribe({
          next: () => {
            Swal.fire('Deleted!', 'Client has been deleted.', 'success');
            this.getAllClients();
          },
          error: (err) => {
            console.error('Delete client error', err);
            Swal.fire('Error', 'Failed to delete client.', 'error');
          }
        });
      }
    });
  }

  editClient(clientId: number) {
    this.isEditMode = true;
    this.selectedClientId = clientId;
    // open modal
    this.isVisible = true;
    this.openModel = 'flex';

    const client = this.clients.find(c => (c.Id ?? c.id ?? c.ID) === clientId);
    if (client) {
      console.log('Client data for edit:', client); // Debug log
      this.saveClient.patchValue({
        image: client.Image || client.image || '',
        fname: client.First_Name || client.first_name || '',
        lname: client.Last_Name || client.last_name || '',
        passport_no: client.Passport_No || client.passport_no || '',
        email: client.Email || client.email || '',
        uid: client.uid,
        visa_approved_at: client.Visa_approved_at ? String(client.Visa_approved_at).split('T')[0] : (client.visa_approved_at ? String(client.visa_approved_at).split('T')[0] : ''),
        visa_expiry_date: client.Visa_expiry_date ? String(client.Visa_expiry_date).split('T')[0] : (client.visa_expiry_date ? String(client.visa_expiry_date).split('T')[0] : ''),
        visa_source: (client.visa_source ?? client.Visa_source ?? '').trim().toUpperCase(),
        visa_type: (client.visa_type ?? client.Visa_type ?? '').trim().toUpperCase(),
        absconding_type: (client.absconding_type ?? client.Absconding_type ?? '').trim().toLowerCase(),
        visa_period: client.visa_period ?? client.Visa_period ?? '',
        visa_extend_for: client.visa_extend_for ?? client.Visa_extend_for ?? '',
        agent: client.agent_id || client.Agent_id || '',
        supplier: client.supplier_id || client.Supplier_id || '',
        agentName: client.AgentCompanyName || '',
        supplierName: client.SupplierCompanyName || '',
        comment: client.comment || ''
      });
      
      // Handle agent selection
      if (client.agent_id || client.Agent_id) {
        this.selectedAgent = {
          Id: client.agent_id || client.Agent_id,
          CompanyName: client.AgentCompanyName || ''
        };
      }
      
      // Handle supplier selection
      if (client.supplier_id || client.Supplier_id) {
        this.selectedSupplier = {
          id: client.supplier_id || client.Supplier_id,
          company_name: client.SupplierCompanyName || ''
        };
      }
      
      // Handle supplier selection
      if (client.supplier_id) {
        this.selectedSupplier = {
          id: client.supplier_id,
          company_name: client.SupplierCompanyName || ''
        };
      }
      console.log('Patched visa_source:', this.saveClient.value.visa_source);


      // Update the file display if there's an image
      if (client.Image || client.image) {
        this.file = null; // Reset file input
        // show the current image filename in the UI
        this.currentImageName = client.Image || client.image || null;
      }
    }
  }

  handleViewModel() {
    this.isVisibleView = !this.isVisibleView;
    this.openViewModel = this.isVisibleView ? 'flex' : 'none';

  }
  handleViewModelClose() {
    this.isVisibleView = false;
    this.openViewModel = "none";
    this.isViewMode = false;
    this.selectedClientId = null;

  }


  handleModel() {
    // Toggle modal visibility. Editing state is managed in editClient()
    this.isVisible = !this.isVisible;
    this.openModel = this.isVisible ? 'flex' : 'none';
    if (!this.isVisible) {
      this.isEditMode = false;
      this.selectedClientId = null;
    }
  }

  handleModelClose() {
    this.isVisible = false;
    this.openModel = "none";
    this.isEditMode = false;
    this.selectedClientId = null;
    this.selectedSupplier = null;
    this.saveClient.reset();
  }

  openAgentSearchModal() {
    this.isAgentSearchModalOpen = true;
  }

  closeAgentSearchModal() {
    this.isAgentSearchModalOpen = false;
  }

  onAgentSelected(agent: any) {
    this.selectedAgent = agent;
    this.saveClient.patchValue({ agent: agent.Id }); // Use agent.Id for the form value
    this.closeAgentSearchModal();
  }

  addClient() {
    this.createClient(); // Call the actual create method
  }

  openSupplierSearchModal() {
    this.isSupplierSearchModalOpen = true;
  }

  closeSupplierSearchModal() {
    this.isSupplierSearchModalOpen = false;
  }

  onSupplierSelected(supplier: any) {
    this.selectedSupplier = supplier;
    this.saveClient.patchValue({ supplier: supplier.id });
  }

  getImageUrl(imagePath: string | null | undefined): string {
    return imagePath ? (this.url + imagePath) : this.placeholderImage;
  }

  getClientName(name: string | null | undefined): string {
    return (name || 'Client') + '\'s photo';
  }

  onImageError(event: any) {
    try {
      event.target.src = this.placeholderImage;
      console.log('Set placeholder image:', this.placeholderImage);
    } catch (e) {
      console.warn('Failed to set placeholder image', e);
    }
  }

  isExpired(expiryDate: string): boolean {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  }

  isExpiringSoon(expiryDate: string): boolean {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const tenDays = 10 * 24 * 60 * 60 * 1000; // 10 days in milliseconds
    return expiry > today && expiry.getTime() - today.getTime() <= tenDays;
  }

  updateHistoryStatus(historyId: number, status: string) {
    const statusLabel = status === 'closed' ? 'Close' : status === 'status changed' ? 'Change Status' : 'Absconded';
    
    Swal.fire({
      title: `Confirm ${statusLabel}`,
      text: `Are you sure you want to mark this client as "${status}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: `Yes, ${statusLabel.toLowerCase()}!`
    }).then((result) => {
      if (result.isConfirmed) {
        this.clientService.updateHistoryStatus(historyId, status).subscribe({
          next: (response: any) => {
            Swal.fire({
              icon: 'success',
              title: 'Status Updated',
              text: response.message || `Client status has been updated to "${status}"`,
              showConfirmButton: true,
            });
            this.getClientHistory(); // Refresh the history list
          },
          error: (error) => {
            console.error('Error updating history status', error);
            Swal.fire({ 
              icon: 'error', 
              title: 'Error', 
              text: error.error?.message || 'Failed to update status.' 
            });
          }
        });
      }
    });
  }

  onHistoryStatusFilterChange(event: any) {
    this.selectedHistoryStatus = event.target.value;
    this.applyHistoryStatusFilter();
  }

  applyHistoryStatusFilter() {
    if (this.selectedHistoryStatus === 'all') {
      this.filteredClientHistory = [...this.clientHistory];
    } else {
      this.filteredClientHistory = this.clientHistory.filter(history => {
        const status = history.Status || 'archived';
        return status === this.selectedHistoryStatus;
      });
    }
  }

  clearHistoryFilters() {
    this.selectedHistoryStatus = 'all';
    this.applyHistoryStatusFilter();
  }
}