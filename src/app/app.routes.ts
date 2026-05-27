import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: 'reports', loadChildren: () => import('./reports/reports.routes').then(r => r.REPORTS_ROUTES) }
];
