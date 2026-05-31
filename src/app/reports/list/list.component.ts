import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal, viewChild } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PoButtonModule, PoDynamicFormField, PoFieldModule, PoPageAction, PoPageModule } from '@po-ui/ng-components';
import {
    ThfComponentsModule,
    ThfGridColumn,
    ThfGridColumnSort,
    ThfGridComponent,
    ThfGridDeleteService,
    ThfTableAction
} from '@totvs/thf-components';
import { of } from 'rxjs';
import { ReportResource, ReportResourceListFilters } from '../report-resource.model';
import { ReportResourceService } from '../report-resource.service';

interface ReportGridItem extends ReportResource {
    ownerDisplayName: string;
    ownerId: string;
    permission: string;
}

@Component({
    selector: 'app-list',
    imports: [PoPageModule, PoButtonModule, PoFieldModule, ReactiveFormsModule, ThfComponentsModule],
    templateUrl: './list.component.html',
    styleUrl: './list.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListComponent implements OnInit {
    protected readonly service = inject(ReportResourceService);

    protected readonly gridItems = signal<ReportGridItem[]>([]);
    protected readonly gridEventHistory = signal<any>({});
    protected readonly selectedRows = signal<ReportGridItem[]>([]);
    protected readonly currentPage = signal(1);
    protected readonly currentPageSize = signal(5);
    protected readonly totalItems = signal(0);
    protected readonly groupColumns = signal<string[]>(['businessArea']);

    protected readonly hasMoreItems = computed(() => this.gridItems().length < this.totalItems());
    protected readonly totalLabel = computed(() => `${this.gridItems().length} de ${this.totalItems()} recursos`);

    private readonly activeFilters = signal<ReportResourceListFilters>({});

    protected readonly pageActions: PoPageAction[] = [
        {
            label: 'Incluir',
            icon: 'an an-plus',
            url: '/reports/create'
        },
        {
            label: 'Recarregar',
            action: () => this.loadPage(1, false)
        },
        {
            label: 'Limpar filtros',
            action: () => this.clearFilters()
        }
    ];

    protected readonly columns: ThfGridColumn[] = [
        { property: 'id', key: true, visible: false },
        {
            property: 'displayName',
            label: 'Nome',
            filter: true,
            resizable: true,
            sortable: true,
            width: 500
        },
        {
            property: 'description',
            label: 'Descricao',
            filter: true,
            resizable: true,
            sortable: false,
            visible: false,
            width: 300
        },
        {
            property: 'resourceType',
            label: 'Tipo',
            filter: true,
            type: 'label',
            labels: [
                { value: 'report', label: 'Relatório', color: 'color-07', icon: 'an an-newspaper' },
                { value: 'pivot-table', label: 'Tabela dinâmica', color: 'color-08', icon: 'an-fill an-crown' },
                { value: 'data-grid', label: 'Visão de dados', color: 'color-09', icon: 'an-fill an-grid-four' }
            ],
            sortable: true,
            width: 200
        },
        {
            property: 'createdAt',
            label: 'Criado em',
            type: 'date',
            format: 'dd/MM/yyyy HH:mm',
            sortable: true,
            filter: true,
            width: 200
        },
        {
            property: 'ownerDisplayName',
            label: 'Proprietário',
            filter: true,
            sortable: true,
            width: 250
        },
        {
            property: 'permission',
            label: 'Permissao',
            type: 'label',
            filter: true,
            sortable: true,
            labels: [
                { value: 'Viewer', label: 'Visualizador' },
                { value: 'Editor', label: 'Editor' },
                { value: 'Owner', label: 'Proprietário' }
            ],
            width: 180
        },
        {
            property: 'isFavorite',
            label: 'Favorito',
            type: 'icon',
            icons: [
                {
                    icon: 'an-fill an-star',
                    value: true as any,
                    tooltip: 'Marcar como favorito',
                    action: (row: any) => {
                        this.gridItems.update(items => {
                            items.find(item => item.id === row.id).isFavorite = false;
                            return [...items];
                        });
                    }
                },
                {
                    icon: 'an an-star',
                    value: false as any,
                    tooltip: 'Marcar como favorito',
                    action: (row: any) => {
                        this.gridItems.update(items => {
                            items.find(item => item.id === row.id).isFavorite = true;
                            return [...items];
                        });
                    }
                }
            ],
            filter: false,
            sortable: true,
            width: 140
        },
        {
            property: 'tags',
            label: 'Marcação',
            filter: true,
            type: 'cellTemplate',
            editProperties: {
                componentEditable: 'multiselect',
                options: [
                    { value: 'Financeiro', label: 'Financeiro' },
                    { value: 'Fiscal', label: 'Fiscal' },
                    { value: 'Orçamento', label: 'Orçamento' },
                    { value: 'RH', label: 'RH' }
                ],
                fieldLabel: 'label',
                fieldValue: 'value'
            }
        }
    ];

    protected readonly sortColumns: ThfGridColumnSort[] = [{ field: 'createdAt', dir: 'desc' }];

    protected readonly optionsPaging = [{ value: 10 }, { value: 20 }, { value: 30 }, { value: 50 }];

    protected readonly filterFields: PoDynamicFormField[] = [
        { property: 'displayName', label: 'Nome do recurso' },
        { property: 'description', label: 'Descricao' },
        { property: 'isFavorite', label: 'Favorito', type: 'boolean' }
    ];

    protected readonly rowActions: ThfTableAction[] = [
        {
            label: 'Visualizar',
            icon: 'an an-arrow-up-right',
            action: (resource: unknown) => this.onViewResource(resource),
            fixed: true
        }
    ];

    protected form: FormGroup;

    protected readonly customActions = [
        { label: 'Exportar', action: () => this.onBatchCustomAction('Exportar') },
        { label: 'Duplicar', action: () => this.onBatchCustomAction('Duplicar') },
        { label: 'Compartilhar', action: () => this.onBatchCustomAction('Compartilhar') }
    ];

    protected readonly onGridEdit = (selectedResource: unknown): void => {
        this.logGridEvent('t-action-edit', selectedResource);
    };

    private grid = viewChild<ThfGridComponent>(ThfGridComponent);

    constructor() {
        this.loadPage(1, false);
    }

    ngOnInit(): void {
        console.log('');
    }

    protected onGridDeleteItems(event: unknown): void {
        this.logGridEvent('t-delete-items', event);
        if (Array.isArray(event)) {
            const remaining = event.filter(item => this.isReportGridItem(item));
            this.gridItems.set(remaining);
            this.totalItems.update(value => Math.max(value - Math.max(this.selectedRows().length, 1), remaining.length));
            this.selectedRows.set([]);
        }
    }

    protected onGridAfterDuplicate(event: unknown): void {
        this.logGridEvent('t-after-duplicate', event);
    }

    protected onGridBeforeDuplicate(event: unknown): void {
        this.logGridEvent('t-before-duplicate', event);
    }

    protected onGridChangeAggregates(event: unknown): void {
        this.logGridEvent('t-change-aggregates', event);
    }

    protected onGridChangeFilterByColumn(event: unknown): void {
        this.logGridEvent('t-change-filter-by-column', event);
    }

    protected onGridChangeFixedColumns(event: unknown): void {
        this.logGridEvent('t-change-fixed-columns', event);
    }

    protected onGridChangeOptionsColumnManager(event: unknown): void {
        this.logGridEvent('t-change-options-column-manager', event);
    }

    protected onGridChangeRowStateFilter(event: unknown): void {
        this.logGridEvent('t-change-row-state-filter', event);
    }

    protected onGridChangeVisibleColumns(event: unknown): void {
        this.logGridEvent('t-change-visible-columns', event);
    }

    protected onGridChangedDensity(event: unknown): void {
        this.logGridEvent('t-changed-density', event);
    }

    protected onGridChangedItems(event: unknown): void {
        this.logGridEvent('t-changed-items', event);
    }

    protected onGridRestoreColumnManager(event: unknown): void {
        this.logGridEvent('t-restore-column-manager', event);
    }

    protected onGridCustomFilter(event: unknown): void {
        this.logGridEvent('t-custom-filter', event);
    }

    protected onGridDeleteItem(event: unknown): void {
        this.logGridEvent('t-delete-item', event);
    }

    protected onGridChangePageSize(event: unknown): void {
        this.logGridEvent('t-change-page-size', event);

        const parsedPageSize = this.extractPageSize(event);
        if (parsedPageSize) {
            this.currentPageSize.set(parsedPageSize);
            this.loadPage(1, false);
        }
    }

    protected onGridItemsAfterGet(event: unknown): void {
        this.logGridEvent('t-items-after-get', event);
    }

    protected onGridChangeGroup(event: unknown): void {
        this.logGridEvent('t-change-group', event);

        if (Array.isArray(event)) {
            const groups = event.filter((value): value is string => typeof value === 'string');
            this.groupColumns.set(groups);
        }
    }

    protected onGridChangeOrderColumn(event: unknown): void {
        this.logGridEvent('t-change-order-column', event);
    }

    protected onGridRowsSelected(event: unknown): void {
        this.logGridEvent('t-rows-selected', event);

        if (Array.isArray(event)) {
            this.selectedRows.set(event.filter(item => this.isReportGridItem(item)));
        }
    }

    protected onGridSelected(event: unknown): void {
        this.logGridEvent('t-selected', event);
    }

    protected onGridAllSelected(event: unknown): void {
        this.logGridEvent('t-all-selected', event);
    }

    protected onGridShowMore(event: unknown): void {
        this.logGridEvent('t-show-more', event);
        if (!this.hasMoreItems()) {
            return;
        }

        this.loadPage(this.currentPage() + 1, true);
    }

    protected onGridChangeSortColumn(event: unknown): void {
        this.logGridEvent('t-change-sort-column', event);
    }

    protected onGridUnselected(event: unknown): void {
        this.logGridEvent('t-unselected', event);
    }

    protected onGridAllUnselected(event: unknown): void {
        this.logGridEvent('t-all-unselected', event);
    }

    protected deleteItemService(): ThfGridDeleteService {
        const service: ThfGridDeleteService = {
            deleteItem: (selectedRow, filterParams, keyValue) => {
                this.logGridEvent('t-service-delete-api', { selectedRow, filterParams, keyValue });
                return of(void 0);
            }
        };

        return service;
    }

    private loadPage(page: number, append: boolean): void {
        this.service
            .listResources({
                ...this.activeFilters(),
                page,
                pageSize: this.currentPageSize()
            })
            .subscribe(result => {
                const mappedItems = result.items.map(item => this.mapResourceToGridItem(item));
                this.totalItems.set(result.total);
                this.currentPage.set(result.page);

                if (append) {
                    this.gridItems.update(items => [...items, ...mappedItems]);
                } else {
                    this.gridItems.set(mappedItems);
                }

                this.logGridEvent('load-page', {
                    page: result.page,
                    pageSize: result.pageSize,
                    total: result.total
                });
            });
    }

    private clearFilters(): void {
        this.activeFilters.set({});
        this.loadPage(1, false);
    }

    private mapResourceToGridItem(item: ReportResource): ReportGridItem {
        return {
            ...item,
            ownerDisplayName: item.owner.displayName,
            ownerId: item.owner.id,
            permission: item.currentUser.permission
        };
    }

    private onViewResource(resource: unknown): void {
        this.logGridEvent('view-resource', resource);
    }

    private onBatchCustomAction(actionName: string): void {
        this.logGridEvent(`custom-action:${actionName}`, {
            selectedRows: this.selectedRows().length
        });
    }

    private extractFilters(event: unknown): ReportResourceListFilters {
        const nextFilters: ReportResourceListFilters = {};

        if (!Array.isArray(event)) {
            return nextFilters;
        }

        for (const filter of event) {
            if (!this.isObject(filter)) {
                continue;
            }

            const property = this.readString(filter, 'property') ?? this.readString(filter, 'field');
            const rawValue = this.readFilterValue(filter);

            if (property === 'displayName') {
                const displayName = this.toNonEmptyString(rawValue);
                if (displayName) {
                    nextFilters.displayName = displayName;
                }
            }

            if (property === 'description') {
                const description = this.toNonEmptyString(rawValue);
                if (description) {
                    nextFilters.description = description;
                }
            }

            if (property === 'isFavorite') {
                const favorite = this.toBoolean(rawValue);
                if (typeof favorite === 'boolean') {
                    nextFilters.isFavorite = favorite;
                }
            }
        }

        return nextFilters;
    }

    private readFilterValue(filter: Record<string, unknown>): unknown {
        if ('value' in filter) {
            return filter.value;
        }

        if ('values' in filter && Array.isArray(filter.values) && filter.values.length > 0) {
            const value = filter.values[0];
            if (this.isObject(value) && 'value' in value) {
                return value.value;
            }

            return value;
        }

        return undefined;
    }

    private extractPageSize(event: unknown): number | undefined {
        if (!this.isObject(event)) {
            return undefined;
        }

        const fromPageSize = this.toPositiveInteger(event.pageSize);
        if (fromPageSize) {
            return fromPageSize;
        }

        const fromDashPageSize = this.toPositiveInteger(event['page-size']);
        if (fromDashPageSize) {
            return fromDashPageSize;
        }

        return undefined;
    }

    private toPositiveInteger(value: unknown): number | undefined {
        if (typeof value !== 'number' || Number.isNaN(value) || value < 1) {
            return undefined;
        }

        return Math.floor(value);
    }

    private toBoolean(value: unknown): boolean | undefined {
        if (typeof value === 'boolean') {
            return value;
        }

        if (typeof value === 'string') {
            if (value.toLowerCase() === 'true') {
                return true;
            }

            if (value.toLowerCase() === 'false') {
                return false;
            }
        }

        return undefined;
    }

    private toNonEmptyString(value: unknown): string | undefined {
        if (typeof value !== 'string') {
            return undefined;
        }

        const normalized = value.trim();
        if (!normalized) {
            return undefined;
        }

        return normalized;
    }

    private isReportGridItem(value: unknown): value is ReportGridItem {
        if (!this.isObject(value)) {
            return false;
        }

        return typeof value.id === 'string' && typeof value.displayName === 'string';
    }

    private isObject(value: unknown): value is Record<string, unknown> {
        return typeof value === 'object' && value !== null;
    }

    private readString(target: Record<string, unknown>, property: string): string | undefined {
        const value = target[property];
        return typeof value === 'string' ? value : undefined;
    }

    private logGridEvent(eventName: string, payload: unknown): void {
        const payloadPreview = this.stringifyPayload(payload);
        this.gridEventHistory.set({ eventName, payloadPreview });
    }

    private stringifyPayload(payload: unknown): string {
        try {
            return JSON.stringify(payload ?? '{}', null, 2);
        } catch {
            return String(payload);
        }
    }
}
