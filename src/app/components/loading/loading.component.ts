import {Component, OnDestroy, OnInit} from '@angular/core';
import {ApiService} from "../../service/api.service";
import {Subject, takeUntil} from "rxjs";

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.css']
})
export class LoadingComponent implements OnInit, OnDestroy {

  public isShown: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private readonly api: ApiService
  ) {}
  public ngOnInit(): void {
    this.api.isLoading
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(status => this.isShown = status)
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
