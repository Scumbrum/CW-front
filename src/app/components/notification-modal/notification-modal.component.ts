import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {NotificationResponse} from "../../shared/interfaces/responses";

@Component({
  selector: 'app-notification-modal',
  templateUrl: './notification-modal.component.html',
  styleUrls: ['./notification-modal.component.css']
})
export class NotificationModalComponent {
  constructor(
    private dialogRef: MatDialogRef<NotificationModalComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: NotificationResponse
  ) {}

  public close(): void {
    this.dialogRef.close();
  }

  public markAsViewed(): void {
    this.dialogRef.close(true);
  }
}
