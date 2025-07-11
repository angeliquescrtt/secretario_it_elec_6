import { Component, OnInit, OnDestroy } from "@angular/core";
import { Subscription } from 'rxjs';
import { AuthService } from "../authentication/auth.service";


@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  private authListenerSubs!: Subscription;
  public userIsAuthenticated = false;


  constructor(private authService: AuthService) {}


  ngOnInit() {
    this.userIsAuthenticated = this.authService.getIsAuth();  
    this.authListenerSubs = this.authService.getAuthStatusListener()
      .subscribe(isAuthenticated => {
        this.userIsAuthenticated = isAuthenticated;
      });
  }


  ngOnDestroy() {
    this.authListenerSubs.unsubscribe();
  }


  onLogout() {
    this.authService.logout();
  }
}



