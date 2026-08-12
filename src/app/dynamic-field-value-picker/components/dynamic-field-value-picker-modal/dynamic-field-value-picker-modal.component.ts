import { Component, computed, effect, inject, input, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ThfLookupDataComponent } from '@totvs/thf-components';
import { PoModalAction, PoModalComponent, PoModalModule } from '@po-ui/ng-components';
import { DynamicFieldValuePickerLookupService, LookupValue } from '../../services/dynamic-field-value-picker-lookup.service';

@Component({
    selector: 'dynamic-field-value-picker-modal',
    templateUrl: './dynamic-field-value-picker-modal.component.html',
    imports: [FormsModule, PoModalModule, ThfLookupDataComponent]
})
export class DynamicFieldValuePickerModalComponent {
    readonly lookupService = inject(DynamicFieldValuePickerLookupService);

    readonly multiValue = input(false);
    readonly serviceUrl = input<string>();
    readonly modal = viewChild(PoModalComponent);
    readonly lookupData = viewChild(ThfLookupDataComponent);
    readonly selectedValue = signal<LookupValue>(null);
    readonly pendingInitialValueResolution = signal(false);

    readonly actions = computed<Record<string, PoModalAction>>(() => ({
        primary: {
            label: 'Selecionar',
            action: () => {
                this.lookupService.confirmSelection(this.getConfirmedValue());
                this.modal()?.close();
            }
        },
        secondary: { label: 'Cancelar', action: () => this.modal()?.close() }
    }));

    constructor() {
        effect(() => {
            if (!this.pendingInitialValueResolution() || !this.lookupService.initialized()) {
                return;
            }

            const lookupData = this.lookupData();
            if (!lookupData) {
                return;
            }

            this.pendingInitialValueResolution.set(false);

            const value = this.lookupService.fieldValue();
            if (value !== null) {
                requestAnimationFrame(() => lookupData['searchByValue'](value, true));
            }
        });
    }

    open(): void {
        this.selectedValue.set(this.lookupService.fieldValue());
        this.pendingInitialValueResolution.set(true);
        this.lookupService.configure(this.serviceUrl());
        this.modal()?.open();
    }

    clearSelection(): void {
        this.selectedValue.set(this.multiValue() ? [] : null);
    }

    onSelected(value: LookupValue | undefined): void {
        this.selectedValue.set(value ?? (this.multiValue() ? [] : null));
    }

    private getConfirmedValue(): LookupValue {
        const value = this.selectedValue();

        return value === null && this.multiValue() ? [] : value;
    }
}
