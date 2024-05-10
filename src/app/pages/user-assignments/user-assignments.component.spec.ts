import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserAssignmentsComponent } from './user-assignments.component';

describe('UserAssignmentsComponent', () => {
  let component: UserAssignmentsComponent;
  let fixture: ComponentFixture<UserAssignmentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserAssignmentsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserAssignmentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
