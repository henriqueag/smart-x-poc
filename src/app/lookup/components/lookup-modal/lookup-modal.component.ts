import { Component, computed, viewChild } from '@angular/core';
import { ThfLookupDataComponent } from '@totvs/thf-components';
import { PoModalAction, PoModalComponent, PoModalModule } from '@po-ui/ng-components';

@Component({
    selector: 'lookup-modal',
    templateUrl: './lookup-modal.component.html',
    styleUrl: './lookup-modal.component.scss',
    imports: [PoModalModule, ThfLookupDataComponent]
})
export class LookupModalComponent {
    modal = viewChild(PoModalComponent);

    actions = computed<Record<string, PoModalAction>>(() => ({
        primary: { label: 'Cancelar', action: () => {} },
        secondary: { label: 'Selecionar', action: () => {} }
    }));

    open() {
        this.modal().open();
    }
}
