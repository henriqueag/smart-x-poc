import { Component, computed, effect, inject, input, signal, viewChild } from '@angular/core';
import { ThfLookupDataComponent } from '@totvs/thf-components';
import { PoModalAction, PoModalComponent, PoModalModule } from '@po-ui/ng-components';
import { LookupService } from '../../services/lookup.service';

@Component({
    selector: 'lookup-modal',
    templateUrl: './lookup-modal.component.html',
    styleUrl: './lookup-modal.component.scss',
    imports: [PoModalModule, ThfLookupDataComponent]
})
export class LookupModalComponent {
    readonly lookupSrv = inject(LookupService);

    multiValue = input<boolean>();
    serviceUrl = input<string>();

    modal = viewChild(PoModalComponent);

    actions = computed<Record<string, PoModalAction>>(() => ({
        primary: {
            label: 'Selecionar',
            action: () => {
                this.lookupSrv.selectedItems.set(this.selectedItems());
                this.modal().close();
            }
        },
        secondary: { label: 'Cancelar', action: () => {} }
    }));

    selectedItems = signal<any>([]);

    open() {
        this.lookupSrv.configure(this.serviceUrl());
        this.modal().open();
    }

    onSelected(value: any) {
        this.selectedItems.set(value);
    }
}
