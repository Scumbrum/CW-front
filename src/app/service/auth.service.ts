import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable, tap} from "rxjs";
import {LoginResponse} from "../shared/interfaces/responses";
import {ApiService} from "./api.service";
import {LoginData, RegisterData} from "../shared/interfaces/params";

interface SaveLogin {
  role: 'admin' | 'user',
  id: number
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'auth';
  public authedId!: BehaviorSubject<number>;
  public authedRole!: BehaviorSubject<'admin' | 'user' | null>;
  constructor(
    private readonly api: ApiService,
  ) {
    this.authedId = new BehaviorSubject<number>(this.getAuthFromLocalStorage?.id || 0);
    this.authedRole = new BehaviorSubject<'admin' | 'user' | null>(this.getAuthFromLocalStorage?.role || null);
  }

  public doLogin(login:string, password: string): Observable<LoginResponse> {
      return this.api.post<LoginData, LoginResponse>(`${this.baseUrl}/login`, {login, password})
        .pipe(
          tap(response => {
            this.saveAuthToLocalStorage(response.id, response.role);
            this.authedId.next(response.id);
            this.authedRole.next(response.role);
          })
        );
  }

  public doRegister(login:string, password: string, name: string): Observable<LoginResponse> {
    return this.api.post<RegisterData, LoginResponse>(`${this.baseUrl}/register`, { login, password, name })
  }

  private saveAuthToLocalStorage(id: number, role: 'admin' | 'user') {
    localStorage.setItem('token', JSON.stringify({id, role}));
  }

  public get getAuthFromLocalStorage(): SaveLogin | null {
    const id = localStorage.getItem('token');
    return id ? JSON.parse(id) : null;
  }

  public logout(): void {
    localStorage.removeItem('token');
    this.authedId.next(0);
    this.authedRole.next(null);
  }
}
