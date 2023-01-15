import {Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import {ApiService} from "../../service/api.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {Subject, takeUntil} from "rxjs";
import {ToastrService} from "../../service/toastr.service";

@Component({
  selector: 'app-toastr',
  templateUrl: './toastr.component.html',
  styleUrls: ['./toastr.component.css']
})
export class ToastrComponent implements OnInit , OnDestroy{

  private destroy$ = new Subject<void>();
  constructor(
    private readonly snackBar: MatSnackBar,
    private zone: NgZone,
    private readonly api: ApiService,
    private readonly toastr: ToastrService
  ) {
  }

  ngOnInit(): void {
    this.api.error
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(error => {
        if (error) {
          this.toastr.setError(error)
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
