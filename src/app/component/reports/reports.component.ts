import { Component,OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {  ReportService } from '../../services/reports.service';
import { NgFor, NgIf, DatePipe } from '@angular/common';


@Component({
  selector: 'app-reports',
  imports: [ReactiveFormsModule, FormsModule,NgIf,NgFor,DatePipe],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent implements OnInit {
    reportForm: FormGroup;
  isLoading = false;
  isDownloading = false;
  errorMessage = '';
  successMessage = '';
  results: any[] = [];
  agentSuggestions: any[] = [];
  isSearchingAgent = false;
  url = 'http://localhost:3001/uploads/';
  placeholderImage = 'assets/placeholder/user.png';

  constructor(private fb: FormBuilder, private reportService: ReportService) {
    this.reportForm = this.fb.group({
      reportType: ['', Validators.required],
      agentName: [''],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      sourceType: [''],
      visaType: [''],
      abscondingType: ['']
    });

    // Add agent name search debounce
    this.reportForm.get('agentName')?.valueChanges.subscribe(value => {
      if (value && value.length >= 2) {
        this.searchAgents(value);
      } else {
        this.agentSuggestions = [];
      }
    });
  }

  ngOnInit(): void {}

  get reportType(): string {
    return this.reportForm.get('reportType')?.value;
  }

  searchAgents(query: string): void {
    this.isSearchingAgent = true;
    this.reportService.searchAgents(query).subscribe(
      (agents) => {
        this.agentSuggestions = agents;
        this.isSearchingAgent = false;
      },
      (error) => {
        console.error('Error searching agents:', error);
        this.isSearchingAgent = false;
      }
    );
  }

  selectAgent(agent: any): void {
    // Store Agent ID in the filter (backend expects Agent_id). Display name stays in suggestions before selection.
    const agentId = agent.agent_id ?? agent.Id ?? agent.id ?? agent.name;
    this.reportForm.patchValue({
      agentName: agentId
    });
    this.agentSuggestions = [];
  }

  onReportTypeChange(event: any): void {
    const type = event.target.value;
    // Reset visa-specific fields if not visa
    if (type !== 'visa') {
      this.reportForm.patchValue({
        sourceType: '',
        visaType: '',
        abscondingType: ''
      });
    }
    // Clear previous results when changing report type
    this.results = [];
    this.errorMessage = '';
    this.successMessage = '';
  }

   private groupAgentResults(data: any[]): any[] {
    // Create a map of agents and their clients
    const agentMap = new Map();
    
    data.forEach(item => {
      const agentId = item.agent_id ?? item.Id;
      if (!agentMap.has(agentId)) {
        // Initialize agent entry with base info and empty clients array
        agentMap.set(agentId, {
          agent_id: agentId,
          companyName: item.companyName ?? item.CompanyName,
          email: item.email ?? item.Email,
          contact: item.contact ?? item.Contact,
          agent_created_at: item.agent_created_at ?? item.Created_At,
          clients: []
        });
      }
      
      // Add client info if it exists
      if (item.client_first_name || item.client_last_name) {
        agentMap.get(agentId).clients.push({
          first_name: item.client_first_name,
          last_name: item.client_last_name,
          Image: item.client_image || item.client_Image,
          image: item.client_image || item.client_Image,
          client_image: item.client_image || item.client_Image,
          passport_no: item.client_passport_no,
          email: item.client_email,
          visa_type: item.client_visa_type,
          visa_source: item.client_visa_source,
          created_at: item.client_created_at
        });
      }
    });
    
    // Convert map to array
    return Array.from(agentMap.values());
  }

   private groupSupplierResults(data: any[]): any[] {
    // Create a map of agents and their clients
    const supplierMap = new Map();
    
    data.forEach(item => {
      const supplierId = item.supplier_id ?? item.Id;
      if (!supplierMap.has(supplierId)) {
        // Initialize supplier entry with base info and empty clients array
        supplierMap.set(supplierId, {
          supplier_id: supplierId,
          companyName: item.companyName ?? item.CompanyName,
          email: item.email ?? item.Email,
          contact: item.contact ?? item.Contact,
          supplier_created_at: item.supplier_created_at ?? item.Created_At,
          clients: []
        });
      }
      
      // Add client info if it exists
      if (item.client_first_name || item.client_last_name) {
        supplierMap.get(supplierId).clients.push({
          first_name: item.client_first_name,
          last_name: item.client_last_name,
          passport_no: item.client_passport_no,
          email: item.client_email,
          visa_type: item.client_visa_type,
          visa_source: item.client_visa_source,
          created_at: item.client_created_at
        });
      }
    });
    
    // Convert map to array
    return Array.from(supplierMap.values());
  }

  async onSubmit(): Promise<void> {
    if (this.reportForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const formData = this.reportForm.value;
      const response = await this.reportService.generateReport(formData).toPromise();
      
      // Process data based on report type
      const rawData = response.data || [];
      this.results = this.reportType === 'agent' 
        ? this.groupAgentResults(rawData)
        : rawData;

      if (this.results.length > 0) {
        const recordCount = this.reportType === 'agent'
          ? this.results.reduce((total: number, agent: any) => total + (agent.clients?.length || 0), 0)
          : this.results.length;
        this.successMessage = `Generated ${this.results.length} ${this.reportType === 'agent' ? 'agents with ' + recordCount + ' total clients' : 'records'}.`;
      } else {
        this.successMessage = 'No records found for the selected filters.';
      }
    } catch (error: any) {
      this.errorMessage = error.error?.message || 'Failed to generate report.';
      this.results = []; // Clear results on error
    } finally {
      this.isLoading = false;
    }
  }

  async downloadExcel(): Promise<void> {
    if (this.reportForm.invalid || !this.results.length) return;

    this.isDownloading = true;
    this.errorMessage = '';

    try {
      const formData = this.reportForm.value;
      const blob = await this.reportService.downloadExcel(formData).toPromise();
      
      if (!blob) {
        throw new Error('No data received');
      }
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.reportType}-report-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
    } catch (error: any) {
      this.errorMessage = 'Failed to download Excel report.';
      console.error('Excel download error:', error);
    } finally {
      this.isDownloading = false;
    }
  }

  getImageUrl(imagePath: string | null | undefined): string {
    if (!imagePath || imagePath === 'null' || imagePath === 'undefined' || imagePath.trim() === '') {
      return this.placeholderImage;
    }
    // Remove leading slash if present to avoid double slashes
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    return this.url + cleanPath;
  }

  onImageError(event: any): void {
    console.warn('Image load failed:', event.target.src);
    event.target.src = this.placeholderImage;
  }
}

