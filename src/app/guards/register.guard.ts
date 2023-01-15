import { Injectable } from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {AuthService} from "../service/auth.service";
import {ROUTES} from "../constants/routes";

@Injectable({
  providedIn: 'root'
})
export class RegisterGuard implements CanActivate {

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}
  public canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): boolean {
    const isAvailable = !this.authService.getAuthFromLocalStorage;

    if(!isAvailable) {
      this.router.navigate([ROUTES.AUTH]);
    }

    return isAvailable;
  }

}
