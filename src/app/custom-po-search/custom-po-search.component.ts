import { JsonPipe } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PoButtonModule, PoDisclaimerModule, PoFieldContainerModule, PoFieldModule, PoIconModule, PoRadioGroupOption, PoThemeA11yEnum } from '@po-ui/ng-components';
import { ThfThemeService } from '@totvs/themes';
import { ThfComponentsModule, ThfLookupGridProperties } from '@totvs/thf-components';
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
        ThfComponentsModule,
        JsonPipe
    ]
})
export class CustomPoSearchComponent {
    private readonly destroyRef = inject(DestroyRef);
    private readonly themeSrv = inject(ThfThemeService);

    openSearch() {

    }

    onRadioChange(value: string) {
        if (value === 'disabled') {
            this.formTest.disable();
        } else {
            this.formTest.enable();
        }
    }

    formTest = new FormGroup({
        lookup1: new FormControl('fjkljslfkjsklfjsldkjfklsdjfkljsddlfjsdlkjfklioweujrioweuqio'),
        lookup2: new FormControl(['Disclaimer 1', 'Disclaimer 2', 'Disclaimer 3', 'Disclaimer 4', 'Disclaimer 5']),
        lookup3: new FormControl(null),
        lookup4: new FormControl([1, 2, 3, 4, 5, 6])
    })

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
        { label: 'Disabled', value: 'disabled' },
        { label: 'Clean', value: 'clean' },
    ]
    maxlength = undefined;

    toogleTheme() {
        this.a11y = this.a11y === PoThemeA11yEnum.AAA ? PoThemeA11yEnum.AA : PoThemeA11yEnum.AAA;
        this.themeSrv.setCurrentThemeA11y(this.a11y)
    }
}
