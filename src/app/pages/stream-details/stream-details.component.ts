import { Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {StreamService} from "../../service/stream.service";
import {EMPTY, Subject, switchMap, take, takeUntil} from "rxjs";
import {Stream} from "../../shared/interfaces/responses";
import {AuthService} from "../../service/auth.service";
import {DomSanitizer, SafeResourceUrl} from "@angular/platform-browser";
import {ToastrService} from "../../service/toastr.service";
import {UsersService} from "../../service/users.service";
import {ChatService} from "../../service/chat.service";
import {ROUTES} from "../../constants/routes";
import {CourseService} from "../../service/course.service";

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
    private readonly courseService: CourseService,
    private readonly router: Router,
  ) {}

  public source!: SafeResourceUrl;
  public source2!: SafeResourceUrl;
  @ViewChild('video2') video2!: ElementRef<HTMLVideoElement>;
  @ViewChild('video') video!: ElementRef<HTMLVideoElement>;
  @ViewChild('player') player!: ElementRef<HTMLElement>;

  private currentPlayer!: HTMLVideoElement;
  private nextPlayer!: HTMLVideoElement | null;
  private isNextReady: boolean = false;
  public loading: boolean = true;
  private isdFirstLoad: boolean = true;
  private isSwitched: boolean = false;
  public firstFrame: boolean = true;
  public fetched: boolean = false;
  public isPlaying = false;
  public showStartButton = false;

  public ngOnInit(): void {
    this.loadStream();

    this.chatService.connected$
      .pipe(takeUntil(this.destroy$))
      .subscribe(connected => {
        this.streamData = {...this.streamData, viewers: connected }
        this.streamData
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

  public openInNewWindow(url: any[]): void {
    const urlSerialized = this.router.serializeUrl(
      this.router.createUrlTree(url)
    );

    window.open(urlSerialized, '_blank');
  }

  public async progress(event: Event): Promise<void> {
    const target = event.target as HTMLVideoElement;

    if (target.currentTime > target.duration * 0.7 && !this.nextPlayer) {
      this.setNextPlayer();
      this.isSwitched = false;
      this.getFrame(this.part + this.activePart);
      return
    }
  }

  public async switchPlayer(): Promise<void> {
    if (this.isEnded) return;

    this.isSwitched = true;
    await this.tryPlayNext();
    this.activePart++;
    this.firstFrame = false;
    this.currentPlayer = this.nextPlayer!;
    this.setNextSource('');
    this.nextPlayer = null;
  }

  private async tryPlayNext(): Promise<void> {
    while(!this.isNextReady) {
      if (this.isEnded) return;
      this.loading = true;
      await new Promise<void>(res => setTimeout(async () => res(), 200));
    }
    this.loading = false;
    await this.nextPlayer?.play();
  }

  private setNextSource(source: SafeResourceUrl): void {
    this.isNextReady = false;
    if (this.currentPlayer === this.video.nativeElement) {
      this.source2 = source;
      return;
    }
    this.source = source;
  }

  private setNextPlayer(): void {
    if (this.currentPlayer === this.video.nativeElement) {
      this.nextPlayer = this.video2.nativeElement;
      return;
    }

    this.nextPlayer = this.video.nativeElement;
  }

  public setTime(event: Event): void {
    if (!this.currentPlayer) {
      this.currentPlayer = this.video.nativeElement;
    }
    if (this.isdFirstLoad) {
      this.isdFirstLoad = false;
      this.loading = false;
    }
    this.isNextReady = true;
  }

  public get isFirstVideo(): boolean {
    if (!this.video) return true;
    return this.currentPlayer === this.video.nativeElement;
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
            this.streamData = { ...stream.data, viewers: 0 };
            this.isModerator = stream.isModerator;
            this.authorMode = stream.data.userId === this.authService.authedId.getValue();
            this.tryMarkEvent()
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

  public tryMarkEvent(): void {
    if (!this.authorMode && this.streamData.planItemId && !this.streamData.assignmentId) {
      this.courseService.markPlanAsDone(this.streamData.planItemId)
        .pipe(take(1))
        .subscribe()
    }
  }

  public onLoad(event: Event): void {
    if (this.isEnded) return;

    event.preventDefault();
    this.currentPlayer.play();
    this.currentPlayer.focus();
  }

  public pause(event: Event): void {
    if (this.isEnded) return;

    event.preventDefault();
    this.currentPlayer.pause();
    setTimeout(() => this.player.nativeElement.focus());
    this.isPlaying = false;
  }

  public onPlay() {
    this.isPlaying = true;
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

  private getFrame(part?: number) {
    this.fetched = false;
    this.streamService.getFrame(this.streamData.id, part)
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next:buff => {
          this.fetched = true;
          const blob = new Blob([buff])
          const blobURL = URL.createObjectURL(blob);
          if(!this.part) {
            this.part = part!;
          }
          if (!this.activePart) {
            this.source = this.sanitizer.bypassSecurityTrustResourceUrl(blobURL);
            this.activePart = 1;
          } else {
            this.setNextSource(this.sanitizer.bypassSecurityTrustResourceUrl(blobURL));
          }
        },
        error: this.errorCatcher.bind(this),
        complete: () => window.setTimeout(() => {
          if (this.fetched) return;
          this.getFrame(this.part + this.activePart)
        }, 1000)
      })
  }
  private errorCatcher(error: number) {
    this.fetched = true;
    if(error === 404) {
      window.setTimeout(() => this.getFrame(this.part + this.activePart), 1000)
    }
    if(error === 405) {
      this.isEnded = true;
      this.toastrService.setInfo('Stream is over');
    }
  }

  public async startRecording(): Promise<void> {
    this.showStartButton = false;
    if (this.streamData.type === 1) {
      this.stream = await window.navigator.mediaDevices.getUserMedia(this.mediaConstraints);
    } else {
      this.stream = await window.navigator.mediaDevices.getDisplayMedia(this.mediaConstraints);
    }
    this.stream.getVideoTracks()[0].addEventListener('ended', () => this.showStartButton = true)
    this.recordFrame();
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
    this.chatService.connected$.next(0);
  }
}
