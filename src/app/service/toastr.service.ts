import {Injectable, NgZone} from '@angular/core';
import {MatSnackBar, MatSnackBarConfig} from "@angular/material/snack-bar";

@Injectable({
  providedIn: 'root'
})
export class ToastrService {

  constructor(
    private readonly snackBar: MatSnackBar,
    private zone: NgZone) { }

  private openSnackBar(message: string, panelClass: string): void {
    const config = new MatSnackBarConfig();
    config.panelClass = [panelClass];
    config.verticalPosition = 'top';
    config.horizontalPosition = 'right';
    this.zone.run(() => {
      this.snackBar.open(message, 'x', config);
    });
  }

  public setError(message: string): void {
    this.openSnackBar(message, 'background-red')
  }

  public setInfo(message: string) {
    this.openSnackBar(message, 'background-blue')
  }

  public setSuccess(message: string) {
    this.openSnackBar(message, 'background-green')
  }
}
