import { Injectable } from '@angular/core';
import {ApiService} from "./api.service";
import {HttpParams} from "@angular/common/http";
import {
  FrameResponse, ReportResponse, RestrictionResponse,
  Stream,
  StreamListResponse,
  StreamResponse
} from "../shared/interfaces/responses";
import {Observable} from "rxjs";
import {StreamData} from "../shared/interfaces/params";

@Injectable({
  providedIn: 'root'
})
export class StreamService {
  private baseurl = 'streams'

  constructor(
    private readonly api: ApiService
  ) { }

  public getStreams(size: number, pageNumber: number, name?: string): Observable<StreamListResponse> {
    const params = new HttpParams({
      fromObject: {
        size,
        pageNumber,
        name: name || ''
      }
    })
    return this.api.get<StreamListResponse>(this.baseurl, params);
  }

  public getStreamsChart(amount: number = 10): Observable<Stream[]> {
     const params = new HttpParams({
       fromObject: {
         amount
       }
     });
    return this.api.get<Stream[]>(`${this.baseurl}/top`, params);
  }

  public getStreamsWithReports(): Observable<Stream[]> {
    return this.api.get<Stream[]>(`${this.baseurl}/reported`);
  }

  public recordFrame(id: number, formData: FormData): Observable<FrameResponse> {
    return this.api.put<FormData, FrameResponse>(`${this.baseurl}/${id}`, formData)
  }

  public getRecordStream(id: number): Observable<ArrayBuffer> {
    return this.api.get<ArrayBuffer>(`${this.baseurl}/${id}/record`, undefined, 'arraybuffer')
  }

  public getFrame(id: number, part?: number): Observable<ArrayBuffer> {
    let params: HttpParams | undefined;
    if (part) {
      params = new HttpParams({
        fromObject: {
          part
        }
      })
    }
    return this.api.get<ArrayBuffer>(`${this.baseurl}/${id}/frame`, params, 'arraybuffer')
  }

  public createStream(streamData: StreamData): Observable<Stream> {
    return this.api.post<StreamData, Stream>(this.baseurl, streamData);
  }

  public startStream(id: number): Observable<Stream> {
    return this.api.put<Object, Stream>(`${this.baseurl}/${id}/start`, {});
  }

  public reportStream(id: number): Observable<ReportResponse> {
    return this.api.post<undefined, ReportResponse>(`${this.baseurl}/${id}/report`, undefined);
  }

  public stopStream(id: number): Observable<StreamResponse> {
    return this.api.patch<undefined, StreamResponse>(`${this.baseurl}/${id}`, undefined);
  }

  public getStream(id: number): Observable<StreamResponse> {
    return this.api.get<StreamResponse>(`${this.baseurl}/${id}`);
  }

  public getRestrictions(id: number):  Observable<RestrictionResponse[]> {
    return this.api.get<RestrictionResponse[]>(`${this.baseurl}/${id}/restriction`);
  }

  public dateToString(date: Date): string {
    const parts =  {
      year: new Intl.DateTimeFormat('en', { year: 'numeric' }).format(date),
      month: new Intl.DateTimeFormat('en', { month: '2-digit' }).format(date),
      day: new Intl.DateTimeFormat('en', { day: '2-digit' }).format(date)
    }
    return `${parts.year}.${parts.month}.${parts.day}`
  }
}
