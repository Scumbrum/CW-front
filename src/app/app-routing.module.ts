import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Route, RouterModule} from "@angular/router";
import {ROUTES} from "./constants/routes";
import {AuthComponent} from "./pages/auth/auth.component";
import {RegistrationComponent} from "./pages/registration/registration.component";
import {HomeComponent} from "./pages/home/home.component";
import {AuthGuard} from "./guards/auth.guard";
import {RegisterGuard} from "./guards/register.guard";
import {ProfileComponent} from "./pages/profile/profile.component";
import {StreamDetailsComponent} from "./pages/stream-details/stream-details.component";
import {CourseDetailsComponent} from "./pages/course-details/course-details.component";

const routes: Route[] = [
  {path: ROUTES.AUTH, component: AuthComponent, canActivate: [RegisterGuard]},
  {path: ROUTES.HOME, component: HomeComponent, pathMatch: 'full', canActivate: [AuthGuard]},
  {path: ROUTES.REGISTRATION, component: RegistrationComponent, canActivate: [RegisterGuard]},
  {path: ROUTES.PROFILE, component: ProfileComponent, canActivate: [AuthGuard]},
  {path: ROUTES.OTHER_PROFILE, component: ProfileComponent, canActivate: [AuthGuard]},
  {path: ROUTES.STREAM_DETAILS, component: StreamDetailsComponent, canActivate: [AuthGuard]},
  {path: ROUTES.COURSE_DETAILS, component: CourseDetailsComponent, canActivate: [AuthGuard]}
]

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forRoot(routes)
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule { }
