import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { PoHeaderActions, PoHeaderBrand, PoHeaderModule, PoThemeA11yEnum, PoThemeTypeEnum } from '@po-ui/ng-components';
import { poThemeTotvs, ThfThemeService } from '@totvs/themes';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    imports: [RouterOutlet, PoHeaderModule]
})
export class AppComponent {
    private router = inject(Router);
    private theme = inject(ThfThemeService);

    headerBrand: PoHeaderBrand = {
        title: 'SMART VIEW',
        logo: 'assets/images/totvs-logo-dark.png',
        smallLogo: 'assets/images/totvs-short-logo-menu-dark.png'
    }

    headerActions: PoHeaderActions[] = [
        { label: 'Home', action: this.reload.bind(this) }
    ]

    constructor() {
        this.theme.setA11yDefaultSizeSmall(true);
        this.theme.setDensityMode('small');
        this.theme.setTheme(poThemeTotvs, PoThemeTypeEnum.light, PoThemeA11yEnum.AAA, true);
    }

    reload() {
        this.router.navigate(['/'], { skipLocationChange: true })
            .then(() => this.router.navigate(['/test']));
    }
}
