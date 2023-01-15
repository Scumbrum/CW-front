import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import {Observable, tap} from 'rxjs';
import {AuthService} from "../service/auth.service";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private readonly authService: AuthService
  ) {}

  public intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getAuthFromLocalStorage
    if(token) {
      const modifiedReq = request.clone({
        headers: request.headers.set('Authorization', JSON.stringify({ id: token.id })),
      });
      return next.handle(modifiedReq);
    }
    return next.handle(request);
  }
}
