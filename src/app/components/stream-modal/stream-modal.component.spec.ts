import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StreamModalComponent } from './stream-modal.component';

describe('StreamModalComponent', () => {
  let component: StreamModalComponent;
  let fixture: ComponentFixture<StreamModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StreamModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StreamModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
