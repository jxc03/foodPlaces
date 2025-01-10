import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientModule } from '@angular/common/http';
import { NavComponent } from './nav.component';
import { ArmaghBusinessesComponent } from './cities/armagh/armaghBusinesses.component';
import { BangorBusinessesComponent } from './cities/bangor/bangorBusinesses.component';
import { BelfastBusinessesComponent } from './cities/belfast/belfastBusinesses.component';
import { LisburnBusinessesComponent } from './cities/lisburn/lisburnBusinesses.component';
import { DerryBusinessesComponent } from './cities/derryLondonderry/derryBusinesses.component';
import { NewryBusinessesComponent } from './cities/newry/newryBusinesses.component';
import { BusinessComponent } from './business.component';
import { DataService } from './data.service';
import { WebService } from './web.service';
import { AuthService } from '@auth0/auth0-angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GoogleMapsModule } from '@angular/google-maps';
import { FormBuilder,ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule, // Even though it was depreciated, it fixed null errors or it made it passed with the green
        HttpClientModule, // Either helped some null errors or to help debug, cant remember
        CommonModule,
        FormsModule,
        AppComponent,
        NavComponent,
        ArmaghBusinessesComponent,
        BangorBusinessesComponent,
        BelfastBusinessesComponent,
        LisburnBusinessesComponent,
        DerryBusinessesComponent,
        NewryBusinessesComponent
      ],
      providers: [
        WebService,       { provide: AuthService, useValue: { isAuthenticated: () => true } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it(`should have the 'foodPlaces' title`, () => {
    expect(component.title).toEqual('foodPlaces');
  });

  it('should render title', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Welcome to foodPlaces');
  });
});

// Test for armaghBusinesses
describe('ArmaghBusinessesComponent', () => {
  let component: ArmaghBusinessesComponent;
  let fixture: ComponentFixture<ArmaghBusinessesComponent>;
  let webService: WebService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientModule,
        CommonModule,
        FormsModule,
        ArmaghBusinessesComponent
      ],
      providers: [
        WebService,
        { provide: AuthService, useValue: { isAuthenticated: () => true } }
      ]
    }).compileComponents();

    webService = TestBed.inject(WebService);
    fixture = TestBed.createComponent(ArmaghBusinessesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should remove duplicate places by name', () => {
    const duplicatePlaces = [
      { info: { name: 'Test Place' } },
      { info: { name: 'Test Place' } },
      { info: { name: 'Unique Place' } }
    ];
    const result = component.removeDuplicatePlacesByName(duplicatePlaces);
    expect(result.length).toBe(2);
  });

  it('should update filters and reset to page 1', () => {
    component.page = 2;
    component.selectedType = 'restaurant';
    component.updateFilter();
    expect(component.page).toBe(1);
  });

  it('should update sort direction when same field is selected', () => {
    component.sortBy = 'name';
    component.sortDirection = 'asc';
    component.updateSort('name');
    expect(component.sortDirection).toBe('desc');
  });

  it('should navigate to previous page when available', () => {
    component.page = 2;
    component.previousPage();
    expect(component.page).toBe(1);
  });

  it('should navigate to next page when available', () => {
    component.page = 1;
    component.totalPages = 2;
    component.nextPage();
    expect(component.page).toBe(2);
  });

  it('should check if business is currently open', () => {
    const mockHours = {
      [component.getCurrentDay()]: {
        open: '00:00',
        close: '23:59'
      }
    };
    const isOpen = component.isCurrentlyOpen(mockHours);
    expect(isOpen).toBeTrue();
  });

  it('should return correct current day', () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = component.getCurrentDay();
    expect(days).toContain(currentDay);
  });
});


/*
import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'foodPlaces' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('foodPlaces');
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Hello, foodPlaces');
  });
});
*/