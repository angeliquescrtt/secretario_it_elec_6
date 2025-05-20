import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  loading = false;
  private authStatusSub!: Subscription;

  constructor(public authservice: AuthService) {}

  ngOnInit() {
    this.authStatusSub = this.authservice.getAuthStatusListener()
      .subscribe(isAuthenticated => {
        this.loading = false;
        if (isAuthenticated) {
          alert('Login successful!');
        } else {
          alert('Login failed.');
        }
      });
  }

  onLogin(form: NgForm) {
    if (form.invalid) return;

    this.loading = true;
    this.authservice.loginUser(form.value.email, form.value.password);
  }

  ngOnDestroy() {
    this.authStatusSub.unsubscribe();
  }
}
