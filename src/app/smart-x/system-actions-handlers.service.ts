import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ICallSystemActionHandlers } from '@smart-ui/ng-schema';

@Injectable({
    providedIn: 'root'
})
export class SystemActionHandlersService implements ICallSystemActionHandlers {
    router = inject(Router);

    navigate(args: any) {
        this.router.navigateByUrl(args.route);
    }
}
