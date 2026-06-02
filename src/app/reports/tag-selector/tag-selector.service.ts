import { Injectable, signal } from '@angular/core';
import { PoComboFilter, PoComboOption } from '@po-ui/ng-components';
import { Observable, of } from 'rxjs';

@Injectable()
export class TagSelectorService implements PoComboFilter {
    tags = signal<PoComboOption[]>([]);

    getFilteredData(params: any): Observable<PoComboOption[]> {
        const currentTags = this.tags().map((val: any) => {
            const { selected, ...rest } = val;
            return rest;
        });

        if (!params.value || String(params.value).trim().length === 0) return of(currentTags);

        const filtered = currentTags.filter(t => String(t.value).toLowerCase().includes(String(params.value).toLowerCase()));
        if (filtered.length > 0) return of(filtered);

        return of([
            {
                label: params.value,
                value: params.value,
                selected: true
            },
            ...currentTags
        ]);
    }

    getObjectByValue(value: string | number): Observable<PoComboOption> {
        const found = this.tags().find(t => t.value === value) ?? { label: String(value), value };
        return of(found);
    }
}
