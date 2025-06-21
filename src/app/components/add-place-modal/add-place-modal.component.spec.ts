import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddPlaceModalComponent } from './add-place-modal.component';

describe('AddPlaceModalComponent', () => {
  let component: AddPlaceModalComponent;
  let fixture: ComponentFixture<AddPlaceModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AddPlaceModalComponent]
    });
    fixture = TestBed.createComponent(AddPlaceModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
