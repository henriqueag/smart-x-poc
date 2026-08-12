import { Component, computed, effect, inject, input, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ThfLookupDataComponent } from '@totvs/thf-components';
import { PoModalAction, PoModalComponent, PoModalModule } from '@po-ui/ng-components';
import { LookupService, LookupValue } from '../../services/lookup.service';

@Component({
    selector: 'lookup-modal',
    templateUrl: './lookup-modal.component.html',
    imports: [FormsModule, PoModalModule, ThfLookupDataComponent]
})
export class LookupModalComponent {
    readonly lookupSrv = inject(LookupService);

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
                this.lookupSrv.confirmSelection(this.selectedValue());
                this.modal()?.close();
            }
        },
        secondary: { label: 'Cancelar', action: () => this.modal()?.close() }
    }));

    constructor() {
        effect(() => {
            if (!this.pendingInitialValueResolution() || !this.lookupSrv.initialized()) {
                return;
            }

            const lookupData = this.lookupData();
            if (!lookupData) {
                return;
            }

            this.pendingInitialValueResolution.set(false);

            const value = this.lookupSrv.fieldValue();
            if (value !== null) {
                requestAnimationFrame(() => lookupData['searchByValue'](value, true));
            }
        });
    }

    open(): void {
        this.selectedValue.set(this.lookupSrv.fieldValue());
        this.pendingInitialValueResolution.set(true);
        this.lookupSrv.configure(this.serviceUrl());
        this.modal()?.open();
    }

    onSelected(value: LookupValue): void {
        this.selectedValue.set(value);
    }
}
