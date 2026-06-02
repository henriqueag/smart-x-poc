import { AfterViewInit, ChangeDetectionStrategy, Component, computed, DestroyRef, ElementRef, inject, Renderer2, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
    PoComboOption,
    PoDynamicFormField,
    PoModalAction,
    PoModalComponent,
    PoModule,
    PoMultiselectOption,
    PoPageAction,
    PoPageDefaultComponent,
    PoPopupAction,
    PoPopupComponent
} from '@po-ui/ng-components';
import { ThfComponentsModule, ThfGridColumn, ThfGridColumnSort, ThfGridComponent, ThfGridLiterals, ThfTableAction } from '@totvs/thf-components';
import { debounceTime, distinctUntilChanged, filter, switchMap, tap } from 'rxjs';
import { TagSelectorComponent } from '../tag-selector/tag-selector.component';
import { ReportResource, ReportResourceListFilters, ReportResourceListQuery, ReportResourceType } from '../report-resource.model';
import { ReportResourceService } from '../report-resource.service';

interface ReportGridItem extends ReportResource {
    ownerDisplayName: string;
    ownerId: string;
    permission: string;
}

@Component({
    selector: 'app-list',
    imports: [
        PoModule, //
        FormsModule,
        ReactiveFormsModule,
        ThfComponentsModule,
        TagSelectorComponent
    ],
    templateUrl: './list.component.html',
    styleUrl: './list.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListComponent implements AfterViewInit {
    // Serviços e injeções da view
    private service = inject(ReportResourceService);
    private elRef = inject(ElementRef);
    private renderer = inject(Renderer2);
    private destroyRef = inject(DestroyRef);

    // Estado base da tela
    gridItems = signal<ReportGridItem[]>([]);
    gridEventHistory = signal<any>({});
    selectedRows = signal<ReportGridItem[]>([]);
    currentPage = signal(1);
    currentPageSize = signal(15);
    totalItems = signal(0);
    groupColumns = signal<string[]>(['businessArea']);

    // Estados derivados
    hasMoreItems = computed(() => this.gridItems().length < this.totalItems());
    totalLabel = computed(() => `${this.gridItems().length} de ${this.totalItems()} recursos`);

    // Filtros ativos e ajustes auxiliares
    searchControl = new FormControl('');
    activeFilters = signal<ReportResourceListFilters>({});

    // Ações da página
    pageActions: PoPageAction[] = [
        {
            label: 'Incluir',
            icon: 'an an-plus',
            action: () => this.popup().toggle()
        },
        {
            label: 'Atualizar',
            action: () => this.loadPage(1, false)
        }
    ];

    // Ações do popup de inclusão
    pageButtonEl = signal<ElementRef>(null);
    popupActions: PoPopupAction[] = [
        { label: 'Relatórios', icon: 'an an-newspaper', action: () => alert('Cadastro de relatório') },
        { label: 'Tabela dinâmica', icon: 'an-fill an-crown', action: () => alert('Cadastro de tabela dinâmica') },
        { label: 'Visão de dados', icon: 'an-fill an-grid-four', action: () => alert('Cadastro de visão de dados') }
    ];

    // #region Gestão de tags
    selectedRowId = signal<string>(null);
    isTagEditing = signal<boolean>(false);
    tags = signal<PoComboOption[]>(this.service.tags.map(tag => ({ label: tag, value: tag })));

    onStartTagEdit(row: ReportGridItem) {
        if (!this.isTagEditing() && this.selectedRowId() === row.id) {
            this.isTagEditing.set(true);
        }
    }

    onFinishTagEdit() {
        this.selectedRowId.set(null);
        this.isTagEditing.set(false);
    }

    onUpdateTags(value: PoComboOption[]) {
        this.tags.set(value);
    }

    // #endregion

    // #region Configuração da grid
    columns: ThfGridColumn[] = [
        { property: 'id', key: true, visible: false },
        {
            property: 'displayName',
            label: 'Nome',
            filter: false,
            resizable: true,
            sortable: true,
            width: 500
        },
        {
            property: 'description',
            label: 'Descricao',
            filter: false,
            resizable: true,
            sortable: false,
            visible: false,
            width: 300
        },
        {
            property: 'resourceType',
            label: 'Tipo',
            filter: false,
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
            filter: false,
            sortable: true,
            width: 250
        },
        {
            property: 'permission',
            label: 'Permissao',
            type: 'label',
            filter: false,
            sortable: true,
            labels: [
                { value: 'Viewer', label: 'Visualizador' },
                { value: 'Editor', label: 'Editor' },
                { value: 'Owner', label: 'Proprietário' }
            ],
            width: 180
        },
        {
            property: 'tags',
            label: 'Marcação',
            filter: false,
            type: 'cellTemplate'
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
        }
    ];

    sortColumns: ThfGridColumnSort[] = [{ field: 'createdAt', dir: 'desc' }];

    optionsPaging = [{ value: 10 }, { value: 20 }, { value: 30 }, { value: 50 }];

    filterFields: PoDynamicFormField[] = [
        { property: 'displayName', label: 'Nome do recurso' },
        { property: 'description', label: 'Descricao' },
        { property: 'isFavorite', label: 'Favorito', type: 'boolean' }
    ];

    rowActions: ThfTableAction[] = [
        {
            label: 'Visualizar',
            icon: 'an an-arrow-up-right',
            action: (resource: unknown) => this.onViewResource(resource),
            fixed: true
        }
    ];

    customActions = [
        { label: 'Exportar', action: () => this.onBatchCustomAction('Exportar') },
        { label: 'Duplicar', action: () => this.onBatchCustomAction('Duplicar') },
        { label: 'Compartilhar', action: () => this.onBatchCustomAction('Compartilhar') }
    ];

    gridLiterals: ThfGridLiterals = {
        noDataRowStateFilterActive: 'Nenhum recurso encontrado',
        noDataRowStateFilterRemoved: 'Nenhum recurso encontrado',
        moreActions: 'Outras ações'
    };

    // #endregion

    // #region Estado do modal de filtro avançado
    advancedFilter = {
        accessType: 'All',
        name: '',
        description: '',
        favorite: 'all',
        types: [] as string[],
        tags: [] as string[]
    };

    accessTypeOptions = [
        { value: 'All', label: 'Todos' },
        { value: 'Owner', label: 'Meus Recursos' },
        { value: 'Shared', label: 'Compartilhados comigo' }
    ];

    favoriteFilterOptions = [
        { value: 'all', label: 'Todos' },
        { value: 'true', label: 'Sim' },
        { value: 'false', label: 'Não' }
    ];

    resourceTypeOptions = [
        { value: 'report', label: 'Relatório' },
        { value: 'pivot-table', label: 'Tabela' },
        { value: 'data-grid', label: 'Visão' }
    ];

    filterModalPrimaryAction: PoModalAction = {
        label: 'Aplicar',
        action: () => {
            this.applyAdvancedFilters();
            this.buildFilterQueryString();
        }
    };

    filterModalSecondaryAction: PoModalAction = {
        label: 'Limpar filtros',
        action: () => this.clearAdvancedFilters()
    };

    tagCatalog: PoMultiselectOption[] = [
        { label: 'Financeiro', value: 'Financeiro' },
        { label: 'Fiscal', value: 'Fiscal' },
        { label: 'Orçamento', value: 'Orçamento' },
        { label: 'RH', value: 'RH' }
    ];
    // #endregion

    // References da view
    private grid = viewChild<ThfGridComponent>(ThfGridComponent);
    private gridEl = viewChild(ThfGridComponent, { read: ElementRef });
    private filterModal = viewChild<PoModalComponent>('filterModal');
    private popup = viewChild<PoPopupComponent>(PoPopupComponent);
    private pageDefault = viewChild(PoPageDefaultComponent, { read: ElementRef });

    // Inicialização
    constructor() {
        this.loadPage(1, false);

        this.searchControl.valueChanges
            .pipe(
                filter(val => val.length <= 0 || val.length >= 3),
                distinctUntilChanged(),
                debounceTime(300),
                takeUntilDestroyed(this.destroyRef),
                switchMap(value => {
                    const query: ReportResourceListQuery = {
                        page: 1,
                        pageSize: this.currentPageSize(),
                        displayName: value
                    };
                    return this.service.listResources(query).pipe(
                        tap(result => {
                            const mappedItems = result.items.map(item => this.mapResourceToGridItem(item));
                            this.totalItems.set(result.total);
                            this.currentPage.set(result.page);
                            this.gridItems.set(mappedItems);
                        })
                    );
                })
            )
            .subscribe();
    }

    // Ajustes pós-renderização da grid e do toolbar search
    ngAfterViewInit(): void {
        queueMicrotask(() => {
            // Atribuição do elementRef do botão incluir
            this.pageButtonEl.set(this.pageDefault().nativeElement.querySelector('.po-page-header-actions po-button[p-kind=primary]'));

            // Alteração na grid
            const dateOperators = ['eq', 'neq', 'gte', 'gt', 'lte', 'lt'];
            this.grid()['dateOptions'] = this.grid()['dateOptions'].filter(opt => dateOperators.includes(opt.value));

            const nativeSarchInput = this.gridEl().nativeElement.querySelector('kendo-grid-toolbar po-input[name=input]') as HTMLElement;
            const nativeSarchInputParent = this.renderer.parentNode(nativeSarchInput);
            const newSearchInput = this.elRef.nativeElement.querySelector('po-input[name=search-input]') as HTMLElement;

            this.renderer.removeAttribute(newSearchInput, 'hidden');
            this.renderer.removeChild(nativeSarchInputParent, nativeSarchInput);
            this.renderer.appendChild(nativeSarchInputParent, newSearchInput);
        });
    }

    // #region Eventos da grid
    onGridEdit(selectedResource: unknown): void {
        this.logGridEvent('t-action-edit', selectedResource);
    }

    onGridDeleteItems(event: unknown): void {
        this.logGridEvent('t-delete-items', event);
        if (Array.isArray(event)) {
            const remaining = event.filter(item => this.isReportGridItem(item));
            this.gridItems.set(remaining);
            this.totalItems.update(value => Math.max(value - Math.max(this.selectedRows().length, 1), remaining.length));
            this.selectedRows.set([]);
        }
    }

    onGridChangeFilterByColumn(event: unknown): void {
        this.logGridEvent('t-change-filter-by-column', event);
    }

    onGridChangeFixedColumns(event: unknown): void {
        this.logGridEvent('t-change-fixed-columns', event);
    }

    onGridChangeOptionsColumnManager(event: unknown): void {
        this.logGridEvent('t-change-options-column-manager', event);
    }

    onGridChangeVisibleColumns(event: unknown): void {
        this.logGridEvent('t-change-visible-columns', event);
    }

    onGridRestoreColumnManager(event: unknown): void {
        this.logGridEvent('t-restore-column-manager', event);
    }

    onGridCustomFilter(event: unknown): void {
        this.logGridEvent('t-custom-filter', event);
        this.filterModal()?.open();
    }

    onGridDeleteItem(event: unknown): void {
        this.logGridEvent('t-delete-item', event);
    }

    onGridChangePageSize(event: unknown): void {
        this.logGridEvent('t-change-page-size', event);

        const parsedPageSize = this.extractPageSize(event);
        if (parsedPageSize) {
            this.currentPageSize.set(parsedPageSize);
            this.loadPage(1, false);
        }
    }

    onGridChangeGroup(event: unknown): void {
        this.logGridEvent('t-change-group', event);

        if (Array.isArray(event)) {
            const groups = event.filter((value): value is string => typeof value === 'string');
            this.groupColumns.set(groups);
        }
    }

    onGridChangeOrderColumn(event: unknown): void {
        this.logGridEvent('t-change-order-column', event);
    }

    onGridShowMore(event: unknown): void {
        this.logGridEvent('t-show-more', event);
        if (!this.hasMoreItems()) {
            return;
        }

        this.loadPage(this.currentPage() + 1, true);
    }

    onGridChangeSortColumn(event: unknown): void {
        this.logGridEvent('t-change-sort-column', event);
    }
    // #endregion

    // #region Carregamento e mapeamento de dados
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

    private mapResourceToGridItem(item: ReportResource): ReportGridItem {
        return {
            ...item,
            ownerDisplayName: item.owner.displayName,
            ownerId: item.owner.id,
            permission: item.currentUser.permission
        };
    }
    // #endregion

    // #region Ações auxiliares da tela
    private onViewResource(resource: unknown): void {
        this.logGridEvent('view-resource', resource);
    }

    private onBatchCustomAction(actionName: string): void {
        this.logGridEvent(`custom-action:${actionName}`, {
            selectedRows: this.selectedRows().length
        });
    }
    // #endregion

    // #region Utilitários de parsing e validação
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

    private isReportGridItem(value: unknown): value is ReportGridItem {
        if (!this.isObject(value)) {
            return false;
        }

        return typeof value.id === 'string' && typeof value.displayName === 'string';
    }

    private isObject(value: unknown): value is Record<string, unknown> {
        return typeof value === 'object' && value !== null;
    }
    // #endregion

    // #region Filtro avançado
    private applyAdvancedFilters(): void {
        const filters: ReportResourceListFilters = {};

        const accessType = this.advancedFilter.accessType;
        if (accessType) filters.accessType = accessType;

        const name = this.advancedFilter.name.trim();
        if (name) filters.displayName = name;

        const desc = this.advancedFilter.description.trim();
        if (desc) filters.description = desc;

        if (this.advancedFilter.favorite === 'true') filters.isFavorite = true;
        else if (this.advancedFilter.favorite === 'false') filters.isFavorite = false;

        if (this.advancedFilter.types.length > 0) {
            filters.resourceTypes = this.advancedFilter.types as ReportResourceType[];
        }

        if (this.advancedFilter.tags.length > 0) {
            filters.tags = [...this.advancedFilter.tags];
        }

        this.activeFilters.set(filters);
        this.loadPage(1, false);
        this.filterModal()?.close();
    }

    private clearAdvancedFilters(): void {
        this.advancedFilter.accessType = 'all';
        this.advancedFilter.name = '';
        this.advancedFilter.description = '';
        this.advancedFilter.favorite = 'all';
        this.advancedFilter.types = [];
        this.advancedFilter.tags = [];
    }

    private buildFilterQueryString() {
        const activeFilters = this.activeFilters();

        if (Object.keys(activeFilters).length <= 0) return;

        const queryParams: any = {};

        queryParams.accessType = activeFilters.accessType?.trim() ?? 'All';

        const name = activeFilters.displayName?.trim() ?? '';
        if (name.length > 0) queryParams.displayName = name;

        const desc = activeFilters.description?.trim() ?? '';
        if (desc.length > 0) queryParams.description = desc;

        if ('isFavorite' in activeFilters) {
            queryParams.isFavorite = activeFilters.isFavorite;
        }

        if (activeFilters.resourceTypes?.length > 0) {
            activeFilters.resourceTypes.forEach((val, ix) => (queryParams[`resourceTypes[${ix}]`] = val));
        }

        if (activeFilters.tags?.length > 0) {
            activeFilters.tags.forEach((val, ix) => (queryParams[`tags[${ix}]`] = val));
        }

        const query = Object.entries(queryParams)
            .map(entry => `${entry[0]}=${entry[1]}`)
            .join('&');
        console.log({
            queryParams,
            queryString: query
        });
    }
    // #endregion

    // Histórico de eventos da grid
    private logGridEvent(eventName: string, payload: unknown): void {
        console.log({
            eventName,
            payload: JSON.stringify(payload ?? '{}', null, 2)
        });
    }
}
