import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import {
    PoHeaderActions, //
    PoHeaderBrand,
    PoHeaderModule,
    PoThemeA11yEnum,
    PoThemeTypeEnum,
    PoTagModule
} from '@po-ui/ng-components';
import { poThemeTotvs, ThfThemeService } from '@totvs/themes';
import { AutocompleteComponent, Disclaimer } from './autocomplete/autocomplete.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    imports: [
        RouterOutlet, //
        PoHeaderModule,
        PoTagModule,
        AutocompleteComponent
    ]
})
export class AppComponent {
    private router = inject(Router);
    private theme = inject(ThfThemeService);

    headerBrand: PoHeaderBrand = {
        title: 'SMART VIEW',
        logo: 'assets/images/totvs-logo-dark.png',
        smallLogo: 'assets/images/totvs-short-logo-menu-dark.png'
    };

    headerActions: PoHeaderActions[] = [
        { label: 'Início', action: () => this.reload(['/']) },
        { label: 'Relatórios', action: () => this.reload(['/reports', 'list']) }
    ];

    constructor() {
        this.theme.setA11yDefaultSizeSmall(true);
        this.theme.setDensityMode('small');
        this.theme.setTheme(poThemeTotvs, PoThemeTypeEnum.light, PoThemeA11yEnum.AA, true);
    }

    reload(commands: string[]) {
        this.router.navigate(['/'], { skipLocationChange: true }).then(() => this.router.navigate(commands));
    }

    tags = signal<Disclaimer[]>([]);

    onTagAdd(value: string) {
        const normalizedValue = value.trim();

        if (!normalizedValue) {
            return;
        }

        const alreadyExists = this.tags().some(tag => String(tag.value).toLowerCase() === normalizedValue.toLowerCase());

        if (alreadyExists) {
            return;
        }

        this.tags.update(tags => [
            ...tags,
            {
                label: normalizedValue,
                value: normalizedValue,
                formattedValue: normalizedValue
            }
        ]);
    }

    onTagRemove(removedTag: Disclaimer) {
        this.tags.update(tags => [...tags].filter(tag => tag.value !== removedTag.value));
    }

    onTagRemoveAll() {
        this.tags.set([]);
    }

    onAutocompleteKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            event.preventDefault();
        }
    }
}
