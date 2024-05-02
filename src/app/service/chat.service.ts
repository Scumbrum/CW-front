import { Injectable } from '@angular/core';
import {environment} from "../environment/environment";
import {AuthService} from "./auth.service";
import {LiveMessage, LiveMessageTypes} from "../shared/interfaces/params";
import {BehaviorSubject, Subject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private messages: LiveMessage[] = [];
  private streamId!: number;
  public messages$ = new Subject<LiveMessage[]>();
  public connected$ = new BehaviorSubject<number>(0);
  public isOpen$ = new Subject<boolean>();

  private ws!: WebSocket;
  constructor(
    private authService: AuthService
  ) {}

  public disconnect(): void {
    this.ws.close();
  }

  private initChat(streamId: number, messageType: LiveMessageTypes, userId?: number) {
    const data = {
      streamId,
      messageType,
      user: userId
    }
    this.streamId = streamId;
    this.ws = new WebSocket(environment.WEBSOCKET_URL);
    this.ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if(message.messageType === LiveMessageTypes.JOIN) {
        this.connected$.next(this.connected$.getValue() + message.amount)
      }
      if(message.messageType === LiveMessageTypes.DISCONNECT) {
        this.connected$.next(this.connected$.getValue() - 1)
      }
      if(message.messageType === LiveMessageTypes.MESSAGE || message.messageType === LiveMessageTypes.ERROR) {
        this.messages.push(message);
        this.messages$.next(this.messages);
      }
      if(message.messageType === LiveMessageTypes.DELETE_MESSAGE) {
        this.messages = this.messages.filter(other => other.id !== message.messageId)
        this.messages$.next(this.messages);
      }
      this.isOpen$.next(true);
    })
    this.ws.addEventListener('open', () => {
      this.ws.send(JSON.stringify(data));
      this.isOpen$.next(true);
    })
    this.ws.addEventListener('close', () => {
      this.isOpen$.next(false);
    })
  }

  public createRoom(id: number) {
    this.initChat(id, LiveMessageTypes.CREATE, this.authService.authedId.getValue());
  }

  public joinToRoom(id: number) {
    this.initChat(id, LiveMessageTypes.JOIN, this.authService.authedId.getValue());
  }

  public sendMessage(text: string) {
    if(!this.ws) {
      throw new Error('Should connect to some room');
    }
    const data = {
      user: this.authService.authedId.getValue(),
      streamId: this.streamId,
      messageType: LiveMessageTypes.MESSAGE,
      text
    }
    this.ws.send(JSON.stringify(data))
  }

  public deleteMessage(id: number) {
    if(!this.ws) {
      throw new Error('Should connect to some room');
    }
    const data = {
      streamId: this.streamId,
      messageType: LiveMessageTypes.DELETE_MESSAGE,
      text: id
    }
    this.ws.send(JSON.stringify(data))
  }
}
