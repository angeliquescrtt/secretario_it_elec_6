import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { ErrorComponent } from './error/error-component'; // Corrected import path

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(private dialog: MatDialog) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('HTTP Error:', error);

        // Default error message
        let errorMessage = "An Unknown Error Occurred!";
        
        // Check if the error object has a custom message
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        }

        // Open the error dialog and pass the message
        this.dialog.open(ErrorComponent, {
          data: { message: errorMessage }
        });

        // Throw the error for further handling
        return throwError(() => error);
      })
    );
  }
}
