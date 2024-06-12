import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {CourseService} from "../../service/course.service";
import {DomSanitizer, SafeResourceUrl} from "@angular/platform-browser";
import {switchMap, zip} from "rxjs";
import {StreamService} from "../../service/stream.service";

@Component({
  selector: 'app-certificates',
  templateUrl: './certificates.component.html',
  styleUrls: ['./certificates.component.css'],
})
export class CertificatesComponent implements OnInit {
  public certificates: number[] = []
  public urls: SafeResourceUrl[] = [];
  private plainUrls: string[] = [];

  constructor(
    private readonly courseService: CourseService,
    private readonly sanitizer: DomSanitizer,
    private readonly streamService: StreamService
  ) {}

  public ngOnInit(): void {
    this.courseService.getCertificates()
      .pipe(switchMap(value => {
        this.certificates = value;
        const observables = value.map(id => this.courseService.getCertificateUrl(id))
        return zip(...observables)
      }))
      .subscribe(responses => {
        this.urls = responses.map(url => this.sanitizer.bypassSecurityTrustResourceUrl(url));
        this.plainUrls = responses;
      });
  }

  public downloadCertificate(index: number): void {
    this.streamService.downLoadFile(this.plainUrls[index], 'pdf')
  }
}
