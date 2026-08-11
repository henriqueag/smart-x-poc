import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { ThfLookupColumn, ThfLookupDataFilter, ThfLookupFilteredItemsParams, ThfLookupResponseApi } from '@totvs/thf-components';
import { BehaviorSubject, defer, filter, firstValueFrom, map, Observable, of, switchMap, take } from 'rxjs';
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
    private readonly _initialized = new BehaviorSubject(false);
    private readonly _keyProperty = signal('');
    private readonly _columns = signal<ThfLookupColumn[]>([]);

    private _requestUrl = '';
    private readonly _lookupRequests = new Map<string, Promise<void>>();

    readonly keyProperty = this._keyProperty.asReadonly();
    readonly columns = this._columns.asReadonly();

    configure(requestUrl: string): Promise<void> {
        if (this._requestUrl === requestUrl && this._initialized.getValue()) {
            return Promise.resolve();
        }

        this._initialized.next(false);
        this._requestUrl = requestUrl;

        const existingRequest = this._lookupRequests.get(requestUrl);

        if (existingRequest) return existingRequest;

        const lookupRequest = firstValueFrom(
            this._httpClient.get<Lookup>(requestUrl, {
                params: { page: 1, pageSize: 1 }
            })
        )
            .then(lookup => {
                if (this._requestUrl !== requestUrl) return;

                this._keyProperty.set(lookup.keyProperty);
                this._columns.set(this.getLookupColumns(lookup) ?? []);
                this._initialized.next(true);
            })
            .finally(() => {
                this._lookupRequests.delete(requestUrl);
            });

        this._lookupRequests.set(requestUrl, lookupRequest);
        return lookupRequest;
    }

    fetchItems(query: string): Observable<{ items: any[] }> {
        return this.whenInitialized().pipe(
            map(() => ({
                items: query ? [{ [this._keyProperty()]: query }] : []
            })),
            take(1)
        );
    }

    getFilteredItems(params: ThfLookupFilteredItemsParams): Observable<ThfLookupResponseApi> {
        return this.whenInitialized().pipe(
            switchMap(() =>
                defer(() => {
                    const { filter, page = 1 } = params;
                    const pageSize = params.filterParams?.pageSize ?? params.pageSize;
                    const query = typeof filter === 'object' ? filter.filter : filter;
                    const queryParams: any = { page, pageSize };

                    if (query?.length > 0) {
                        queryParams.q = query;
                    }

                    return this._httpClient.get<Lookup>(this._requestUrl, { params: queryParams });
                })
            ),
            map(lookup => ({
                items: lookup.data.map(item => ({ ...item, id: item.id ?? uuidv4() })),
                hasNext: lookup.hasNext
            })),
            take(1)
        );
    }

    getObjectByValue(value: string | any[]): Observable<any> {
        return this.whenInitialized().pipe(
            switchMap(() => (Array.isArray(value) ? of(value.map(item => ({ [this._keyProperty()]: item }))) : of({ [this._keyProperty()]: value }))),
            take(1)
        );
    }

    private whenInitialized(): Observable<void> {
        return this._initialized.pipe(
            filter(initialized => initialized),
            map(() => undefined),
            take(1)
        );
    }

    private getLookupColumns(lookup: Lookup): ThfLookupColumn[] {
        return Object.entries(lookup.descriptor)
            .map(([property, label]) => ({ property, label } as ThfLookupColumn))
    }
}
