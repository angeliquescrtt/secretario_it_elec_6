import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-error',
  templateUrl: './error-component.html',
  styleUrls: ['./error-component.css']
})
export class ErrorComponent {
  // The message will be injected from the dialog
  message: string;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { message: string }) {
    this.message = data.message; // Set the message passed from the dialog
  }
}
