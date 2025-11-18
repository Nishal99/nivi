import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgentSearchModalComponent } from './agent-search-modal.component';

describe('AgentSearchModalComponent', () => {
  let component: AgentSearchModalComponent;
  let fixture: ComponentFixture<AgentSearchModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgentSearchModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgentSearchModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
