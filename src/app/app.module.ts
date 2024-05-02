import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AuthComponent } from './pages/auth/auth.component';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {SharedModule} from "./shared/shared.module";
import {AppRoutingModule} from "./app-routing.module";
import { RegistrationComponent } from './pages/registration/registration.component';
import {HTTP_INTERCEPTORS, HttpClientModule} from "@angular/common/http";
import {AuthInterceptor} from "./interceptors/auth.interceptor";
import { HomeComponent } from './pages/home/home.component';
import {LoadingInterceptor} from "./interceptors/loading.interceptor";
import { ToastrComponent } from './components/toastr/toastr.component';
import { LoadingComponent } from './components/loading/loading.component';
import { HeaderComponent } from './components/header/header.component';
import { SearchComponent } from './components/search/search.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { SubscriberListComponent } from './components/subscriber-list/subscriber-list.component';
import {InfiniteScrollModule} from "ngx-infinite-scroll";
import { StreamModalComponent } from './components/stream-modal/stream-modal.component';
import { NotificationModalComponent } from './components/notification-modal/notification-modal.component';
import { StreamDetailsComponent } from './pages/stream-details/stream-details.component';
import {ChatModule} from "@progress/kendo-angular-conversational-ui";
import { StreamChatComponent } from './components/stream-chat/stream-chat.component';
import { UsersListComponent } from './components/users-list/users-list.component';
import { CourseDetailsComponent } from './pages/course-details/course-details.component';

@NgModule({
  declarations: [
    AppComponent,
    AuthComponent,
    RegistrationComponent,
    HomeComponent,
    ToastrComponent,
    LoadingComponent,
    HeaderComponent,
    SearchComponent,
    ProfileComponent,
    SubscriberListComponent,
    StreamModalComponent,
    NotificationModalComponent,
    StreamDetailsComponent,
    StreamChatComponent,
    UsersListComponent,
    CourseDetailsComponent
  ],
    imports: [
        BrowserModule,
        HttpClientModule,
        BrowserAnimationsModule,
        SharedModule,
        ReactiveFormsModule,
        AppRoutingModule,
        FormsModule,
        InfiniteScrollModule,
        ChatModule
    ],

  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoadingInterceptor,
      multi: true,
    },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
