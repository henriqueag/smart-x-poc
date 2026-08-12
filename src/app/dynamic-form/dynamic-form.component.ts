import { JsonPipe } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
    PoButtonModule,
    PoDisclaimerModule,
    PoFieldContainerModule,
    PoFieldModule,
    PoIconModule,
    PoRadioGroupOption,
    PoThemeA11yEnum
} from '@po-ui/ng-components';
import { ThfThemeService } from '@totvs/themes';
import { ThfComponentsModule, ThfLookupComponent, ThfLookupGridProperties } from '@totvs/thf-components';
import { DynamicFieldValuePickerComponent } from '../dynamic-field-value-picker/dynamic-field-value-picker.component';

@Component({
    selector: 'dynamic-form',
    templateUrl: './dynamic-form.component.html',
    styleUrl: './dynamic-form.component.scss',
    imports: [
        PoFieldModule, //
        PoButtonModule,
        PoIconModule,
        PoFieldContainerModule,
        PoDisclaimerModule,
        ReactiveFormsModule,
        FormsModule,
        ThfComponentsModule,
        ThfLookupComponent,
        JsonPipe,
        DynamicFieldValuePickerComponent
    ]
})
export class DynamicFormComponent {
    private readonly destroyRef = inject(DestroyRef);
    private readonly themeSrv = inject(ThfThemeService);

    readonly serviceUrl = 'http://localhost:3000/api/mockoon/objects/employees/schema/properties/options?type=lookup&id=1';
    readonly serviceUrlStr = 'http://localhost:3000/api/mockoon/objects/employees/schema/properties/options?type=lookup&id=2';
    openSearch() {}

    onRadioChange(value: string) {
        if (value === 'disabled') {
            this.formTest.disable();
        } else {
            this.formTest.enable();
        }
    }

    formTest = new FormGroup({
        lookup1: new FormControl('Hahn, Stokes and Rolfson'),
        lookup2: new FormControl([1, 2]),
        lookup3: new FormControl(null),
        lookup4: new FormControl([1, 2, 3, 4, 5, 6])
    });

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
        { label: 'Clean', value: 'clean' }
    ];
    maxlength = undefined;

    toogleTheme() {
        this.a11y = this.a11y === PoThemeA11yEnum.AAA ? PoThemeA11yEnum.AA : PoThemeA11yEnum.AAA;
        this.themeSrv.setCurrentThemeA11y(this.a11y);
    }
}
