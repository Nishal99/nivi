import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { provideSweetAlert2 } from '@sweetalert2/ngx-sweetalert2';
import { provideHttpClient } from '@angular/common/http';

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    ...(appConfig?.providers ?? []),
    provideSweetAlert2(),
     provideHttpClient() 
  ]
})
  .catch((err) => console.error(err));
