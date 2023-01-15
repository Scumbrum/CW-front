import {Component, Input, OnInit} from '@angular/core';
import {ChatService} from "../../service/chat.service";
import {AuthService} from "../../service/auth.service";
import {LiveMessage, LiveMessageTypes} from "../../shared/interfaces/params";
import {FormControl} from "@angular/forms";
import {UsersService} from "../../service/users.service";
import {StreamService} from "../../service/stream.service";
import {RestrictionResponse} from "../../shared/interfaces/responses";

@Component({
  selector: 'app-stream-chat',
  templateUrl: './stream-chat.component.html',
  styleUrls: ['./stream-chat.component.css']
})
export class StreamChatComponent implements OnInit {
  @Input() id!: number;
  @Input() creator: boolean = false;
  @Input() moderator: boolean = false;
  @Input() authorId!: number;
  public isOpen = false;
  public userId!: number;
  public messages: LiveMessage[]= [];
  public restrictions: RestrictionResponse[] = [];
  public messageQuery = new FormControl('');
  constructor(
    private readonly chatService: ChatService,
    private readonly userService: UsersService,
    private readonly streamService: StreamService,
    private readonly authService: AuthService
  ) {}

  public ngOnInit(): void {
    if(this.creator) {
      this.chatService.createRoom(this.id);
    } else {
      this.chatService.joinToRoom(this.id);
    }

    this.streamService.getRestrictions(this.id)
      .subscribe(restrictions => this.restrictions = restrictions)

    this.authService.authedId
      .subscribe(id => this.userId = id);

    this.chatService.messages$
      .subscribe(messages =>  {
        this.messages = messages
      });

    this.chatService.isOpen$
      .subscribe(status => this.isOpen = status);
  }

  public sendMessage() {
    this.chatService.sendMessage(this.messageQuery.value!);
    this.messageQuery.setValue('');
  }

  public addFirstRestriction(id: number, name: string) {
    this.userService.addRestriction(id, this.id, 1)
      .subscribe(_ => {
        this.restrictions = [...this.restrictions, { userId: id, userName: name, restrictionType: 1 }]
      })
  }

  public displayControlls(message: LiveMessage): boolean {
    return this.moderator
      && message.userId !== this.authorId
      && message.userId !== this.userId
      && message.messageType === LiveMessageTypes.MESSAGE
      && !this.restrictions.some(restriction => restriction.userId === message.userId);
  }

  public addSecondRestriction(id: number, name: string) {
    this.userService.addRestriction(id, this.id, 2)
      .subscribe(_ => {
        this.restrictions = [...this.restrictions, { userId: id, userName: name, restrictionType: 2 }]
      })
  }

  public deleteRestriction(userId: number) {
    this.userService.deleteRestriction(userId, this.id)
      .subscribe(_ => {
        this.restrictions = this.restrictions.filter(restriction => restriction.userId !== userId);
      })
  }

  public deleteMessage(id: number): void {
    this.chatService.deleteMessage(id);
  }
}
