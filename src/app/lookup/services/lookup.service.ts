import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { ThfLookupColumn, ThfLookupDataFilter, ThfLookupFilteredItemsParams, ThfLookupResponseApi } from '@totvs/thf-components';
import { map, Observable, of, switchMap, tap } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

export interface Lookup {
    keyProperty?: string;
    data: any[];
    descriptor?: Record<string, string>;
    hasNext?: boolean;
}

@Injectable()
export class LookupService implements ThfLookupDataFilter {
    private readonly _httpClient = inject(HttpClient);

    private readonly requestUrl = signal(null);
    private readonly _keyProperty = signal('empty');
    private readonly _columns = signal<ThfLookupColumn[]>([]);

    private readonly initialized = computed(() => this.keyProperty() !== 'empty' && this.columns().length > 0);

    readonly configured = computed(() => !!this.requestUrl());

    readonly loading = signal(false);
    readonly keyProperty = this._keyProperty.asReadonly();
    readonly columns = this._columns.asReadonly();
    readonly selectedItems = signal<any[]>([]);

    configure(requestUrl: string): void {
        this.requestUrl.set(requestUrl);
    }

    fetchItems(query: string): Observable<{ items: any[] }> {
        return of(null).pipe(
            map(() => ({ items: query ? [{ [this._keyProperty()]: query }] : [] }))
        );
    }

    getFilteredItems(params: ThfLookupFilteredItemsParams): Observable<ThfLookupResponseApi> {
        this.loading.set(!this.initialized());

        const { filter, page = 1 } = params;
        const pageSize = params.filterParams?.pageSize ?? params.pageSize;
        const query = typeof filter === 'object' ? filter.filter : filter;
        const queryParams: any = { page, pageSize };

        if (query?.length > 0) {
            queryParams.q = query;
        }

        return this._httpClient.get<Lookup>(this.requestUrl(), { params: queryParams }).pipe(
            tap((lookup) => {
                if (!this.initialized()) {
                    this._keyProperty.set(lookup.keyProperty);
                    this._columns.set(this.getLookupColumns(lookup));
                    this.loading.set(false);
                }
            }),
            map((lookup) => ({
                items: lookup.data.map(item => ({ ...item, id: item.id ?? uuidv4() })),
                hasNext: lookup.hasNext
            }))
        );
    }

    getObjectByValue(value: string | any[]): Observable<any> {
        return of(null).pipe(
            switchMap(() => (Array.isArray(value)
                ? of(value.map(item => ({ [this._keyProperty()]: item })))
                : of({ [this._keyProperty()]: value }))
            )
        );
    }

    private getLookupColumns(lookup: Lookup): ThfLookupColumn[] {
        return Object.entries(lookup.descriptor)
            .map(([property, label]) => ({ property, label }) as ThfLookupColumn);
    }
}
