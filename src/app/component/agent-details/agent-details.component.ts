import { CommonModule, NgStyle } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { AgentService } from '../../services/agent.service';
import { __values } from 'tslib';

interface agent {
  Id: number;
  companyName: string;
  email: string;
  contact: string;
  contactPersonName: string;
  contactPersonEmail: string;
  contactPersonPhone: string;
}

@Component({
  selector: 'app-agent-details',
  standalone: true,
  imports: [NgStyle, ReactiveFormsModule, FormsModule, CommonModule, HttpClientModule],
  templateUrl: './agent-details.component.html',
  styleUrls: ['./agent-details.component.scss']
})
export class AgentDetailsComponent implements OnInit {
viewAgent(arg0: any) {
throw new Error('Method not implemented.');
}

  isVisible: boolean = false;
  openModel: string = "none";
  deleteSwal: any;
  file: any;
  agentForm: FormGroup;
  agentsList: any[] = [];
  activeStatus: String = '';
  agents: agent[] = [];
  isEditMode: boolean = false;
  selectedAgentId: number | null = null;
  selectedAgent: any[]  = [];

  private apiUrl = 'http://localhost:3001/api/agents';



  constructor(private fb: FormBuilder, private agentService: AgentService) {
    this.agentForm = this.fb.group({
      companyName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      contact: ['', Validators.required],
      contactPersonName: ['', Validators.required],
      contactPersonEmail: ['', [Validators.required, Validators.email]],
      contactPersonPhone: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.getAgentList();
  }

  onSubmit() {
    if (!this.agentForm.valid) {
      return; // Don't submit if the form is invalid
    }

    Swal.fire({
      title: this.isEditMode ? 'Updating Agent...' : 'Creating Agent...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    if (this.isEditMode && this.selectedAgentId) {
      // Update existing agent
      const updatedAgent = {
        id: this.selectedAgentId,
        ...this.agentForm.value,
      };

      this.agentService.editAgent(updatedAgent).subscribe({
        next: (response: any) => {
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Agent updated successfully',
            showConfirmButton: false,
            timer: 1500,
          });
          this.handleModelClose();
          this.getAgentList();
        },
        error: (error) => {
          Swal.fire({
            position: 'center',
            icon: 'error',
            title: 'Failed to update agent',
            text: error.message,
            showConfirmButton: true,
          });
        },
      });
    } else {
      // Create new agent
      this.agentService.addAgent(this.agentForm.value).subscribe({
        next: (response) => {
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Agent created successfully',
            showConfirmButton: false,
            timer: 1500,
          });
          this.handleModelClose();
          this.getAgentList();
        },
        error: (error) => {
          Swal.fire({
            position: 'center',
            icon: 'error',
            title: 'Failed to create agent',
            text: error.message,
            showConfirmButton: true,
          });
        },
      });
    }
  }

  getAgentList() {
    this.agentService.getAllAgents().subscribe({
      next: (data: any[]) => {
        // Assign the response directly to agentsList.
        this.agentsList = data || [];
        console.log('Fetched agents list:', this.agentsList);
      },
      error: (error) => {
        console.error('Failed to fetch agents list', error);
      }
    });
  }
  
  // Call this function when you want to open the modal for editing
  editAgent(agentOrId: any) {
    // Accept either an id (number) or the full agent object from the template
    let id: number | null = null;
    if (typeof agentOrId === 'object' && agentOrId !== null) {
      id = agentOrId.Id ?? agentOrId.id ?? null;
    } else {
      id = agentOrId;
    }

    if (id === null || id === undefined) {
      console.error('editAgent called without a valid id or agent object:', agentOrId);
      return;
    }

    this.isEditMode = true;
    this.selectedAgentId = id;
    this.openModel = 'flex';
    this.isVisible = true;

    // Find the agent by either PascalCase or camelCase id field
    const agentToEdit = this.agentsList.find(a => (a.Id ?? a.id) === id);

    if (!agentToEdit) {
      console.error(`Agent with ID ${id} not found.`);
      this.handleModelClose(); // Close if agent not found
      return;
    }

    console.log('Populating form with agent data:', agentToEdit);
    // Populate the form using whichever property names exist on the returned object
    this.agentForm.patchValue({
      companyName: agentToEdit.CompanyName ?? agentToEdit.companyName ?? '',
      email: agentToEdit.Email ?? agentToEdit.email ?? '',
      contact: agentToEdit.Contact ?? agentToEdit.contact ?? '',
      contactPersonName: agentToEdit.ContactPersonName ?? agentToEdit.contactPersonName ?? '',
      contactPersonEmail: agentToEdit.ContactPersonEmail ?? agentToEdit.contactPersonEmail ?? '',
      contactPersonPhone: agentToEdit.ContactPersonPhone ?? agentToEdit.contactPersonPhone ?? '',
    });
  }

  async deleteAgentWithReassign(agent: any) {
    // Prepare list of other agents to reassign clients
    const otherAgents = this.agentsList.filter(a => (a.Id ?? a.id) !== (agent.Id ?? agent.id) && (a.status ?? 'active') === 'active');
    if (otherAgents.length === 0) {
      alert('Please create or activate another agent before deleting this one.');
      return;
    }

    // Build HTML select for Swal
    const options = otherAgents.map(a => `<option value="${a.Id ?? a.id}">${a.CompanyName ?? a.companyName}</option>`).join('');
    const { value: newAgentId } = await Swal.fire({
      title: 'Reassign clients before deleting agent',
      html: `
        <p class="mb-2">Select the agent to reassign existing clients to:</p>
        <select id="reassignSelect" class="swal2-select form-select">${options}</select>
      `,
      showCancelButton: true,
      confirmButtonText: 'Reassign & Delete',
      preConfirm: () => {
        const select = (document.getElementById('reassignSelect') as HTMLSelectElement);
        return select ? select.value : null;
      }
    });

    if (newAgentId) {
      // call service with proper params
      this.agentService.reassignAndDelete(agent.Id ?? agent.id, Number(newAgentId)).subscribe({
        next: () => {
          Swal.fire('Success', 'Clients reassigned and agent deactivated', 'success');
          this.getAgentList();
        },
        error: (err) => {
          console.error('Error reassigning agent:', err);
          Swal.fire('Error', 'Failed to reassign and delete agent', 'error');
        }
      });
    }
  }


  toggleAgentStatus(agent: any) {
    const currentStatus = (agent.status || 'active').toLowerCase();
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const actionWord = currentStatus === 'active' ? 'deactivate' : 'activate';

    Swal.fire({
      position: 'center',
      icon: 'question',
      title: `Are you sure you want to ${actionWord} this agent?`,
      showConfirmButton: true,
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
      iconColor: currentStatus === 'active' ? 'red' : 'green',
    }).then((result) => {
      if (result.isConfirmed) {
        // Build an updated agent payload that preserves existing fields and sets the new status
        const updatedAgent = {
          id: agent.Id ?? agent.id,
          companyName: agent.CompanyName ?? agent.companyName ?? null,
          email: agent.Email ?? agent.email ?? null,
          contact: agent.Contact ?? agent.contact ?? null,
          contactPersonName: agent.ContactPersonName ?? agent.contactPersonName ?? null,
          contactPersonEmail: agent.ContactPersonEmail ?? agent.contactPersonEmail ?? null,
          contactPersonPhone: agent.ContactPersonPhone ?? agent.contactPersonPhone ?? null,
          status: newStatus
        };

        this.agentService.editAgent(updatedAgent).subscribe({
          next: (response) => {
            Swal.fire({
              position: 'center',
              icon: 'success',
              title: `Agent ${actionWord}d successfully`,
              iconColor: currentStatus === 'active' ? 'red' : 'green',
              timer: 2000
            });
            // Update the local status immediately for UX
            agent.status = newStatus;
            // Refresh the list to ensure consistency
            this.getAgentList();
          },
          error: (error) => {
            console.error('Error updating agent status:', error);
            Swal.fire({
              position: 'center',
              icon: 'error',
              title: `Failed to ${actionWord} agent`,
              text: error.message,
              showConfirmButton: true
            });
          }
        });
      }
    });
  }

  // Keep the original deleteAgent method for reference or future use
  deleteAgent(id: any) {
    this.toggleAgentStatus({ Id: id, Status: 'Active' });
  }
















  //......................................model handling..............................................

  handleModel() {
    this.isVisible = !this.isVisible;
    this.openModel = this.isVisible ? "flex" : "none";
    this.isEditMode = false;
    this.selectedAgentId = null;
    this.agentForm.reset();
  }

  handleModelClose() {
    this.isVisible = false;
    this.openModel = "none";
    this.isEditMode = false;
    this.selectedAgentId = null;
    this.agentForm.reset();
  }



}
