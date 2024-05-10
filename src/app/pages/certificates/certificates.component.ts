import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {CourseService} from "../../service/course.service";
import {DomSanitizer, SafeResourceUrl} from "@angular/platform-browser";
import {switchMap, zip} from "rxjs";

@Component({
  selector: 'app-certificates',
  templateUrl: './certificates.component.html',
  styleUrls: ['./certificates.component.css'],
})
export class CertificatesComponent implements OnInit {
  public certificates: number[] = []
  public urls: SafeResourceUrl[] = [];

  constructor(
    private readonly courseService: CourseService,
    private readonly sanitizer: DomSanitizer
  ) {}

  public ngOnInit(): void {
    console.log('hhh')
    this.courseService.getCertificates()
      .pipe(switchMap(value => {
        this.certificates = value;
        const observables = value.map(id => this.courseService.getCertificateUrl(id))
        return zip(...observables)
      }))
      .subscribe(responses => this.urls = responses.map(url => this.sanitizer.bypassSecurityTrustResourceUrl(url)));
  }

  public certificateUrl(url: string): SafeResourceUrl {
    console.log('asss')
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
