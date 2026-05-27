import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from "@angular/core";
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withComponentInputBinding } from "@angular/router";
import { PoModule } from "@po-ui/ng-components";
import { routes } from "./app.routes";

export const appConfig: ApplicationConfig = {
    providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideAnimationsAsync(),
        importProvidersFrom(PoModule),
        provideRouter(routes, withComponentInputBinding()),
        provideZoneChangeDetection({ eventCoalescing: true })
    ]
}
