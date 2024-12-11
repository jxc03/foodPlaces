import { Component } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { DataService } from '../../data.service';
import { CommonModule } from '@angular/common';
/*import { WebService } from '../../web.service';*/

@Component({
  selector: 'armaghBusinesses',
  imports: [RouterOutlet, CommonModule, RouterModule],
  providers: [DataService, /*WebService*/],
  templateUrl: './armaghBusinesses.component.html',
  styleUrls: ['./armaghBusinesses.component.css']
})

export class ArmaghBusinessesComponent {
  business_list: any = [];
  page: number = 1;

  constructor(public dataService: DataService, /*private webService: WebService*/) { }

  ngOnInit() {
    if (sessionStorage['page']) {
      this.page = Number(sessionStorage['page']); 
    }

    this.business_list = this.dataService.getBusinesses(this.page);
    console.log('Raw data:', this.business_list);
    console.log('Places array:', this.business_list?.places);
  }

  previousPage() { 
    if (this.page > 1){
      this.page = this.page - 1 
      sessionStorage['page'] = this.page;
      this.business_list = this.dataService.getBusinesses(this.page);
    }
  } 

  nextPage() { 
    if (this.page < this.dataService.getLastPageNumber()){
      this.page = this.page + 1 
      sessionStorage['page'] = this.page;
      this.business_list = this.dataService.getBusinesses(this.page);
    }
  }
}
