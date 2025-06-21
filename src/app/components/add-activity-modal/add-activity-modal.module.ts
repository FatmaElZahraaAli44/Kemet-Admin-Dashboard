import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AddActivityModalComponent } from './add-activity-modal.component';

// PrimeNG Imports
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { ProgressBarModule } from 'primeng/progressbar';

@NgModule({
  declarations: [
    AddActivityModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    InputTextareaModule,
    DropdownModule,
    InputNumberModule,
    ButtonModule,
    DialogModule,
    MessageModule,
    ToastModule,
    ProgressBarModule,
  ],
  exports: [
    AddActivityModalComponent
  ]
})
export class AddActivityModalModule { 


}