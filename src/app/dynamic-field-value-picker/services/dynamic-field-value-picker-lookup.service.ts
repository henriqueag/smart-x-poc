import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { ThfLookupColumn, ThfLookupDataFilter, ThfLookupFilteredItemsParams, ThfLookupResponseApi } from '@totvs/thf-components';
import { map, Observable, of, switchMap, tap } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

const MINIMUM_FILTER_LENGTH = 3;

export type LookupPrimitiveValue = string | number;
export type LookupValue = LookupPrimitiveValue | LookupPrimitiveValue[] | null;

export interface Lookup {
    keyProperty?: string;
    data: any[];
    descriptor?: Record<string, string>;
    hasNext?: boolean;
}

@Injectable()
export class DynamicFieldValuePickerLookupService implements ThfLookupDataFilter {
    private readonly httpClient = inject(HttpClient);

    private readonly requestUrl = signal<string | null>(null);
    private readonly keyPropertyState = signal('empty');
    private readonly columnsState = signal<ThfLookupColumn[]>([]);
    private lastFilteredResponse: ThfLookupResponseApi = { items: [], hasNext: false };
    readonly initialized = computed(() => this.keyProperty() !== 'empty' && this.columns().length > 0);

    readonly configured = computed(() => !!this.requestUrl());
    readonly loading = signal(false);
    readonly keyProperty = this.keyPropertyState.asReadonly();
    readonly columns = this.columnsState.asReadonly();
    readonly fieldValue = signal<LookupValue>(null);
    readonly confirmedValue = signal<LookupValue | undefined>(undefined);

    configure(requestUrl: string | undefined): void {
        this.requestUrl.set(requestUrl ?? null);
    }

    setFieldValue(value: LookupValue): void {
        this.fieldValue.set(value);
    }

    confirmSelection(value: LookupValue): void {
        this.setFieldValue(value);
        this.confirmedValue.set(value);
    }

    clearConfirmedValue(): void {
        this.confirmedValue.set(undefined);
    }

    fetchItems(query: string): Observable<{ items: any[] }> {
        return of({ items: query ? [{ [this.keyProperty()]: query }] : [] });
    }

    getFilteredItems(params: ThfLookupFilteredItemsParams): Observable<ThfLookupResponseApi> {
        const { filter, page = 1 } = params;
        const pageSize = params.filterParams?.pageSize ?? params.pageSize;
        const query = (typeof filter === 'object' ? filter.filter : filter) ?? '';

        if (query.length > 0 && query.length < MINIMUM_FILTER_LENGTH) {
            return of(this.lastFilteredResponse);
        }

        this.loading.set(!this.initialized());

        const queryParams: Record<string, string | number> = { page, pageSize };

        if (query.length >= MINIMUM_FILTER_LENGTH) {
            queryParams.q = query;
        }

        return this.httpClient.get<Lookup>(this.requestUrl() ?? '', { params: queryParams }).pipe(
            tap(lookup => {
                if (!this.initialized()) {
                    this.keyPropertyState.set(lookup.keyProperty ?? 'empty');
                    this.columnsState.set(this.getLookupColumns(lookup));
                    this.loading.set(false);
                }
            }),
            map(lookup => {
                const response = {
                    items: lookup.data.map(item => ({ ...item, id: item.id ?? uuidv4() })),
                    hasNext: lookup.hasNext
                };
                this.lastFilteredResponse = response;

                return response;
            })
        );
    }

    getObjectByValue(value: LookupValue): Observable<any> {
        if (Array.isArray(value) && value.length === 0) {
            return of([{}]);
        }

        return of(null).pipe(
            switchMap(() => {
                const values = this.toValues(value);
                const items = values.map(item => ({ [this.keyProperty()]: item }));

                return of(Array.isArray(value) ? items : items[0] ?? null);
            })
        );
    }

    private toValues(value: LookupValue): LookupPrimitiveValue[] {
        if (value === null) {
            return [];
        }

        return Array.isArray(value) ? value : [value];
    }

    private getLookupColumns(lookup: Lookup): ThfLookupColumn[] {
        return Object.entries(lookup.descriptor ?? {})
            .map(([property, label]) => ({ property, label }) as ThfLookupColumn);
    }
}
