import {Component} from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {AuthService} from "../../service/auth.service";
import { Router} from "@angular/router";
import {ROUTES} from "../../constants/routes";


@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent {
  constructor(
    private readonly authService: AuthService,
    private router: Router
  ) {
  }

  public form: FormGroup = new FormGroup({
    login: new FormControl('', [Validators.required]),
    password: new FormControl(''),
  });

  public submit(): void {
    if (this.form.valid) {
      const { login, password } = this.form.value;
      this.authService.doLogin(login, password)
        .subscribe(_ => this.router.navigate([ROUTES.HOME]));
    }
  }
}
