import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService } from "../auth.service";  

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']    
})
export class SignupComponent {
  loading = false;

  constructor(public authService: AuthService) {}

  onSignup(form: NgForm) {
    if (form.invalid) {
      return;
    }

    this.loading = true;

    this.authService.createUser(form.value.email, form.value.password)
      .subscribe({
        next: (response) => {
          console.log('Signup successful:', response);
          this.loading = false;
          alert('Signup successful!');
        },
        error: (error) => {
          console.error('Signup failed:', error);
          this.loading = false;
          alert('Signup failed! Email may already be taken.');
        }
      });

    console.log('Form submitted with values:', form.value);
  }
}
