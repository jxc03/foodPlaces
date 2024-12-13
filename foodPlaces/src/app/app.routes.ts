import { Routes } from '@angular/router';
import { HomeComponent } from './home.component'; 
import { ArmaghBusinessesComponent } from './cities/armagh/armaghBusinesses.component';
import { BangorBusinessesComponent } from './cities/bangor/bangorBusinesses.component';
import { BelfastBusinessesComponent } from './cities/belfast/belfastBusinesses.component';
import { BusinessComponent } from './business.component';
import { LisburnBusinessesComponent } from './cities/lisburn/lisburnBusinesses.component';
import { DerryBusinessesComponent } from './cities/derryLondonderry/derryBusinesses.component';
import { NewryBusinessesComponent } from './cities/newry/newryBusinesses.component';
import { TestWSComponent } from './testWS.component';

/*import { CitiesComponent } from './cities.component';*/

export const routes: Routes = [
    { 
        path: '', 
        component: HomeComponent 
    }, 
    { 
        path: 'armaghBusinesses', 
        component: ArmaghBusinessesComponent 
    },
    { 
        path: 'bangorBusinesses', 
        component: BangorBusinessesComponent 
    },
    { 
        path: 'belfastBusinesses', 
        component: BelfastBusinessesComponent
    },
    {
        path: 'lisburnBusinesses',
        component: LisburnBusinessesComponent
    },
    {
        path: 'derryBusinesses',
        component: DerryBusinessesComponent
    },
    {
        path: 'newryBusinesses',
        component: NewryBusinessesComponent
    },
    {   path: 'armaghBusinesses/:id', 
        component: BusinessComponent 
    },
    {   path: 'bangorBusinesses/:id', 
        component: BusinessComponent 
    },
    {   path: 'belfastBusinesses/:id', 
        component: BusinessComponent 
    },
    {   path: 'lisburnBusinesses/:id', 
        component: BusinessComponent 
    },
    {
        path: 'derryBusinesses/:id',
        component: BusinessComponent
    },
    {
        path: 'newryBusinesses',
        component: BusinessComponent

    },
    { 
        path: 'testWS', 
        component: TestWSComponent 
    }
];

/*{ path: 'cities', component: CitiesComponent },*/