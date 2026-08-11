import { Component, DestroyRef, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PoButtonModule, PoDisclaimer, PoDisclaimerModule, PoFieldContainerModule, PoFieldModule, PoIconModule, PoInputComponent, PoRadioGroupOption, PoThemeA11yEnum } from '@po-ui/ng-components';
import { ThfThemeService } from '@totvs/themes';
import { ThfComponentsModule, ThfLookupGridProperties } from '@totvs/thf-components';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { LookupComponent } from '../lookup/lookup.component';

@Component({
    selector: 'custom-po-search',
    templateUrl: './custom-po-search.component.html',
    styleUrl: './custom-po-search.component.scss',
    imports: [
        PoFieldModule, //
        PoButtonModule,
        PoIconModule,
        PoFieldContainerModule,
        PoDisclaimerModule,
        ReactiveFormsModule,
        FormsModule,
        LookupComponent,
        ThfComponentsModule
    ]
})
export class CustomPoSearchComponent {
    private readonly destroyRef = inject(DestroyRef);
    private readonly themeSrv = inject(ThfThemeService);

    control = new FormControl('Teste');

    input = viewChild(PoInputComponent);

    loading = false;

    constructor() {
        this.control.valueChanges.pipe(debounceTime(250), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef)).subscribe(value => {
            console.log(value);
        });
    }

    onModify() {
        this.loading = !this.loading;
    }

    openSearch() {

    }

    clear() {
        console.log('clear');
    }

    formMission = new FormGroup({
        lookup2: new FormControl(['1495831666871'])
    });

    gridProperties: ThfLookupGridProperties = {
        autoSize: true,
        autoSizeOnScroll: true,
        resizable: true,
        groupable: true,
        draggable: true,
        hideSelectAll: true
    };

    columns = [
        { property: 'name', label: 'Name' },
        { property: 'nickname', label: 'Nickname' },
        { property: 'email', label: 'Email' },
        { property: 'id', label: 'Id' }
    ];

    keysLabel = [
        { label: 'Nome', value: 'name' },
        { label: 'Email', value: 'email' }
    ];

    filterSelect = [
        { label: 'Nome', value: 'name' },
        { label: 'Nickname', value: 'nickname' },
        { label: 'Email', value: 'email' }
    ];

    a11y = PoThemeA11yEnum.AAA;

    radioValue: string;
    radioOptions: PoRadioGroupOption[] = [
        { label: 'None', value: 'none' },
        { label: 'Loading', value: 'loading' },
        { label: 'Readonly', value: 'readonly' },
        { label: 'Disabled', value: 'disabled' }
    ]

    toogleTheme() {
        this.a11y = this.a11y === PoThemeA11yEnum.AAA ? PoThemeA11yEnum.AA : PoThemeA11yEnum.AAA;
        this.themeSrv.setCurrentThemeA11y(this.a11y)
    }
}
