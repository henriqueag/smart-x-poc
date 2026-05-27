import { Routes } from '@angular/router';

export const REPORTS_ROUTES: Routes = [
    { path: '', redirectTo: 'list', pathMatch: 'full' },
    { path: 'list', loadComponent: () => import('./list/list.component').then(c => c.ListComponent) }
];
