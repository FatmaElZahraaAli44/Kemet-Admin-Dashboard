import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TravelAgenciesComponent } from './travel-agencies.component';

describe('TravelAgenciesComponent', () => {
  let component: TravelAgenciesComponent;
  let fixture: ComponentFixture<TravelAgenciesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TravelAgenciesComponent]
    });
    fixture = TestBed.createComponent(TravelAgenciesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
