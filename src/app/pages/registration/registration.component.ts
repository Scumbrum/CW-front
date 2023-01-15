import {Component, EventEmitter, Input, OnDestroy, Output} from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {AuthService} from "../../service/auth.service";
import {Router} from "@angular/router";
import {checkPasswords} from "../../validators/registerValidator";
import {ToastrService} from "../../service/toastr.service";
import {ROUTES} from "../../constants/routes";
import {Subject, takeUntil} from "rxjs";

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css']
})
export class RegistrationComponent implements OnDestroy{
  public form!: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(
    private readonly authService: AuthService,
    private readonly toastrService: ToastrService,
    private router: Router
  ) {
    this.form = new FormGroup({
      login: new FormControl('', [Validators.required]),
      name: new FormControl('', [Validators.required]),
      password: new FormControl(''),
      confirmPassword: new FormControl('')
    }, { validators: checkPasswords });
  }

  public submit(): void {
    if (this.form.valid) {
      this.authService.doRegister(this.form.controls['login'].value!, this.form.controls['password'].value!, this.form.controls['name'].value!)
        .pipe(takeUntil(this.destroy$))
        .subscribe(_=> {
          this.toastrService.setSuccess('User registered');
          this.router.navigate([ROUTES.AUTH]);
        })
    }
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
