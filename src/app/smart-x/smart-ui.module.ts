import { NgModule } from '@angular/core';
import { EnvironmentConfig, SmartUIComponentsModule } from '@smart-ui/ng-schema';
import { SmartResourceWrapperComponent } from './smart-resource-wrapper.component';
import { SystemActionHandlersService } from './system-actions-handlers.service';

export const SMART_UI_CONFIG: EnvironmentConfig = {
    authorizationType: 'Bearer',
    production: false,
    apiBaseUrl: 'http://localhost:3002/api/smart-x',
    apiFilterUrl: 'filter'
};

@NgModule({
    imports: [
        SmartUIComponentsModule.forRoot(SMART_UI_CONFIG),
        SmartResourceWrapperComponent
    ],
    providers: [
        { provide: 'ICallSystemActionHandlers', useExisting: SystemActionHandlersService }
    ]
})
export class SmartUIModule {}
