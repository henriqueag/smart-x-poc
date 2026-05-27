import { Component } from '@angular/core';
import { TSmartResourceModule } from '@smart-ui/ng-schema';

@Component({
    selector: 'sv-smart-resource-wrapper',
    template: `<t-smart-resource/>`,
    imports: [TSmartResourceModule]
})
export class SmartResourceWrapperComponent {
    navigate(route: string) {
        console.log(route);
    }
}
