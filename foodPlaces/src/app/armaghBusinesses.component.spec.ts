import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ArmaghBusinessesComponent } from './cities/armagh/armaghBusinesses.component';
import { RouterTestingModule } from '@angular/router/testing';
import { WebService } from './web.service';
import { AuthService } from '@auth0/auth0-angular';
import { of } from 'rxjs';

describe('ArmaghBusinessesComponent', () => {
  let component: ArmaghBusinessesComponent;
  let fixture: ComponentFixture<ArmaghBusinessesComponent>;
  let webServiceSpy: jasmine.SpyObj<WebService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  // Mock data for testing
  const mockPlaces = {
    places: [
      {
        _id: '1',
        info: {
          name: 'Test Restaurant 1',
          type: ['restaurant'],
        },
        ratings: {
          average_rating: 4.5
        },
        service_options: {
          meals: {
            breakfast: true,
            lunch: true
          }
        },
        business_hours: {
          monday: {
            open: '09:00',
            close: '17:00'
          }
        }
      },
      {
        _id: '2',
        info: {
          name: 'Test Restaurant 2',
          type: ['cafe'],
        },
        ratings: {
          average_rating: 3.5
        }
      }
    ],
    pagination: {
      current_page: 1,
      total_pages: 2
    }
  };

  beforeEach(async () => {
    webServiceSpy = jasmine.createSpyObj('WebService', ['getPlaces', 'deletePlace']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated']);

    // Setup default spy responses
    webServiceSpy.getPlaces.and.returnValue(of(mockPlaces));
    webServiceSpy.deletePlace.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        ArmaghBusinessesComponent
      ],
      providers: [
        { provide: WebService, useValue: webServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ArmaghBusinessesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.page).toBe(1);
    expect(component.selectedType).toBe('all');
    expect(component.selectedMeal).toBe('all');
    expect(component.minRating).toBe(0);
    expect(component.sortBy).toBe('name');
    expect(component.sortDirection).toBe('asc');
  });

  it('should fetch places on init', () => {
    component.ngOnInit();
    expect(webServiceSpy.getPlaces).toHaveBeenCalled();
    expect(component.filteredPlaces.length).toBe(2);
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

  it('should update filters and fetch new data', () => {
    component.selectedType = 'restaurant';
    component.updateFilter();
    expect(component.page).toBe(1);
    expect(webServiceSpy.getPlaces).toHaveBeenCalled();
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
    expect(webServiceSpy.getPlaces).toHaveBeenCalled();
  });

  it('should navigate to next page when available', () => {
    component.page = 1;
    component.totalPages = 2;
    component.nextPage();
    expect(component.page).toBe(2);
    expect(webServiceSpy.getPlaces).toHaveBeenCalled();
  });

  it('should delete place when confirmed', () => {
    const mockEvent = new Event('click');
    spyOn(window, 'confirm').and.returnValue(true);
    component.filteredPlaces = mockPlaces.places;
    component.deletePlace('1', mockEvent);
    expect(webServiceSpy.deletePlace).toHaveBeenCalled();
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