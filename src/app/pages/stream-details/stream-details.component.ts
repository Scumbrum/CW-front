import { Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {StreamService} from "../../service/stream.service";
import {EMPTY, Subject, switchMap, takeUntil} from "rxjs";
import {Stream} from "../../shared/interfaces/responses";
import {AuthService} from "../../service/auth.service";
import {DomSanitizer, SafeResourceUrl} from "@angular/platform-browser";
import {ToastrService} from "../../service/toastr.service";
import {UsersService} from "../../service/users.service";
import {ChatService} from "../../service/chat.service";
import {ROUTES} from "../../constants/routes";

@Component({
  selector: 'app-stream-details',
  templateUrl: './stream-details.component.html',
  styleUrls: ['./stream-details.component.css']
})
export class StreamDetailsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  public streamData!: Stream;
  public isModerator!: boolean;
  public authorMode: boolean = false;
  public stream!: MediaStream | null;
  public streamLive = false;
  private srcStream = new Subject<SafeResourceUrl>();
  public currentSrc!: SafeResourceUrl;
  public nextSrc!: SafeResourceUrl;
  private part!: number;
  public activePart!: number;
  private loaded: boolean = false;
  public currentStreamId!: number;
  public reported = false;
  public isEnded = true;
  public isSubscribes = false;

  private mediaConstraints = {
    audio: true,
    video: true
  };
  private mimeType = 'video/webm';

  constructor(
    private readonly authService: AuthService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly streamService: StreamService,
    private readonly usersService: UsersService,
    private readonly toastrService: ToastrService,
    private readonly sanitizer: DomSanitizer,
    private readonly chatService: ChatService,
    private readonly router: Router,
  ) {}

  @ViewChild('video') player!: ElementRef<HTMLVideoElement>;
  @ViewChild('video2') player2!: ElementRef<HTMLVideoElement>;

  public ngOnInit(): void {
    this.loadStream();

    this.chatService.connected$
      .pipe(takeUntil(this.destroy$))
      .subscribe(connected => {
        this.streamData = {...this.streamData, viewers: connected }
      })

    this.srcStream
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(src => {
        if((this.activePart % 2 === 1 && this.currentSrc) || (this.activePart % 2 === 0 && !this.nextSrc)) {
          this.nextSrc = src;
        }
        if((this.activePart % 2  === 0 && this.nextSrc) || (this.activePart % 2 === 1 && !this.currentSrc)) {
          this.currentSrc = src;
        }
      })
  }

  public get isVideoLoading() {
    return (!this.nextSrc && this.activePart === 1) || (!this.currentSrc && this.activePart === 0)
  }

  private loadStream(): void {
    this.activatedRoute.params
      .pipe(
        switchMap(params => {
          if(this.currentStreamId !== +params['id']) {
            this.currentStreamId = +params['id'];
            return this.streamService.getStream(params['id'])
          }
          return EMPTY
        }),
        switchMap(stream => {
          if(stream) {
            this.isEnded = false;
            this.streamLive = true;
            this.streamData = { ...stream.data, viewers:0 };
            this.isModerator = stream.isModerator;
            this.authorMode = stream.data.userId === this.authService.authedId.getValue();
          }
          if (this.authorMode) {
            this.startRecording();
          } else {
            this.getFrame(stream.endPoint);
          }
          return this.usersService.getUser(stream.data.userId)
        }),
        takeUntil(this.destroy$)
      ).subscribe({
          next: user => {
            this.isSubscribes = user.isSubscribed!;
          },
          error: () => {
            this.streamLive = false;
            this.loadStream()
          }
      })
  }

  public onLoad() {
    if(this.activePart % 2 === 1) {
      this.player.nativeElement.play();
    } else {
      this.player2.nativeElement.play();
    }
  }

  public pause() {
    if(this.activePart % 2 === 1) {
      this.player.nativeElement.pause();
    } else {
      this.player2.nativeElement.pause();
    }
  }

  public reportStream(): void {
    this.streamService.reportStream(this.streamData.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(_ => this.reported = true);
  }

  public subscribe(): void {
    this.usersService.subscribe(this.streamData.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(_ => {
        this.toastrService.setSuccess('Subscribed');
        this.isSubscribes = true;
      })
  }

  public unsubscribe(): void {
    this.usersService.unsubscribe(this.streamData.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(_ => {
        this.toastrService.setSuccess('Unsubscribed')
        this.isSubscribes = false;
      })
  }

  public onEnded() {
    if(this.isEnded) return;

    this.activePart++;
    this.loaded = false;

    if(this.activePart % 2 === 0 && this.nextSrc) {
      this.currentSrc = '';
      this.player2.nativeElement.play();
    } else if(this.activePart % 2 === 1 && this.currentSrc) {
      this.nextSrc = '';
      this.player.nativeElement.play();
    }
  }

  private getFrame(part?: number) {
    this.streamService.getFrame(this.streamData.id, part)
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next:buff => {
          const blob = new Blob([buff])
          const blobURL = URL.createObjectURL(blob);
          if(!this.part) {
            this.part = part!;
          }
          if (!this.activePart) {
            this.currentSrc = this.sanitizer.bypassSecurityTrustResourceUrl(blobURL);
            this.activePart = 1;
          } else {
            this.srcStream.next(this.sanitizer.bypassSecurityTrustResourceUrl(blobURL));
          }
        },
        error: this.errorCatcher.bind(this)
      })

  }
  private errorCatcher(error: number) {
    if(error === 404) {
      window.setTimeout(() => this.getFrame(this.part + this.activePart), 500)
    }
    if(error === 405) {
      this.isEnded = true;
      this.toastrService.setInfo('Stream is over');
    }
  }

  private async startRecording(): Promise<void> {
    this.stream = await window.navigator.mediaDevices.getUserMedia(this.mediaConstraints);
    this.recordFrame();
  }

  public onTimeUpdate(event: Event): void {
    if (this.loaded) {
      return
    }
    if(this.activePart % 2 == 0 && (this.player2.nativeElement.duration - this.player2.nativeElement.currentTime < 2.5)) {
      this.getFrame(this.part + this.activePart);
      this.loaded = true;
    }
    if(this.activePart % 2 == 1 && (this.player.nativeElement.duration - this.player.nativeElement.currentTime < 2.5)) {
      this.getFrame(this.part + this.activePart);
      this.loaded = true;
    }
  }

  private async recordFrame(): Promise<void> {
    const mediaRecorder = new MediaRecorder(this.stream!, {mimeType: this.mimeType});
    mediaRecorder.start();
    this.dataHandler(mediaRecorder);
    window.setTimeout(() => {
      if(this.stream?.active) {
        this.recordFrame();
        mediaRecorder.stop();
      }
    }, 5000);
  }

  private dataHandler(mediaRecorder: MediaRecorder): void {
    try {
      mediaRecorder.ondataavailable = (event: any) => {
        if (event.data && event.data.size > 0) {
          const videoBuffer = new Blob([event.data], {
            type: 'video/webm'
          });
          const file = new File([videoBuffer], 'mediaLiveFrame')
          let formData = new FormData();
          formData.append("file", file);
          if(this.streamLive) {
            this.streamService.recordFrame(this.streamData.id, formData)
              .pipe(
                takeUntil(this.destroy$)
              )
              .subscribe({
                error: this.endRecording.bind(this)
              });
          }
        }
      };
    } catch (error) {
      console.log(error);
    }
  }

  private endRecording(error: number): void {
    if(error === 405) {
      this.streamLive = false;
      this.stream?.getTracks().forEach(track => track.stop());
    }
  }

  public stopStream(): void {
    this.streamService.stopStream(this.streamData.id)
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(stream => {
        this.streamLive = false;
        this.stream?.getTracks().forEach(track => track.stop());
        this.router.navigate([ROUTES.PROFILE]);
        this.toastrService.setInfo('Stream was ended')
      });
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
