import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'reports/list',
        loadComponent: () => import('./smart-x/smart-resource-wrapper.component').then(c => c.SmartResourceWrapperComponent)
    },
    {
        path: 'reports/create',
        loadComponent: () => import('./reports/create/create.component').then(c => c.CreateComponent),
    }
];
