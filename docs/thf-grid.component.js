class ThfGridComponent extends ThfGridBaseComponent {
    static {
        this.PAGEABLE_BUTTON_HEIGHT_SMALL = 48;
    }
    static {
        this.PAGEABLE_BUTTON_HEIGHT_MEDIUM = 60;
    }
    get iconActionOne() {
        return this.actions?.[0]?.icon;
    }
    get isInEditingMode() {
        return this.editedRowIndex !== undefined;
    }
    get isHiddenGrid() {
        if (this.hasActiveFilters) {
            return false;
        }
        if (this.gridRowActions) {
            return (this.gridRowActions.hiddenGrid ?? true) && this.gridView?.length === 0;
        }
        return false;
    }
    get isInRowsActionsMode() {
        return this.rowActionsIndex !== undefined;
    }
    get rowSubtractIndex() {
        if (this.selectable) {
            if (this.visibleActions?.length) {
                return this.actionRight ? 1 : 2;
            }
            return 1;
        } else if (this.visibleActions?.length) {
            return this.actionRight ? 0 : 1;
        }
        return 0;
    }
    get showHeaderPrimary() {
        return (
            (this.actionsFilter || !this.hideColumnsManager || !this.hideTableSearch) &&
            (!this.selectable || this.mySelection.length < 1) &&
            !this.isInEditingMode &&
            !this.gridRowActions?.actionEdit
        );
    }
    get showHeaderSecondary() {
        return this.mySelection.length >= 1 && this.selectable && !this.hideBatchAction && !this.isInEditingMode && !this.gridRowActions?.actionEdit;
    }
    get visibleCustomDropDown() {
        return this.customActions !== undefined && this.customActions.length > 0 && this.customActions.filter(action => action && action.visible !== false);
    }
    get verifyActionFixed() {
        return this.visibleActions?.length > 0 && this.visibleActions?.some(action => action.fixed);
    }
    get modalDeleteMessage() {
        return this.resolveDeleteModalMessage();
    }
    get requiredFieldsToasterActionLabel() {
        return this.showOnlyRequiredFields() ? this.literals.requiredFieldsToasterDisableActionLabel : this.literals.requiredFieldsToasterEnableActionLabel;
    }
    updateVisibleActions() {
        const actions = this.actions?.length > 0 ? this.actions.filter(action => action && action.visible !== false) : [];
        const hasActions = actions.length > 0;
        if (this.editProperties?.actionEdit) {
            actions.push({
                fixed: true,
                icon: 'ICON_EDIT',
                label: hasActions ? this.literals.editRowAction : '',
                action: this.editingChoice.bind(this)
            });
        }
        if (this.gridRowActions?.actionEdit && this.isDuplicateAllowedEditMode() && this.rowStateFilter === 'active') {
            actions.push({
                fixed: true,
                disabled: () =>
                    this.isDuplicating ||
                    this.rowData?.$currentRowActions ||
                    this.disabledIncludeButton ||
                    this.isInIncludeMode ||
                    this.isInRowsActionsMode ||
                    this.showOnlySelectedItems(),
                icon: 'ICON_COPY',
                label: this.literals.duplicateRowAction,
                action: this.duplicateChoice.bind(this)
            });
        }
        if (this.gridRowActions?.actionEdit && this.isActionAllowedEditMode(ThfGridEditModeActionType.Remove)) {
            actions.push({
                fixed: true,
                disabled: () => this.isDuplicating || this.rowData?.$currentRowActions,
                icon: this.rowStateFilter === 'removed' ? 'ICON_ARROW_ARC_LEFT' : 'ICON_DELETE',
                label: this.rowStateFilter === 'removed' ? this.literals.undoRemoveRowAction : this.literals.removeRowAction,
                action: this.removingChoice.bind(this),
                type: this.rowStateFilter === 'removed' ? 'default' : 'danger'
            });
        }
        this.visibleActions = actions;
    }
    get currentfilterByColumn() {
        return this.columns.find(column => column.property === this.filterByColumnName);
    }

    constructor(poDialog, languageService, activatedRoute, changeDetector, poNotification, thfGridService, renderer, el, sanitizer) {
        super(languageService);
        this.poDialog = poDialog;
        this.languageService = languageService;
        this.activatedRoute = activatedRoute;
        this.changeDetector = changeDetector;
        this.poNotification = poNotification;
        this.thfGridService = thfGridService;
        this.renderer = renderer;
        this.el = el;
        this.sanitizer = sanitizer;
        this.rowStateFilterApplyDebouncedTimeout = null;
        this.loadGridDataDebouncedTimeout = null;
        this.closeActionModal = {
            action: () => {
                this.modalDelete.close();
            },
            label: this.literals.cancel
        };
        this.confirmActionModal = {
            action: () => {
                this.deleteItems();
            },
            label: this.literals.delete,
            danger: true
        };
        this.primaryAction = {
            action: () => {
                this.getByFilter();
                this.poModal.close();
            },
            label: this.literals.confirm
        };
        this.secondaryAction = {
            action: () => {
                this.poModal.close();
            },
            label: this.literals.cancel
        };
        this.destructiveModalActionType = ThfGridEditModeActionType.Remove;
        this.destructiveModalIcons = {
            [ThfGridEditModeActionType.Add]: 'ICON_EXCLAMATION',
            [ThfGridEditModeActionType.Replace]: 'ICON_EXCLAMATION',
            [ThfGridEditModeActionType.Remove]: 'ICON_PROHIBIT'
        };
        this.destructiveModalCancel = {
            action: () => {
                this.onDestructiveModalCancelAction();
            },
            label: this.literals.gridRowActionsConfirmAddCancelButton
        };
        this.destructiveModalConfirm = {
            action: this.onDialogConfirm.bind(this),
            danger: true,
            label: this.literals.gridRowActionsConfirmAddConfirmButton
        };
        this.visibleActions = [];
        this.autoFocusEdit = false;
        this.deselectedRows = [];
        this.filter = {};
        this.gridData = [];
        this.loadingShowMore = false;
        this.showHeaderTooltip = false;
        this.fixedAfterInit = false;
        this.isInIncludeMode = false;
        this.mySelection = [];
        this.isDuplicating = false;
        this.duplicateFillComplete = null;
        this.popupTabNavigationCleanup = null;
        this.searchTerm = '';
        this.selectedRows = [];
        this.show = true;
        this.rowData = {};
        this.rowDataInitial = {};
        this.kendoGridId = `thf-kendo-grid-${uuid()}`;
        this.fixedActionsApplied = false;
        this.initIncludeMode = false;
        this.lastSelectedItem = [];
        this.group = [];
        this.aggregates = [];
        this.visibleColumns = [];
        this.selectAllState = 'unchecked';
        this.thfGridEditService = new ThfGridEditService();
        this.skip = 0;
        this.columnsChangeFixed = [];
        this.defaultColumns = [];
        this.defaultFrozenColumns = [];
        this.hasActiveFilters = false;
        this.maxColumnsGrid = [];
        this.showColumnManager = false;
        this.gridUtils = inject(ThfGridUtilsService);
        this.thfGridZombieTag = new ThfGridZombieTag();
        this.gridSelectedItems = [];
        this.rowStateFilterLabel = '';
        this.ThfGridEditModeActionTypeEnum = ThfGridEditModeActionType;
        this.PoSwitchLabelPositionEnum = PoSwitchLabelPosition;
        this.showOnlyRequiredFields = signal(
            false,
            ...(ngDevMode
                ? [
                      {
                          debugName: 'showOnlyRequiredFields'
                      }
                  ]
                : /* istanbul ignore next */ [])
        );
        this.showOnlySelectedItems = signal(
            false,
            ...(ngDevMode
                ? [
                      {
                          debugName: 'showOnlySelectedItems'
                      }
                  ]
                : /* istanbul ignore next */ [])
        );
        this.filterByColumnForm = new FormGroup({});
        this.modelsColumn1 = {};
        this.modelsColumn2 = {};
        this.inputModelsColumn1 = {};
        this.inputModelsColumn2 = {};
        this.modelsOperatorsColumn = {};
        this.iconFilterByColumn = {};
        this.typeFilterByColumn = {};
        this.activesFilterByColumn = [];
        this.stringOptions = [
            {
                label: this.literals.contains,
                value: 'contains'
            },
            {
                label: this.literals.doesntContain,
                value: 'doesnotcontain'
            },
            {
                label: this.literals.isEqual,
                value: 'eq'
            },
            {
                label: this.literals.isNotEqual,
                value: 'neq'
            },
            {
                label: this.literals.startsWith,
                value: 'startswith'
            },
            {
                label: this.literals.endsWith,
                value: 'endswith'
            },
            {
                label: this.literals.isNull,
                value: 'isnull'
            },
            {
                label: this.literals.isNotNull,
                value: 'isnotnull'
            },
            {
                label: this.literals.isEmpty,
                value: 'isempty'
            },
            {
                label: this.literals.isNotEmpty,
                value: 'isnotempty'
            }
        ];
        this.numberOptions = [
            {
                label: this.literals.isEqual,
                value: 'eq'
            },
            {
                label: this.literals.isNotEqual,
                value: 'neq'
            },
            {
                label: this.literals.isGreaterOrEqual,
                value: 'gte'
            },
            {
                label: this.literals.isGreater,
                value: 'gt'
            },
            {
                label: this.literals.isLessOrEqual,
                value: 'lte'
            },
            {
                label: this.literals.isLess,
                value: 'lt'
            },
            {
                label: this.literals.isNull,
                value: 'isnull'
            },
            {
                label: this.literals.isNotNull,
                value: 'isnotnull'
            }
        ];
        this.dateOptions = [
            {
                label: this.literals.isEqual,
                value: 'eq'
            },
            {
                label: this.literals.isNotEqual,
                value: 'neq'
            },
            {
                label: this.literals.isAfterOrEqual,
                value: 'gte'
            },
            {
                label: this.literals.isAfter,
                value: 'gt'
            },
            {
                label: this.literals.isBeforeOrEqual,
                value: 'lte'
            },
            {
                label: this.literals.isBefore,
                value: 'lt'
            },
            {
                label: this.literals.isNull,
                value: 'isnull'
            },
            {
                label: this.literals.isNotNull,
                value: 'isnotnull'
            }
        ];
        this.operatorsOptions = [
            {
                label: this.literals.and,
                value: 'and'
            },
            {
                label: this.literals.or,
                value: 'or'
            }
        ];
        this.selectModelOperator = this.operatorsOptions[0].value;
        this.filterByColumn = {
            logic: 'and',
            filters: []
        };
        this.initialFilterColumnProps = true;
        this.cachedFilterByColumn = null;
        this.clearFormControlValue = false;
        this.hasFirstChangeFixed = true;
        this.initialFilter = true;
        this.inputFilter = {};
        this.itemsByApi = {
            page: 0,
            pageSize: 0,
            total: 0
        };
        this.myLastSelection = [];
        this.isNew = false;
        this.initialColumns = [];
        this.page = 1;
        this.editingRow = {};
        this.thfGridFormatService = inject(ThfGridFormatService);
        this.filterSubject = new Subject();
        this.subscriptionService = new Subscription();
        this.activedObservableFunction = false;
        this.mutationSubject = new Subject();
        this.gapSubTitle = 18;
        this.hasItems = false;
        this.rowHeightInternal = 1;
        this.shiftKeyPressed = false;
        this.showValidationErrorToaster = false;
        this.isTestEnvironment = false;
        // serviço injetado para inicializar o serviço de tema
        this.initializationService = inject(ThfThemeService);
        this.notificationDisplayed = false;
        this.subscriptionGridRowActions = new Subscription();
        this.resizeSubject = new Subject();
        this.applyFixedWidthFirstTime = true;
        this.firstCallCalculateRowHeight = true;
        this.previouslyFocusedRowActionElement = null;
        this.firstCallDinamicRow = true;
        this.suppressValidationOnDestructiveModalDismiss = false;
        this.shiftAnchorIndex = {
            index: 0,
            id: null
        };
        this.isExportingExcel = false;
        this.autoFitDebounceSubject = new Subject();
        this.safeTagHtmlCache = new Map();
        this.editableControlsSet = new Set();
        this.injectedDefaultCurrency = inject(DEFAULT_CURRENCY_CODE);
        this.operatorsWithoutValue = ['isnull', 'isnotnull', 'isempty', 'isnotempty'];
        this.getGridToExport = () => {
            const exportData = {
                data: process(this.gridData, {
                    group: this.group,
                    sort: this.sort
                }).data,
                group: this.group
            };
            if (this.group.length && this.aggregatesDescriptor.length) {
                exportData.data.forEach(element => {
                    element.items = this.thfGridFormatService.formatGridDataSync(this.columns, element.items, this.literals, true);
                });
            } else {
                exportData.data = this.thfGridFormatService.formatGridDataSync(this.columns, exportData.data, this.literals, true);
            }
            return exportData;
        };
        this.selectedCallback = args => args.dataItem;
        this.setRowClasses = context => ({
            ['not-striped']: !this.striped,
            ['thf-grid-edited']: context.dataItem?.$edited,
            ['thf-grid-included']: context.dataItem?.$included,
            ['thf-grid-current-row-actions']: context.dataItem?.$currentRowActions,
            ['thf-grid-include-mode-row-actions']: this.isInIncludeMode,
            ['thf-grid-removed']: context.dataItem?.$removed,
            ['thf-grid-inline-edit']: this.editProperties && this.editedRowIndex,
            ['thf-row-disabled']: this.selectableDisabled
        });
        this.initialSelectableEntireLine = this.selectableEntireLine;
        effect(() => {
            const showOnlyRequiredFields = this.showOnlyRequiredFields();
            if (this.gridRowActions) {
                this.resizeSubject.next(null);
                this.columns.forEach(column => {
                    column.visible = showOnlyRequiredFields
                        ? this.isColumnRequired(column.property)
                        : this.initialColumns.some(initialColumn => initialColumn.property === column.property && initialColumn.visible !== false);
                });
            }
        });
        effect(() => {
            const showOnlySelectedItems = this.showOnlySelectedItems();
            this.handleShowOnlySelectedItems(showOnlySelectedItems);
        });
    }
    /* eslint-enable max-params */
    ngOnDestroy() {
        this.thfGridSubscription?.unsubscribe();
        this.filterSubscription?.unsubscribe();
        this.resizeSubscription?.unsubscribe();
        this.mutationSubject?.unsubscribe();
        this.scrollListener = null;
        this.containerScrollListener = null;
        this.subscriptionService?.unsubscribe();
        this.subscriptionGridRowActions?.unsubscribe();
        this.resizeSubscription?.unsubscribe();
        clearTimeout(this.timeoutResize);
        this.gridUtils.subjectUtils?.unsubscribe();
        this.autoFitDebounceSubject.complete();
        this.intersectionObserver?.disconnect();
        this.safeTagHtmlCache.clear();
        this.detachPopupTabNavigation();
    }
    ngOnInit() {
        this.closeActionModal.label = this.literals.cancel;
        this.confirmActionModal.label = this.literals.delete;
        this.primaryAction.label = this.literals.confirm;
        this.secondaryAction.label = this.literals.cancel;
        this.dynamicHeight = this.height;
        this.dynamicMinHeight = this.minHeight;
        this.dynamicMaxHeight = this.maxHeight;
        this.changedDensityOption ??= this.spacing;
        this.gridUtils.subjectUtils?.subscribe(({ visibleColumns, maxColumnsGrid, column, isReorder }) => {
            this.visibleColumns = [...visibleColumns];
            this.maxColumnsGrid = [...maxColumnsGrid];
            this.afterUpdateVisibleColumns(column, isReorder);
        });
        this.loadGridData();
        this.loadGridConfiguration();
        this.filterSubscription = this.filterSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => this.onFilterInputHandle());
        this.resizeSubject.pipe(debounceTime(100)).subscribe(() => {
            this.applyFixedWidths(this.autoSize);
        });
        this.autoFitDebounceSubject.pipe(debounceTime(100)).subscribe(() => {
            if (!this.gridRowActions) {
                this.autoFitColumns(true);
            }
        });
        this.setRowStateFilterActions();
        this.setRowStateFilter('active');
        this.setPopupFilterProperties();
        this.updateVisibleActions();
    }
    ngAfterViewInit() {
        this.onSelectedKeysChange();
        this.changeDetector.detectChanges();
        this.calculateDynamicSize('height', true);
        this.calculateDynamicSize('minHeight');
        this.calculateDynamicSize('maxHeight');
        this.onEventResize();
        if (this.gridRowActions?.actionEdit) {
            this.subscriptionGridRowActions.add(this.renderer.listen('document', 'click', this.onClickOutGrid.bind(this)));
        }
        this.initialHeightHandler(typeof this.height === 'string');
        this.changeDetector.detectChanges();
        this.initIntersectionObserver();
    }
    ngAfterViewChecked() {
        this.initialMinMaxHeightHandler();
    }
    ngOnChanges(changes) {
        const { maxColumns, columns, onLoad, actions, editProperties, actionRight, selectable } = changes;
        if (maxColumns || columns || onLoad || actions || editProperties) {
            if (onLoad) {
                this.loadGridConfiguration();
            } else {
                this.handleFixedColumns(maxColumns);
            }
        }
        if (changes['groupListString']?.currentValue && this.groupable) {
            const groupChange = [];
            changes['groupListString'].currentValue.forEach(value => {
                groupChange.push({
                    field: value,
                    aggregates: this.aggregates
                });
            });
            this.group = [...this.group, ...groupChange];
        }
        if ((columns?.firstChange && columns?.currentValue) || (columns?.currentValue?.length && !columns.previousValue?.length)) {
            this.initialColumns = JSON.parse(JSON.stringify(columns.currentValue));
            this.thfGridZombieTag.buildTagCache(columns.currentValue);
            this.safeTagHtmlCache.clear();
        }
        if (changes['items']) {
            this.loadGridData();
        }
        if (changes['customActions']?.currentValue) {
            this.setDropdownActions();
        }
        if (changes['actions'] || changes['editProperties'] || changes['gridRowActions']) {
            this.updateVisibleActions();
        }
        if (this.headlineFixed && changes['headlineFixed'] && changes['headlineFixed']?.currentValue !== changes['headlineFixed']?.previousValue) {
            this.setEventListenerScroll(changes['headlineFixed']?.currentValue);
        }
        if (this.headlineFixed && changes['height']) {
            const addEventListener = changes['height']?.currentValue === null;
            this.setEventListenerScroll(addEventListener);
        }
        if (this.fixedAfterInit) {
            if (changes['height']) {
                this.dynamicHeight = this.height;
                this.calculateDynamicSize('height');
            }
            if (changes['minHeight']) {
                this.dynamicMinHeight = this.minHeight;
                this.calculateDynamicSize('minHeight');
            }
            if (changes['maxHeight']) {
                this.dynamicMaxHeight = this.maxHeight;
                this.calculateDynamicSize('maxHeight');
            }
        }
        if (changes['minHeight'] || changes['maxHeight']) {
            this.initialMinMaxHeightHandler();
        }
        if (changes['spacing'] && this.fixedAfterInit && !this.rowHeight) {
            setTimeout(() => {
                this.calculateRowHeight();
            }, 100);
        }
        if (changes['rowHeight'] && this.fixedAfterInit && this.virtualScroll) {
            this.calculateRowHeight(changes['rowHeight'].currentValue, true);
        }
        if (changes['gridRowActions']?.currentValue?.actionEdit) {
            this.groupable = false;
            this.draggable = false;
            this.editProperties = undefined;
        }
        if (this.gridRowActions?.actionEdit) {
            this.groupable = false;
            this.draggable = false;
            this.editProperties = undefined;
        }
        if (changes['columns'] && this.gridRowActions) {
            if (!this.virtualColumnsWasSetted && changes['columns'].currentValue.length >= 50) {
                this.virtualColumns = true;
            }
            this.setEditorColumnsDefaultWidth();
            this.applyFixedWidths();
            if (this.fixedAfterInit && this.virtualScroll && this.firstCallDinamicRow) {
                setTimeout(() => {
                    this.calculateRowHeight();
                }, 100);
                this.firstCallDinamicRow = false;
            }
            defineHeaderAlign(this.columns);
        }
        if ((((actionRight || actions) && this.visibleActions.length) || editProperties) && this.fixedAfterInit) {
            this.applyFixedWidths();
        }
        if (selectable && this.fixedAfterInit) {
            this.applyFixedWidths();
        }
        if (this.fixedAfterInit && this.visibleActions?.length && !this.fixedActionsApplied && this.gridRowActions?.actionEdit) {
            this.applyFixedWidths(true);
            this.autoFitColumns();
            this.fixedActionsApplied = true;
        }
        if (changes['showMoreVisible']?.currentValue !== changes['showMoreVisible']?.previousValue) {
            this.calculateDynamicSize('height');
            this.calculateDynamicSize('minHeight');
            this.calculateDynamicSize('maxHeight');
        }
        if (changes['selectable']?.firstChange) {
            this.initialSelectable = changes['selectable'].currentValue;
        }
        if (changes['selectableEntireLine']?.firstChange) {
            this.initialSelectableEntireLine = changes['selectableEntireLine'].currentValue;
        }
        if (changes['sort'] && this.sort?.[0]?.field) {
            this.filterByColumnName = this.sort?.[0]?.field;
            this.setIconFilterByColumn();
            this.filterByColumnName = '';
        }
        if (changes['sortable']) {
            this.columns
                .filter(column => column?.filter)
                .forEach(column => {
                    this.filterByColumnName = column.property;
                    this.setIconFilterByColumn();
                });
            this.filterByColumnName = '';
        }
        this.recreateGroupWithAggregatesOnChanges(changes);
        this.updateAggregatesFooterOnChanges(changes);
    }
    recreateGroupWithAggregatesOnChanges(changes) {
        const aggregateChange = changes['aggregatesDescriptor'];
        if (!aggregateChange || aggregateChange?.currentValue === aggregateChange?.previousValue || !this.group.length) {
            return;
        }
        const processedAggregates = this.aggregatesDescriptor
            .filter(x => x.aggregate)
            .map(x => ({
                field: x.field,
                aggregate: x.aggregate
            }));
        const hasAggregates = this.aggregatesDescriptor.length > 0;
        const groupNew = this.group.map(x => ({
            field: x.field,
            ...(hasAggregates && {
                aggregates: processedAggregates
            })
        }));
        this.group = groupNew;
    }
    updateAggregatesFooterOnChanges(changes) {
        const aggregateChange = changes['aggregatesDescriptor'];
        if (!aggregateChange || (aggregateChange?.currentValue === aggregateChange?.previousValue && this.showFooterAggregates)) {
            return;
        }
        this.totalAggregates = this.calculateTotalAggregates();
    }
    cleanTableWidth() {
        this.grid?.wrapper?.nativeElement?.querySelectorAll('table').forEach(e => e.setAttribute('style', ''));
    }
    /**
     * Ajusta automaticamente a largura das colunas com base no conteúdo atual das células.
     *
     * Este método calcula a largura ideal para cada coluna considerando o conteúdo textual das células visíveis,
     * cabeçalhos das colunas e configurações de redimensionamento e tamanho fixo
     *
     * **Exemplo de uso:**
     * ```typescript
     * // Ajusta colunas e mantém largura total da tabela
     * this.gridComponent.autoFitColumns(true);
     *
     * // Ajusta colunas e permite redimensionamento fluido
     * this.gridComponent.autoFitColumns();
     * ```
     *
     * > Este método é chamado automaticamente quando:
     * > - A propriedade `t-auto-size` é habilitada
     * > - O evento `t-auto-size-on-scroll` é disparado durante scroll virtual
     *
     * @param {boolean} [recalculate=false] - Quando `true`, mantém a largura total da tabela após o ajuste.
     * Quando `false` ou omitido, limpa a largura fixa da tabela para permitir redimensionamento fluido.
     */
    autoFitColumns(recalculate) {
        if (this.gridRowActions) return;
        if (this.fixedAfterInit && this.virtualColumns) return;
        if (this.resizable) {
            const columnsWidthResizable = this.columns.filter(col => col.widthResizable);
            columnsWidthResizable.forEach(col => (col.widthResizable = undefined));
            this.changeDetector.detectChanges();
        }
        if (!this.grid) return;
        this.grid.autoFitColumns();
        if (!recalculate) this.cleanTableWidth();
        const columnsArray = this.grid.columns.toArray();
        const isFirstColumnSelectable = this.grid.columns.first && this.selectable;
        const actionColumnIndex = this.getColumnIndex(columnsArray, 'actions');
        const [startIndex, endIndex] = this.getDynamicColumnIndices(isFirstColumnSelectable, actionColumnIndex, columnsArray.length);
        const columnsToResize = columnsArray.slice(startIndex, endIndex);
        columnsToResize.forEach(col => {
            const matchingColumn = this.columns.find(column => column.property === col.field);
            matchingColumn.width = col.width;
            matchingColumn.widthResizable = undefined;
            matchingColumn.internalWidth = undefined;
        });
        this.applyFixedWidths(true);
    }
    changeFormValue(columnProperty) {
        if (this.editProperties?.validate) {
            this.formGroupIntern = this.editProperties?.validate(this.formGroupIntern.value, columnProperty);
        }
    }
    changeOrderFixedColumns(column, index) {
        if (
            column.fixed &&
            (this.hasFirstChangeFixed ||
                (this.columnsChangeFixed[index]?.fixed !== column.fixed && this.columnsChangeFixed[index]?.property === column.property))
        ) {
            const hasFixed = this.gridUtils.getFixedColumns(this.columns);
            let newIndex = 0;
            if (hasFixed.length === 1) {
                this.hasFirstChangeFixed = false;
            } else if (index !== 0 && this.columns[0].fixed) {
                this.hasFirstChangeFixed = false;
                newIndex = 1;
            }
            if (index !== newIndex) {
                const [columnToMove] = this.columns.splice(index, 1);
                this.columns.splice(newIndex, 0, columnToMove);
            }
            if ((hasFixed.length === 1 && newIndex === 0) || (hasFixed.length === 2 && newIndex === 1)) {
                this.columnsChangeFixed = JSON.parse(JSON.stringify(this.columns));
                this.changeDetector.detectChanges();
            }
        } else if (index === 0 && this.columns[1]?.fixed && !column.fixed && this.columnsChangeFixed[index]?.fixed !== column.fixed) {
            this.columns.splice(0, 0, this.columns.splice(0 + 1, 1)[0]);
            this.columnsChangeFixed = JSON.parse(JSON.stringify(this.columns));
            this.changeDetector.detectChanges();
        }
        return true;
    }
    changePageSize(event) {
        this.pageSize = event;
        this.gridData = [];
        this.gridOriginalData = null;
        this.gridView = [];
        this.mySelection = [];
        this.myLastSelection = [];
        this.page = 0;
        this.onShowMore(false);
    }
    changeValidateEdit(formChanged) {
        this.formGroupIntern = formChanged;
        this.updateEditableControlsSet();
    }
    /**
     * Aplica o estado default aos itens editados, incluídos e removidos do grid.
     *
     * Usado para aplicar as alterações realizadas nos registros do grid, e também
     * para remover os itens marcados para exclusão, de acordo com os parâmetros fornecidos.
     *
     * ```
     * // Aplica o estado de edição e inclusão, removendo os itens com $removed
     * this.cleanRowActionsMode();
     *
     * // Aplica apenas as edições, sem alterar as inclusões e exclusões
     * this.cleanRowActionsMode(true, false, false);
     *
     * // Remove apenas os itens com $removed, sem aplicar edições e inclusões
     * this.cleanRowActionsMode(false, false, true);
     * ```
     *
     * Exemplo de uso:
     * Se você precisa aplicar o estado de todas as ações de linha, como edição, inclusão e
     * remoção, basta chamar esta função. Por exemplo, se houver uma ação de aplicar o grid ao
     * salvar os dados, você pode usá-lo da seguinte forma:
     * ```typescript
     * // Após salvar os dados na API, você pode limpar todos os estados de ação de linha
     * this.myService.saveData(this.thfGrid.getChangedItems()).subscribe(() => {
     *   this.thfGrid.cleanRowActionsMode(); // Limpa todas as ações de linha após salvar
     *   console.log('Ações de linha limpas.');
     * });
     * ```
     *
     * @param {boolean} [edit=true] - Indica se deve aplicar as edições realizadas nas linhas.
     * @param {boolean} [include=true] - Indica se deve aplicar as inclusões de novas linhas.
     * @param {boolean} [del=true] - Indica se deve remover as linhas marcadas para exclusão.
     */
    cleanRowActionsMode(edit = true, include = true, del = true) {
        if (this.isInIncludeMode) {
            this.unselectRowItem(this.rowData);
            this.removeLastGridItem();
        }
        this.closeRowActions();
        this.rowDataInitial = {};
        if (del) {
            this.deleteItems();
        }
        this.gridData.forEach(data => {
            data.$currentRowActions = false;
            data.$selected = false;
            if (edit) {
                data.$edited = false;
            }
            if (include) {
                data.$included = false;
            }
        });
        this.showOnlySelectedItems.set(false);
        this.gridSelectedItems = [];
        this.selectedRows = [];
        this.mySelection = [];
        this.showValidationErrorToaster = false;
        this.onSelectedKeysChange();
        this.applyRowStateFilterImmediate();
        this.totalAggregates = this.calculateTotalAggregates();
    }
    closeEditor() {
        this.isNew = false;
        this.rowData = {};
        this.editedRowIndex = undefined;
        this.formGroupIntern = undefined;
        this.editingRow = null;
        this.updateEditableControlsSet();
    }
    closeRowActions(fromTabOrEnter = false) {
        this.isNew = false;
        if (!fromTabOrEnter) {
            this.rowData = {};
            this.isInIncludeMode = false;
            this.formGroupIntern = undefined;
        }
        this.rowActionsIndex = undefined;
        this.showOnlyRequiredFields.set(false);
        this.showValidationErrorToaster = false;
        this.updateEditableControlsSet();
        this.applyRowStateFilterImmediate();
    }
    columnsIsSortable(column) {
        if (column.sortable === false || (column.filter && this.rowStateFilter !== 'removed')) {
            return false;
        }
        if (this.sortable && column.sortable === undefined) {
            return true;
        }
        return true;
    }
    /**
     * Responsável pela exclusão de itens selecionados.
     *
     * Quando **t-items** está definido, a remoção pode ser feita em lote, excluindo todas as linhas selecionadas localmente.
     * Se utilizado com um serviço (**t-service-api** e/ou **t-service-delete-api**), a exclusão permitida é de um item por vez.
     *
     * > Caso utilizado com a "edição fluída offline via formulário (propriedade **t-grid-row-actions**)" remove localmente
     * as linhas sinalizadas com `$removed`.
     *
     * > É possível habilitar a exclusão em lote com serviços remotos utilizando a propriedade **t-allow-batch-delete** em conjunto com **t-service-api** e/ou **t-service-delete-api**.
     */
    deleteItems() {
        this.isLoading = true;
        const property = this.gridRowActions ? '$removed' : '$selected';
        const itemsFiltered = [...this.gridData].filter(item => item[property]);
        const newItemsFiltered = [...this.gridData].filter(item => !item[property]);
        if (itemsFiltered.length === 0) {
            this.finalizeDelete();
        } else if ((this.serviceDeleteApi || this.serviceUrl) && !this.gridRowActions?.actionEdit) {
            this.deleteItemByApi(itemsFiltered);
        } else {
            this.deleteItemsLocal(newItemsFiltered, itemsFiltered);
            this.finalizeDelete();
        }
    }
    calculateCountLine() {
        const table = this.el.nativeElement.querySelector('.k-grid-aria-root');
        const rowHeightInternal = this.getRowHeight();
        return table.offsetHeight / rowHeightInternal + 3;
    }
    resolveDeleteModalMessage() {
        const isBatch = this.allowBatchDelete && this.mySelection?.length > 1;
        return isBatch ? this.literals.bodyDeleteBatch : this.literals.bodyDelete;
    }
    deleteItemsLocal(newItemsFiltered, itemsFiltered) {
        this.nextStepDeletingOriginalData(itemsFiltered);
        this.gridData = [...newItemsFiltered];
        this.applyRowStateFilterImmediate();
        this.nextStepDeletingSelected(itemsFiltered);
        this.unselectRows();
        this.afterDelete.emit(this.gridView);
        this.deleteItem.emit(itemsFiltered);
        this.onSelectedKeysChange();
    }
    createBatchDeletePayload(rows) {
        const params = [];
        if (rows.length > 1) {
            rows.forEach(row => {
                params.push(this.getDeleteParam(row));
            });
        } else {
            params.push(this.getDeleteParam(rows[0]));
        }
        const paramName = this.paramDeleteApi || undefined;
        const keys = params.map(p => p.paramValue);
        return {
            paramName,
            keys
        };
    }
    handleBatchDeleteRequest(itemsToDelete) {
        const payload = this.createBatchDeletePayload(itemsToDelete);
        let serviceDelete = this.thfGridService;
        let serviceUrl;
        if (this.serviceDeleteApi && isTypeof(this.serviceDeleteApi, 'object')) {
            serviceDelete = this.serviceDeleteApi;
        } else {
            serviceUrl = this.serviceDeleteApi || this.serviceUrl;
            this.thfGridService.setUrlDelete(serviceUrl);
        }
        if (typeof serviceDelete.deleteBatchItems === 'function') {
            this.subscriptionService.add(
                serviceDelete
                    .deleteBatchItems(itemsToDelete, payload.paramName, payload.keys)
                    .pipe(
                        finalize$1(() => {
                            this.finalizeDelete();
                        })
                    )
                    .subscribe({
                        next: () => {
                            this.nextStepDeleting(itemsToDelete);
                        },
                        error: () => {
                            this.poNotification.error(this.literals.deleteApiError);
                        }
                    })
            );
        } else {
            console.error(
                `[THF-Grid] A propriedade 't-allow-batch-delete' está habilitada, mas o método 'deleteBatchItems' não foi implementado no serviço informado.`
            );
            this.finalizeDelete();
        }
    }
    handleSingleDeleteRequest(itemToDelete) {
        const { paramName, paramValue } = this.getDeleteParam(itemToDelete[0]);
        if (paramValue) {
            let serviceDelete = this.thfGridService;
            let serviceUrl;
            if (this.serviceDeleteApi && isTypeof(this.serviceDeleteApi, 'object')) {
                serviceDelete = this.serviceDeleteApi;
            } else {
                serviceUrl = this.serviceDeleteApi || this.serviceUrl;
                this.thfGridService.setUrlDelete(serviceUrl);
            }
            this.subscriptionService.add(
                serviceDelete
                    .deleteItem(itemToDelete[0], paramName, paramValue)
                    .pipe(
                        finalize$1(() => {
                            this.finalizeDelete();
                        })
                    )
                    .subscribe({
                        next: () => {
                            this.nextStepDeleting(itemToDelete[0]);
                        },
                        error: () => {
                            this.poNotification.error(this.literals.deleteApiError);
                        }
                    })
            );
        }
    }
    deleteItemByApi(itemsToDelete) {
        if (this.allowBatchDelete) {
            this.handleBatchDeleteRequest(itemsToDelete);
        } else {
            this.handleSingleDeleteRequest(itemsToDelete);
        }
    }
    finalizeDelete() {
        if (this.items) {
            const elementTable = this.getElementTable();
            const countLine = this.calculateCountLine();
            this.skip = this.gridRowActions ? 0 : 1;
            this.changeDetector.detectChanges();
            setTimeout(() => {
                this.isLoading = false;
                this.skip = 0;
                if (this.virtualScroll && this.gridView.length < countLine) {
                    this.renderer.setStyle(elementTable, 'transform', 'translateY(0px)');
                }
                this.changeDetector.detectChanges();
            }, 100);
        } else {
            this.isLoading = false;
        }
        this.modalDelete.close();
    }
    getAggregateByFieldType(field) {
        const descriptor = this.aggregatesDescriptor.find(item => item.field === field);
        return descriptor ? descriptor.aggregate : '';
    }
    getDeleteParam(item) {
        const key = this.formatUniqueKey(item, !!this.paramDeleteApi);
        const paramName = this.paramDeleteApi;
        const paramValue = key;
        return {
            paramName,
            paramValue
        };
    }
    getElementTable() {
        const contentTable = this.el.nativeElement.querySelector('.k-grid-aria-root .k-grid-content');
        return contentTable.querySelector('.k-grid-table.k-table.k-table-md');
    }
    getRowHeight() {
        let rowHeightInternal = this.rowHeight;
        const tdElement = this.el.nativeElement.querySelector('kendo-grid-list .k-table-td');
        if (tdElement instanceof HTMLElement) {
            rowHeightInternal = tdElement.offsetHeight;
        }
        return rowHeightInternal;
    }
    nextStepDeleting(itemsDeleted) {
        const isBatch = this.allowBatchDelete && Array.isArray(itemsDeleted);
        const items = isBatch ? itemsDeleted : [itemsDeleted];
        const columns = [...this.gridData];
        const deletedRows = [];
        for (const item of items) {
            const index = columns.findIndex(el => this.compareGridItemById(el, item));
            if (index !== -1) {
                deletedRows.push(columns[index]);
                columns.splice(index, 1);
            }
        }
        this.nextStepDeletingOriginalData(deletedRows);
        this.gridData = [...columns];
        this.gridView = this.gridData;
        this.nextStepDeletingSelected(deletedRows);
        this.unselectRows();
        this.deleteItem.emit(isBatch ? deletedRows : deletedRows[0]);
        this.mySelection = [];
        this.afterDelete.emit(this.gridView);
        this.onSelectedKeysChange();
    }
    nextStepDeletingOriginalData(deletedItems) {
        if (this.gridOriginalData) {
            deletedItems.forEach(deletedItem => {
                const gridOriginalIndex = this.gridOriginalData.findIndex(gridItem => this.compareGridItemById(gridItem, deletedItem));
                if (gridOriginalIndex > -1) {
                    this.gridOriginalData.splice(gridOriginalIndex, 1);
                }
            });
        }
    }
    nextStepDeletingSelected(deletedItems) {
        if (this.selectedRows) {
            deletedItems.forEach(deletedItem => {
                const indexSelectable = this.selectedRows.findIndex(gridSelectedItem => this.compareGridItemById(deletedItem, gridSelectedItem));
                if (indexSelectable > -1) {
                    this.selectedRows.splice(indexSelectable, 1);
                }
                this.selectedRows.splice(indexSelectable, 1);
            });
        }
    }
    onDialogCancelOrClose(mode) {
        this.notificationDisplayed = false;
        if (mode === 'include') {
            this.isInIncludeMode = true;
        }
        setTimeout(() => {
            if (this.previouslyFocusedRowActionElement) {
                this.previouslyFocusedRowActionElement.focus();
            } else {
                this.thfGridEdit.first.setFocus();
            }
        });
    }
    onDestructiveModalClose() {
        this.suppressValidationOnDestructiveModalDismiss = true;
        this.destructiveModalOnClose?.();
        setTimeout(() => {
            this.suppressValidationOnDestructiveModalDismiss = false;
        });
    }
    onDestructiveModalCancelAction() {
        this.suppressValidationOnDestructiveModalDismiss = true;
        this.modalDestructiveAction.close();
    }
    onDialogConfirm() {
        this.notificationDisplayed = false;
        this.modalDestructiveAction.close();
        this.removeItemSelected(this.rowData);
        this.rowActionsIndex = undefined;
        this.resetRowActions();
        this.onSelectedKeysChange();
        setTimeout(() => {
            this.gridComponent.focusCell(0, 0);
        });
    }
    onDestructiveEditModalConfirm() {
        const focusedIndex = this.gridView.indexOf(this.rowData);
        this.notificationDisplayed = false;
        this.modalDestructiveAction.close();
        this.returnOnBeforeFalse();
        this.rowDataInitial = {};
        this.closeRowActions();
        setTimeout(() => {
            this.gridComponent.scrollTo({
                row: focusedIndex
            });
            this.gridComponent.focusCell(focusedIndex + 1, this.rowSubtractIndex);
        });
    }
    editingChoice(row) {
        if (this.editProperties?.actionEdit && this.editingRow !== row) {
            this.editingRow = row;
            this.editGrid({
                dataItem: row
            });
        }
    }
    removingChoice(row) {
        this.rowData = row;
        this.executeRowActionsRemove();
    }
    duplicateChoice(row) {
        if (!row || !this.isDuplicateAllowedEditMode() || this.rowStateFilter !== 'active') {
            return;
        }
        if (this.disabledIncludeButton || this.showOnlySelectedItems() || this.isInIncludeMode || this.isInRowsActionsMode) {
            return;
        }
        const sourceRow = this.cleanObject(structuredClone(row));
        const duplicateEvent = {
            sourceRow,
            duplicatedRow: structuredClone(sourceRow),
            cancel: false
        };
        this.beforeDuplicate.emit(duplicateEvent);
        if (duplicateEvent.cancel) {
            return;
        }
        if (Object.prototype.hasOwnProperty.call(duplicateEvent.duplicatedRow, 'id')) {
            duplicateEvent.duplicatedRow.id = null;
        }
        this.closeActionsPopup();
        const sourceIndex = this.gridData.findIndex(item => this.compareGridItemById(item, row));
        const targetIndex = sourceIndex > -1 ? sourceIndex + 1 : this.gridData.length;
        this.isDuplicating = true;
        this.isLoading = true;
        const newLine = this.onInitIncludeMode(targetIndex);
        this.applyDuplicateDataInSequence(newLine, duplicateEvent.duplicatedRow, sourceRow);
    }
    resetRowActions() {
        this.rowData.$currentRowActions = false;
        this.includeInsertIndex = undefined;
        this.rowDataInitial = {};
        this.removeLastGridItem(this.rowData);
        this.closeRowActions();
    }
    editGrid({ dataItem }) {
        const formGroup = this.editProperties.actionEdit(dataItem);
        this.columns.forEach(column => {
            if (!column.editProperties?.componentEditable && formGroup.controls[column.property]) {
                column.editProperties = {
                    ...column.editProperties,
                    componentEditable: 'input'
                };
            }
        });
        this.autoFocusEdit = false;
        this.indexFocusEdit = null;
        this.formGroupIntern = formGroup;
        this.rowData = dataItem;
        this.editedRowIndex = true;
        this.updateEditableControlsSet();
    }
    isCellInDisplayMode(dataItem, columnProperty) {
        if (this.rowData !== dataItem) {
            return true;
        }
        if (!this.isInEditingMode && !this.isInRowsActionsMode) {
            return true;
        }
        return !this.editableControlsSet.has(columnProperty);
    }
    executeGridAction(row, gridActions) {
        if (!row.disabled && !this.validateGridAction(row, gridActions)) {
            gridActions.action(row);
        }
    }
    exportToPdf() {
        if (this.showFooterAggregates) {
            const footerElement = this.gridComponent.footer.first.nativeElement;
            const tfoot = footerElement.querySelector('.k-table-tfoot');
            if (!this.aggregatesDescriptor.length) {
                this.renderer.addClass(tfoot, 'hide-pdf-export');
            } else {
                this.renderer.removeClass(tfoot, 'hide-pdf-export');
            }
        }
        const singleGridPromise = this.gridComponent.drawPDF();
        singleGridPromise
            .then(group => {
                const rootGroup = new Group({});
                rootGroup.append(...group.children);
                return exportPDF(rootGroup);
            })
            .then(dataUri => {
                saveAs(dataUri, 'tabela.pdf');
            });
    }
    async exportToExcel() {
        this.isLoading = true;
        this.isExportingExcel = true;
        const showFooterAggregatesChanged = await this.hideShowFooterAggregate();
        this.gridComponent.saveAsExcel();
        if (showFooterAggregatesChanged) {
            this.showFooterAggregates = true;
        }
        this.isExportingExcel = false;
        this.isLoading = false;
    }
    hideShowFooterAggregate() {
        return new Promise(resolve => {
            if (!this.aggregatesDescriptor.length && this.showFooterAggregates) {
                this.showFooterAggregates = false;
                requestAnimationFrame(() => {
                    resolve(true);
                });
            } else {
                resolve(false);
            }
        });
    }
    /**
     * Retorna uma lista dos itens que foram modificados no grid, com a propriedade `op` indicando
     * a ação executada sobre cada item, podendo ser 'remove', 'add' ou 'replace'.
     *
     * ```
     * // Exemplo de uso:
     * const changedItems = this.getChangedItems();
     * console.log(changedItems);
     * // Saída esperada: [{ id: 1, name: 'Item 1', op: 'replace' }, { id: 2, name: 'Item 2', op: 'remove' }]
     * ```
     *
     *
     * @returns {Array<any>} Uma lista de objetos representando os itens modificados. Cada objeto terá a propriedade `op` que indica a ação realizada
     */
    getChangedItems() {
        const itensEdited = structuredClone(this.gridData);
        const itensEvent = itensEdited
            .filter(data => data.$edited || data.$included || data.$removed)
            .map(({ $included, $edited, $removed, ...rest }) => {
                delete rest.$currentRowActions;
                delete rest.$selected;
                delete rest.$gridItemId;
                if ($removed) {
                    rest.op = ThfGridEditModeActionType.Remove;
                } else if ($included) {
                    rest.op = ThfGridEditModeActionType.Add;
                } else if ($edited) {
                    rest.op = ThfGridEditModeActionType.Replace;
                }
                return rest;
            });
        this.changedItems.emit(itensEvent);
        return itensEvent;
    }
    /**
     * Responsável por retornar os itens do grid que estão selecionadas.
     */
    getSelectedRows() {
        return this.mySelection;
    }
    onRowActionsFieldFocus(event) {
        const target = event.target;
        this.previouslyFocusedRowActionElement = target;
    }
    onGroupChange(group) {
        if (this.aggregatesDescriptor.length > 0) {
            const aggregates = this.createAggregateDescriptors(this.aggregatesDescriptor);
            const groupAggregates = [];
            group.map(group => {
                groupAggregates.push({
                    field: group.field,
                    aggregates: aggregates
                });
            });
            this.group = groupAggregates;
        } else {
            this.group = group;
        }
        this.onGroup.emit(this.getListGroup());
        this.applyFixedWidths(false);
    }
    densityChanged(event) {
        const spacingValues = {
            medium: ThfColumnSpacing.Medium,
            small: ThfColumnSpacing.Small,
            extraSmall: ThfColumnSpacing.ExtraSmall
        };
        if (this.changedDensityOption in spacingValues) {
            this.changedDensityOption = event;
            this.spacing = spacingValues[this.changedDensityOption];
        }
        if (!this.rowHeight) {
            setTimeout(() => {
                this.calculateRowHeight();
            }, 100);
        }
        this.changedDensity.emit(this.changedDensityOption);
    }
    optionsColumnManagerChanged(event) {
        this.draggable = true;
        this.changeOptionsColumnManager.emit(event);
    }
    fixedQty() {
        return this.verifyActionFixed ? 1 : 2;
    }
    onChangeWidthResize(select) {
        this.gridComponent.visibleColumns
            .filter(colKendo => !colKendo.isCheckboxColumn && colKendo.field !== 'actions')
            .forEach(colKendo => {
                if (select && colKendo.field === select[0].column.field) {
                    const currentColumn = this.columns.find(col => col.property === colKendo.field);
                    currentColumn.widthResizable = colKendo.width;
                    currentColumn.internalWidth = undefined;
                }
            });
        if (select) {
            this.applyFixedWidths(true, true);
        }
    }
    /**
     * Exibe o conteúdo da propriedade `helper` durante a edição (`t-edit-properties` ou `t-grid-row-actions`) do grid.
     * Para isso, será necessário ter uma instância do componente no DOM e configurar uma tecla de atalho utilizando o evento `t-keydown`.
     *
     * ```
     * import { ThfGridComponent } from '@totvs/thf-components';
     * ...
     * @ViewChild('gridComponent', { static: false }) thfGrid!: ThfGridComponent;
     *
     * columns: Array<ThfGridColumn> = [
     *  ...
     *  {
     *    property: 'name',
     *    label: 'Nome',
     *    editProperties: {
     *      componentEditable: 'input',
     *      helper: 'Nome completo',
     *      keydown: this.onkeydown.bind(this, 'name')
     *     }
     *  },
     * ]
     *
     * onkeydown(property: string, event: KeyboardEvent): void {
     *  if (event.code === 'F9') {
     *    this.thfGrid.showAdditionalHelp(property);
     *  }
     * }
     * ```
     *
     * > Com t-grid-row-actions: Alguns atalhos já estão em uso, então, evite sobrescrevê-los. Para mais detalhes,
     * consulte o [TDN](https://tdn.totvs.com/pages/releaseview.action?pageId=871520382).
     *
     * @param { string } property Identificador da coluna.
     */
    showAdditionalHelp(property) {
        if (this.isInEditingMode) {
            this.thfGridInlineEdit.forEach(component => {
                if (component.column.property === property) {
                    component.showAdditionalHelp();
                }
            });
        }
        if (this.isInRowsActionsMode) {
            this.thfGridEdit?.find(fieldEdit => fieldEdit.column?.property === property)?.showAdditionalHelp();
        }
    }
    async setGridOriginalData() {
        if (!this.gridOriginalData) {
            this.gridOriginalData = [...this.gridData];
            this.isLoading = true;
            this.gridOriginalDataFormated = await this.thfGridFormatService.formatGridData(this.columns, this.gridOriginalData, this.literals);
            this.isLoading = false;
        }
    }
    async onFilterInputHandle(fromHtml = true) {
        await this.setGridOriginalData();
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            const resultFilter = this.gridOriginalDataFormated.filter(item => {
                for (const key of Object.keys(item)) {
                    if (key.startsWith('$')) continue;
                    const val = item[key];
                    if (val === null || val === undefined) continue;
                    try {
                        if (val.toString().toLowerCase().includes(term)) {
                            return true;
                        }
                    } catch {
                        continue;
                    }
                }
                return false;
            });
            this.gridData = this.gridOriginalData.filter(item => resultFilter.some(res => this.compareGridItemById(res, item)));
            if (this.virtualScroll && this.height && fromHtml) {
                this.skip = 1;
                this.isLoading = true;
                const elementTable = this.getElementTable();
                setTimeout(() => {
                    this.skip = 0;
                    this.renderer.setStyle(elementTable, 'transform', 'translateY(0px)');
                    this.changeDetector.detectChanges();
                    this.isLoading = false;
                }, 100);
            }
        } else {
            this.gridData = [...this.gridOriginalData];
        }
        this.gridView = this.gridData;
        this.verifyFilterByColumn();
        this.thfGridEditService.setData(this.gridData);
        this.totalAggregates = this.calculateTotalAggregates();
    }
    onFilterInputKeyup(event) {
        if (this.filterInputMode === 'basic') {
            const target = event.target;
            this.filterSubject.next(target.value);
        }
        if (this.filterInputMode === 'service') {
            this.onFilterInputService(event);
        }
    }
    onFilterInputService(event) {
        if (this.hasItems) {
            return;
        }
        if (this.filterInputMode === 'service' && event.key === 'Enter') {
            let fields;
            this.isLoading = true;
            this.page = 1;
            if (event.target.value) {
                this.inputFilter = {
                    search: event.target.value
                };
                fields = {
                    ...this.inputFilter,
                    ...this.filter,
                    ...this.getFilterPaging()
                };
            } else {
                this.inputFilter = {};
                fields = {
                    ...this.filter,
                    ...this.getFilterPaging()
                };
            }
            this.thfGridService
                .listItems(this.service, fields)
                .pipe(finalize$1(() => (this.isLoading = false)))
                .subscribe({
                    next: items => {
                        this.showMoreDisabled = !items.hasNext;
                        this.gridData = items['items'];
                        this.setGridItemId(this.gridData);
                        this.gridView = this.gridData;
                        this.updateSelection();
                        this.setPaginationData(items);
                        this.thfGridEditService.setData(this.gridData);
                        this.itemsAfterGet.emit(this.getInfoProperties());
                    },
                    error: error => {
                        this.filterItemError.emit(error);
                    }
                });
        }
    }
    onFocusoutLookupMultiselect(event) {
        if (this.shiftKeyPressed && event.isTrusted) {
            this.handleFocusChange(event, 'previous');
        } else {
            this.handleFocusChange(event, 'next');
        }
    }
    handleFocusChange(event, direction) {
        const currentTd = event.target?.closest('.k-table-td-columns-fields');
        const siblingTd = this.getSiblingTd(currentTd, direction);
        if (this.canSetFocusToSiblingTd(siblingTd)) {
            const columnProperty = this.getColumnProperty(event.target, direction);
            this.setFocusToColumn(columnProperty);
        } else {
            event.preventDefault();
            direction === 'previous' ? this.gridComponent.focusPrevCell() : this.gridComponent.focusNextCell();
        }
    }
    getSiblingTd(currentTd, direction) {
        const sibling = direction === 'previous' ? currentTd?.previousElementSibling : currentTd?.nextElementSibling;
        return sibling instanceof HTMLElement ? sibling : null;
    }
    canSetFocusToSiblingTd(siblingTd) {
        return !!(siblingTd && siblingTd.nodeName === 'TD' && siblingTd.querySelector("thf-grid-edit[enabled-thf-grid-edit='true']"));
    }
    getColumnProperty(element, direction) {
        const attribute = direction === 'previous' ? 'previous-column-property' : 'next-column-property';
        return element.getAttribute(attribute);
    }
    setFocusToColumn(columnProperty) {
        if (!columnProperty) return;
        const editElement = this.thfGridEdit?.find(fieldEdit => fieldEdit.column?.property === columnProperty);
        editElement?.setFocus();
    }
    onSelectedKey(context) {
        return context.dataItem;
    }
    onSelectionChange(event) {
        if (this.isInRowsActionsMode && !this.validateCurrentForm()) {
            if (this.lastSelectedItem) {
                this.mySelection = [this.lastSelectedItem];
                this.selectedRows = [this.lastSelectedItem];
            }
            return;
        }
        this.myLastSelection = [...this.mySelection];
        if (!this.singleSelect) {
            this.handleGridSelectable(event);
        } else {
            this.handleGridSingleSelectable(event);
        }
        this.setDropdownActions();
        if (event.selectedRows?.length) {
            const rowIndex = event.selectedRows[0].index;
            const rowEl = this.el.nativeElement.querySelector(`tr.k-table-row:nth-child(${rowIndex + 1})`);
            rowEl?.querySelectorAll('td:not(.k-table-td-select)').forEach(cell => cell.setAttribute('tabindex', '0'));
        }
    }
    onShowMore(fromHtml = true) {
        let heightDefault;
        if (this.hasItems) {
            this.showMore.emit();
            return;
        }
        if (!fromHtml && this.virtualScroll) {
            heightDefault = this.getHeightRow();
        }
        let sortedColumn;
        this.isLoading = this.loadingShowMore = true;
        this.page++;
        if (this.sort[0]?.dir && this.sort[0]?.field) {
            sortedColumn = this.sort;
        }
        const fields = {
            ...this.inputFilter,
            ...this.filter,
            ...this.getFilterPaging()
        };
        this.thfGridSubscription = this.getFilteredItems(fields)
            .pipe(
                finalize$1(() => {
                    this.isLoading = this.loadingShowMore = false;
                    if (!fromHtml && this.virtualScroll) {
                        this.calculateRowHeight(heightDefault);
                    }
                    this.onSelectedKeysChange();
                })
            )
            .subscribe({
                next: data => {
                    this.gridData = [...(this.gridOriginalData ?? this.gridData), ...data.items];
                    this.setGridItemId(this.gridData);
                    this.gridOriginalData = null;
                    this.onFilterInputHandle(false);
                    this.gridView = this.gridData;
                    this.updateSelection();
                    this.setPaginationData(data);
                    this.showMoreDisabled = !data.hasNext;
                    this.totalAggregates = this.calculateTotalAggregates();
                    if (fromHtml) {
                        this.showMore.emit(sortedColumn);
                    } else {
                        this.eventPageSize.emit({
                            pageSize: this.pageSize
                        });
                    }
                },
                error: () => {
                    this.page--;
                }
            });
    }
    openModalFilter() {
        if (this.initialFilter) {
            this.filter = {
                ...this.filter,
                ...getInitialValuesFromFilter(this.fields)
            };
        }
        this.poModal.open();
        this.initialFilter = false;
    }
    onCellClick(e) {
        // função para selecionar um item ao clicar na linha (sem evento de ctrl ou shift)
        const IsSelectableAlready = this.mySelection.find(data => this.compareGridItemById(e.dataItem, data));
        if (!IsSelectableAlready || (this.mySelection.length !== 1 && this.gridData.length > 1)) {
            this.handleGridSeletableLine(e);
        }
        const clickedCell = e.originalEvent?.target;
        const td = clickedCell?.closest('td');
        if (td && !td.closest('.k-table-td-select') && !td.closest('.k-table-td-action') && !this.gridRowActions?.actionEdit) {
            const row = td.closest('tr');
            row?.querySelectorAll('td:not(.k-table-td-select)').forEach(cell => cell.setAttribute('tabindex', '0'));
            td.focus();
        }
        if (this.gridRowActions?.actionEdit) {
            if (e.dataItem?.$removed) {
                if (e.column?.field === 'actions') {
                    this.onCellClickTypeActions(e);
                }
                this.cellArgs = null;
                return;
            }
            if (this.gridRowActions.validateField && e.originalEvent.type === 'click') {
                setTimeout(() => {
                    this.onCellClickEnableEdit(e);
                }, 90);
            } else {
                this.onCellClickEnableEdit(e);
            }
        }
    }
    onInitIncludeMode(insertIndex) {
        const newLine = this.createEmptyIncludeLine();
        const targetIndex = Number.isInteger(insertIndex) ? Math.max(0, insertIndex) : this.gridData.length;
        this.includeInsertIndex = Number.isInteger(insertIndex) ? targetIndex : undefined;
        this.gridData.splice(targetIndex, 0, newLine);
        this.gridData = [...this.gridData];
        this.applyRowStateFilterImmediate();
        this.changeDetector.detectChanges();
        setTimeout(() => {
            const focusedIndex = Number.isInteger(insertIndex) ? targetIndex + 1 : this.getFocusedIndex();
            this.gridComponent.scrollTo({
                row: focusedIndex
            });
            this.gridComponent.focusCell(focusedIndex, this.rowSubtractIndex);
            this.isInIncludeMode = true;
            this.initIncludeMode = true;
            this.uuidIncluded = uuid();
            this.ensureIncludeRowInEditMode(newLine);
            this.dispachFocusedElement();
            if (!this.isDuplicating) {
                setTimeout(() => this.focusFirstEditableField(), 30);
            }
            this.notificationDisplayed = false;
            this.applyFixedWidths();
        }, 0);
        return newLine;
    }
    onKeydownSelectInput(event) {
        if (this.gridRowActions?.actionEdit) {
            return;
        }
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
        }
        if (event.key === ' ') {
            event.preventDefault();
            event.target?.click();
        }
    }
    onKeydownGrid(event) {
        if (this.poPopupComponent?.showPopup && event.key === 'Tab' && !event.shiftKey) {
            const target = event.target;
            if (target?.closest('.k-table-td-action') && !this.getActionsPopupElement()?.contains(target)) {
                event.preventDefault();
                event.stopPropagation();
                this.focusFirstPopupAction();
                return;
            }
        }
        if (this.gridRowActions?.actionEdit) {
            this.onKeydownEditMode(event);
        }
        const target = event.target;
        if (event.key === 'Enter' && target instanceof HTMLElement && target.classList.contains('k-table-th')) {
            const clickableElement = target.querySelector('.po-icon-header.po-clickable');
            if (clickableElement) {
                const enterEvent = new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    bubbles: true,
                    cancelable: true
                });
                clickableElement.dispatchEvent(enterEvent);
            }
        }
        if (event.key === 'Tab') {
            this.onTabNavigationSelectAndActions(event, target);
        }
        if ((event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') && target.closest('.k-table-td-action')) {
            this.onActionCellActivation(event, target);
        }
        if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && target.closest('.k-table-td-select') && !this.gridRowActions?.actionEdit) {
            const currentRow = target.closest('tr.k-table-row');
            if (!currentRow) {
                return;
            }
            const rows = Array.from(currentRow.parentElement?.querySelectorAll('tr.k-table-row') || []);
            const currentIndex = rows.indexOf(currentRow);
            const nextRow = rows[event.key === 'ArrowDown' ? currentIndex + 1 : currentIndex - 1];
            if (nextRow) {
                const input = nextRow.querySelector('.k-table-td-select input[type="checkbox"], .k-table-td-select input[type="radio"]');
                if (input) {
                    event.preventDefault();
                    event.stopPropagation();
                    input.focus();
                }
            }
        }
        if (event.key === 'ArrowRight' && target.closest('.k-table-td-select') && !this.gridRowActions?.actionEdit) {
            const row = target.closest('tr.k-table-row');
            const focusableLinks = Array.from(
                row?.querySelectorAll('.thf-grid-link:not(.thf-grid-link-disabled) a, .thf-grid-link:not(.thf-grid-link-disabled) button') || []
            );
            if (focusableLinks.length) {
                event.preventDefault();
                event.stopPropagation();
                focusableLinks[0].focus();
            } else {
                const rows = Array.from(this.el.nativeElement.querySelectorAll('tr.k-table-row') || []);
                const rowIndex = rows.indexOf(row);
                const actionCells = this.el.nativeElement.querySelectorAll('.k-table-td-action');
                const actionCell = row?.querySelector('.k-table-td-action') || actionCells?.[rowIndex];
                if (actionCell) {
                    event.preventDefault();
                    event.stopPropagation();
                    actionCell.setAttribute('tabindex', '0');
                    actionCell.focus();
                }
            }
        }
        if (event.key === 'ArrowRight' && target.closest('.thf-grid-link') && !this.gridRowActions?.actionEdit) {
            const row = target.closest('tr.k-table-row');
            const focusableLinks = Array.from(
                row?.querySelectorAll('.thf-grid-link:not(.thf-grid-link-disabled) a, .thf-grid-link:not(.thf-grid-link-disabled) button') || []
            );
            const currentLink = target.closest('a') || target.closest('button') || target.closest('.thf-grid-link')?.querySelector('a, button');
            const currentIndex = focusableLinks.indexOf(currentLink);
            if (currentIndex >= 0 && currentIndex < focusableLinks.length - 1) {
                event.preventDefault();
                event.stopPropagation();
                focusableLinks[currentIndex + 1].focus();
            } else {
                const rows = Array.from(this.el.nativeElement.querySelectorAll('tr.k-table-row') || []);
                const rowIndex = rows.indexOf(row);
                const actionCells = this.el.nativeElement.querySelectorAll('.k-table-td-action');
                const actionCell = row?.querySelector('.k-table-td-action') || actionCells?.[rowIndex];
                if (actionCell) {
                    event.preventDefault();
                    event.stopPropagation();
                    actionCell.setAttribute('tabindex', '0');
                    actionCell.focus();
                }
            }
        }
        if (event.key === 'ArrowLeft' && target.closest('.k-table-td-action') && !this.gridRowActions?.actionEdit) {
            const row = target.closest('tr.k-table-row');
            const focusableLinks = Array.from(
                row?.querySelectorAll('.thf-grid-link:not(.thf-grid-link-disabled) a, .thf-grid-link:not(.thf-grid-link-disabled) button') || []
            );
            if (focusableLinks.length) {
                event.preventDefault();
                event.stopPropagation();
                focusableLinks[focusableLinks.length - 1].focus();
            } else {
                const input = row?.querySelector('.k-table-td-select input[type="checkbox"], .k-table-td-select input[type="radio"]');
                if (input) {
                    event.preventDefault();
                    event.stopPropagation();
                    input.focus();
                }
            }
        }
        if (event.key === 'ArrowLeft' && target.closest('.thf-grid-link') && !this.gridRowActions?.actionEdit) {
            const row = target.closest('tr.k-table-row');
            const focusableLinks = Array.from(
                row?.querySelectorAll('.thf-grid-link:not(.thf-grid-link-disabled) a, .thf-grid-link:not(.thf-grid-link-disabled) button') || []
            );
            const currentLink = target.closest('a') || target.closest('button') || target.closest('.thf-grid-link')?.querySelector('a, button');
            const currentIndex = focusableLinks.indexOf(currentLink);
            if (currentIndex > 0) {
                event.preventDefault();
                event.stopPropagation();
                focusableLinks[currentIndex - 1].focus();
            } else {
                const input = row?.querySelector('.k-table-td-select input[type="checkbox"], .k-table-td-select input[type="radio"]');
                if (input) {
                    event.preventDefault();
                    event.stopPropagation();
                    input.focus();
                }
            }
        }
        if (
            (event.key === 'ArrowLeft' || event.key === 'ArrowRight') &&
            !this.gridRowActions?.actionEdit &&
            !target.closest('.k-table-td-select') &&
            !target.closest('.k-table-td-action') &&
            !target.closest('.thf-grid-link')
        ) {
            const row = target.closest('tr.k-table-row') || this.el.nativeElement.querySelector('tr.k-table-row.k-selected, tr.k-table-row.k-state-selected');
            if (!row) {
                return;
            }
            const focusableLinks = Array.from(
                row.querySelectorAll('.thf-grid-link:not(.thf-grid-link-disabled) a, .thf-grid-link:not(.thf-grid-link-disabled) button') || []
            );
            if (event.key === 'ArrowLeft') {
                const input = row.querySelector('.k-table-td-select input[type="checkbox"], .k-table-td-select input[type="radio"]');
                if (input) {
                    event.preventDefault();
                    event.stopPropagation();
                    input.focus();
                }
            } else if (focusableLinks.length) {
                event.preventDefault();
                event.stopPropagation();
                focusableLinks[0].focus();
            } else {
                const rows = Array.from(this.el.nativeElement.querySelectorAll('tr.k-table-row') || []);
                const rowIndex = rows.indexOf(row);
                const actionCells = this.el.nativeElement.querySelectorAll('.k-table-td-action');
                const actionCell = row.querySelector('.k-table-td-action') || actionCells?.[rowIndex];
                if (actionCell) {
                    event.preventDefault();
                    event.stopPropagation();
                    actionCell.setAttribute('tabindex', '0');
                    actionCell.focus();
                }
            }
        }
    }
    onActionCellActivation(event, target) {
        const row = target.closest('tr.k-table-row');
        if (!row) {
            return;
        }
        const rowIndex = Array.from(row.parentElement?.children || []).indexOf(row);
        const dataItem = this.gridView?.[rowIndex];
        if (!dataItem) {
            return;
        }
        if (this.visibleActions.length === 1 && this.visibleActions[0].visible !== false) {
            if (event.key === 'ArrowDown') {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            this.executeGridAction(dataItem, this.visibleActions[0]);
        } else if (this.visibleActions.length > 1) {
            event.preventDefault();
            event.stopPropagation();
            const actionTrigger = row.querySelector('.icon-actions');
            if (actionTrigger) {
                this.togglePopup(dataItem, actionTrigger, true);
            }
        }
    }
    onTabNavigationSelectAndActions(event, target) {
        if (this.gridRowActions?.actionEdit) {
            return;
        }
        const row = target.closest('tr.k-table-row');
        if (!row) {
            return;
        }
        const selectCell = target.closest('.k-table-td-select');
        const actionCell = target.closest('.k-table-td-action');
        const linkElement = target.closest('.thf-grid-link');
        const focusableLinks = Array.from(
            row.querySelectorAll('.thf-grid-link:not(.thf-grid-link-disabled) a, .thf-grid-link:not(.thf-grid-link-disabled) button')
        );
        const hasSelect = this.selectable;
        const hasActions = this.visibleActions?.length > 0;
        if (!hasSelect && !linkElement && !actionCell) {
            return;
        }
        if (selectCell && !hasActions && !focusableLinks.length) {
            return;
        }
        if (!event.shiftKey && selectCell) {
            if (hasActions && !this.actionRight) {
                const targetActionCell = row.querySelector('.k-table-td-action');
                if (targetActionCell) {
                    event.preventDefault();
                    event.stopPropagation();
                    targetActionCell.setAttribute('tabindex', '0');
                    targetActionCell.focus();
                }
            } else if (focusableLinks.length) {
                event.preventDefault();
                event.stopPropagation();
                focusableLinks[0].focus();
            } else if (hasActions) {
                const targetActionCell = row.querySelector('.k-table-td-action');
                if (targetActionCell) {
                    event.preventDefault();
                    event.stopPropagation();
                    targetActionCell.setAttribute('tabindex', '0');
                    targetActionCell.focus();
                }
            }
            return;
        }
        if (!event.shiftKey && linkElement) {
            const currentLink = target.closest('a') || target.closest('button') || linkElement.querySelector('a, button');
            const currentIndex = focusableLinks.indexOf(currentLink);
            if (currentIndex >= 0 && currentIndex < focusableLinks.length - 1) {
                event.preventDefault();
                event.stopPropagation();
                focusableLinks[currentIndex + 1].focus();
            } else if (hasActions && this.actionRight) {
                const targetActionCell = row.querySelector('.k-table-td-action');
                if (targetActionCell) {
                    event.preventDefault();
                    event.stopPropagation();
                    targetActionCell.setAttribute('tabindex', '0');
                    targetActionCell.focus();
                }
            }
            return;
        }
        if (event.shiftKey && actionCell) {
            if (!this.actionRight && hasSelect) {
                const input = row.querySelector('.k-table-td-select input[type="checkbox"], .k-table-td-select input[type="radio"]');
                if (input) {
                    event.preventDefault();
                    event.stopPropagation();
                    input.focus();
                }
            } else if (focusableLinks.length) {
                event.preventDefault();
                event.stopPropagation();
                focusableLinks[focusableLinks.length - 1].focus();
            } else if (hasSelect) {
                const input = row.querySelector('.k-table-td-select input[type="checkbox"], .k-table-td-select input[type="radio"]');
                if (input) {
                    event.preventDefault();
                    event.stopPropagation();
                    input.focus();
                }
            }
            return;
        }
        if (event.shiftKey && linkElement) {
            const currentLink = target.closest('a') || target.closest('button') || linkElement.querySelector('a, button');
            const currentIndex = focusableLinks.indexOf(currentLink);
            if (currentIndex > 0) {
                event.preventDefault();
                event.stopPropagation();
                focusableLinks[currentIndex - 1].focus();
            } else if (hasActions && !this.actionRight) {
                const targetActionCell = row.querySelector('.k-table-td-action');
                if (targetActionCell) {
                    event.preventDefault();
                    event.stopPropagation();
                    targetActionCell.setAttribute('tabindex', '0');
                    targetActionCell.focus();
                }
            } else if (hasSelect) {
                const input = row.querySelector('.k-table-td-select input[type="checkbox"], .k-table-td-select input[type="radio"]');
                if (input) {
                    event.preventDefault();
                    event.stopPropagation();
                    input.focus();
                }
            }
        }
    }
    onReorder(e) {
        let newIndex = e.newIndex;
        let oldIndex = e.oldIndex;
        e.preventDefault();
        if (!this.draggable) {
            return;
        }
        if (this.selectable || (this.visibleActions?.length && !this.actionRight)) {
            if (this.visibleActions?.length && !this.actionRight) {
                newIndex--;
                oldIndex--;
            }
            if (newIndex === 0 || newIndex === -1) {
                return;
            }
            if (this.selectable) {
                newIndex--;
                oldIndex--;
            }
        }
        if (this.actionRight && this.columns.length === newIndex) {
            return;
        }
        if (!this.columns[newIndex] || !this.columns[oldIndex]) {
            return;
        }
        if (this.columns[newIndex].fixed || this.columns[oldIndex].fixed) {
            return;
        }
        const [columnToMove] = this.columns.splice(oldIndex, 1);
        this.columns.splice(newIndex, 0, columnToMove);
        if (this.virtualColumns && (oldIndex === 0 || newIndex === 0)) {
            // Método necessário quando virtualColumns é habilitado para atualizar o width da coluna para o kendo detectar mudança e atualizar as colunas
            this.changeWidthVirtualColumns(newIndex, oldIndex);
        }
        this.emitEventOrder();
    }
    returnLabelColumn(column) {
        for (const col of this.columns) {
            if (col['property'] === column) {
                return col['label'];
            }
        }
        return null;
    }
    saveCurrent() {
        if (this.formGroupIntern && !this.formGroupIntern.valid) {
            return;
        }
        this.saveRow();
    }
    /**
     * Seleciona um item do grid.
     *
     * @param { { key: value } | Function } item Item ou função que recebe como parâmetro o item e retorna um boolean.
     *
     */
    selectRowItem(itemfn) {
        this.toggleSelect(itemfn, true, true);
        this.onSelectedKeysChange();
    }
    setAutoFocusOnEdit(column, currentIndex) {
        if (!column.editProperties?.disabled) {
            this.indexFocusEdit = currentIndex;
            this.autoFocusEdit = true;
            setTimeout(() => {
                this.indexFocusEdit = null;
            }, 500);
            return true;
        }
        return false;
    }
    setEventListenerScroll(addEvent) {
        if (addEvent && !this.height && this.headlineFixed) {
            this.scrollListener = this.renderer.listen('window', 'scroll', this.scrollFixed.bind(this));
            const container = this.el.nativeElement.closest('.po-page-content');
            if (container) {
                this.containerScrollListener = this.renderer.listen(container, 'scroll', this.scrollFixed.bind(this));
            }
        } else {
            this.scrollListener = null;
            this.containerScrollListener = null;
        }
    }
    setHeaderClass(column) {
        let thRight = '';
        if (column?.headerAlign) {
            thRight = column?.headerAlign === 'right' ? 'k-table-th-right' : '';
        } else {
            thRight = column.type === 'number' || column.type === 'currency' ? 'k-table-th-right' : '';
        }
        const thInteractive = this.sortable || this.draggable || this.groupable ? 'k-table-th-interactive' : '';
        const thOnRowActions = this.isInRowsActionsMode && this.sortable ? 'k-table-th-not-allowed' : '';
        return [thRight, thInteractive, thOnRowActions];
    }
    showOnlyIfDetail(column, data) {
        return data[column.property].length > 0;
    }
    showTooltip(e) {
        let element = e.target;
        const isTitle = element.closest('.toolbar-edit-row-title');
        const columnTitle = element.closest('.k-column-title');
        if (columnTitle) {
            element = columnTitle.querySelector('.k-column-title-content');
        }
        if (element.offsetWidth < element.scrollWidth && (element.closest('.thf-grid-content') || isTitle || columnTitle)) {
            if (
                (this.isInRowsActionsMode || this.isInEditingMode) &&
                (element.closest('thf-grid-edit') || element?.firstElementChild?.nodeName === 'THF-GRID-EDIT')
            ) {
                this.tooltipDir.hide();
                return;
            }
            this.tooltipDir.hide();
            this.tooltipDir.show(element);
        } else {
            this.tooltipDir.hide();
        }
    }
    sortChange(sort, fromHtml = false) {
        if (fromHtml && this.poPopupFilters?.length) {
            this.filterByColumnName = '';
        }
        this.sort = sort;
        let gridDataCopy = [...this.gridData];
        if (this.sort[0].field && this.sort[0].dir) {
            gridDataCopy = this.sortGridData([...this.gridData], this.sort[0].field, this.sort[0].dir);
        }
        if (this.shiftAnchorIndex.id) {
            this.shiftAnchorIndex.index = gridDataCopy.findIndex(item => item.$gridItemId === this.shiftAnchorIndex.id);
        }
        this.columns
            .filter(column => column.filter === true)
            .forEach(column => {
                this.filterByColumnName = column.property;
                this.setIconFilterByColumn();
                this.filterByColumnName = '';
            });
        this.sortColumn.emit(this.sort);
    }
    togglePopup(row, targetRef, focusFirstAction = false) {
        this.poPopupComponent.actions = this.visibleActions.map(action => ({
            ...action,
            action: action?.action
                ? item => {
                      this.closeActionsPopup();
                      action.action(item);
                  }
                : action?.action
        }));
        this.popupTarget = targetRef;
        this.changeDetector.detectChanges();
        this.poPopupComponent.toggle(row);
        setTimeout(() => {
            this.setupPopupTabNavigation();
            if (focusFirstAction) {
                this.focusFirstPopupAction();
            }
        }, 0);
    }
    trackItemFixed(_, item) {
        return item ? item.fixed : undefined;
    }
    /**
     * Desmarca o item que está selecionado.
     *
     * @param { { key: value } | Function } item Item ou função que recebe como parâmetro o item e retorna um boolean.
     *
     */
    unselectRowItem(itemfn) {
        this.toggleSelect(itemfn, false);
        this.onSelectedKeysChange();
    }
    verifyCustomActionsDisabled() {
        if (this.visibleCustomDropDown.length > 0) {
            if (this.dropdownActions?.every(action => action && action.disabled === true)) {
                return true;
            }
            return false;
        }
        if (this.hasActiveFilters) {
            const visibleItems = this.gridView ?? [];
            const visibleSelected = visibleItems.filter(i => i.$selected).length;
            return visibleSelected !== visibleItems.length;
        }
        return this.mySelection.length !== this.gridView.length;
    }
    validateGridAction(row, gridAction) {
        return validateGridAction(row, gridAction);
    }
    updateColumns() {
        const columnsOptions = [];
        const visibleCount = this.gridUtils.getVisibleColumnsCount(this.maxColumnsGrid);
        this.gridUtils.setMaxColumnsProperties(this.maxColumns, this.maxColumnsGrid);
        this.gridUtils.setVisibleColumns(this.visibleColumns);
        this.columns
            ?.filter(column => column.type !== 'detail')
            .map(column => {
                columnsOptions.push({
                    ...column,
                    visible: visibleCount >= this.maxColumns ? !this.gridUtils.isDisableColumn(column) : this.isVisibleColumn(column)
                });
            });
        this.columns = columnsOptions;
    }
    /**
     * Método responsável por realizar busca no serviço de dados podendo informar filtros e com o retorno, atualiza o grid.
     *
     * Caso não seja informado parâmetro, nada será adicionado ao GET, conforme abaixo:
     * ```
     * url + ?page=1&pageSize=10
     * ```
     * > Obs: os parâmetros `page` e `pageSize` sempre serão chamados independente de ser enviados outros parâmetros.
     *
     * Caso sejam informados os parâmetros `{ name: 'JOHN', age: '23' }`, todos serão adicionados ao GET, conforme abaixo:
     * ```
     * url + ?page=1&pageSize=10&name=JOHN&age=23
     * ```
     *
     * @param { { key: value } } queryParams Formato do objeto a ser enviado.
     * > Pode ser utilizada qualquer string como key, e qualquer string ou number como value.
     */
    applyFilters(queryParams) {
        if (this.hasItems) {
            return;
        }
        this.filter = {
            ...this.filter,
            ...queryParams
        };
        if (!queryParams) {
            this.filter = {};
        }
        this.page = (queryParams && queryParams['page']) || this.page;
        this.getByFilter();
        this.changeDetector.detectChanges();
    }
    /**
     * Mantém compatibilidade com versões anteriores, chamando `calculateDynamicSize` com a propriedade `'height'`.
     *
     * @deprecated v21.x.x - Use `calculateDynamicSize('height')` em vez desta função.
     * @param callRowHeight Define se o `calculateRowHeight` deve ser chamado após o cálculo do tamanho.
     */
    calculateHeightDynamically(callRowHeight = false) {
        console.warn('⚠️ [ThfGridComponent] "calculateHeightDynamically" está obsoleto. Use "calculateDynamicSize(\'height\')" no lugar.');
        this.calculateDynamicSize('height', callRowHeight);
    }
    getByFilter() {
        if (this.hasItems) {
            return;
        }
        Object.keys(this.filter).forEach(property => {
            if (!this.filter[property]) {
                delete this.filter[property];
            }
        });
        this.isLoading = this.loadingShowMore = true;
        this.page = 1;
        const fields = {
            ...this.filter,
            ...this.inputFilter,
            ...this.getFilterPaging()
        };
        this.getFilteredItems(fields)
            .pipe(
                finalize$1(() => {
                    this.isLoading = this.loadingShowMore = false;
                    this.onSelectedKeysChange();
                    this.itemsAfterGet.emit(this.getInfoProperties());
                })
            )
            .subscribe({
                next: items => {
                    this.showMoreDisabled = !items.hasNext;
                    this.gridData = items['items'];
                    this.setGridItemId(this.gridData);
                    this.gridView = this.gridData;
                    this.setPaginationData(items);
                    this.updateSelection();
                    this.thfGridEditService.setData(this.gridData);
                    this.gridOriginalData = null;
                    this.onFilterInputHandle(false);
                }
            });
    }
    /**
     * Remove um item localmente do grid.
     *
     * @param { number | { key: value } } item Índice ou item que será removido.
     * > Ao remover o item, a linha que o representa será removida do grid.
     */
    removeItem(item) {
        if (item instanceof Object) {
            this.gridData = this.gridData.filter(filterItem => JSON.stringify(this.cleanObject(filterItem)) !== JSON.stringify(this.cleanObject(item)));
            if (this.gridOriginalData) {
                this.gridOriginalData = this.gridOriginalData.filter(filterItem => JSON.stringify(filterItem) !== JSON.stringify(item));
            }
        } else if (typeof item === 'number') {
            const index = item;
            if (this.gridOriginalData) {
                const itemToRemove = this.gridOriginalData[index];
                this.gridOriginalData = this.gridOriginalData.filter((_, i) => i !== index);
                this.gridData = this.gridData.filter(obj => obj.id !== itemToRemove.id);
            } else {
                this.gridData = this.gridData.filter((_, i) => i !== index);
            }
        }
    }
    /**
     * Método responsável por desmarcar as linhas que estão selecionadas.
     *
     */
    unselectRows() {
        this.gridData.forEach(item => {
            item.$selected = false;
        });
        this.selectedRows = [];
        this.mySelection = [];
        this.gridView = this.gridData;
        this.onSelectedKeysChange();
    }
    onSelectAllChange(checkedState) {
        if ((checkedState === 'unchecked' || checkedState === 'indeterminate') && this.isInRowsActionsMode) {
            checkedState = 'checked';
        } else if (checkedState === 'checked' && this.isInRowsActionsMode) {
            checkedState = 'unchecked';
        }
        const isChecked = checkedState === 'checked';
        const visibleItems = this.gridRowActions ? this.gridView : this.gridData;
        if (this.gridRowActions) {
            const visibleIds = new Set(visibleItems.map(v => v.$gridItemId));
            this.gridData.forEach(item => {
                if (isChecked) {
                    item.$selected = visibleIds.has(item.$gridItemId);
                } else if (visibleIds.has(item.$gridItemId)) {
                    item.$selected = false;
                }
            });
        } else {
            this.gridData.forEach(item => (item.$selected = isChecked));
        }
        if (isChecked) {
            const newItems = visibleItems.filter(data => !this.mySelection.some(row => this.compareGridItemById(data, row)));
            this.mySelection = [...this.mySelection, ...newItems];
            this.updateSelection();
        } else {
            const mySelectionNow = this.mySelection.filter(row => !visibleItems.some(data => this.compareGridItemById(data, row)));
            this.mySelection = [...mySelectionNow];
        }
        this.selectedRows = [...this.mySelection];
        this.selectAllState = isChecked ? 'checked' : 'unchecked';
        if (isChecked) {
            this.selectedAll.emit(this.mySelection);
        } else {
            this.unSelectedAll.emit(visibleItems);
        }
        this.emitSelectionEvents();
        this.setDropdownActions();
        this.onSelectedKeysChange();
    }
    onSelectedKeysChange() {
        const visibleItems = this.gridRowActions && this.gridView ? this.gridView : this.gridData;
        const visibleSelected = visibleItems.filter(data => data.$selected).length;
        if (this.gridRowActions && this.showOnlySelectedItems() && this.gridSelectedItems.length > 0) {
            this.lastSelectedItem = this.gridSelectedItems[this.gridSelectedItems.length - 1];
            this.gridSelectedItems = this.gridSelectedItems.filter(selectedItem => selectedItem.$selected);
            if (this.gridSelectedItems.length === 0 && this.mySelection.length === 0) {
                this.showOnlySelectedItems.set(false);
            } else {
                this.applyRowStateFilterImmediate();
                const indexLastSelectedItem = this.gridView.findIndex(item => this.compareGridItemById(item, this.lastSelectedItem));
                if (indexLastSelectedItem === -1) {
                    this.gridComponent.focusCell(this.gridSelectedItems.length, 0);
                }
            }
        }
        if (visibleSelected === 0) {
            this.selectAllState = 'unchecked';
            this.shiftAnchorIndex = {
                index: 0,
                id: null
            };
        } else if (visibleSelected > 0 && visibleSelected < this.gridView.length) {
            this.selectAllState = 'indeterminate';
        } else {
            this.selectAllState = 'checked';
        }
    }
    getHeightRow() {
        return this.el.nativeElement.querySelector('kendo-grid-list .k-table-td').offsetHeight;
    }
    /**
     * Método que retorna informações sobre os itens atuais da tabela.
     *
     * Inclui:
     * - `items`: lista de itens atualmente carregados na tabela.
     * - `total`: total de itens informado pela API através da propriedade `total`; pode ser `undefined` caso a API não informe.
     * - `page`: número da página atual informado pela API (`itemsByApi.page`); se não existir, utiliza a propriedade local `page`.
     * - `pageSize`: quantidade de itens por página informada pela API (`itemsByApi.pageSize`); se não existir, utiliza a propriedade local `pageSize`.
     */
    getInfoProperties() {
        return {
            items: this.gridData,
            total: this.itemsByApi.total,
            page: this.itemsByApi.page || this.page,
            pageSize: this.itemsByApi.pageSize || this.pageSize
        };
    }
    /**
     * Atualiza um item do grid quando utilizado **t-itens**.
     *
     *
     * @param { number | { key: value } } item Índice ou o item que será atualizado.
     * @param { { key: value } } updatedItem Item que foi atualizado.
     * > Ao atualizar o item, a informação será alterada no grid.
     */
    updateItem(item, updatedItem) {
        const index = typeof item === 'number' ? item : this.gridData.findIndex(indexItem => indexItem === item);
        if (index === -1) {
            return;
        }
        const copyItems = [...this.gridData];
        copyItems.splice(index, 1, updatedItem);
        if (
            updatedItem['$selected'] &&
            ((this.rowStateFilter === 'removed' && !updatedItem['$removed']) || (this.rowStateFilter === 'active' && updatedItem['$removed']))
        ) {
            updatedItem['$selected'] = false;
        }
        this.items = [...copyItems];
        this.loadGridDataDebounced();
    }
    /**
     * calcula dinamicamente o tamanho da grid com base na porcentagem definida nas propriedades **t-height**,
     * **t-min-height** e **t-max-height**.
     *
     * Caso a grid esteja dentro de um componente ou elemento que altere sua visibilidade,
     * é necessário chamar esta função para garantir um cálculo correto. Exemplo:
     *
     * ```html
     * <po-tabs>
     *  <po-tab (p-click)="emitClickTab()" p-label="PO Tabs">
     *    <thf-grid #thfGrid> </thf-grid>
     *  </po-tab>
     * </po-tabs>
     * ```
     *
     * ```typescript
     * @ViewChild('thfGrid') thfGrid: ThfGridComponent;
     *
     * emitClickTab() {
     *  // Time-out necessário para garantir que o DOM foi atualizado antes do cálculo da altura.
     *  setTimeout(() => {
     *    this.thfGrid.calculateDynamicSize('height', true);
     *  }, 100);
     * }
     * ```
     *
     * @param property Define qual propriedade será calculada: `'height'`, `'minHeight'` ou `'maxHeight'`.
     * @param callRowHeight Define se o método `calculateRowHeight` deve ser chamado após o cálculo do tamanho.
     */
    calculateDynamicSize(property, callRowHeight = false) {
        if (typeof this[`dynamic${this.capitalize(property)}`] !== 'string') {
            return;
        }
        const percentage = this.calculateHeightPercentage(this[`dynamic${this.capitalize(property)}`]);
        const containerType = this.getContainerType();
        switch (containerType) {
            case 'po-page-slide-body':
                this.setGridSizeForSlide(property, percentage);
                break;
            case 'po-page-content':
                setTimeout(() => this.setGridSizeForPageContent(property, percentage), 50);
                break;
            default:
                this.setGridSizeForDocument(property, percentage);
        }
        if (callRowHeight) {
            this.calculateRowHeight();
        }
    }
    onPageChange() {
        if (this.autoSizeOnScroll) {
            this.autoFitDebounceSubject.next();
        }
    }
    getItemsEditMode(items) {
        const propertiesToRemove = getInternalGridColumns();
        const itensEdited = items
            .filter(item => !item.$removed)
            .map(item => {
                const cleanItem = {
                    ...item
                };
                propertiesToRemove.forEach(prop => delete cleanItem[prop]);
                return cleanItem;
            });
        if (this.gridRowActions.change) {
            this.gridRowActions.change(itensEdited);
        }
        this.totalAggregates = this.calculateTotalAggregates();
        this.thfGridEditService.setData(this.gridData);
    }
    loadGridData() {
        if (this.items) {
            this.nextStepDataLoading({
                items: this.items,
                hasNext: !this.showMoreDisabled
            });
            this.hasItems = true;
            this.mySelection = this.gridData.filter(item => item['$selected'] === true);
            this.onSelectedKeysChange();
            return;
        }
        if (this.serviceUrl) {
            this.getParams();
        }
    }
    loadGridDataDebounced() {
        if (this.loadGridDataDebouncedTimeout) {
            clearTimeout(this.loadGridDataDebouncedTimeout);
        }
        this.loadGridDataDebouncedTimeout = setTimeout(() => {
            this.loadGridData();
        }, 50);
    }
    applyLabelsToGridItems(items) {
        if (!items || !Array.isArray(items) || items.length === 0) {
            return items;
        }
        if (!this.gridRowActions && !this.editProperties) {
            return items;
        }
        if (!this.columns || !Array.isArray(this.columns)) {
            return items;
        }
        this.columns.forEach(column => {
            if (!column?.property) {
                return;
            }
            const { controlValueWithLabel, options, fieldLabel = 'label', fieldValue = 'value' } = column?.editProperties || {};
            if (controlValueWithLabel) {
                items.forEach(item => {
                    if (!item) {
                        return;
                    }
                    const value = item[column.property];
                    const label = this.getLabelFromOptions(value, options || [], fieldLabel, fieldValue) || this.getLabelFromValue(value) || value;
                    if (this.shouldApplyLabel(item, column.property, label)) {
                        item[getNamePropertyLabel(column.property)] = label;
                        item[column.property] = Array.isArray(value) ? value.map(v => v?.value || v) : value?.value || value;
                    }
                });
            }
        });
        return items;
    }
    getLabelFromOptions(value, options, fieldLabel, fieldValue) {
        if (!Array.isArray(options) || options.length === 0) {
            return undefined;
        }
        const optionsMap = new Map(
            options.filter(option => option && option[fieldValue] !== undefined && option[fieldLabel] !== undefined).map(x => [x[fieldValue], x[fieldLabel]])
        );
        if (Array.isArray(value)) {
            const labels = value.map(v => (typeof v !== 'object' && v !== null ? optionsMap.get(v) : undefined)).filter(Boolean);
            return labels.length > 0 ? labels.join(', ') : undefined;
        }
        return typeof value !== 'object' && value !== null ? optionsMap.get(value) : undefined;
    }
    getLabelFromValue(value) {
        if (!value) {
            return undefined;
        }
        if (Array.isArray(value) && value.every(v => v && v?.value !== undefined && v?.label !== undefined)) {
            return value.map(v => v.label).join(', ');
        }
        return value?.label;
    }
    shouldApplyLabel(item, property, label) {
        const hasValidLabel = label !== undefined && label !== null && label !== '';
        const labelNotApplied = !item[getNamePropertyLabel(property)];
        return hasValidLabel && labelNotApplied;
    }
    loadGridConfiguration() {
        if (this.onLoad) {
            if (typeof this.onLoad === 'string') {
                this.loadFromUrl(this.onLoad);
            } else if (typeof this.onLoad === 'function') {
                this.loadFromFunction(this.onLoad);
            }
        }
    }
    loadFromUrl(url) {
        this.thfGridService.loadFromUrl(url).subscribe(response => {
            this.applyGridConfiguration(response);
        });
    }
    loadFromFunction(loadFunction) {
        const response = loadFunction();
        this.applyGridConfiguration(response);
    }
    applyGridConfiguration(config) {
        this.columns = this.mergeConfigurations(this.columns, config.columns, 'property');
        this.actions = this.mergeConfigurations(this.actions, config.actions, 'label');
        this.customActions = this.mergeConfigurations(this.customActions, config.customActions, 'label');
        this.handleFixedColumns();
        this.initialColumns = JSON.parse(JSON.stringify(this.columns));
    }
    mergeConfigurations(existingConfig, newConfig, key) {
        if (!newConfig) return existingConfig;
        const mergedConfig = [...(existingConfig || [])];
        newConfig.forEach(newItem => {
            const index = mergedConfig.findIndex(existingItem => existingItem[key] === newItem[key]);
            if (index !== -1) {
                mergedConfig[index] = {
                    ...mergedConfig[index],
                    ...newItem
                };
            } else {
                mergedConfig.push(newItem);
            }
        });
        return mergedConfig;
    }
    updateSelection() {
        if (this.mySelection.length) {
            this.mySelection.forEach(row => {
                this.gridData.find(data => {
                    if (this.compareGridItemById(data, row)) {
                        data.$selected = true;
                    }
                });
            });
            if (this.gridRowActions) {
                this.applyRowStateFilterImmediate();
            } else {
                this.gridView = this.gridData;
            }
            this.mySelection = [...this.mySelection, ...this.gridData.filter(item => item['$selected'] === true)];
            const uniqueMap = new Map();
            this.mySelection.forEach(item => uniqueMap.set(item.$gridItemId, item));
            this.mySelection = Array.from(uniqueMap.values());
            this.selectedRows = JSON.parse(JSON.stringify(this.mySelection));
        }
    }
    formatUniqueKey(item, actionDelete) {
        if (actionDelete && this.paramDeleteApi && item[this.paramDeleteApi]) {
            return item[this.paramDeleteApi];
        }
        const keys = {
            keysNumber: [],
            keysBoolean: []
        };
        this.initialColumns
            .filter(column => column.key)
            .forEach((column, currentIndex) => {
                if (typeof column.key === 'number') {
                    keys.keysNumber[column.key - 1] = item[column.property];
                } else {
                    keys.keysBoolean[currentIndex] = item[column.property];
                }
            });
        const keysFiltered = [...keys.keysNumber, ...keys.keysBoolean].filter(item => item !== null && item !== undefined && item !== '');
        return keysFiltered.length ? keysFiltered.join('|') : item.id;
    }
    calculateTotalAggregates() {
        const aggregates = this.createAggregateDescriptors(this.aggregatesDescriptor);
        const gridData = this.gridRowActions ? this.gridView : this.gridData;
        if (!gridData || aggregates.length === 0) {
            return {};
        }
        return aggregateBy(gridData, aggregates);
    }
    createAggregateDescriptors(descriptors) {
        return descriptors.map(({ field, aggregate }) =>
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
            ({
                field,
                aggregate
            })
        );
    }
    checkBeforeEditValue(isValid) {
        if (isValid) {
            this.setAfterSaveInEditMode();
        } else if (!this.notificationDisplayed) {
            Object.keys(this.formGroupIntern.controls).forEach(property => {
                this.formGroupIntern.controls[property].markAsDirty();
                this.formGroupIntern.controls[property].updateValueAndValidity();
            });
            this.openDestructiveActionModal(ThfGridEditModeActionType.Replace);
            this.notificationDisplayed = true;
        }
    }
    checkBeforeIncludeValue(isValid) {
        if (isValid) {
            this.rowData.$currentRowActions = false;
            this.rowData.$included = true;
            this.gridOriginalData?.push(this.rowData);
            this.verifyFilterByColumn();
            this.getItemsEditMode(this.gridData);
        } else {
            this.returnOnBeforeFalse();
            this.onSelectedKeysChange();
        }
        this.rowDataInitial = {};
        this.closeRowActions();
    }
    checkBeforeRemoveValue(beforeMethod, undo) {
        if (isObservable(beforeMethod)) {
            this.activedObservableFunction = true;
            beforeMethod.pipe(finalize$1(() => (this.activedObservableFunction = false))).subscribe(value => {
                if (value) {
                    this.setAfterRemoveInEditMode(!undo);
                }
            });
        } else if (beforeMethod) {
            this.setAfterRemoveInEditMode(!undo);
        }
    }
    compareGridItemById(origin, destination) {
        return origin.$gridItemId === destination.$gridItemId;
    }
    checkDisabled(row, column) {
        return column.disabled ? column.disabled(row) : false;
    }
    /**
     * Método chamado quando a janela do navegador é redimensionada. Ele recalcula dinamicamente o tamanho da grid
     * para garantir que ela se ajuste corretamente ao novo tamanho da tela.
     */
    onWindowResize() {
        this.calculateDynamicSize('height');
        this.calculateDynamicSize('minHeight');
        this.calculateDynamicSize('maxHeight');
    }
    onEventResize() {
        this.resizeSubscription = fromEvent(window, 'resize')
            .pipe(
                auditTime(100),
                map$1(() => window.innerHeight),
                distinctUntilChanged()
            )
            .subscribe(() => this.onWindowResize());
    }
    /**
     * Converte um valor percentual de altura em um valor decimal correspondente.
     *
     * Recebe uma string no formato `"50%"`, valida se o formato está correto e
     * converte para um valor decimal (`0.5` para `"50%"`), que pode ser multiplicado pela altura total da tela.
     *
     * **Regras:**
     * - Se o valor não seguir o formato esperado (ex: `"abc%"` ou `"50"` sem `%`), retorna `1` como fallback.
     * - Se o valor for negativo (`"-20%"`), retorna `0.01` (equivalente a `1%`).
     * - Se o valor for maior que `100%`, retorna `1` (limite máximo).
     * - Valores válidos como `"50%"`, `"75%"` são convertidos corretamente para `0.5` e `0.75`, respectivamente.
     *
     * @param {string} valuePercentage - String representando um percentual (ex: `"50%"`).
     * @returns {number} - Valor decimal correspondente (`0.5` para `"50%"`).
     *
     * @private
     */
    calculateHeightPercentage(valuePercentage) {
        const newValue = valuePercentage.trim();
        const percentagePattern = /^-?\d+(\.\d{1,2})?%$/;
        if (!percentagePattern.test(newValue)) {
            return 1;
        }
        let numberValue = parseFloat(newValue.replace('%', ''));
        if (numberValue < 0) {
            numberValue = 1;
        } else if (numberValue > 100) {
            numberValue = 100;
        }
        return numberValue / 100;
    }
    //#region calculateRowHeight
    /**
     * Garante que a altura da linha interna (`rowHeightInternal`) seja calculada corretamente
     * para o Virtual Scroll, mesmo quando a GRID está inicialmente oculta (e.g., dentro de uma aba 'Tab').
     *
     * * **Problema:** Em elementos inicialmente ocultos (display: none), 'calculateRowHeight'
     * não consegue obter as dimensões reais, resultando em cálculos incorretos e falha
     * do Virtual Scroll.
     *
     * * **Solução:** Utiliza um `IntersectionObserver` para detectar o momento exato em que a
     * GRID se torna visível (intersecta a viewport) e só então dispara o cálculo de altura.
     */
    initIntersectionObserver() {
        const callback = (entries, observer) => {
            entries.forEach(entry => {
                const shouldCalculate = entry.isIntersecting && !this.rowHeightInternal;
                if (shouldCalculate) {
                    this.calculateRowHeight();
                }
                if (this.rowHeightInternal) {
                    observer.unobserve(entry.target);
                }
            });
        };
        this.intersectionObserver = new IntersectionObserver(callback);
        this.intersectionObserver.observe(this.thfGridContainer.nativeElement);
    }
    calculateRowHeight(heightDefault, forceChange = false) {
        if (this.virtualScroll && (this.height || this.minHeight || this.maxHeight) && (!this.rowHeight || forceChange)) {
            const tdElement = this.el.nativeElement.querySelector('kendo-grid-list .k-table-row .k-table-td');
            this.show = false;
            if (tdElement instanceof HTMLElement) {
                this.rowHeightInternal = heightDefault || tdElement.offsetHeight;
            }
            this.changeDetector.detectChanges();
        }
        setTimeout(() => {
            this.show = true;
            this.changeDetector.detectChanges();
            this.handleGridResizeOnChange();
        }, 100);
    }
    //#endregion
    cleanObject(obj) {
        const { $selected, $gridItemId, ...rest } = obj;
        return rest;
    }
    changeWidthVirtualColumns(newIndex, oldIndex) {
        const currentWidthOldIndex = this.getCurrentWidthValid(this.columns[oldIndex]);
        const currentWidthNewIndex = this.getCurrentWidthValid(this.columns[newIndex]);
        this.columns[oldIndex][currentWidthOldIndex] = this.columns[oldIndex][currentWidthOldIndex] + 0.1;
        this.columns[newIndex][currentWidthNewIndex] = this.columns[newIndex][currentWidthNewIndex] + 0.1;
    }
    deselectItem(compare) {
        this.gridData.forEach(item => {
            if (this.compareGridItemById(item, compare)) {
                item.$selected = false;
            }
        });
        this.removeItemSelected(compare);
        this.onSelectedKeysChange();
    }
    isInEditableField(event) {
        return !!event.target.closest('.k-table-td-columns-fields');
    }
    dispachEnterKeyEdit(event) {
        const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            bubbles: true,
            cancelable: true
        });
        if (this.isInEditableField(event)) {
            if (event.key === 'Backspace' || event.key === 'Delete') {
                this.clearFormControlValue = true;
            }
            event.target.dispatchEvent(enterEvent);
        }
    }
    dispachFocusedElement() {
        setTimeout(() => {
            if (this.isDuplicating || this.isInRowsActionsMode) {
                return;
            }
            const focusedElement = document.activeElement;
            if (focusedElement && !this.shouldSkipDispatchEnterForFocusedElement(focusedElement)) {
                this.dispachEnterKeyEdit({
                    key: '',
                    target: focusedElement
                });
            }
        }, 10);
    }
    shouldSkipDispatchEnterForFocusedElement(element) {
        return !!element?.closest?.(
            'po-combo, .po-combo-container, po-select, .po-select, po-multiselect, po-datepicker, thf-lookup, .thf-lookup-container-intern'
        );
    }
    doesItemExistInSelection(compare) {
        return this.mySelection.some(item => this.compareGridItemById(item, compare));
    }
    editRowInGrid({ dataItem, column }) {
        let mode = 'include';
        if (this.initIncludeMode && this.isInIncludeMode) {
            if (this.uuidIncluded) {
                dataItem.$uuidThfIncluded = this.uuidIncluded;
                dataItem.$gridItemId = this.uuidIncluded;
                this.uuidIncluded = undefined;
            }
        } else if (this.isActionAllowedEditMode(ThfGridEditModeActionType.Replace)) {
            mode = 'edit';
        }
        const formGroup = this.gridRowActions?.actionEdit(dataItem, mode);
        this.processRowEditForm(formGroup, {
            dataItem,
            column
        });
    }
    editRowInGridProperties({ dataItem, column }, formGroup) {
        const initialData = {
            ...dataItem,
            ...formGroup.value
        };
        const needsUpdate = false;
        this.columns.forEach(col => {
            if (!col.editProperties?.componentEditable && formGroup.controls[col.property]) {
                col.editProperties = {
                    ...col.editProperties,
                    componentEditable: 'input'
                };
            }
            setValueWithLabel(col, formGroup, initialData);
            const properties = {
                needsUpdate,
                column: col
            };
            this.applyDynamicStates(formGroup, properties, initialData);
        });
        requestAnimationFrame(() => {
            this.setInitialEditProperties(formGroup, {
                dataItem,
                column
            });
        });
        if (this.clearFormControlValue) {
            const currentColumn = this.columns.find(col => col.property === column.field);
            const currentColumnGridEdit = this.thfGridEdit.find(
                component =>
                    currentColumn.property === component.column.property && component.el.nativeElement.querySelector("[data-inactive-component='false']")
            );
            if (currentColumnGridEdit) {
                this.formGroupIntern.controls[column.field]?.setValue(null);
                this.formGroupIntern.controls[column.field]?.markAsDirty();
            }
            this.clearFormControlValue = false;
        }
    }
    emitEventOrder() {
        const eventOrder = [...this.columns].map(obj => obj['property']);
        this.orderColumn.emit(eventOrder);
    }
    executeRowActions() {
        if (!this.activedObservableFunction) {
            this.isInIncludeMode ? this.executeRowActionsInclude() : this.executeRowActionsEdit();
        }
    }
    executeRowActionsEdit() {
        if (this.gridRowActions.beforeSave) {
            const beforeSave = this.gridRowActions?.beforeSave(this.rowData, this.rowDataInitial);
            if (isObservable(beforeSave)) {
                this.activedObservableFunction = true;
                beforeSave.pipe(finalize$1(() => (this.activedObservableFunction = false))).subscribe(value => {
                    this.checkBeforeEditValue(value);
                });
            } else {
                this.checkBeforeEditValue(beforeSave);
            }
            if (this.changedItems.observed) {
                this.getChangedItems();
            }
        } else {
            this.setAfterSaveInEditMode();
        }
    }
    executeRowActionsInclude() {
        if (this.gridRowActions.beforeInsert) {
            const beforeInsert = this.gridRowActions?.beforeInsert(this.rowData);
            if (isObservable(beforeInsert)) {
                this.activedObservableFunction = true;
                beforeInsert.pipe(finalize$1(() => (this.activedObservableFunction = false))).subscribe(value => {
                    this.checkBeforeIncludeValue(value);
                });
            } else {
                this.checkBeforeIncludeValue(beforeInsert);
            }
            if (this.changedItems.observed) {
                this.getChangedItems();
            }
        } else {
            this.checkBeforeIncludeValue(true);
        }
    }
    executeRowActionsRemove() {
        if (this.rowData?.$currentRowActions || this.activedObservableFunction) {
            return;
        }
        const undo = this.rowData?.$removed || false;
        if (!undo) {
            this.openDestructiveActionModal(ThfGridEditModeActionType.Remove);
            return;
        }
        if (undo) {
            if (this.gridRowActions.beforeUndoRemove) {
                const beforeUndoRemove = this.gridRowActions?.beforeUndoRemove(this.rowData);
                this.checkBeforeRemoveValue(beforeUndoRemove, true);
            } else {
                this.setAfterRemoveInEditMode(false);
            }
        }
    }
    onDestructiveRemoveModalConfirm() {
        if (this.gridRowActions.beforeRemove) {
            const beforeRemove = this.gridRowActions?.beforeRemove(this.rowData);
            this.checkBeforeRemoveValue(beforeRemove, false);
            if (this.changedItems.observed) {
                this.getChangedItems();
            }
        } else {
            this.setAfterRemoveInEditMode(true);
        }
        this.modalDestructiveAction.close();
    }
    getCurrentWidthValid(column) {
        if (column.internalWidth) {
            return 'internalWidth';
        } else if (column.widthResizable) {
            return 'widthResizable';
        } else {
            return 'width';
        }
    }
    getDefaultColumns(items) {
        if (this.columns?.length < 1 && items.items.length > 0) {
            let index = 0;
            Object.keys(this.gridData[0])
                .filter(key => typeof this.gridData[0][key] !== 'object')
                .forEach(columnName => {
                    if (!getInternalGridColumns().includes(columnName)) {
                        this.columns[index] = {
                            property: columnName,
                            label: columnName
                        };
                        index++;
                    }
                });
            this.handleFixedColumns();
        }
    }
    getFilteredItems(queryParams) {
        const filteredParams = this.getFilteredParams(queryParams);
        return this.thfGridService.listItems(this.service, filteredParams);
    }
    getFilteredParams(queryParams) {
        const { page, pageSize, sortStore } = this;
        const filteredParams = {};
        const order = this.getOrderParam(sortStore);
        const params = {
            page,
            pageSize,
            order,
            ...queryParams
        };
        for (const key in params) {
            if (Object.prototype.hasOwnProperty.call(params, key) && params[key] !== undefined) {
                filteredParams[key] = params[key];
            }
        }
        return filteredParams;
    }
    getFilterPaging() {
        if (this.pageable) {
            return {
                page: this.page,
                pageSize: this.pageSize,
                ...this.filter
            };
        }
        return {};
    }
    getFocusedIndex() {
        if (this.sort[0].dir === 'asc' && this.sort[0].field) {
            return 1;
        }
        return this.gridRowActions ? this.gridView.length : this.gridData.length;
    }
    getListGroup() {
        const list = [];
        this.group.map(value => list.push(value.field));
        return list;
    }
    getOrderParam(
        sort = {
            type: undefined
        }
    ) {
        const { column, type } = sort;
        if (!column) {
            return undefined;
        }
        if (type === PoTableColumnSortType.Descending) {
            return `-${column.property}`;
        }
        return `${column.property}`;
    }
    getParams() {
        let fieldsFilters = {};
        this.isLoading = this.loadingShowMore = true;
        const { serviceApi } = this.activatedRoute.snapshot.data;
        this.service = serviceApi || this.serviceUrl;
        fieldsFilters = this.filter = getInitialValuesFromFilter(this.fields);
        if (this.pageable) {
            fieldsFilters = this.getFilterPaging();
        }
        this.thfGridService
            .listItems(this.service, fieldsFilters)
            .pipe(
                finalize$1(() => {
                    this.isLoading = this.loadingShowMore = false;
                    this.itemsAfterGet.emit(this.getInfoProperties());
                })
            )
            .subscribe({
                next: items => {
                    this.nextStepDataLoading(items);
                },
                error: error => {
                    this.filterItemError.emit(error);
                }
            });
    }
    isActionAllowedEditMode(action) {
        return !this.gridRowActions?.noPermission?.includes(action);
    }
    isDuplicateAllowedEditMode() {
        return this.isActionAllowedEditMode(ThfGridEditModeActionType.Add) && this.isActionAllowedEditMode(ThfGridEditModeActionType.Duplicate);
    }
    nextStepDataLoading(items) {
        this.gridData = this.applyLabelsToGridItems(items['items']);
        this.setGridItemId(this.gridData);
        if (this.gridRowActions) {
            this.applyRowStateFilterDebounced();
        } else {
            this.gridView = this.gridData;
        }
        this.gridOriginalData = null;
        this.setPaginationData(items);
        this.showMoreDisabled = !items.hasNext;
        this.thfGridEditService.setData(this.gridData);
        this.getDefaultColumns(items);
        this.columns.forEach(column => {
            const columnCopy = JSON.parse(JSON.stringify(column));
            this.defaultColumns.push(columnCopy);
            this.defaultFrozenColumns.push(columnCopy);
        });
        if (this.fields.length < 1) {
            this.setFilters();
        }
        this.calculateRowHeight();
        this.onFilterInputHandle(false);
        this.onFilterColumnProperties(items);
        this.totalAggregates = this.calculateTotalAggregates();
    }
    getVisibleOrFixedColumns(columns, isVisible = true) {
        let visibleOrFixedColumns = [];
        columns.forEach(column => {
            if ((this.isVisibleColumn(column) && isVisible) || column.fixed) {
                visibleOrFixedColumns = [...visibleOrFixedColumns, column.property];
            }
        });
        return visibleOrFixedColumns;
    }
    handleFunctionCompare(compare, selectionMode = false) {
        if (selectionMode) {
            this.gridData.forEach(item => {
                const isSelected = compare(item);
                item.$selected = isSelected;
                if (isSelected && !this.doesItemExistInSelection(item)) {
                    this.mySelection.push(item);
                } else {
                    this.handleValueCompare(item, isSelected);
                }
            });
        } else {
            this.mySelection = this.mySelection.filter(item => {
                const isSelected = compare(item);
                item.$selected = isSelected;
                return isSelected;
            });
        }
    }
    handleGridResizeOnChange() {
        this.applyFixedColumnsWidthFirstTime();
        if (this.resizable) {
            const columnsWidthResizable = this.columns.filter(col => col.widthResizable);
            columnsWidthResizable.forEach(col => (col.widthResizable = col.widthResizable + 0.1));
        }
    }
    handleValueCompare(compare, selectValue) {
        const itemExists = this.doesItemExistInSelection(compare);
        if (!itemExists && selectValue) {
            this.mySelection.push(compare);
        } else if (itemExists && !selectValue) {
            this.deselectItem(compare);
        }
    }
    hasDiffInFormGroup() {
        let hasDiff = false;
        if (this.formGroupIntern?.valid && Object.keys(this.rowDataInitial).length > 0) {
            Object.keys(this.formGroupIntern.controls).forEach(controlName => {
                const formValueIntern = this.formGroupIntern.get(controlName).value;
                let formValue;
                const initialValue = this.rowDataInitial[controlName];
                if (Array.isArray(formValueIntern)) {
                    formValue = formValueIntern.map(x => x?.value || x);
                } else {
                    formValue = formValueIntern && typeof formValueIntern === 'object' ? formValueIntern?.value : formValueIntern;
                }
                if (Object.hasOwn(this.rowDataInitial, controlName) || this.isInIncludeMode) {
                    if (Array.isArray(formValue) && Array.isArray(initialValue)) {
                        if (formValue.length !== initialValue.length || !formValue.every((item, index) => item === initialValue[index])) {
                            hasDiff = true;
                        }
                    } else if (formValue !== initialValue) {
                        hasDiff = true;
                    }
                }
            });
        }
        return hasDiff;
    }
    /**
     * @private
     * Determina se o elemento alvo faz parte de um componente de controle de formulário complexo
     * que requer tratamento especial (Lookup, Multiselect, Datepicker).
     *
     * Esta verificação é necessária porque estes componentes possuem comportamentos personalizados
     * de dropdown que podem entrar em conflito com outras interações na interface.
     *
     * Ignora quando o alvo é um botão (ex.: botão do datepicker) e o calendário não está aberto
     *
     * @param {HTMLElement} target - Elemento DOM a ser verificado
     * @returns {boolean} Retorna `true` se o elemento pertence a um componente Lookup, Multiselect ou Datepicker
     */
    isDropdownFormControl(target) {
        if (target?.closest('thf-lookup.components-form, po-multiselect.components-form, div.thf-lookup-container-intern')) {
            return true;
        }
        const isDatepicker = target.closest('po-datepicker.components-form');
        const isTimepicker = target.closest('po-timepicker.components-form');
        const isPoHelper = target.closest('.po-field-container-content')?.querySelector('po-helper');
        if (isDatepicker || isTimepicker || isPoHelper) {
            return (
                target.tagName === 'INPUT' ||
                (target.tagName === 'BUTTON' && target.getAttribute('aria-expanded') === 'true') ||
                (isTimepicker && target.tagName === 'PO-CLEAN')
            );
        }
        return false;
    }
    isValidToInclude() {
        let hasFormValid = true;
        if (this.formGroupIntern) {
            Object.keys(this.formGroupIntern.controls).forEach(property => {
                if (!this.formGroupIntern.controls[property].valid) {
                    hasFormValid = false;
                }
            });
        }
        if (hasFormValid) {
            this.notificationDisplayed = false;
            return true;
        }
        if (!this.notificationDisplayed) {
            Object.keys(this.formGroupIntern.controls).forEach(property => {
                this.formGroupIntern.controls[property].markAsDirty();
                this.formGroupIntern.controls[property].updateValueAndValidity();
            });
            this.openDestructiveActionModal(ThfGridEditModeActionType.Add);
            this.notificationDisplayed = true;
        }
        return false;
    }
    openDestructiveActionModal(type) {
        this.destructiveModalActionType = type;
        this.destructiveModalCancel.label = this.literals.gridRowActionsConfirmAddCancelButton;
        if (type === ThfGridEditModeActionType.Add) {
            this.destructiveModalConfirm.action = this.onDialogConfirm.bind(this);
            this.destructiveModalConfirm.label = this.literals.gridRowActionsConfirmAddConfirmButton;
            this.destructiveModalOnClose = this.onDialogCancelOrClose.bind(this, 'include');
            delete this.destructiveModalConfirm.icon;
        } else if (type === ThfGridEditModeActionType.Replace) {
            this.destructiveModalConfirm.action = this.onDestructiveEditModalConfirm.bind(this);
            this.destructiveModalConfirm.label = this.literals.gridRowActionsConfirmAddConfirmButton;
            this.destructiveModalOnClose = this.onDialogCancelOrClose.bind(this, 'edit');
            delete this.destructiveModalConfirm.icon;
        } else if (type === ThfGridEditModeActionType.Remove) {
            this.destructiveModalConfirm.action = this.onDestructiveRemoveModalConfirm.bind(this);
            this.destructiveModalConfirm.icon = 'ICON_DELETE';
            this.destructiveModalConfirm.label = this.literals.gridRowActionsConfirmRemoveConfirmButton;
            this.destructiveModalOnClose = () => {};
        }
        this.suppressValidationOnDestructiveModalDismiss = false;
        this.modalDestructiveAction.open();
    }
    isValidFormControl() {
        if (this.isInRowsActionsMode && !this.formGroupIntern.valid) {
            const fieldsWithErrors = Object.entries(this.formGroupIntern.controls)
                .filter(([_, control]) => control.errors)
                .map(([field]) => field);
            const orderedEditables = this.thfGridEdit?.toArray() ?? [];
            const firstErrorEditable = orderedEditables.find(edit => fieldsWithErrors.includes(edit.column?.property));
            if (firstErrorEditable) {
                requestAnimationFrame(() => {
                    firstErrorEditable.setFocus?.();
                });
            }
            return false;
        }
        return true;
    }
    // Realiza uma validação rigorosa dos campos obrigatórios, considerando espaços em branco e arrays vazios.
    checkValidityStrict() {
        if (!this.isInRowsActionsMode || !this.formGroupIntern) {
            return {
                isValid: true,
                invalidField: null
            };
        }
        let invalidField = null;
        for (const column of this.columns) {
            if (this.isColumnRequired(column.property)) {
                const control = this.formGroupIntern.get(column.property);
                const value = control?.value;
                const isStringEmpty = typeof value === 'string' && value.trim() === '';
                const isNullOrUndefined = value === null || value === undefined;
                const isArrayEmpty = Array.isArray(value) && value.length === 0;
                if (isStringEmpty || isNullOrUndefined || isArrayEmpty) {
                    control?.setErrors({
                        required: true
                    });
                    control?.markAsTouched();
                    invalidField = column.property;
                    return {
                        isValid: false,
                        invalidField
                    };
                }
            }
        }
        if (this.formGroupIntern.invalid) {
            return {
                isValid: false,
                invalidField: null
            };
        }
        return {
            isValid: true,
            invalidField: null
        };
    }
    /**
     * Encontra o índice da coluna baseado na propriedade.
     */
    findColumnIndex(propertyName) {
        if (!this.columns || !Array.isArray(this.columns)) {
            return -1;
        }
        return this.columns.findIndex(col => col.property === propertyName);
    }
    isSingleItemView() {
        return this.showOnlySelectedItems?.() && this.gridSelectedItems?.length === 1;
    }
    updateSingleItemToaster() {
        if (!this.isSingleItemView()) return;
        const { isValid } = this.checkValidityStrict();
        this.showValidationErrorToaster = !isValid;
        this.changeDetector.detectChanges();
    }
    /**
     * Valida os valores manualmente para garantir que nada passe pelo delay do Angular.
     * @param enforceFocus Se true, força o scroll e foco de volta para o erro.
     * Se false, apenas valida e retorna o status.
     */
    validateCurrentForm(enforceFocus = true) {
        const { isValid, invalidField } = this.checkValidityStrict();
        if (isValid) {
            this.showValidationErrorToaster = false;
            return true;
        }
        if (!this.showValidationErrorToaster) {
            this.showValidationErrorToaster = true;
        }
        this.changeDetector.detectChanges();
        if (enforceFocus && invalidField) {
            try {
                const absoluteIndex = this.gridData.findIndex(item => this.compareGridItemById(item, this.rowData));
                if (absoluteIndex !== -1 && this.gridComponent) {
                    this.gridComponent.scrollTo({
                        row: absoluteIndex
                    });
                    setTimeout(() => {
                        const realColIndex = this.findColumnIndex(invalidField);
                        const targetCol = Math.max(realColIndex, 0);
                        this.gridComponent.focusCell(absoluteIndex, targetCol);
                        setTimeout(() => {
                            const selector = `
                .k-grid-edit-row [formcontrolname="${invalidField}"] input:not([type="hidden"]),
                .k-grid-edit-row [formcontrolname="${invalidField}"] select,
                .k-grid-edit-row [formcontrolname="${invalidField}"] textarea,
                .k-grid-edit-row [formcontrolname="${invalidField}"] [tabindex]:not([tabindex="-1"])
              `;
                            let targetElement = this.el.nativeElement.querySelector(selector);
                            if (!targetElement) {
                                const containerSelector = `.k-grid-edit-row [formcontrolname="${invalidField}"]`;
                                targetElement = this.el.nativeElement.querySelector(containerSelector);
                            }
                            if (targetElement) {
                                targetElement.focus();
                                targetElement.click();
                            } else {
                                const targetEditComp = this.thfGridEdit?.find(c => c.column?.property === invalidField);
                                targetEditComp?.setFocus?.();
                            }
                        }, 100);
                    }, 100);
                }
            } catch (e) {
                // Falha ao tentar focar o campo inválido, ignora
            }
        }
        this.changeDetector.markForCheck();
        return false;
    }
    /**
     * Executa a lógica de cancelamento/descarte (Idêntica à tecla ESC).
     * Abre o modal de confirmação se houver alterações ou erros, ou apenas fecha se estiver limpo.
     */
    triggerCancelRow() {
        if (this.isInIncludeMode) {
            this.openDestructiveActionModal(ThfGridEditModeActionType.Add);
            return;
        }
        if (this.hasDiffInFormGroup() || this.formGroupIntern?.invalid) {
            this.openDestructiveActionModal(ThfGridEditModeActionType.Replace);
            return;
        } else {
            this.rowDataInitial = {};
            this.rowData.$currentRowActions = false;
        }
        this.closeRowActions();
    }
    isVisibleColumn(column) {
        return column.visible !== false && column.type !== 'detail';
    }
    manageEditingOnCellClick(args) {
        if (this.cellArgs?.rowIndex !== args?.rowIndex) {
            this.manageRowEditState();
        }
    }
    manageRowEditState() {
        if (this.hasDiffInFormGroup() || (this.formGroupIntern.valid && this.isInIncludeMode)) {
            this.executeRowActions();
        }
    }
    matchesSelector(el, selector) {
        return (el.matches || el.msMatchesSelector)?.call(el, selector);
    }
    /**
     * Lista de seletores CSS que representam elementos internos da grid
     * onde cliques não devem fechar o modo de edição
     */
    get protectedElementsSelectors() {
        return [
            `#${this.kendoGridId} tbody *`,
            'thf-lookup-modal *',
            'po-lookup-modal *',
            '.po-toaster.po-toaster-warning *',
            '.thf-lookup-edit-row-disclaimer *',
            '.multiselect-edit-row-disclaimer *',
            'div.po-calendar-day, div.po-calendar-day span',
            'div.po-calendar-year, div.po-calendar-year span',
            '.po-switch *, .po-switch-icon *',
            'po-icon.po-field-icon',
            'po-icon.thf-field-icon',
            '.po-listbox-check',
            '.po-combo-container',
            '.po-calendar-footer-today-button',
            '.po-calendar-header-title span',
            'po-icon.thf-field-icon.po-clickable',
            '.po-listbox-check *',
            '.po-combo-container *',
            'po-calendar *',
            '.po-item-list__selected *',
            'po-item-list *',
            '.po-popover *',
            '.po-toaster.po-toaster-error *',
            '#selectAllCheckboxId',
            'po-timer *'
        ];
    }
    /**
     * Método que trata o evento de clique fora da grid, permitindo salvar ou cancelar a edição
     * dependendo do estado do formulário e se está em modo de edição.
     */
    onClickOutGrid(e) {
        if (!this.modalDestructiveAction?.isHidden || this.suppressValidationOnDestructiveModalDismiss) {
            return;
        }
        const targetElement = e.target;
        if (this.isProtectedElement(targetElement)) {
            return;
        }
        if (this.shouldCancelRowAction(e)) {
            return;
        }
        if (this.isInEditingMode) {
            return;
        }
        const isFormValid = this.checkFormValidity();
        if (isFormValid) {
            this.handleValidFormClickOut();
        } else {
            this.handleInvalidFormClickOut(isFormValid);
        }
    }
    isProtectedElement(target) {
        return this.matchesSelector(target, this.protectedElementsSelectors.join(', '));
    }
    shouldCancelRowAction(e) {
        if (this.isInRowsActionsMode && this.formGroupIntern) {
            const { isValid } = this.checkValidityStrict();
            if (!isValid) {
                e.preventDefault();
                e.stopPropagation();
                this.triggerCancelRow();
                return true;
            }
        }
        return false;
    }
    checkFormValidity() {
        return (this.hasDiffInFormGroup() && !this.formGroupIntern?.invalid) || !!this.formGroupIntern?.valid;
    }
    handleValidFormClickOut() {
        if (this.hasDiffInFormGroup()) {
            this.callValidateField(ThfGridActionEdit.ViaClickOut);
            this.thfGridEditService.saveGridRowsActions(this.formGroupIntern.value, this.rowData);
        } else {
            this.resetRowDataState();
        }
        this.notificationDisplayed = false;
        this.manageRowEditState();
    }
    resetRowDataState() {
        this.rowDataInitial = {};
        this.rowData.$currentRowActions = false;
        this.rowActionsIndex = undefined;
        this.showOnlyRequiredFields.set(false);
    }
    handleInvalidFormClickOut(isFormValid) {
        if (this.isInIncludeMode) {
            this.isValidToInclude();
        } else if (this.isInRowsActionsMode) {
            this.checkBeforeEditValue(isFormValid);
        }
    }
    // Gerencia o clique na célula para habilitar a edição
    onCellClickEnableEdit(args) {
        if (this.shouldBlockRowChange(args)) {
            return;
        }
        if (args.column?.field === 'actions') {
            this.onCellClickTypeActions(args);
            return;
        }
        if (this.poPopupComponent?.showPopup) {
            this.detachPopupTabNavigation();
            this.poPopupComponent.close();
        }
        const isSameCell = this.cellArgs?.rowIndex === args?.rowIndex;
        if (isSameCell && this.isInRowsActionsMode) {
            this.handleSameRowClick(args);
        } else if (this.isInRowsActionsMode && args.dataItem === this.rowData) {
            this.handleSameRowClick(args);
        } else {
            this.handleRowSwitchOrNewEdit(args);
        }
    }
    shouldBlockRowChange(args) {
        const isDifferentRow = this.cellArgs?.rowIndex !== args.rowIndex;
        return this.isInRowsActionsMode && isDifferentRow && !this.validateCurrentForm(true);
    }
    /**
     * Gerencia cliques repetidos na mesma célula (Foco e Limpeza)
     */
    handleSameRowClick(args) {
        const target = args.originalEvent?.target;
        const currentTd = target.closest('.k-table-td-columns-fields');
        if (currentTd) {
            const editableComponent = currentTd.querySelector("thf-grid-edit[enabled-thf-grid-edit='true']");
            const editElement = editableComponent ? this.thfGridEdit?.find(fieldEdit => fieldEdit.column?.property === args.column.field) : undefined;
            const clickedOnHelper = this.isPoHelperTarget(target);
            if (editElement && !clickedOnHelper) {
                this.applyFocusAndClearValue(editElement, args.column.field);
            }
            this.cellArgs = args;
        }
    }
    applyFocusAndClearValue(editElement, fieldName) {
        setTimeout(() => {
            editElement.setFocus();
            if (this.clearFormControlValue && this.formGroupIntern.controls[fieldName]) {
                this.formGroupIntern.controls[fieldName].setValue(null);
                this.formGroupIntern.controls[fieldName].markAsDirty();
                this.clearFormControlValue = false;
            }
        }, 0);
    }
    /**
     * Gerencia a troca de linha ou início de uma nova edição
     */
    handleRowSwitchOrNewEdit(args) {
        if (this.isInRowsActionsMode && !this.validateCurrentForm()) {
            return;
        }
        if (this.isInRowsActionsMode) {
            this.savePreviousRowState(args);
        }
        if (this.returnCellClickEdit(args)) {
            return;
        }
        this.cellArgs = args;
        if (args.column?.field !== 'actions') {
            this.editRowInGrid(args);
        }
    }
    savePreviousRowState(args) {
        if (this.hasDiffInFormGroup()) {
            this.callValidateField(ThfGridActionEdit.ViaCellClick, args);
            this.thfGridEditService.saveGridRowsActions(this.formGroupIntern.value, this.rowData);
            this.manageEditingOnCellClick(args);
        } else {
            this.rowDataInitial = {};
            this.rowData.$currentRowActions = false;
        }
    }
    onCellClickTypeActions(args) {
        if (args.originalEvent?.key === 'Enter') {
            if (this.visibleActions.length === 1 && this.visibleActions[0].visible !== false) {
                this.executeGridAction(args.dataItem, this.visibleActions[0]);
                args.originalEvent.stopPropagation();
            } else if (this.visibleActions.length > 1) {
                const target = args.originalEvent.target;
                const spanActions = target?.closest('.icon-actions') ?? target?.querySelector('.icon-actions');
                this.togglePopup(args.dataItem, spanActions);
                setTimeout(() => this.focusFirstPopupAction(), 0);
                args.originalEvent.stopPropagation();
            }
        }
    }
    setupPopupTabNavigation() {
        this.detachPopupTabNavigation();
        if (!this.poPopupComponent?.showPopup) {
            return;
        }
        this.popupTabNavigationCleanup = this.renderer.listen('document', 'keydown', event => {
            this.onPopupActionsKeydown(event);
        });
    }
    detachPopupTabNavigation() {
        if (this.popupTabNavigationCleanup) {
            this.popupTabNavigationCleanup();
            this.popupTabNavigationCleanup = null;
        }
    }
    onPopupActionsKeydown(event) {
        if (!this.poPopupComponent?.showPopup) {
            this.detachPopupTabNavigation();
            if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                this.restoreFocusToGridCell();
            }
            return;
        }
        const popupElement = this.getActionsPopupElement();
        if (!popupElement) {
            return;
        }
        const activeElement = document.activeElement;
        const isOnTrigger = this.isActionsTriggerElement(activeElement);
        const isInPopup = popupElement.contains(activeElement);
        if (!isOnTrigger && !isInPopup) {
            return;
        }
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            this.closeActionsPopupAndRestoreFocus();
            return;
        }
        if (event.key !== 'Tab' || !isInPopup) {
            return;
        }
        const actionItems = this.getFocusablePopupActionItems(popupElement);
        const currentIndex = actionItems.findIndex(item => item === activeElement || item.contains(activeElement) || item === activeElement.closest('li'));
        if (currentIndex === -1) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        const nextItem = actionItems[event.shiftKey ? currentIndex - 1 : currentIndex + 1];
        if (nextItem) {
            nextItem.setAttribute('tabindex', '0');
            nextItem.focus();
            return;
        }
        if (event.shiftKey) {
            this.closeActionsPopupAndFocusPreviousCell();
            return;
        }
        this.closeActionsPopupAndRestoreFocus();
    }
    getFocusablePopupActionItems(popupElement) {
        return Array.from(popupElement.querySelectorAll('li')).filter(
            item =>
                !item.classList.contains('po-popup-item-disabled') && !item.closest('.po-popup-item-disabled') && item.getAttribute('aria-disabled') !== 'true'
        );
    }
    getActionsPopupElement() {
        return this.el?.nativeElement?.querySelector('.po-popup') || document.querySelector('.po-popup');
    }
    focusFirstPopupAction() {
        const popupElement = this.getActionsPopupElement();
        const firstItem = popupElement && this.getFocusablePopupActionItems(popupElement)[0];
        if (firstItem) {
            firstItem.setAttribute('tabindex', '0');
            firstItem.focus();
        }
    }
    closeActionsPopupAndRestoreFocus() {
        this.detachPopupTabNavigation();
        this.poPopupComponent.close();
        this.restoreFocusToGridCell();
    }
    restoreFocusToGridCell() {
        setTimeout(() => {
            const triggerElement = this.popupTarget;
            const parentTd = triggerElement?.closest('td.k-table-td, td.k-table-td-action');
            if (parentTd) {
                parentTd.focus();
            } else if (this.gridComponent?.activeCell) {
                const { rowIndex, colIndex } = this.gridComponent.activeCell;
                this.gridComponent.focusCell(rowIndex, colIndex);
            }
        }, 0);
    }
    closeActionsPopupAndFocusPreviousCell() {
        this.detachPopupTabNavigation();
        this.poPopupComponent.close();
        setTimeout(() => {
            this.gridComponent?.focusPrevCell?.();
        }, 0);
    }
    closeActionsPopup() {
        if (!this.poPopupComponent?.showPopup) {
            return;
        }
        this.detachPopupTabNavigation();
        this.poPopupComponent.close();
    }
    isActionsTriggerElement(element) {
        return this.popupTarget instanceof HTMLElement && !!element && this.popupTarget.contains(element);
    }
    onKeydownCommandsKeyEdit(event) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        if (this.isDropdownFormControl(event.target) || this.isPoHelperTarget(event.target)) {
            return;
        }
        if (event.key === 'Escape') {
            if (this.isInIncludeMode) {
                this.openDestructiveActionModal(ThfGridEditModeActionType.Add);
                return;
            }
            if (this.hasDiffInFormGroup() || this.formGroupIntern?.invalid) {
                this.openDestructiveActionModal(ThfGridEditModeActionType.Replace);
                return;
            } else {
                this.rowDataInitial = {};
                this.rowData.$currentRowActions = false;
            }
            this.closeRowActions();
        } else if (event.key === 'Enter' && this.formGroupIntern.valid) {
            const currentColumn = this.columns.find(column => column.property === this.cellArgs?.column.field);
            const componentEditable = currentColumn?.editProperties?.componentEditable;
            // permite salvar pressionar ENTER nos componentes decimal/input/number
            if (componentEditable === 'decimal' || componentEditable === 'input' || componentEditable === 'number') {
                // se houver mudança no formulário, salva e fecha a linha;
                // se não houver mudança e o permanece formulário for válido, fecha a linha;
                if (this.hasDiffInFormGroup() || this.isInIncludeMode) {
                    this.callValidateField(ThfGridActionEdit.ViaEnter);
                    this.thfGridEditService.saveGridRowsActions(this.formGroupIntern?.value, this.rowData);
                    //verifica novamente, por que o validateField pode ter retornado falso e colocado o valor de volta
                    if (this.hasDiffInFormGroup() || this.isInIncludeMode) {
                        this.executeRowActions();
                    }
                    return;
                } else {
                    this.rowData.$currentRowActions = false;
                    this.closeRowActions();
                    this.rowDataInitial = {};
                    return;
                }
            }
        }
    }
    onKeydownCtrlDelKeyEdit(event) {
        if (
            this.isActionAllowedEditMode(ThfGridEditModeActionType.Remove) &&
            !this.isInRowsActionsMode &&
            !this.activedObservableFunction &&
            event.ctrlKey &&
            event.key === 'Delete' &&
            event.target.nodeName === 'TD'
        ) {
            this.rowData = this.gridComponent.activeCell?.dataItem;
            this.executeRowActionsRemove();
            return true;
        }
        return false;
    }
    onKeydownCtrlInsertKeyEdit(event) {
        if (
            this.isDuplicateAllowedEditMode() &&
            !this.isDuplicating &&
            this.rowStateFilter === 'active' &&
            !this.isInRowsActionsMode &&
            !this.isInIncludeMode &&
            !this.activedObservableFunction &&
            event.ctrlKey &&
            event.key === 'Insert' &&
            event.target.nodeName === 'TD'
        ) {
            event.preventDefault();
            this.rowData = this.gridComponent.activeCell?.dataItem;
            this.duplicateChoice(this.rowData);
            return true;
        }
        return false;
    }
    onKeydownEditMode(event) {
        if (
            (!event.isTrusted && !this.isTestEnvironment) ||
            (event.target?.['className'] === 'po-button' &&
                !event.target.parentElement?.classList.contains('po-datepicker-button') &&
                !event.target.parentElement?.classList.contains('po-timepicker-button'))
        ) {
            return;
        }
        const isLetter = /^[a-zA-Z]$/.test(event.key);
        const isNumber = /^\d$/.test(event.key);
        const rowIndex = this.gridComponent.activeCell?.rowIndex;
        const isTriggerKey = isLetter || isNumber || event.key === 'Backspace' || event.key === 'Delete';
        const targetElement = event.target;
        const isTypingElement = targetElement?.tagName === 'INPUT' || targetElement?.tagName === 'TEXTAREA' || targetElement?.isContentEditable;
        if (isTypingElement && event.key !== 'Tab' && event.key !== 'Escape' && event.key !== 'Enter') {
            return;
        }
        if (event.key === 'Delete' && event.ctrlKey && !this.isActionAllowedEditMode(ThfGridEditModeActionType.Remove)) {
            event.preventDefault();
            return;
        }
        if (this.onKeydownCtrlDelKeyEdit(event)) {
            return;
        }
        if (this.onKeydownCtrlInsertKeyEdit(event)) {
            return;
        }
        if (event.key === 'Tab') {
            this.onKeydownTabEditMode(event);
        }
        if (this.isInRowsActionsMode || (this.isInIncludeMode && event.key === 'Escape')) {
            const activeElement = document.activeElement;
            const isDirectlyOnCell = activeElement?.tagName === 'TD';
            if (isDirectlyOnCell && isTriggerKey) {
                if (event.key === 'Backspace' || event.key === 'Delete') {
                    this.clearFormControlValue = true;
                }
                this.dispachEnterKeyEdit(event);
                return;
            }
            this.onKeydownCommandsKeyEdit(event);
            if (event.key === 'Escape' || event.key === 'Enter') {
                return;
            }
        } else if (isTriggerKey) {
            this.dispachEnterKeyEdit(event);
            return;
        }
        setTimeout(() => {
            this.processKeydownRowEdit(rowIndex, event);
        });
    }
    onKeydownTabEditMode(event) {
        this.shiftKeyPressed = event.shiftKey;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        if (this.isDropdownFormControl(event.target) || this.isPoHelperTarget(event.target)) {
            return;
        }
        if (event.target.closest('tr.k-table-row') || this.isFilterByColumnButton(event.target)) {
            this.verifiyFocusInCell(event);
        }
    }
    processKeydownRowEdit(oldIndex, event) {
        if (this.preventKeydown(event)) {
            event.preventDefault();
            return;
        }
        const updatedRowIndex = this.gridComponent ? this.gridComponent.activeCell?.rowIndex : undefined;
        if (oldIndex !== updatedRowIndex && !this.formGroupIntern?.invalid && event.key) {
            if (this.hasDiffInFormGroup() || this.isInIncludeMode) {
                if (event.key == 'Tab') {
                    this.callValidateField(ThfGridActionEdit.ViaTab);
                }
                this.thfGridEditService.saveGridRowsActions(this.formGroupIntern.value, this.rowData);
                this.executeRowActions();
            } else {
                this.rowData.$currentRowActions = false;
                this.closeRowActions();
                this.rowDataInitial = {};
            }
        } else if (
            event.key === 'ArrowDown' &&
            event.target.nodeName === 'TD' &&
            !this.disabledIncludeButton &&
            !this.isInRowsActionsMode &&
            !this.isInIncludeMode &&
            !this.rowData?.$currentRowActions
        ) {
            if (!this.isActionAllowedEditMode(ThfGridEditModeActionType.Add) || this.rowStateFilter !== 'active') {
                return;
            }
            this.onInitIncludeMode();
        }
    }
    preventKeydown(event) {
        if (event.target?.hasAttribute('data-append-in-body') && event.key === 'ArrowDown') {
            return true;
        }
        if (event.key === 'Delete' && event.ctrlKey && this.isActionAllowedEditMode(ThfGridEditModeActionType.Remove)) {
            return true;
        }
        if (this.showOnlySelectedItems() && event.key === 'ArrowDown') {
            return true;
        }
        return false;
    }
    processRowEditForm(formGroup, { dataItem, column }) {
        if (isObservable(formGroup)) {
            this.activedObservableFunction = true;
            formGroup.pipe(finalize$1(() => (this.activedObservableFunction = false))).subscribe(value => {
                this.editRowInGridProperties(
                    {
                        dataItem,
                        column
                    },
                    value
                );
            });
        } else {
            this.editRowInGridProperties(
                {
                    dataItem,
                    column
                },
                formGroup
            );
        }
    }
    createEmptyIncludeLine() {
        const newLine = {};
        if (this.gridData.length) {
            for (const key in this.gridData[0]) {
                newLine[key] = null;
            }
        } else {
            this.columns.forEach(column => {
                newLine[column.property] = null;
            });
        }
        return newLine;
    }
    applyDuplicateDataInSequence(newLine, duplicatedRow, sourceRow) {
        const postObservableTriesLimit = 50;
        let postObservableTry = 0;
        const interval = setInterval(() => {
            this.ensureIncludeRowInEditMode(newLine);
            if (this.activedObservableFunction) {
                return;
            }
            postObservableTry++;
            const readyToApply = !!(this.formGroupIntern && this.rowData === newLine);
            if (!readyToApply && postObservableTry < postObservableTriesLimit) {
                return;
            }
            clearInterval(interval);
            if (!readyToApply) {
                this.rollbackFailedDuplicate(newLine);
                return;
            }
            void this.fillDuplicatedRowSequentially(newLine, duplicatedRow, sourceRow);
        }, 20);
    }
    ensureIncludeRowInEditMode(newLine) {
        if (this.isInRowsActionsMode && this.rowData === newLine && this.formGroupIntern) {
            return;
        }
        if (!this.isInIncludeMode || this.isInRowsActionsMode) {
            return;
        }
        if (this.activedObservableFunction) {
            return;
        }
        const firstEditableColumn = this.columns.find(column => column.type !== 'detail' && column.visible !== false);
        if (!firstEditableColumn) {
            return;
        }
        this.editRowInGrid({
            dataItem: newLine,
            column: {
                field: firstEditableColumn.property
            }
        });
    }
    rollbackFailedDuplicate(newLine) {
        const insertedIndex = this.gridData.findIndex(item => item === newLine);
        if (insertedIndex > -1) {
            this.gridData.splice(insertedIndex, 1);
            this.gridData = [...this.gridData];
            this.applyRowStateFilterImmediate();
        }
        this.isInIncludeMode = false;
        this.includeInsertIndex = undefined;
        this.initIncludeMode = false;
        this.rowActionsIndex = undefined;
        this.formGroupIntern = undefined;
        this.rowDataInitial = {};
        this.rowData = {};
        this.isLoading = false;
        this.isDuplicating = false;
    }
    async fillDuplicatedRowSequentially(newLine, duplicatedRow, sourceRow) {
        try {
            const orderedColumns = this.columns.filter(column => this.formGroupIntern.controls[column.property]);
            for (const column of orderedColumns) {
                this.formGroupIntern.controls[column.property].setValue(duplicatedRow?.[column.property] ?? null);
                this.formGroupIntern.controls[column.property].markAsDirty();
                this.formGroupIntern.controls[column.property].markAsTouched();
                this.formGroupIntern.controls[column.property].updateValueAndValidity();
                this.changeForm({
                    column
                });
                await this.waitValidateFieldFinish();
            }
            this.thfGridEditService.saveGridRowsActions(this.formGroupIntern.value, this.rowData);
            this.applyLabelsToGridItems([this.rowData]);
            this.duplicateFillComplete?.();
            this.afterDuplicate.emit({
                sourceRow,
                duplicatedRow: this.cleanObject(structuredClone(newLine))
            });
        } finally {
            this.includeInsertIndex = undefined;
            this.isLoading = false;
            this.isDuplicating = false;
        }
    }
    focusFirstEditableField() {
        this.changeDetector.detectChanges();
        const editComponent = this.thfGridEdit?.toArray()?.find(component => component?.el?.nativeElement?.getAttribute('enabled-thf-grid-edit') === 'true');
        editComponent?.setFocus();
    }
    waitValidateFieldFinish() {
        return new Promise(resolve => {
            if (!this.activedObservableFunction) {
                resolve();
                return;
            }
            const maxAttempts = 50;
            let attempts = 0;
            const checkInterval = setInterval(() => {
                attempts++;
                if (!this.activedObservableFunction || attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 20);
        });
    }
    removeItemSelected(item) {
        this.mySelection = this.mySelection.filter(i => i !== item);
    }
    removeLastGridItem(itemToRemove) {
        const removeIndex = itemToRemove ? this.gridData.findIndex(item => item === itemToRemove) : -1;
        if (removeIndex > -1) {
            this.gridData.splice(removeIndex, 1);
        } else {
            this.gridData.splice(this.gridData.length - 1);
        }
        this.gridData = [...this.gridData];
        if (this.gridRowActions) {
            this.applyRowStateFilterImmediate();
        } else {
            this.gridView = this.gridData;
        }
    }
    returnCellClickEdit(args) {
        if (
            args.column?.isCheckboxColumn ||
            this.activedObservableFunction ||
            (this.isInRowsActionsMode && this.cellArgs?.rowIndex === args?.rowIndex && this.cellArgs?.columnIndex === args?.columnIndex)
        ) {
            return true;
        }
        return false;
    }
    returnOnBeforeFalse() {
        this.gridData = [];
        this.changeDetector.detectChanges();
        this.thfGridEditService.saveGridRowsActions(this.rowDataInitial, this.rowData);
        this.gridData = [...this.thfGridEditService.getData()];
        this.gridView = this.gridData;
        this.rowData.$currentRowActions = false;
    }
    saveRow() {
        if (this.isInEditingMode) {
            const dataForm = this.thfGridEditService.mapValueFromObject(structuredClone(this.formGroupIntern.value));
            this.thfGridEditService
                .edit(this.service, this.formatUniqueKey(this.formGroupIntern.value), dataForm)
                .pipe(
                    finalize$1(() => {
                        this.closeEditor();
                    })
                )
                .subscribe({
                    next: () => {
                        this.thfGridEditService.save(this.formGroupIntern.value, false);
                    }
                });
        }
    }
    scrollFixed() {
        const listGrids = this.el.nativeElement.querySelectorAll('.grid-header-fixed.k-grid');
        const listGridsWithGroupable = this.el.nativeElement.querySelectorAll('.grid-header-fixed-with-groupable.k-grid');
        if (listGridsWithGroupable.length) {
            for (let i = 0; i < listGridsWithGroupable.length; i++) {
                const header = listGridsWithGroupable[i].querySelector('.k-grid-header');
                const headerGroup = listGridsWithGroupable[i].querySelector('.k-grouping-header');
                if (header) {
                    this.scrollFixedHandle(listGridsWithGroupable, header, i, true);
                }
                if (headerGroup) {
                    this.scrollFixedHandle(listGridsWithGroupable, headerGroup, i);
                }
            }
        } else if (listGrids.length) {
            for (let i = 0; i < listGrids.length; i++) {
                const header = listGrids[i].querySelector('.k-grid-header');
                if (header) {
                    this.scrollFixedHandle(listGrids, header, i);
                }
            }
        }
    }
    scrollFixedHandle(listGrids, header, index, styleGroup) {
        const container = this.el.nativeElement.closest('.po-page-content');
        const offset = container ? container.scrollTop : window.scrollY;
        const widthHeader = this.el.nativeElement.querySelector('.k-grid-toolbar');
        const widthGrid = listGrids[index].querySelector('kendo-grid-list.k-grid-container');
        const tableOffsetTop = listGrids[index].parentElement.offsetTop + (widthHeader?.offsetHeight || 0);
        const tableOffsetBottom = tableOffsetTop + widthGrid.clientHeight;
        if (offset <= tableOffsetTop - 48 || offset > tableOffsetBottom) {
            this.renderer.removeClass(header, 'fixed-header');
            this.renderer.removeClass(header, 'fixed-header-with-group');
        } else if (offset >= tableOffsetTop && offset <= tableOffsetBottom) {
            this.renderer.addClass(header, 'fixed-header');
            if (styleGroup) {
                this.renderer.addClass(header, 'fixed-header-with-group');
            }
            this.renderer.setStyle(header, 'width', listGrids[index].clientWidth + 'px');
        }
    }
    setAfterSaveInEditMode() {
        if (this.gridRowActions.afterSave) {
            this.gridRowActions.afterSave(this.rowData);
            if (this.changedItems.observed) {
                this.getChangedItems();
            }
        }
        this.rowData.$currentRowActions = false;
        this.rowData.$edited = true;
        this.rowDataInitial = {};
        this.verifyFilterByColumn();
        this.getItemsEditMode(this.gridData);
        this.closeRowActions();
        this.onSelectedKeysChange();
    }
    setAfterRemoveInEditMode(removed) {
        if (removed && this.gridRowActions.afterRemove) {
            this.gridRowActions.afterRemove(this.rowData);
            if (this.changedItems.observed) {
                this.getChangedItems();
            }
        }
        if (!removed) {
            this.poNotification.success({
                message: this.literals.gridRowActionsRestoreSuccessful,
                duration: 3000
            });
            if (this.gridRowActions.afterUndoRemove) {
                this.gridRowActions.afterUndoRemove(this.rowData);
            }
        }
        this.rowData.$removed = removed;
        this.unselectRowItem(this.rowData);
        this.getItemsEditMode(this.gridData);
        this.applyRowStateFilterImmediate();
    }
    setDropdownActions() {
        let allVisibleSelected = false;
        if (this.hasActiveFilters) {
            const visibleItems = this.gridView || [];
            const visibleSelected = visibleItems.filter(i => i.$selected).length;
            allVisibleSelected = visibleItems.length > 0 && visibleSelected === visibleItems.length;
        } else {
            allVisibleSelected = this.mySelection?.length === this.gridView?.length;
        }
        this.dropdownActions = [
            {
                label: this.literals.exportPDF,
                action: this.exportToPdf.bind(this),
                visible: this.actionPDF,
                disabled: !this.actionPDF || !allVisibleSelected
            },
            {
                label: this.literals.exportExcel,
                action: this.exportToExcel.bind(this),
                visible: this.actionExcel,
                disabled: !this.actionExcel || !allVisibleSelected
            }
        ];
        this.dropdownActions = [...this.dropdownActions, ...(this.customActions || [])];
    }
    setFilters() {
        let index = 0;
        this.columns.forEach(column => {
            if (column['type'] !== 'detail') {
                this.fields[index] = {
                    property: column['property'],
                    label: column['label']
                };
            }
            index++;
        });
        this.changeDetector.detectChanges();
    }
    setGridItemId(items) {
        items.forEach(item => {
            if (!item.$gridItemId) {
                item.$gridItemId = item?.id || generateHashId(JSON.stringify(item));
            }
        });
    }
    setCustomWidthForSwitchColumn(column) {
        setTimeout(() => {
            const targetColumn = this.grid.columns?.find(clmn => clmn['field'] === column.property);
            if (!targetColumn) {
                return;
            }
            this.grid.autoFitColumn(targetColumn);
            targetColumn.width = typeof targetColumn.width === 'number' ? targetColumn.width + 56 : targetColumn.width;
        }, 100);
    }
    setEditorColumnsDefaultWidth() {
        if (!this.gridRowActions) return;
        this.resizable = true;
        this.columns.forEach(column => {
            if (column?.width) return;
            if (column?.editProperties) {
                if (column?.editProperties.componentEditable === 'switch' && column?.editProperties?.formatModel) {
                    this.setCustomWidthForSwitchColumn(column);
                }
                const hasHelper = column.editProperties.helper || column.editProperties.additionalHelpTooltip || column.editProperties.additionalHelp;
                const widths = hasHelper ? this.editorWidthsWithHelper : this.defaultEditorWidths;
                const defaultWidth = widths[column.editProperties.componentEditable || 'input'];
                if (defaultWidth && (column.internalWidth ?? this.DEFAULT_COLUMN_WIDTH) < defaultWidth) {
                    column.width = defaultWidth;
                }
            } else {
                column.width = this.DEFAULT_COLUMN_WIDTH;
            }
        });
    }
    setInitialEditProperties(formGroup, { dataItem, column }) {
        this.formGroupIntern = formGroup;
        this.rowData = dataItem;
        this.rowData.$currentRowActions = true;
        if (Object.keys(this.rowDataInitial).length === 0) {
            this.rowDataInitial = {
                ...dataItem
            };
        }
        this.rowActionsIndex = true;
        this.updateEditableControlsSet();
        this.changeDetector.detectChanges();
        this.formGroupIntern.valueChanges.subscribe(() => {
            if (this.isInIncludeMode) {
                this.notificationDisplayed = false;
            }
            this.updateSingleItemToaster();
        });
        this.updateSingleItemToaster();
        if (this.initIncludeMode && this.isInIncludeMode) {
            if (this.isDuplicating) {
                new Promise(resolve => {
                    this.duplicateFillComplete = resolve;
                }).then(() => {
                    this.duplicateFillComplete = null;
                    this.focusFirstEditableField();
                });
            } else {
                const firstEnabled = this.thfGridEdit
                    .toArray()
                    .find(component => component.el.nativeElement.querySelector("[data-inactive-component='false']"));
                if (firstEnabled) {
                    firstEnabled?.setFocus();
                }
            }
        } else {
            this.thfGridEdit?.find(fieldEdit => fieldEdit.column?.property === column.field)?.setFocus();
        }
        const focusedIndex = this.getFocusedIndex();
        if (this.isInIncludeMode) {
            this.formGroupIntern.valueChanges.subscribe(newValue => {
                this.notificationDisplayed = false;
            });
            if (this.thfGridEdit && focusedIndex !== 1 && !Number.isInteger(this.includeInsertIndex)) {
                const gridContent = this.el.nativeElement.querySelector('div.k-grid-content');
                if (gridContent?.scrollHeight > gridContent?.clientHeight) {
                    gridContent.scrollTop = gridContent.scrollHeight - gridContent.clientHeight;
                }
            }
        }
        if (formGroup?.controls[this.thfGridEdit?.first?.column?.property]) {
            formGroup.controls[this.thfGridEdit.first.column.property].markAsDirty();
        }
    }
    setPaginationData(items) {
        this.itemsByApi.page = items.page;
        this.itemsByApi.pageSize = items.pageSize;
        this.itemsByApi.total = items.total;
    }
    toggleSelect(compare, selectValue, selectionMode = false) {
        const isCompareFunction = typeof compare === 'function';
        if (isCompareFunction) {
            this.handleFunctionCompare(compare, selectionMode);
        } else {
            compare = this.gridData.find(data => JSON.stringify(this.cleanObject(data)) === JSON.stringify(this.cleanObject(compare)));
            this.handleValueCompare(compare, selectValue);
        }
        this.updateSelection();
    }
    handleFixedColumns(maxColumns) {
        const fixedColumns = this.gridUtils.getFixedColumns(this.columns);
        if (fixedColumns?.length > this.fixedQty()) {
            fixedColumns.forEach((col, index) => {
                if (index >= this.fixedQty()) {
                    col.fixed = false;
                }
            });
        }
        fixedColumns?.forEach(col => {
            col.visible = col.fixed ? true : col.visible;
        });
        this.gridUtils.setMaxColumnsProperties(this.maxColumns, this.maxColumnsGrid);
        this.gridUtils.setVisibleColumns(this.visibleColumns);
        this.gridUtils.updateVisibleColumns(this.columns, maxColumns);
        if (!this.fixedAfterInit) {
            this.visibleColumns = [...this.gridUtils.visibleColumns];
            this.maxColumnsGrid = [...this.gridUtils.maxColumnsGrid];
        }
        this.updateColumns();
    }
    afterUpdateVisibleColumns(column, isReorder = false) {
        if (this.fixedAfterInit && !isReorder) {
            setTimeout(() => {
                this.applyFixedWidths(this.autoSize, false, column);
                this.cleanTableWidth();
                if (column?.filter && !column.visible) {
                    this.filterByColumnName = column.property;
                    this.removeFilterByColumn();
                }
            }, 10);
        }
    }
    //#region verifiyFocusInCell
    getAdditionalColumnCount() {
        let sumIndex = 0;
        if (this.selectable) {
            sumIndex = 1;
            if (this.visibleActions?.length) {
                sumIndex = 2;
            }
        } else if (this.visibleActions?.length) {
            sumIndex = 1;
        }
        return sumIndex;
    }
    verifiyFocusInCell(event) {
        const activeCell = this.gridComponent.activeCell;
        if (!event.shiftKey) {
            this.handleForwardTab(event, activeCell);
        } else if (activeCell?.rowIndex > 0 || activeCell?.colIndex > 0) {
            this.handleBackwardTab(event);
        }
    }
    handleForwardTab(event, activeCell) {
        const sumIndex = this.getAdditionalColumnCount();
        const currentVisibleColumns = this.getVisibleOrFixedColumns(this.columns);
        if (activeCell?.colIndex === currentVisibleColumns.length + sumIndex - 1 && activeCell?.rowIndex === this.gridData.length) {
            return;
        }
        const nextTd = event.target.closest('.k-table-td-columns-fields')?.nextElementSibling;
        const currentPopup = this.poPopupFilters.find(popup => popup.showPopup === true);
        if (this.isNextCellEditable(nextTd) || currentPopup?.showPopup) {
            return;
        }
        event.preventDefault();
        this.gridComponent.focusNextCell();
    }
    handleBackwardTab(event) {
        const targetEl = event.target;
        const isOnSelectCell = !!targetEl.closest('.k-table-td-select');
        if (isOnSelectCell && this.focusPreviousRowAction(event, targetEl)) {
            return;
        }
        const previousTd = targetEl.closest('.k-table-td-columns-fields')?.previousElementSibling;
        if (this.isNextCellEditable(previousTd)) {
            return;
        }
        event.preventDefault();
        this.gridComponent.focusPrevCell();
    }
    focusPreviousRowAction(event, targetEl) {
        const currentRow = targetEl.closest('tr');
        const previousRow = currentRow?.previousElementSibling;
        const actionTd = previousRow?.querySelector('td.k-table-td-action');
        if (actionTd) {
            event.preventDefault();
            actionTd.focus();
            return true;
        }
        return false;
    }
    isNextCellEditable(td) {
        return td?.nodeName === 'TD' && !!td.querySelector("thf-grid-edit[enabled-thf-grid-edit='true']");
    }
    //#endregion
    /**
     * Aplica as alturas mínimas e máximas da grid, caso tenham sido definidas.
     *
     * Este, verifica se `t-min-height` e `t-max-height` foram passados como propriedades do componente
     * e, se sim, chama `setGridMinMaxHeight` para aplicar os valores.
     *
     * - Se `t-min-height` for informado, define a altura mínima da grid.
     * - Se `t-max-height` for informado, define a altura máxima da grid.
     *
     * @private
     */
    initialMinMaxHeightHandler() {
        const heightConfigs = [
            {
                property: 'min-height',
                value: this.minHeight
            },
            {
                property: 'max-height',
                value: this.maxHeight
            }
        ];
        heightConfigs.forEach(config => {
            this.setGridMinMaxHeight(config.property, config.value);
        });
    }
    /**
     * Define dinamicamente a altura mínima ou máxima da grid com base no valor passado.
     *
     * O método aceita valores em pixels (ex: `450`) ou em percentual (ex: `"50%"`).
     * Se o valor for percentual, ele é convertido para pixels com base na altura da tela.
     *
     * - Se um valor inválido for passado (ex: string sem número), ele será ignorado.
     * - Se o valor for menor ou igual a zero, também será ignorado.
     *
     * @param {string} property - Propriedade CSS a ser aplicada (`min-height` ou `max-height`).
     * @param {number | string} value - Valor da altura a ser aplicada (número em pixels ou string percentual).
     *
     * @private
     */
    setGridMinMaxHeight(property, value) {
        const gridWrapperElement = this.grid?.wrapper.nativeElement;
        if (value === null || value === undefined) {
            gridWrapperElement?.style.removeProperty(property);
            return;
        }
        let heightValue = null;
        if (typeof value === 'string' && value.includes('%')) {
            heightValue = `${this.calculateHeightPercentage(value) * 100}%`;
        } else if (!isNaN(Number(value))) {
            heightValue = `${Math.max(1, Number(value))}px`;
        }
        if (heightValue !== null) {
            gridWrapperElement?.style.setProperty(property, heightValue);
        } else {
            gridWrapperElement?.style.removeProperty(property);
        }
    }
    // função para adaptar a grid quando o sub-title do po-page-default é alterado
    initialHeightHandler(isPercentage) {
        this.updateGapSubtitle();
        const pageDefault = document.querySelector('po-page-default');
        const poPageContent = document.querySelector('.po-page-content');
        if (!pageDefault || !isPercentage || (typeof this.height === 'string' && !this.height.includes('%'))) {
            return;
        }
        this.changesMutation = new MutationObserver(() => {
            this.mutationSubject.next(poPageContent.clientHeight);
        });
        this.changesMutation.observe(pageDefault, {
            attributes: true
        });
        this.mutationSubject.subscribe(value => {
            this.currentHeightPageContent = value;
            this.handleGridInsidePageDefaut(this.currentHeightPageContent);
        });
    }
    /**
     * Ajusta a altura da grid quando ela está dentro de um **po-page-default**, levando em consideração
     * a presença de um subtítulo na página e garantindo que o layout não seja quebrado.
     *
     * @param heightPage Altura total da página para ser usada no cálculo da altura da grid.
     */
    handleGridInsidePageDefaut(heightPage) {
        const pageDefault = document.querySelector('po-page-default');
        const hasSubTitle = pageDefault.querySelector('.po-page-header-subtitle');
        const poPageContent = document.querySelector('.po-page-content');
        const adjustment = hasSubTitle ? -this.gapSubTitle : this.gapSubTitle;
        this.adjustSizeProperty('height', heightPage, poPageContent, adjustment);
        this.adjustSizeProperty('minHeight', heightPage, poPageContent, adjustment);
        this.adjustSizeProperty('maxHeight', heightPage, poPageContent, adjustment);
    }
    onResize() {
        this.updateGapSubtitle();
        clearTimeout(this.timeoutResize);
        this.timeoutResize = setTimeout(() => {
            this.resizeSubject.next(null);
        }, 20);
    }
    updateGapSubtitle() {
        this.gapSubTitle = window.innerWidth > 1366 ? 18 : 16;
    }
    callValidateField(mode, args = null) {
        const columnsWasModelChanged = this.columns.find(item => item.editProperties?.changeModelInternal);
        if (columnsWasModelChanged && this.hasDiffInFormGroup()) {
            this.changeForm(
                {
                    column: columnsWasModelChanged
                },
                false,
                mode,
                args
            );
        }
    }
    /**
     * CÓDIGOS REFERENTES A SELEÇÃO DE LINHA DA GRID
     */
    handleGridSelectable(event) {
        if (event.shiftKey && !event.ctrlKey && event.rangeStartRow) {
            // Condição de clique na linha pressionando o shift
            this.handleGridSelectableLineWithShift(event);
        } else if (event.shiftKey && !event.ctrlKey && !event.rangeStartRow) {
            // Condição de clique no checkbox da linha pressionando o shift
            this.handleGridSelectableCheckboxWithShift(event);
        } else if (!event.shiftKey) {
            // Condição de clique na linha pressionando o ctrl ou clicando diretamente no checkbox
            this.handleGridSelectableLine(event);
        }
        this.onSelectedKeysChange();
    }
    handleGridSelectableCheckboxWithShift(event) {
        const activeElement = document.activeElement;
        const row = activeElement?.closest('kendo-grid-list tr[data-kendo-grid-item-index]');
        const currentIndex = row ? parseInt(row.dataset['kendoGridItemIndex'] || '0', 10) : 0;
        const anchorIndex = this.shiftAnchorIndex.index ?? 0;
        const startIndex = Math.min(anchorIndex, currentIndex);
        const endIndex = Math.max(anchorIndex, currentIndex);
        const gridData = this.gridRowActions ? this.gridView : this.gridData;
        let newRangeItems = gridData.slice(startIndex, endIndex + 1);
        if (!this.sort[0].dir || !this.sort[0].field) {
            newRangeItems = gridData.slice(startIndex, endIndex + 1);
        } else {
            this.sortGridData([...gridData], this.sort[0].field, this.sort[0].dir);
            const gridDataCopy = this.sortGridData([...gridData], this.sort[0].field, this.sort[0].dir);
            newRangeItems = gridDataCopy.slice(startIndex, endIndex + 1);
        }
        const newRangeIds = new Set(newRangeItems.map(item => item.$gridItemId));
        const previousSelection = this.mySelection;
        const previousIds = new Set(previousSelection.map(item => item.$gridItemId));
        this.mySelection = [...newRangeItems];
        this.selectedRows = [...newRangeItems];
        previousSelection.forEach(item => {
            if (!newRangeIds.has(item.$gridItemId)) {
                item.$selected = false;
                this.unSelected.emit(item);
            }
        });
        newRangeItems.forEach(item => {
            if (!previousIds.has(item.$gridItemId)) {
                item.$selected = true;
                this.selected.emit(item);
            }
        });
        this.emitSelectionEvents();
        this.onSelectedKeysChange();
        this.changeDetector.detectChanges();
    }
    emitSelectionEvents() {
        this.rowsSelected.emit(this.mySelection);
    }
    handleGridSelectableLineWithShift(event) {
        const anchorIndex = this.shiftAnchorIndex.index ?? 0;
        const normalizedStart = Math.min(anchorIndex, event.rangeEndRow.index);
        const normalizedEnd = Math.max(anchorIndex, event.rangeEndRow.index);
        const gridData = this.gridRowActions ? this.gridView : this.gridData;
        if (!this.sort[0].dir || !this.sort[0].field) {
            this.mySelection = gridData.slice(normalizedStart, normalizedEnd + 1).map(item => item);
            this.selectedRows = this.mySelection;
        } else {
            this.sortGridData([...gridData], this.sort[0].field, this.sort[0].dir);
            const gridDataCopy = this.sortGridData([...gridData], this.sort[0].field, this.sort[0].dir);
            this.mySelection = gridDataCopy.slice(normalizedStart, normalizedEnd + 1).map(item => item);
            this.selectedRows = this.mySelection;
        }
        if (this.myLastSelection.length < 1) {
            this.mySelection.forEach(item => {
                item.$selected = true;
                this.selected.emit(item);
            });
        } else {
            this.mySelection.forEach(item => {
                const alreadySelected = this.myLastSelection.some(selectedItem => this.compareGridItemById(selectedItem, item));
                if (!alreadySelected) {
                    item.$selected = true;
                    this.selected.emit(item);
                }
            });
            this.myLastSelection.forEach(item => {
                const itemIsStillSelected = this.mySelection.some(selectedItem => this.compareGridItemById(selectedItem, item));
                if (!itemIsStillSelected) {
                    item.$selected = false;
                    this.unSelected.emit(item);
                }
            });
        }
        this.emitSelectionEvents();
    }
    handleGridSelectableLine(event) {
        if (event.selectedRows.length > 0) {
            this.shiftAnchorIndex.index = event.selectedRows[0].index;
            this.shiftAnchorIndex.id = event.selectedRows[0].dataItem.$gridItemId;
            event.selectedRows.forEach(item => {
                item.dataItem.$selected = true;
                this.mySelection = [...this.mySelection, item.dataItem];
                this.selectedRows = this.mySelection;
                this.selected.emit(item.dataItem);
            });
        }
        if (event.deselectedRows.length > 0) {
            event.deselectedRows.forEach(item => {
                item.dataItem.$selected = false;
                this.mySelection = this.mySelection.filter(selectionItem => selectionItem !== item.dataItem);
                this.selectedRows = this.mySelection;
                this.unSelected.emit(item.dataItem);
            });
        }
        this.emitSelectionEvents();
    }
    // Condição de clique na linha sem ctrl ou shift
    handleGridSeletableLine(event) {
        const { ctrlKey, metaKey, shiftKey } = event.originalEvent;
        const hasModifier = ctrlKey || metaKey || shiftKey;
        const selectedItemsMap = new Map(this.myLastSelection.map(item => [item.$gridItemId, item]));
        if (!this.singleSelect && this.selectableEntireLine && this.selectable && !this.selectableDisabled) {
            const item = event.dataItem;
            const itemKey = item.$gridItemId;
            if (!hasModifier && this.myLastSelection.length < 1) {
                this.handleGridSeletableLineSelectItem(item);
            } else if (!hasModifier && this.myLastSelection.length > 0) {
                selectedItemsMap.forEach((lastItem, lastItemKey) => {
                    if (lastItemKey !== itemKey) {
                        lastItem.$selected = false;
                        this.mySelection = Array.from(selectedItemsMap.values()).filter(item => item.$selected);
                        this.selectedRows = this.mySelection;
                        this.unSelected.emit(lastItem);
                    }
                });
                this.handleGridSeletableLineSelectItem(item);
            }
            this.myLastSelection = [...this.mySelection];
            this.onSelectedKeysChange();
            this.setDropdownActions();
        }
    }
    handleGridSeletableLineSelectItem(item) {
        const itemKey = item.$gridItemId;
        const selectedKeysSet = new Set(this.mySelection.map(selectedItem => selectedItem.$gridItemId));
        item.$selected = true;
        this.mySelection = [item];
        this.selectedRows = [...this.mySelection];
        if (!selectedKeysSet.has(itemKey)) {
            this.selected.emit(item);
        }
        this.emitSelectionEvents();
    }
    handleGridSingleSelectable(event) {
        this.myLastSelection = [...this.mySelection];
        if (event.deselectedRows.length > 0) {
            const item = event.deselectedRows[0].dataItem;
            item.$selected = false;
            this.mySelection = [];
            this.selectedRows = this.mySelection;
            this.showOnlySelectedItems.set(false);
            this.unSelected.emit(item);
        }
        if (event.selectedRows.length > 0) {
            const selectedItem = event.selectedRows[0].dataItem;
            selectedItem.$selected = true;
            this.mySelection = [selectedItem];
            this.selectedRows = this.mySelection;
            this.selected.emit(selectedItem);
            if (this.myLastSelection.length > 0 && event.deselectedRows.length < 1) {
                this.myLastSelection[0].$selected = false;
                this.unSelected.emit(this.myLastSelection[0]);
            }
        }
        this.emitSelectionEvents();
    }
    sortGridData(data, field, order) {
        return data.sort((a, b) => {
            const valueA = a[field];
            const valueB = b[field];
            if (order === 'asc') {
                return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
            } else {
                return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
            }
        });
    }
    emitChangeFixedColumns(event) {
        this.changeFixedColumns.emit(event);
    }
    emitChangeVisibleColumns(event) {
        this.changeVisibleColumns.emit(event);
    }
    emitRestoreColumnManager(event) {
        this.changeDetector.detectChanges();
        this.columnRestoreManager.emit(event.defaultColumns);
        this.columnsChangeFixed = [...event.columnsChangeFixed];
        this.hasFirstChangeFixed = true;
        this.applyFixedWidths();
        if (this.autoSize) {
            this.autoFitColumns();
        }
    }
    getFixedColumnWidth(type) {
        return getFixedColumnWidth(type, this.spacing, this.componentsSize);
    }
    changeForm(formChanged, viaEdit = false, mode = '', args = null) {
        formChanged.column.editProperties.changeModelInternal = false;
        const backupLastForm = this.formGroupIntern.value;
        let lastValue;
        if (this.gridRowActions.validateField) {
            this.activedObservableFunction = true;
            this.thfGridEditService.processLabelForm(this.formGroupIntern.value, this.rowData);
            const onValidate = this.gridRowActions?.validateField(this.formGroupIntern.value, formChanged.column.property);
            if (isObservable(onValidate)) {
                this.isLoading = true;
                this.activedObservableFunction = true;
                onValidate
                    .pipe(
                        tap(value => {
                            lastValue = value;
                        }),
                        finalize$1(() => {
                            this.activedObservableFunction = false;
                            this.isLoading = false;
                            if (lastValue) {
                                this.handleValidateObservable(lastValue, mode, args);
                            } else {
                                const changesForm = getChangedKeysFromForm(backupLastForm, this.formGroupIntern);
                                changesForm.forEach(property => {
                                    this.formGroupIntern.controls[property].setValue(this.rowDataInitial[property]);
                                    this.rowData[property] = this.rowDataInitial[property];
                                });
                                this.formGroupIntern.controls[formChanged.column.property].setValue(this.rowDataInitial[formChanged.column.property]);
                            }
                        })
                    )
                    .subscribe(value => {
                        if (!value) {
                            const changesForm = getChangedKeysFromForm(backupLastForm, this.formGroupIntern);
                            changesForm.forEach(property => {
                                this.formGroupIntern.controls[property].setValue(this.rowDataInitial[property]);
                                this.rowData[property] = this.rowDataInitial[property];
                            });
                            this.formGroupIntern.controls[formChanged.column.property].setValue(this.rowDataInitial[formChanged.column.property]);
                        }
                    });
            } else {
                this.activedObservableFunction = false;
                if (!onValidate) {
                    this.formGroupIntern.controls[formChanged.column.property].setValue(this.rowDataInitial[formChanged.column.property]);
                    if (mode === ThfGridActionEdit.ViaCellClick) {
                        this.rowDataInitial = {};
                        this.rowData.$currentRowActions = false;
                    } else if (mode === ThfGridActionEdit.ViaEnter) {
                        this.rowData.$currentRowActions = false;
                        this.closeRowActions();
                        this.rowDataInitial = {};
                    }
                }
            }
            this.changeDetector.detectChanges();
            if (this.changedItems.observed) {
                this.getChangedItems();
            }
        }
        this.updateDynamicStates(formChanged);
        if (!viaEdit) {
            formChanged.column.editProperties.blockEmit = true;
        }
    }
    handleValidateObservable(value, mode, args = null) {
        if (!mode && value) {
            this.thfGridEditService.saveGridRowsActions(this.formGroupIntern.value, this.rowData);
        }
        if (mode === ThfGridActionEdit.ViaTab || mode === ThfGridActionEdit.ViaEnter) {
            if (value) {
                this.thfGridEditService.saveGridRowsActions(this.formGroupIntern.value, this.rowData);
                this.executeRowActions();
            } else {
                this.rowData.$currentRowActions = false;
                this.closeRowActions();
                this.rowDataInitial = {};
            }
        }
        if (mode === ThfGridActionEdit.ViaCellClick) {
            if (value) {
                this.thfGridEditService.saveGridRowsActions(this.formGroupIntern.value, this.rowData);
                this.manageEditingOnCellClick(args);
            } else {
                this.rowDataInitial = {};
                this.rowData.$currentRowActions = false;
            }
        }
        if (mode === ThfGridActionEdit.ViaClickOut) {
            if (value) {
                this.thfGridEditService.saveGridRowsActions(this.formGroupIntern.value, this.rowData);
            } else {
                this.rowDataInitial = {};
                this.rowData.$currentRowActions = false;
                this.rowActionsIndex = undefined;
            }
            this.notificationDisplayed = false;
            this.manageRowEditState();
        }
    }
    applyFixedWidths(onlyLast, callByOnResize = false, callByUpdateColumns) {
        const columns = this.grid?.columns;
        if (!columns) return;
        const columnsArray = columns.toArray();
        if (!columnsArray.length) return;
        const isFirstColumnSelectable = columns.first && this.selectable;
        const hasActionColumn = this.editProperties || this.visibleActions.length;
        const actionColumnIndex = hasActionColumn ? this.getColumnIndex(columnsArray, 'actions') : -1;
        const selectionWidth = isFirstColumnSelectable ? this.getFixedColumnWidth('selection') : 0;
        const actionsWidth = hasActionColumn ? this.getFixedColumnWidth('action') : 0;
        const fixedColumnWidth = selectionWidth + actionsWidth;
        const [startIndex, endIndex] = this.getDynamicColumnIndices(isFirstColumnSelectable, actionColumnIndex, columnsArray.length);
        const visibleColumns = columnsArray.slice(startIndex, endIndex);
        const totalGridWidth = this.grid.header.nativeElement.clientWidth;
        const groupableFixedSize = this.grid.group.length * 32;
        const availableWidth = totalGridWidth - fixedColumnWidth - groupableFixedSize;
        if (this.applyFixedWidthFirstTime && this.columns.some(column => !Number.isNaN(column.width))) {
            this.convertColumnWidthStringToNumber(availableWidth);
        }
        this.resizeElegibleColumn(visibleColumns, availableWidth, onlyLast, callByOnResize, callByUpdateColumns);
        this.updateColumns();
    }
    getColumnIndex(columns, field) {
        return columns.findIndex(col => 'field' in col && col.field === field);
    }
    getDynamicColumnIndices(isFirstColumnSelectable, actionColumnIndex, totalColumns) {
        let startIndex = 0;
        let endIndex = totalColumns;
        if (isFirstColumnSelectable) {
            startIndex = 1;
        }
        if (actionColumnIndex > 1) {
            endIndex = totalColumns - 1;
        } else if (actionColumnIndex >= 0) {
            startIndex++;
        }
        return [startIndex, endIndex];
    }
    resizeElegibleColumn(columns, availableWidth, onlyLast, callByOnResize = false, callByUpdateColumns) {
        const visibleColumns = this.columns.filter(col => col.visible !== false);
        const _isUpdateColumnVisible = visibleColumns.find(col => col === callByUpdateColumns);
        const totalInitialWidth = visibleColumns.reduce(
            (sum, col) => sum + (col.internalWidth || col.widthResizable || Number(col.width) || this.DEFAULT_COLUMN_WIDTH),
            0
        );
        let remainingWidth = availableWidth - totalInitialWidth;
        if (remainingWidth === 0) return;
        const isOverflow = remainingWidth < 0;
        if (isOverflow && callByOnResize) return;
        if (isOverflow) {
            let _totalUsedWidth = 0;
            if (!onlyLast && (!callByOnResize || /* istanbul ignore next */ !callByUpdateColumns) && !visibleColumns.some(col => col.width)) {
                _totalUsedWidth = visibleColumns.reduce(
                    (sum, col) => sum + (col.widthResizable && !col.internalWidth ? col.widthResizable || /* istanbul ignore next */ 0 : 0),
                    0
                );
            } else {
                if (callByUpdateColumns && !onlyLast) {
                    _totalUsedWidth = visibleColumns.reduce((sum, col) => sum + (col.widthResizable || Number(col.width) || 0), 0);
                } else {
                    _totalUsedWidth = visibleColumns.reduce(
                        (sum, col, index) =>
                            sum + (visibleColumns.length - 1 !== index ? col.widthResizable || Number(col.width) || /* istanbul ignore next */ 0 : 0),
                        0
                    );
                }
            }
            remainingWidth = availableWidth - _totalUsedWidth;
        }
        if (remainingWidth <= 0) return;
        if (!onlyLast) {
            this.distributeWidths(columns, visibleColumns, remainingWidth, isOverflow);
        } else {
            this.adjustLastColumnWidth(columns, visibleColumns, remainingWidth, isOverflow, callByOnResize);
        }
        this.applyFixedWidthFirstTime = false;
    }
    distributeWidths(columns, visibleColumns, remainingWidth, isOverlow) {
        if (isOverlow) {
            visibleColumns
                .filter(visibleColumn => (visibleColumn.width || visibleColumn.widthResizable) && visibleColumn.internalWidth)
                .forEach(visibleColumn => (visibleColumn.internalWidth = undefined));
        }
        let resizableColumns = visibleColumns.filter(col => !col.width && (!this.applyFixedWidthFirstTime ? !col.widthResizable : true));
        if (!resizableColumns.length) {
            resizableColumns = visibleColumns.filter(col => !col.width);
            if (!resizableColumns.length) {
                resizableColumns = [visibleColumns[visibleColumns.length - 1]];
            }
            this.adjustLastColumnWidth(columns, visibleColumns, remainingWidth, isOverlow, false, resizableColumns[resizableColumns.length - 1]);
            return;
        }
        // distribuir para todos
        columns.forEach(column => {
            const matchingColumn = visibleColumns.find(visibleColumn => visibleColumn.property === column.field);
            if (!matchingColumn) return;
            if (matchingColumn.width) return;
            if (!this.applyFixedWidthFirstTime && !matchingColumn.internalWidth && matchingColumn.widthResizable) return;
            const initialWidth = matchingColumn.widthResizable || matchingColumn.internalWidth || matchingColumn.width || this.DEFAULT_COLUMN_WIDTH;
            const proportionalWidth = (isOverlow ? 0 : column.width) + remainingWidth / resizableColumns.length;
            column.width = Math.max(proportionalWidth, isOverlow ? this.DEFAULT_COLUMN_WIDTH : initialWidth);
            matchingColumn.internalWidth = column.width;
        });
    }
    adjustLastColumnWidth(columns, visibleColumns, remainingWidth, isOverlow, callByOnResize, columnToResize) {
        const lastColumn = !columnToResize ? this.getLastColumn(visibleColumns) : columnToResize;
        if (!lastColumn) return;
        const kendoColumn = columns.find(col => col.field === lastColumn.property);
        if (!kendoColumn) return;
        const initialWidth = lastColumn.internalWidth || lastColumn.widthResizable || lastColumn.width || this.DEFAULT_COLUMN_WIDTH;
        const proportionalWidth = (isOverlow && !columnToResize ? 0 : columnToResize ? initialWidth : kendoColumn.width) + remainingWidth;
        kendoColumn.width = Math.max(proportionalWidth, isOverlow ? lastColumn.width : initialWidth);
        lastColumn.internalWidth = kendoColumn.width;
        lastColumn.widthResizable = undefined;
        if (visibleColumns.length > 1 && !callByOnResize) {
            visibleColumns
                .filter(col => col !== lastColumn)
                .forEach(col => {
                    if (col.width && col.internalWidth && isOverlow) col.internalWidth = undefined;
                });
        }
    }
    getLastColumn(visibleColumns) {
        return [...visibleColumns].reverse().find(col => !col.width && !col.widthResizable) || visibleColumns.slice(-1)[0];
    }
    convertColumnWidthStringToNumber(availableWidth) {
        this.columns.forEach(column => {
            if (typeof column.width === 'string' && column.width.includes('%')) {
                column.width = availableWidth * parsePercent(column.width);
            } else if (typeof column.width === 'number' && isNaN(column.width)) {
                column.width = this.DEFAULT_COLUMN_WIDTH;
            }
        });
    }
    getDefaultWidth(column) {
        if (typeof column === 'string') {
            return this.DEFAULT_COLUMN_WIDTH;
        }
        if (Number.isNaN(column)) {
            column = undefined;
            return undefined;
        }
        return column;
    }
    applyFixedColumnsWidthFirstTime() {
        this.applyFixedWidths();
        if ((this.autoSize || (this._autoSizeRequested && this.virtualColumns)) && !this.fixedAfterInit) {
            this.autoFitColumns();
        }
        this.fixedAfterInit = true;
        if (this.firstCallCalculateRowHeight && this.fixedAfterInit) {
            this.calculateRowHeight();
            this.firstCallCalculateRowHeight = false;
        }
    }
    // Retorna o tipo de container onde a grid está
    getContainerType() {
        if (this.el.nativeElement.closest('.po-page-slide-body')) {
            return 'po-page-slide-body';
        } else if (this.el.nativeElement.closest('.po-page-content')) {
            return 'po-page-content';
        }
        return 'document';
    }
    // Obtém a altura do botão "carregar mais"
    getPageableButtonHeight() {
        let buttonHeight = 0;
        if ((this.pageable && this.showMoreVisible) || (this.hasItems && this.showMore.observed && this.showMoreVisible)) {
            buttonHeight = this.componentsSize === 'small' ? ThfGridComponent.PAGEABLE_BUTTON_HEIGHT_SMALL : ThfGridComponent.PAGEABLE_BUTTON_HEIGHT_MEDIUM;
        }
        return buttonHeight;
    }
    // Calcula a altura dentro do po-page-slide-body
    setGridSizeForSlide(property, percentage) {
        const pageableButton = this.getPageableButtonHeight();
        const totalHeader = this.getPageHeaderHeight('.po-page-slide-header');
        const pageSlideBodyElement = this.el.nativeElement.closest('.po-page-slide-body');
        const computedStyle = getComputedStyle(pageSlideBodyElement);
        const offsetHeight = pageSlideBodyElement.offsetHeight;
        const paddingBottom = parseFloat(computedStyle.paddingBottom);
        const totalSpace = offsetHeight - paddingBottom + totalHeader - pageableButton;
        this.setGridSize(property, totalSpace, percentage);
    }
    // Calcula a altura dentro do po-page-content
    setGridSizeForPageContent(property, percentage) {
        const headerPage = (document.querySelector('.po-page-header')?.clientHeight || 0) - 8;
        const pageableButton = this.getPageableButtonHeight();
        const totalSpace = this.el.nativeElement.closest('.po-page-content').offsetHeight;
        this.setGridSize(property, totalSpace + headerPage - pageableButton, percentage);
    }
    // Calcula a altura para a grid no documento da página
    setGridSizeForDocument(property, percentage) {
        const totalSpace = document.body.clientHeight;
        const pageableButton = this.getPageableButtonHeight();
        this.setGridSize(property, totalSpace - pageableButton, percentage);
    }
    // Define a propriedade (height, minHeight ou maxHeight) dinamicamente
    setGridSize(property, totalSpace, percentage) {
        const gridToTop = Math.round(this.el.nativeElement.getBoundingClientRect().top);
        this[property] = (totalSpace - gridToTop) * percentage;
    }
    // Obtém a altura do cabeçalho da página, considerando margens
    getPageHeaderHeight(selector) {
        const header = document.querySelector(selector);
        if (!header) return 0;
        const rectHeader = header.getBoundingClientRect();
        const style = window.getComputedStyle(header);
        const marginTop = parseFloat(style.marginTop) || 0;
        const marginBottom = parseFloat(style.marginBottom) || 0;
        return rectHeader.height + marginTop + marginBottom;
    }
    // Capitaliza a primeira letra da string (ex: height -> Height)
    capitalize(value) {
        return value.charAt(0).toUpperCase() + value.slice(1);
    }
    /**
     * Aplica o ajuste dinâmico para uma propriedade específica da grid, atualizando
     * tanto a variável da classe quanto o estilo do `poPageContent`, se existir.
     */
    adjustSizeProperty(property, heightPage, poPageContent, adjustment) {
        if (typeof this[property] === 'number') {
            this[property] += adjustment;
            if (poPageContent) {
                this.renderer.setStyle(poPageContent, property, `${heightPage + adjustment}px`);
                if (property === 'height') {
                    this.currentHeightPageContent = poPageContent.clientHeight;
                }
            }
            this.calculateDynamicSize(property);
        }
    }
    fieldEditOnFocus(dataItem, rowIndex, columnIndex, column, event) {
        this.cellArgs = {
            ...this.cellArgs,
            dataItem: dataItem,
            columnIndex: columnIndex,
            rowIndex: rowIndex,
            column: column,
            originalEvent: event
        };
    }
    /**
     * @private
     * Atualiza os estados dinâmicos (readonly/disabled) com base na alteração do formulário
     *
     * @param formChanged Objeto com informações da alteração do formulário
     */
    updateDynamicStates(formChanged) {
        if (!formChanged?.column || !this.columns) {
            return this.rowData;
        }
        const property = formChanged.column.property;
        const fieldValue = formChanged.column.editProperties?.fieldValue;
        const propertyData = this.getPropertyNewData(property, fieldValue, this.formGroupIntern);
        let newRowData = {
            ...this.rowData,
            ...propertyData
        };
        const needsUpdate = false;
        this.columns.forEach(col => {
            const properties = {
                needsUpdate,
                column: col
            };
            newRowData = this.applyDynamicStates(this.formGroupIntern, properties, newRowData);
        });
    }
    /**
     * @private
     * Aplica estados dinâmicos (disabled/readonly) aos controles do formulário
     * com base nos dados atuais da linha e configurações das colunas
     *
     * @param formGroup FormGroup do formulário em edição
     * @param properties Objeto contendo a coluna e flag needsUpdate
     * @param rowData Dados atuais da linha (incluindo alterações não salvas)
     * @returns Novos dados da linha após processamento
     */
    applyDynamicStates(formGroup, properties, rowData) {
        const column = properties?.column;
        let currentData = rowData;
        if (column?.editProperties) {
            const control = formGroup.get(column.property);
            if (control) {
                const property = column.property;
                const fieldValue = column.editProperties.fieldValue;
                currentData = {
                    ...currentData,
                    ...this.getPropertyNewData(property, fieldValue, formGroup)
                };
                const shouldBeDisabled = this.evaluateDynamicState(column, currentData, 'disabled');
                const shouldBeReadonly = this.evaluateDynamicState(column, currentData, 'readonly');
                if (column.editProperties.internalDisabled !== shouldBeDisabled) {
                    column.editProperties.internalDisabled = shouldBeDisabled;
                    properties.needsUpdate = true;
                }
                if (column.editProperties.internalReadonly !== shouldBeReadonly) {
                    column.editProperties.internalReadonly = shouldBeReadonly;
                    properties.needsUpdate = true;
                }
            }
        }
        if (properties?.needsUpdate) {
            this.changeDetector.markForCheck();
        }
        return currentData;
    }
    /**
     * Avalia um estado dinâmico (disabled/readonly) para uma coluna
     */
    evaluateDynamicState(column, rowData, property) {
        const state = column.editProperties[property];
        if (typeof state === 'function') {
            try {
                return state(rowData, column);
            } catch (error) {
                console.error(`Erro ao executar função ${property} para coluna ${column.property}:`, error);
                return false;
            }
        }
        return !!state;
    }
    /**
     * @private
     * Obtém os dados atualizados de uma propriedade considerando fieldValue
     *
     * @param property Propriedade a ser obtida
     * @param fieldValue Nome do campo aninhado (se aplicável)
     * @param formGroup FormGroup contendo os valores
     * @returns Objeto com a propriedade e valor processado
     */
    getPropertyNewData(property, fieldValue, formGroup) {
        const value = formGroup.value[property];
        return {
            [property]: value?.[fieldValue] ?? value
        };
    }
    isPoHelperTarget(target) {
        return !!target?.closest('po-helper');
    }
    /** Verifica se uma coluna é obrigatória na propriedade `editProperties` ou no `formGroupIntern` */
    isColumnRequired(property) {
        const isRequiredFromEditProperties = this.columns.some(col => col.property === property && col.editProperties?.required);
        const control = this.formGroupIntern?.get(property);
        const isRequiredFromFormGroupValidator = control?.hasValidator(Validators.required);
        const hasRequiredError = !!control?.errors?.['required'];
        return !!(isRequiredFromEditProperties || isRequiredFromFormGroupValidator || hasRequiredError);
    }
    setRowStateFilterActions() {
        const isRemovedDisabled = !this.gridData.some(item => item.$removed === true);
        this.rowStateFilterActions = [
            {
                label: this.literals.rowStateFilterActive,
                action: this.setRowStateFilter.bind(this, 'active', true)
            },
            {
                label: this.literals.rowStateFilterRemoved,
                action: this.setRowStateFilter.bind(this, 'removed', true),
                disabled: isRemovedDisabled
            }
        ];
    }
    /**
     * Define o filtro de estado das linhas a ser aplicado na exibição da grid.
     *
     * Este método permite alternar entre a visualização de itens ativos (não removidos) e itens removidos,
     * filtrando a grid com base na propriedade `$removed` dos itens. É utilizado principalmente em conjunto
     * com o recurso de edição fluida offline (**t-grid-row-actions**).
     *
     * Quando o filtro é alterado:
     * - A grid é filtrada para exibir apenas os itens que correspondem ao estado selecionado
     * - A paginação é reiniciada (`skip = 0`)
     * - O label do filtro é atualizado
     * - Os agregados totais são recalculados
     * - A seleção pode ser desabilitada (no caso de itens removidos)
     *
     * ```typescript
     * // Exibe apenas itens ativos (não removidos)
     * this.thfGrid.setRowStateFilter('active');
     *
     * // Exibe apenas itens removidos, forçando recarregamento da grid
     * this.thfGrid.setRowStateFilter('removed', true);
     *
     * // Exibe apenas itens ativos (não removidos), sem emitir evento
     * this.thfGrid.setRowStateFilter('active', false, false);
     * ```
     *
     * > Quando o filtro é alterado para `'removed'`, a seleção de linhas é desabilitada automaticamente.
     * >
     * > Ao retornar para `'active'`, a seleção é restaurada ao seu estado inicial.
     *
     * @param {('active' | 'removed')} filter - Define qual filtro será aplicado:
     * - `'active'`: Exibe apenas itens não removidos (`$removed !== true`)
     * - `'removed'`: Exibe apenas itens marcados para remoção (`$removed === true`)
     *
     * @param {boolean} [reloadGrid=false] - Indica se a grid deve ser recarregada visualmente:
     * - Quando `true`, desmarca todas as seleções, limpa itens selecionados e força uma renderização completa da grid
     * - Quando `false`, apenas aplica o filtro sem recarregar a grid
     *
     * @param {boolean} [emitEvent=true] - Indica se o evento `changeRowStateFilter` deve ser emitido após a alteração do filtro:
     * - Quando `true`, o evento é emitido com o novo valor do filtro
     * - Quando `false`, o evento não é emitido
     */
    setRowStateFilter(filter, reloadGrid = false, emitEvent = true) {
        if (reloadGrid) {
            this.show = false;
            this.unselectRows();
            this.showOnlySelectedItems.set(false);
            this.gridSelectedItems = [];
        }
        if (filter === 'removed' && this.rowStateFilter !== 'removed') {
            this.cachedFilterByColumn = this.filterByColumn;
        }
        if (filter !== 'removed' && this.rowStateFilter === 'removed' && this.cachedFilterByColumn) {
            this.filterByColumn = this.cachedFilterByColumn;
        }
        this.rowStateFilter = filter;
        this.updateVisibleActions();
        this.skip = 0;
        const filterValue = {
            logic: 'and',
            filters: []
        };
        if (filter === 'removed') {
            filterValue.filters.push({
                field: '$removed',
                operator: 'eq',
                value: true
            });
            this.rowStateFilterLabel = this.literals.rowStateFilterRemovedLabel;
            this.selectable = !!this.selectableRemoved;
        } else {
            filterValue.filters.push({
                field: '$removed',
                operator: 'neq',
                value: true
            });
            this.rowStateFilterLabel = this.literals.rowStateFilterActiveLabel;
            this.selectable = this.initialSelectable;
        }
        let gridData;
        if (this.showOnlySelectedItems()) {
            if (!this.hasActiveFilters) {
                gridData = this.mySelection;
                this.gridSelectedItems = [...this.mySelection];
            } else {
                gridData = this.gridSelectedItems.length > 0 ? this.gridSelectedItems : this.mySelection;
            }
        } else {
            gridData = this.gridData;
        }
        this.gridView = filterBy(gridData, filterValue);
        if (filter !== 'removed' && this.hasActiveFilters) {
            this.gridView = this.normalizeAndFilterGridData(this.gridView);
        }
        this.totalAggregates = this.calculateTotalAggregates();
        this.setRowStateFilterActions();
        if (reloadGrid) {
            setTimeout(() => {
                this.show = true;
                if (emitEvent) {
                    this.changeRowStateFilter.emit(this.rowStateFilter);
                }
            }, 100);
        }
    }
    /** Aplica o filtro armazenado na propriedade `rowStateFilter` com debounce */
    applyRowStateFilterDebounced() {
        if (this.rowStateFilterApplyDebouncedTimeout) {
            clearTimeout(this.rowStateFilterApplyDebouncedTimeout);
        }
        this.rowStateFilterApplyDebouncedTimeout = setTimeout(() => {
            this.rowStateFilterApplyDebouncedTimeout = null;
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
            this.setRowStateFilter(this.rowStateFilter);
        }, 50);
    }
    /** Aplica o filtro armazenado na propriedade `rowStateFilter` imediatamente */
    applyRowStateFilterImmediate() {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        this.setRowStateFilter(this.rowStateFilter);
    }
    /** Manipula a exibição de apenas itens selecionados na grid */
    handleShowOnlySelectedItems(showOnlySelectedItems) {
        if (!showOnlySelectedItems) {
            this.selectableEntireLine = this.initialSelectableEntireLine;
            this.applyRowStateFilterImmediate();
            this.onSelectedKeysChange();
            return;
        }
        this.show = false;
        this.selectableEntireLine = false;
        this.gridSelectedItems = this.gridView.filter(item => item.$selected);
        this.applyRowStateFilterImmediate();
        this.totalAggregates = this.calculateTotalAggregates();
        this.onSelectedKeysChange();
        this.setDropdownActions();
        setTimeout(() => {
            this.show = true;
        }, 100);
    }
    // Retorna o título do modal destrutivo com base no tipo de ação
    getDestructiveModalTitle(actionType) {
        const destructiveModalTitles = {
            [ThfGridEditModeActionType.Add]: this.literals.gridRowActionsConfirmAddTitle,
            [ThfGridEditModeActionType.Replace]: this.literals.gridRowActionsConfirmEditTitle,
            [ThfGridEditModeActionType.Remove]: this.literals.gridRowActionsConfirmRemoveTitle
        };
        return destructiveModalTitles[actionType];
    }
    toggleShowOnlyRequiredFields() {
        this.showOnlyRequiredFields.set(!this.showOnlyRequiredFields());
    }
    hideChangeRequiredFieldsToaster(event) {
        if (event) {
            this.showValidationErrorToaster = false;
        }
    }
    getSelectedItemsLabel() {
        const count = this.mySelection?.length ?? 0;
        return `${count} ${count === 1 ? this.literals.selectedItemsSingleLabel : this.literals.selectedItemsMultipleLabel}`;
    }
    getNoDataRowStateFilterLabel() {
        if (this.rowStateFilter === 'removed') {
            return this.literals.noDataRowStateFilterRemoved;
        } else {
            return this.literals.noDataRowStateFilterActive;
        }
    }
    getNoDataRowStateFilterDescription() {
        if (this.rowStateFilter === 'removed') {
            return this.literals.noDataDescriptionRowStateFilterRemoved;
        } else {
            return this.literals.noDataDescriptionRowStateFilterActive;
        }
    }
    selectedAggregate({ property, aggregate }) {
        if (!aggregate) {
            this.aggregatesDescriptor = this.aggregatesDescriptor.filter(x => x.field != property);
        } else {
            const find = this.aggregatesDescriptor.find(x => x.field === property);
            if (!find) {
                const label = this.columns.find(x => x.property === property)?.label ?? property;
                this.aggregatesDescriptor.push({
                    field: property,
                    aggregate,
                    label
                });
            } else {
                find.aggregate = aggregate;
            }
            this.aggregatesDescriptor = [...this.aggregatesDescriptor];
        }
        this.totalAggregates = this.calculateTotalAggregates();
        if (this.group.length) {
            const aggregates = this.createAggregateDescriptors(this.aggregatesDescriptor);
            this.group = this.group.map(group => ({
                field: group.field,
                aggregates: aggregates
            }));
        }
        this.changeAggregate.emit(this.aggregatesDescriptor);
    }
    //#region Métodos relacionados ao filtro por coluna
    setPopupFilterProperties(column) {
        this.popupFiltersActions = [
            {
                icon: this.sort[0]?.dir === 'asc' && this.sort[0]?.field === this.filterByColumnName ? 'ICON_FILL_SORT_DESCENDING' : 'ICON_SORT_DESCENDING',
                label: this.literals.orderAsc,
                action: actions => {
                    if (actions.selected) {
                        this.sortChange([
                            {
                                dir: undefined,
                                field: this.filterByColumnName
                            }
                        ]);
                    } else {
                        this.sortChange([
                            {
                                dir: 'asc',
                                field: this.filterByColumnName
                            }
                        ]);
                    }
                    this.setIconFilterByColumn();
                },
                visible: this.sortable,
                selected: this.sort[0]?.dir === 'asc' && this.sort[0]?.field === this.filterByColumnName
            },
            {
                icon: this.sort[0]?.dir === 'desc' && this.sort[0]?.field === this.filterByColumnName ? 'ICON_FILL_SORT_ASCENDING' : 'ICON_SORT_ASCENDING',
                label: this.literals.orderDesc,
                action: actions => {
                    if (actions.selected) {
                        this.sortChange([
                            {
                                dir: undefined,
                                field: this.filterByColumnName
                            }
                        ]);
                    } else {
                        this.sortChange([
                            {
                                dir: 'desc',
                                field: this.filterByColumnName
                            }
                        ]);
                    }
                    this.setIconFilterByColumn();
                },
                visible: this.sortable,
                selected: this.sort[0]?.dir === 'desc' && this.sort[0]?.field === this.filterByColumnName
            },
            {
                icon: 'ICON_FUNNEL_X',
                label: this.literals.removeFilter,
                disabled: !this.hasFilterInColumn(column?.field),
                separator: this.sortable,
                action: () => this.removeFilterByColumn()
            },
            {
                icon: this.hasFilterInColumn(column?.field) ? 'ICON_FILL_FILTER' : 'ICON_FILTER',
                label: this.literals.filterByColumn,
                selected: this.activesFilterByColumn?.includes(column?.field),
                $subItemTemplate: this.templateFiltersColumn
            }
        ];
        if (column) {
            this.changeDetector?.detectChanges();
        } else {
            this.setIconFilterByColumn();
        }
    }
    setIconFilterByColumn() {
        const sortDir = this.sort[0]?.dir;
        const isCurrentSort = this.sort[0]?.field === this.filterByColumnName;
        const isCurrentFilterable = this.columns.find(col => col.property === this.filterByColumnName && col.filter === true);
        const hasMultipleFilters = isCurrentFilterable && this.sortable;
        const isFilterByColumnActive = this.activesFilterByColumn?.includes(this.filterByColumnName);
        const isCurrentSortActive = isCurrentSort && sortDir;
        this.iconFilterByColumn[this.filterByColumnName] = 'ICON_MORE_VERT';
        if ((isFilterByColumnActive || isCurrentSortActive) && hasMultipleFilters) {
            this.iconFilterByColumn[this.filterByColumnName] = 'ICON_FILL_MORE_OUTLINE_VERT';
        } else if (!hasMultipleFilters && isCurrentFilterable) {
            if (isFilterByColumnActive) {
                this.iconFilterByColumn[this.filterByColumnName] = 'ICON_FILL_FILTER';
            } else {
                this.iconFilterByColumn[this.filterByColumnName] = 'ICON_FILTER';
            }
        }
    }
    getIconFilter(column) {
        const field = column && (column.field || column.property);
        const customIcon = this.iconFilterByColumn && field ? this.iconFilterByColumn[field] : undefined;
        if (this.sortable) {
            return customIcon || 'ICON_MORE_VERT';
        }
        return customIcon || 'ICON_FILTER';
    }
    openPopupByColumn(column, pop, event) {
        if (event && event?.code !== 'Enter' && event?.code !== 'Space') return;
        const currentPopup = this.poPopupFilters.find(popup => popup.id === pop.id);
        if (!currentPopup?.showPopup) {
            this.filterByColumnName = column.field;
            this.initializeFilterByColumnForm();
            this.setModelsFilterByColumn(column);
            this.setPopupFilterProperties(column);
            this.onOperatorChange(this.modelsColumn1[column.field], column.field, 1);
            this.onOperatorChange(this.modelsColumn2[column.field], column.field, 2);
        }
        currentPopup?.toggle();
    }
    closePopupByColumn() {
        const currentPopup = this.poPopupFilters.find(popup => popup.showPopup === true);
        currentPopup?.close();
    }
    onKeydownTabFilterByColumnButton(event) {
        if (event.key !== 'Tab' || event.shiftKey) {
            return;
        }
        this.closePopupByColumn();
        if (!this.gridRowActions) return;
        event.preventDefault();
        event.stopPropagation();
        const activeFilterColumnIndex = this.gridComponent.columns.toArray().findIndex(col => col?.field === this.filterByColumnName);
        if (activeFilterColumnIndex === -1) {
            this.gridComponent.focusNextCell();
        } else {
            this.gridComponent.focusCell(0, activeFilterColumnIndex);
        }
    }
    onOperatorChange(operator, field, pos) {
        this.updateFilterState(field, pos, operator, true);
    }
    classifyFilterColumns(activeFilters) {
        const numericColumns = [];
        const timeColumns = [];
        const nonNumericColumns = [];
        for (const col of activeFilters) {
            if (col?.type === 'currency' || col?.type === 'number') {
                const locale = col?.locale || col?.editProperties?.locale || this.languageService.getShortLanguage();
                const parts = new Intl.NumberFormat(locale).formatToParts(1000.1);
                numericColumns.push({
                    prop: col.property,
                    groupSep: new RegExp(`\\${parts.find(p => p.type === 'group')?.value || '.'}`, 'g'),
                    decimalSep: new RegExp(`\\${parts.find(p => p.type === 'decimal')?.value || ','}`, 'g')
                });
                continue;
            }
            if (col?.type === 'time' && col?.editProperties?.componentEditable === 'timepicker') {
                timeColumns.push(col.property);
                continue;
            }
            nonNumericColumns.push(col.property);
        }
        return {
            numericColumns,
            timeColumns,
            nonNumericColumns
        };
    }
    normalizeNumericColumnValue(value, groupSep, decimalSep) {
        const normalized = String(value)
            .replace(groupSep, '')
            .replace(decimalSep, '.')
            .replace(/[^0-9.-]/g, '');
        return parseFloat(normalized);
    }
    processSerializedGridData(gridSerializedData, gridData, numericColumns, timeColumns, nonNumericColumns) {
        const originalDataMap = new Map(gridData.map(item => [item.$gridItemId, item]));
        for (const item of gridSerializedData) {
            const gridDataItem = originalDataMap.get(item.$gridItemId);
            for (const col of numericColumns) {
                item[col.prop] = this.normalizeNumericColumnValue(item[col.prop], col.groupSep, col.decimalSep);
            }
            for (const prop of timeColumns) {
                item[prop] = convertTimeToSeconds(gridDataItem[prop]);
            }
            for (const prop of nonNumericColumns) {
                item[prop] = gridDataItem[prop];
            }
        }
    }
    normalizeAndFilterGridData(gridData) {
        const activeFilters = this.columns.filter(col => this.hasFilterInColumn(col.property));
        if (!activeFilters.length) return gridData;
        const { numericColumns, timeColumns, nonNumericColumns } = this.classifyFilterColumns(activeFilters);
        let gridSerializedData = gridData;
        if (numericColumns.length > 0 || timeColumns.length > 0) {
            gridSerializedData = this.thfGridFormatService.formatGridDataSync(activeFilters, gridData, this.literals, true);
            this.processSerializedGridData(gridSerializedData, gridData, numericColumns, timeColumns, nonNumericColumns);
        }
        const filteredFormatedData = filterBy(gridSerializedData, this.filterByColumn);
        const allowedIds = new Set(filteredFormatedData.map(i => i.$gridItemId));
        return gridData.filter(item => allowedIds.has(item.$gridItemId));
    }
    // aplica filtros por coluna
    executeFilterOperations() {
        if (this.gridRowActions && this.rowStateFilter === 'active') {
            this.setRowStateFilter(this.rowStateFilter, false, false);
        } else {
            const gridData = this.searchTerm ? this.gridData : this.gridOriginalData;
            this.gridData = this.normalizeAndFilterGridData(gridData);
            this.gridView = this.gridData;
        }
    }
    setModelsFilterByColumn(column) {
        const optionsDefault = this.setColumnFilterType(column);
        // Função utilitária pra reduzir repetição
        const ensureValue = (obj, key, defaultValue) => ({
            ...obj,
            [key]: obj[key] ?? defaultValue
        });
        this.modelsColumn1 = ensureValue(this.modelsColumn1, column.field, optionsDefault);
        this.modelsColumn2 = ensureValue(this.modelsColumn2, column.field, optionsDefault);
        this.inputModelsColumn1 = ensureValue(this.inputModelsColumn1, column.field, undefined);
        this.inputModelsColumn2 = ensureValue(this.inputModelsColumn2, column.field, undefined);
        this.modelsOperatorsColumn = ensureValue(this.modelsOperatorsColumn, column.field, this.typeFilterByColumn[column?.field] === 'boolean' ? 'or' : 'and');
        this.filterByColumnForm.patchValue({
            modelsColumn1: this.modelsColumn1[column.field],
            inputModelsColumn1: this.inputModelsColumn1[column.field],
            modelsOperatorsColumn: this.modelsOperatorsColumn[column.field],
            modelsColumn2: this.modelsColumn2[column.field],
            inputModelsColumn2: this.inputModelsColumn2[column.field]
        });
    }
    setColumnFilterType(column) {
        const currentColumn = this.columns.find(col => col.property === column.field);
        const property = currentColumn?.property;
        // Define o tipo de filtro e as opções com base no tipo da coluna (por padrão é string)
        let filterType = 'string';
        this.selectOptions = this.stringOptions;
        let operator = 'contains';
        switch (currentColumn?.type) {
            case 'number':
            case 'currency':
                filterType = 'number';
                this.selectOptions = this.numberOptions;
                operator = 'eq';
                break;
            case 'date':
                filterType = 'date';
                this.selectOptions = this.dateOptions;
                operator = 'gte';
                break;
            case 'boolean':
                filterType = 'boolean';
                this.selectOptions = this.dateOptions;
                operator = 'eq';
                break;
            case 'time':
                if (this.currentfilterByColumn?.editProperties?.componentEditable === 'timepicker') {
                    filterType = 'time';
                    this.selectOptions = this.dateOptions;
                    operator = 'eq';
                }
                break;
        }
        if (property) {
            this.typeFilterByColumn[property] = filterType;
        }
        return operator;
    }
    handleApplyFilterButton() {
        this.isLoading = true;
        setTimeout(async () => {
            await this.filterByColumnChange();
            this.isLoading = false;
        }, 0);
    }
    async filterByColumnChange(keydown) {
        if (!keydown) {
            await this.setGridOriginalData();
            const field = this.filterByColumnName;
            const operator1 = this.filterByColumnForm.get('modelsColumn1')?.value;
            const operator2 = this.filterByColumnForm.get('modelsColumn2')?.value;
            const value1 = this.filterByColumnForm.get('inputModelsColumn1')?.value;
            const value2 = this.filterByColumnForm.get('inputModelsColumn2')?.value;
            const logic = this.filterByColumnForm.get('modelsOperatorsColumn')?.value;
            this.modelsColumn1[field] = operator1;
            this.modelsColumn2[field] = operator2;
            this.inputModelsColumn1[field] = value1;
            this.inputModelsColumn2[field] = value2;
            this.modelsOperatorsColumn[field] = logic;
            if (this.shouldActivateColumnFilter(field, operator1, operator2, value1, value2)) {
                if (!this.activesFilterByColumn.includes(field)) {
                    this.activesFilterByColumn.push(field);
                }
            } else {
                this.activesFilterByColumn = this.activesFilterByColumn.filter(f => f !== field);
            }
            this.setFilterByColumn();
            this.setIconFilterByColumn();
        }
        const currentPopup = this.poPopupFilters.find(popup => popup.showPopup);
        currentPopup?.toggle();
    }
    buildFilterByColumnProps() {
        return Object.keys(this.modelsColumn1 || {})
            .map(column => {
                const logic = this.modelsOperatorsColumn[column];
                const operator1 = this.modelsColumn1[column];
                const operator2 = this.modelsColumn2[column];
                const value1 = this.inputModelsColumn1[column];
                const value2 = this.inputModelsColumn2[column];
                const hasValue1 = value1 !== undefined && value1 !== null && value1 !== '';
                const hasValue2 = value2 !== undefined && value2 !== null && value2 !== '';
                const isSpecialOp = this.operatorsWithoutValue.includes(operator1) || this.operatorsWithoutValue.includes(operator2);
                if (!hasValue1 && !hasValue2 && !isSpecialOp) {
                    return null;
                }
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
                return {
                    property: column,
                    logic,
                    operator1,
                    value1,
                    operator2,
                    value2
                };
            })
            .filter(item => item !== null);
    }
    setFilterByColumn() {
        const columnKeys = Object.keys(this.modelsColumn1 || {});
        const filtersByColumn = [];
        columnKeys.forEach(column => {
            const currentColumn = this.columns.find(col => col.property === column);
            const operator1 = this.modelsColumn1[column];
            const operator2 = this.modelsColumn2[column];
            let value2 = this.inputModelsColumn2[column];
            if (this.typeFilterByColumn[column] === 'boolean') {
                this.inputModelsColumn1[column] = this.inputModelsColumn1[column] ? true : undefined;
                value2 = this.inputModelsColumn2[column] ? false : undefined;
            }
            let value1 = this.inputModelsColumn1[column];
            if (this.typeFilterByColumn[column] === 'time') {
                if (this.inputModelsColumn1[column]) {
                    value1 = convertTimeToSeconds(this.inputModelsColumn1[column]);
                }
                if (this.inputModelsColumn2[column]) {
                    value2 = convertTimeToSeconds(this.inputModelsColumn2[column]);
                }
            }
            const logic = this.modelsOperatorsColumn[column] || 'and';
            const columnFilters = [];
            const columnField = currentColumn?.editProperties?.controlValueWithLabel ? `$${column}_label` : column;
            const addFilterIfNeeded = (operator, value) => {
                const hasValue = value !== undefined && value !== null && value !== '';
                if (this.operatorsWithoutValue.includes(operator) || hasValue) {
                    columnFilters.push({
                        field: columnField,
                        operator,
                        value
                    });
                }
            };
            addFilterIfNeeded(operator1, value1);
            addFilterIfNeeded(operator2, value2);
            if (columnFilters.length) {
                filtersByColumn.push({
                    logic,
                    filters: columnFilters
                });
            }
        });
        this.filterByColumn = {
            logic: 'and',
            filters: filtersByColumn
        };
        this.hasActiveFilters = !!this.filterByColumn?.filters?.length;
        this.executeFilterOperations();
        this.totalAggregates = this.calculateTotalAggregates();
        this.changeFilterByColumn.emit(this.buildFilterByColumnProps());
        if ((this.mySelection.length > 0 && this.hasActiveFilters) || this.gridView?.length > 0) {
            this.onSelectedKeysChange();
            this.setDropdownActions();
        }
    }
    hasFilterInColumn(column) {
        if (!this.activesFilterByColumn.includes(column)) {
            return false;
        }
        return this.shouldActivateColumnFilter(
            column,
            this.modelsColumn1[column],
            this.modelsColumn2[column],
            this.inputModelsColumn1[column],
            this.inputModelsColumn2[column]
        );
    }
    // detecta filtros sem valor ou com valor
    shouldActivateColumnFilter(field, operator1, operator2, value1, value2) {
        const operatorWithoutValue = this.operatorsWithoutValue.includes(operator1) || this.operatorsWithoutValue.includes(operator2);
        const valueExists = (value1 !== undefined && value1 !== null && value1 !== '') || (value2 !== undefined && value2 !== null && value2 !== '');
        const booleanHasValue = this.typeFilterByColumn[field] === 'boolean' && (value1 !== undefined || value2 !== undefined);
        return operatorWithoutValue || valueExists || booleanHasValue;
    }
    // atualiza estado de bloqueio e limpa os campos de valores quando operados do tipo operatorsWithoutValue
    updateFilterState(field, pos, operator, clearValues) {
        const blocked = this.operatorsWithoutValue.includes(operator);
        const formControlName = `inputModelsColumn${pos}`;
        if (!blocked) {
            this.filterByColumnForm.get(formControlName)?.enable();
            return;
        }
        if (blocked && clearValues) {
            this.filterByColumnForm.patchValue({
                [formControlName]: this.typeFilterByColumn[field] === 'string' ? '' : undefined
            });
            this.filterByColumnForm.get(formControlName)?.disable();
        }
    }
    verifyFilterByColumn() {
        if (this.hasActiveFilters) {
            this.executeFilterOperations();
        }
    }
    resetFilterColumn(clearValues = true) {
        const field = this.filterByColumnName;
        if (!field) return;
        const defaultOperator = this.setColumnFilterType({
            field
        });
        this.modelsColumn1[field] = defaultOperator;
        this.modelsColumn2[field] = undefined;
        this.modelsOperatorsColumn[field] = this.typeFilterByColumn[field] === 'boolean' ? 'or' : 'and';
        if (clearValues) {
            this.inputModelsColumn1[field] = undefined;
            this.inputModelsColumn2[field] = undefined;
        }
        this.updateFilterState(field, 1, this.modelsColumn1[field], clearValues);
        this.updateFilterState(field, 2, this.modelsColumn2[field], clearValues);
        this.activesFilterByColumn = this.activesFilterByColumn.filter(f => f !== field);
        this.setIconFilterByColumn();
        this.filterByColumnName = '';
    }
    removeFilterByColumn() {
        this.resetFilterColumn();
        this.setFilterByColumn();
        const currentPopup = this.poPopupFilters.find(popup => popup.showPopup);
        currentPopup?.toggle();
        this.filterByColumnName = '';
        if (this.searchTerm) {
            this.onFilterInputHandle();
        }
        this.changeDetector.detectChanges();
    }
    onFilterColumnProperties(items) {
        if (items && !this.initialFilterColumnProps) return;
        if (this.filterColumnProperties?.length > 0) {
            this.applyFilterByColumnProps(this.filterColumnProperties);
        }
    }
    /**
     * Aplica filtro por coluna com base no parâmetro fornecido.
     *
     * ```typescript
     * // Aplica filtro na coluna 'email' para exibir itens cujo e-mail:
     * // - contém 'gmail'
     * // - e não contém 'teste'
     *
     * const filter: Array<ThfFilterByColumn> = [
     *   {
     *     property: 'email',
     *     logic: 'and',
     *     operator1: 'contains',
     *     value1: 'gmail',
     *     operator2: 'doesnotcontain',
     *     value2: 'teste'
     *   }
     * ];
     * this.gridComponent.applyFilterByColumnProps(filter);
     *
     * > Requer que a propriedade `filter` esteja habilitada na coluna.
     *
     * ```
     * @param {Array<ThfFilterByColumn>} filterColumnProps - Lista de filtros a serem aplicados.
     */
    applyFilterByColumnProps(filterColumnProps) {
        if (!filterColumnProps?.length) {
            Object.keys(this.inputModelsColumn1).forEach(key => {
                this.filterByColumnName = key;
                this.resetFilterColumn();
            });
        }
        filterColumnProps.forEach(props => {
            const column = this.columns.find(col => col.property === props.property);
            if (!column?.filter) return;
            if (column.type !== 'boolean') {
                this.inputModelsColumn1[props.property] = props.value1;
                this.inputModelsColumn2[props.property] = props.value2;
                this.modelsColumn1[props.property] = props.operator1;
                this.modelsColumn2[props.property] = props.operator2;
                this.modelsOperatorsColumn[props.property] = props.logic;
            } else {
                this.modelsColumn1[props.property] = 'eq';
                if (props.value1) {
                    this.inputModelsColumn1[props.property] = true;
                } else {
                    this.inputModelsColumn2[props.property] = true;
                }
            }
            const operator1 = props.operator1;
            const operator2 = props.operator2;
            const value1 = props.value1;
            const value2 = props.value2;
            if (this.shouldActivateColumnFilter(props.property, operator1, operator2, value1, value2)) {
                if (!this.activesFilterByColumn.includes(props.property)) {
                    this.activesFilterByColumn.push(props.property);
                }
            } else {
                this.activesFilterByColumn = this.activesFilterByColumn.filter(filter => filter !== props.property);
            }
            this.filterByColumnName = props.property;
            this.setIconFilterByColumn();
        });
        this.filterByColumnName = '';
        this.setFilterByColumn();
        this.initialFilterColumnProps = false;
        this.changeDetector.detectChanges();
    }
    initializeFilterByColumnForm() {
        this.filterByColumnForm = new FormGroup({
            modelsColumn1: new FormControl(''),
            inputModelsColumn1: new FormControl(''),
            modelsOperatorsColumn: new FormControl(''),
            modelsColumn2: new FormControl(''),
            inputModelsColumn2: new FormControl('')
        });
    }
    isFilterByColumnButton(target) {
        return !!target.closest('.container-buttons-filters');
    }
    updateEditableControlsSet() {
        this.editableControlsSet.clear();
        if (!(this.isInEditingMode || this.isInRowsActionsMode) || !this.formGroupIntern?.controls) {
            return;
        }
        Object.keys(this.formGroupIntern.controls).forEach(controlName => this.editableControlsSet.add(controlName));
    }
    getColumnDecimalsLength(column) {
        const decimalsLength = column?.editProperties?.decimalsLength;
        if (column?.type === 'currency') {
            return decimalsLength;
        }
        if (column?.type === 'number') {
            const format = column?.format;
            let match;
            if (format) {
                const regex = /\.(\d+)(-(\d+))?$/;
                match = new RegExp(regex).exec(format);
                if (match) {
                    const length = match[3] || match[1];
                    return Number.parseInt(length, 10);
                }
            }
            if ((!format || !match) && !decimalsLength) {
                return 3;
            }
        }
        return decimalsLength;
    }
    getCachedTagHtml(property, value) {
        const html = this.thfGridZombieTag.getCachedTagHtml(property, value);
        if (!html) {
            return null;
        }
        const key = `${property}::${typeof value}::${String(value)}`;
        const cachedTag = this.safeTagHtmlCache.get(key);
        if (cachedTag?.rawHtml === html) {
            return cachedTag.safeHtml;
        }
        const safeHtml = this.sanitizer.bypassSecurityTrustHtml(html);
        this.safeTagHtmlCache.set(key, {
            rawHtml: html,
            safeHtml
        });
        return safeHtml;
    }
    static {
        this.ɵfac = function ThfGridComponent_Factory(__ngFactoryType__) {
            return new (__ngFactoryType__ || ThfGridComponent)(
                i0.ɵɵdirectiveInject(i1.PoDialogService),
                i0.ɵɵdirectiveInject(i1.PoLanguageService),
                i0.ɵɵdirectiveInject(i2.ActivatedRoute),
                i0.ɵɵdirectiveInject(i0.ChangeDetectorRef),
                i0.ɵɵdirectiveInject(i1.PoNotificationService),
                i0.ɵɵdirectiveInject(ThfGridService),
                i0.ɵɵdirectiveInject(i0.Renderer2),
                i0.ɵɵdirectiveInject(i0.ElementRef),
                i0.ɵɵdirectiveInject(i4.DomSanitizer)
            );
        };
    }
    static {
        this.ɵcmp = /* @__PURE__ */ i0.ɵɵdefineComponent({
            type: ThfGridComponent,
            selectors: [['thf-grid']],
            contentQueries: function ThfGridComponent_ContentQueries(rf, ctx, dirIndex) {
                if (rf & 1) {
                    i0.ɵɵcontentQuery(dirIndex, ThfGridCellTemplateDirective, 5)(dirIndex, ThfGridColumnTemplateDirective, 4);
                }
                if (rf & 2) {
                    let _t;
                    i0.ɵɵqueryRefresh((_t = i0.ɵɵloadQuery())) && (ctx.tableCellTemplate = _t.first);
                    i0.ɵɵqueryRefresh((_t = i0.ɵɵloadQuery())) && (ctx.tableColumnTemplates = _t);
                }
            },
            viewQuery: function ThfGridComponent_Query(rf, ctx) {
                if (rf & 1) {
                    i0.ɵɵviewQuery(GridComponent, 5)(_c45, 5)(_c46, 7)(_c47, 7)(PoModalComponent, 7)(_c48, 5)(_c49, 5)(_c50, 5)(_c51, 5)(
                        _c52,
                        5,
                        ViewContainerRef
                    )(TooltipDirective, 5)(_c53, 5)(_c54, 7)(_c55, 5)(_c56, 5)(_c57, 5);
                }
                if (rf & 2) {
                    let _t;
                    i0.ɵɵqueryRefresh((_t = i0.ɵɵloadQuery())) && (ctx.grid = _t.first);
                    i0.ɵɵqueryRefresh((_t = i0.ɵɵloadQuery())) && (ctx.poPopupComponent = _t.first);
                    i0.ɵɵqueryRefresh((_t = i0.ɵɵloadQuery())) && (ctx.templateFiltersColumn = _t.first);
                    i0.ɵɵqueryRefresh((_t = i0.ɵɵloadQuery())) && (ctx.targetIconFiltersRef = _t.first);
                    i0.ɵɵqueryRefresh((_t = i0.ɵɵloadQuery())) && (ctx.poModal = _t.first);
                    i0.ɵɵqueryRefresh((_t = i0.ɵɵloadQuery())) && (ctx.modalDelete = _t.first);
                    i0.ɵɵqueryRefresh((_t = i0.ɵɵloadQuery())) && (ctx.modalDestructiveAction = _t.first);
                    i0.ɵɵqueryRefresh((_t = i0.ɵɵloadQuery())) && (ctx.gridComponent = _t.first);
                    i0.ɵɵqueryRefresh((_t = i0.ɵɵloadQuery())) && (ctx.inputSearch = _t.first);
                    i0.ɵɵqueryRefresh((_t = i0.ɵɵloadQuery())) && (ctx.gridEditContainer = _t.first);
                    i0.ɵɵqueryRefresh((_t = i0.ɵɵloadQuery())) && (ctx.tooltipDir = _t.first);
                    i0.ɵɵqueryRefresh((_t = i0.ɵɵloadQuery())) && (ctx.requiredFieldsToaster = _t.first);
                    i0.ɵɵqueryRefresh((_t = i0.ɵɵloadQuery())) && (ctx.thfGridContainer = _t.first);
                    i0.ɵɵqueryRefresh((_t = i0.ɵɵloadQuery())) && (ctx.thfGridEdit = _t);
                    i0.ɵɵqueryRefresh((_t = i0.ɵɵloadQuery())) && (ctx.thfGridInlineEdit = _t);
                    i0.ɵɵqueryRefresh((_t = i0.ɵɵloadQuery())) && (ctx.poPopupFilters = _t);
                }
            },
            hostBindings: function ThfGridComponent_HostBindings(rf, ctx) {
                if (rf & 1) {
                    i0.ɵɵlistener(
                        'resize',
                        function ThfGridComponent_resize_HostBindingHandler() {
                            return ctx.onResize();
                        },
                        i0.ɵɵresolveWindow
                    );
                }
            },
            features: [i0.ɵɵProvidersFeature([ThfGridUtilsService]), i0.ɵɵInheritDefinitionFeature, i0.ɵɵNgOnChangesFeature],
            decls: 30,
            vars: 44,
            consts: [
                ['template', ''],
                ['templateShowOnlySelectedSwitch', ''],
                ['thfGridContainer', ''],
                ['thfGridTemplate', ''],
                ['popup', ''],
                ['poModal', ''],
                ['modalDelete', ''],
                ['modalDestructiveAction', ''],
                ['templateIconNotFixed', ''],
                ['templateIconFixed', ''],
                ['templateFiltersColumn', ''],
                ['grid', 'kendoGrid'],
                ['colunsCustom', ''],
                ['inputSearch', ''],
                ['requiredFieldsToaster', ''],
                ['popupTarget', ''],
                ['aggregateTemplate', ''],
                ['thfGridInlineEdit', ''],
                ['thfGridEdit', ''],
                ['notFilterableTemp', ''],
                ['targetIconFiltersRef', ''],
                ['poPopupFilters', ''],
                [1, 'thf-grid-container'],
                ['p-no-padding', ''],
                [3, 'ngTemplateOutlet'],
                [
                    3,
                    't-change-fixed-columns',
                    't-change-loading',
                    't-change-order-column',
                    't-change-options-column-manager',
                    't-change-visible-columns',
                    't-change-page-size',
                    't-changed-density',
                    't-restore-column-manager',
                    't-literals',
                    't-changed-density-option',
                    't-columns',
                    't-columns-change-fixed',
                    't-components-size',
                    't-default-columns',
                    't-default-frozen-columns',
                    't-draggable',
                    't-groupable',
                    't-hide-action-fixed-columns',
                    't-max-columns',
                    't-max-columns-grid',
                    't-options-paging',
                    't-page-size',
                    't-show-page-size',
                    't-verify-action-fixed',
                    't-virtual-columns',
                    't-visible-columns',
                    't-show-column-manager',
                    't-show-densification-configuration'
                ],
                [3, 'p-size', 'p-target'],
                [3, 'p-components-size', 'p-title', 'p-hide-close', 'p-primary-action', 'p-secondary-action'],
                [3, 'p-components-size', 'p-fields', 'p-value', 4, 'ngIf'],
                ['p-size', 'small', 3, 'p-components-size', 'p-primary-action', 'p-secondary-action', 'p-title', 'p-click-out'],
                ['p-size', 'small', 3, 'p-close', 'p-icon', 'p-components-size', 'p-primary-action', 'p-secondary-action', 'p-title', 'p-click-out'],
                ['p-tooltip-position', 'top', 3, 'ngModel', 'p-size', 'p-label-off', 'p-label-on', 'p-label-position', 'p-tooltip'],
                ['p-tooltip-position', 'top', 3, 'ngModelChange', 'ngModel', 'p-size', 'p-label-off', 'p-label-on', 'p-label-position', 'p-tooltip'],
                ['kendoTooltip', '', 'showOn', 'none', 'position', 'bottom', 'filter', '.k-grid td', 3, 'mouseover', 'tooltipTemplate'],
                [
                    3,
                    'id',
                    'data',
                    'groupable',
                    'group',
                    'height',
                    'scrollable',
                    'skip',
                    'rowHeight',
                    'pageSize',
                    'kendoGridBinding',
                    'kendoGridSelectBy',
                    'loading',
                    'resizable',
                    'reorderable',
                    'selectable',
                    'sort',
                    'sortable',
                    'selectedKeys',
                    'rowClass',
                    'text-wrap',
                    'hidden-grid',
                    'grid-row-actions',
                    'grid-header-fixed',
                    'grid-header-fixed-with-groupable',
                    'navigable',
                    'virtualColumns',
                    'groupChange',
                    'columnResize',
                    'columnReorder',
                    'selectionChange',
                    'selectedKeysChange',
                    'cellClick',
                    'sortChange',
                    'keydown',
                    'pageChange',
                    4,
                    'ngIf'
                ],
                ['class', 'po-row thf-grid-footer-show-more', 4, 'ngIf'],
                [4, 'ngIf'],
                [
                    3,
                    'groupChange',
                    'columnResize',
                    'columnReorder',
                    'selectionChange',
                    'selectedKeysChange',
                    'cellClick',
                    'sortChange',
                    'keydown',
                    'pageChange',
                    'id',
                    'data',
                    'groupable',
                    'group',
                    'height',
                    'scrollable',
                    'skip',
                    'rowHeight',
                    'pageSize',
                    'kendoGridBinding',
                    'kendoGridSelectBy',
                    'loading',
                    'resizable',
                    'reorderable',
                    'selectable',
                    'sort',
                    'sortable',
                    'selectedKeys',
                    'rowClass',
                    'navigable',
                    'virtualColumns'
                ],
                ['kendoGridNoRecordsTemplate', ''],
                [
                    'class',
                    'k-table-td-select checkbox-phosphor',
                    'headerClass',
                    'k-table-th-select checkbox-phosphor',
                    3,
                    'columnMenu',
                    'reorderable',
                    'resizable',
                    'width',
                    4,
                    'ngIf'
                ],
                [4, 'ngTemplateOutlet'],
                ['fileName', 'tabela.pdf', 3, 'repeatHeaders'],
                ['fileName', 'tabela.xlsx', 3, 'fetchData'],
                ['kendoGridLoadingTemplate', ''],
                ['aria-live', 'polite', 'tabindex', '-1', 1, 'grid-no-data-container'],
                ['p-kind', 'tertiary', 'p-icon', 'ICON_PLUS', 1, 'toolbar-edit-row-button-include', 3, 'p-label', 'p-size', 'p-disabled'],
                ['p-kind', 'tertiary', 'p-icon', 'ICON_PLUS', 1, 'toolbar-edit-row-button-include', 3, 'p-click', 'p-label', 'p-size', 'p-disabled'],
                ['kendoGridToolbarTemplate', ''],
                ['class', 'po-row thf-grid-toolbar', 4, 'ngIf'],
                ['class', 'thf-grid-headertemplate', 4, 'ngIf'],
                [1, 'required-fields-toaster'],
                [1, 'po-row', 'thf-grid-toolbar'],
                ['class', 'po-sm-12 po-md-3 po-lg-3 po-xl-3 thf-grid-toolbar-content-input', 4, 'ngIf'],
                [1, 'po-md-6', 'po-sm-12', 'thf-grid-toolbar-buttons'],
                ['p-icon', 'ICON_FILTER', 'p-kind', 'tertiary', 3, 'p-label', 'p-size', 'p-click', 4, 'ngIf'],
                [1, 'po-sm-12', 'po-md-3', 'po-lg-3', 'po-xl-3', 'thf-grid-toolbar-content-input'],
                [
                    'name',
                    'input',
                    'p-icon',
                    'ICON_SEARCH',
                    1,
                    'thf-grid-toolbar-input',
                    'components-form',
                    3,
                    'keyup',
                    'ngModelChange',
                    'ngModel',
                    'p-placeholder',
                    'p-size'
                ],
                ['p-icon', 'ICON_FILTER', 'p-kind', 'tertiary', 3, 'p-click', 'p-label', 'p-size'],
                ['p-icon', 'ICON_SETTINGS', 'p-kind', 'tertiary', 3, 'p-click', 'p-aria-label', 'p-label', 'p-size'],
                [1, 'po-md-12', 'thf-grid-toolbar-items-selected', 'po-field-container-content'],
                [1, 'thf-grid-toolbar-items-selected-text', 3, 'ngPlural'],
                ['ngPluralCase', '=0'],
                ['ngPluralCase', '=1'],
                ['ngPluralCase', 'other'],
                ['p-icon', 'ICON_DELETE', 3, 'p-danger', 'p-label', 'p-disabled', 'p-size', 'p-click', 4, 'ngIf'],
                ['id', 'buttonEdit', 'class', 'po-button-edit', 'p-icon', 'ICON_EDIT', 3, 'p-label', 'p-disabled', 'p-size', 'p-click', 4, 'ngIf'],
                [3, 'p-label', 'p-actions', 'p-disabled', 'p-size', 4, 'ngIf'],
                ['p-icon', 'ICON_DELETE', 3, 'p-click', 'p-danger', 'p-label', 'p-disabled', 'p-size'],
                ['id', 'buttonEdit', 'p-icon', 'ICON_EDIT', 1, 'po-button-edit', 3, 'p-click', 'p-label', 'p-disabled', 'p-size'],
                [3, 'p-label', 'p-actions', 'p-disabled', 'p-size'],
                [1, 'thf-grid-toolbar-items-selected-text'],
                ['style', 'display: flex; gap: 8px', 4, 'ngIf'],
                [2, 'display', 'flex', 'gap', '8px'],
                [3, 'p-click', 'p-danger', 'p-label', 'p-size'],
                [3, 'p-click', 'p-label', 'p-disabled', 'p-size'],
                [1, 'toolbar-edit-row-actions'],
                [1, 'toolbar-edit-row-title'],
                [3, 'ngModel', 'p-size', 'p-label-off', 'p-label-on'],
                [1, 'toolbar-edit-row-content'],
                [3, 'p-label', 'p-actions', 'p-size'],
                ['p-kind', 'tertiary', 'p-icon', 'ICON_PLUS', 1, 'toolbar-edit-row-button-include', 3, 'p-label', 'p-disabled', 'p-size'],
                [3, 'ngModelChange', 'ngModel', 'p-size', 'p-label-off', 'p-label-on'],
                ['p-kind', 'tertiary', 'p-icon', 'ICON_PLUS', 1, 'toolbar-edit-row-button-include', 3, 'p-click', 'p-label', 'p-disabled', 'p-size'],
                [1, 'thf-grid-headertemplate'],
                ['p-type', 'error', 3, 'p-hide-change', 'p-message', 'p-support-message', 'p-size-actions', 'p-action', 'p-action-label'],
                [
                    'headerClass',
                    'k-table-th-select checkbox-phosphor',
                    1,
                    'k-table-td-select',
                    'checkbox-phosphor',
                    3,
                    'columnMenu',
                    'reorderable',
                    'resizable',
                    'width'
                ],
                ['kendoGridHeaderTemplate', ''],
                [
                    'type',
                    'checkbox',
                    'kendoCheckBox',
                    '',
                    'id',
                    'selectAllCheckboxId',
                    'kendoGridSelectAllCheckbox',
                    '',
                    3,
                    'selectAllChange',
                    'state',
                    'disabled'
                ],
                ['for', 'selectAllCheckboxId', 1, 'k-checkbox-label'],
                ['kendoGridCellTemplate', ''],
                ['type', 'checkbox', 'kendoCheckBox', '', 3, 'kendoGridSelectionCheckbox', 'disabled'],
                ['kendoRadioButton', '', 'type', 'radio', 3, 'keydown', 'kendoGridSelectionCheckbox', 'disabled'],
                [
                    'field',
                    'actions',
                    'title',
                    '',
                    3,
                    'class',
                    'editable',
                    'groupable',
                    'headerClass',
                    'hidden',
                    'reorderable',
                    'resizable',
                    'sticky',
                    'width',
                    4,
                    'ngIf'
                ],
                [4, 'ngFor', 'ngForOf', 'ngForTrackBy'],
                [
                    'field',
                    'actions',
                    'title',
                    '',
                    3,
                    'class',
                    'editable',
                    'groupable',
                    'resizable',
                    'reorderable',
                    'headerClass',
                    'hidden',
                    'sticky',
                    'width',
                    4,
                    'ngIf'
                ],
                ['field', 'actions', 'title', '', 3, 'editable', 'groupable', 'headerClass', 'hidden', 'reorderable', 'resizable', 'sticky', 'width'],
                ['class', 'k-cell-inner', 3, 'click', 4, 'ngIf'],
                ['class', 'thf-grid-single-action po-clickable', 3, 'thf-grid-action-disabled', 'thf-grid-single-action-content__danger', 'click', 4, 'ngIf'],
                [1, 'k-cell-inner', 3, 'click'],
                [1, 'po-clickable', 'icon-actions', 3, 'click'],
                ['class', 'po-field-icon', 'p-icon', 'ICON_MORE_VERT', 4, 'ngIf'],
                ['p-icon', 'ICON_MORE_VERT', 1, 'po-field-icon'],
                [1, 'thf-grid-single-action', 'po-clickable', 3, 'click'],
                [1, 'span-single-action', 3, 'ngClass'],
                ['class', 'po-field-icon thf-grid-single-action-content', 3, 'p-icon', 4, 'ngIf'],
                [1, 'po-field-icon', 'thf-grid-single-action-content', 3, 'p-icon'],
                [
                    1,
                    'thf-grid-content',
                    3,
                    'field',
                    'headerClass',
                    'headerStyle',
                    'hidden',
                    'sortable',
                    'title',
                    'filterable',
                    'width',
                    'reorderable',
                    'resizable',
                    'minResizableWidth',
                    'maxResizableWidth',
                    'sticky'
                ],
                ['kendoGridGroupFooterTemplate', ''],
                ['kendoGridGroupHeaderTemplate', ''],
                [
                    3,
                    't-selected-aggregate',
                    't-aggregates-config',
                    't-aggregates-descriptor',
                    't-aggregates',
                    't-column',
                    't-components-size',
                    't-exporting-excel',
                    't-footer-mode',
                    't-literals'
                ],
                [4, 'ngTemplateOutlet', 'ngTemplateOutletContext'],
                ['kendoGridFooterTemplate', ''],
                [1, 'k-cell-inner'],
                [1, 'thf-grid-content', 3, 't-columns', 't-row', 't-type', 't-column-template', 't-cel-template', 't-literals'],
                [1, 'k-cell-inner', 'thf-grid-content', 'thf-grid-cached-label-content', 3, 'innerHTML'],
                [3, 't-auto-focus', 't-components-size', 't-form-group', 't-column', 't-edit-properties', 't-is-virtual-scroll'],
                [3, 't-change-validate-edit', 't-auto-focus', 't-components-size', 't-form-group', 't-column', 't-edit-properties', 't-is-virtual-scroll'],
                [
                    3,
                    't-close-click-out-event',
                    't-change-validate-edit',
                    't-change-form',
                    'focusin',
                    't-form-group',
                    't-column',
                    't-components-size',
                    't-edit-properties',
                    't-include-mode',
                    't-is-virtual-scroll',
                    't-close-click-out',
                    't-custom-template'
                ],
                [3, 'tabIndex'],
                [3, 'focus', 'tabIndex'],
                [1, 'k-column-title', 'thf-grid-content'],
                [1, 'k-column-title-content'],
                [1, 'header-right-icon'],
                [4, 'ngIf', 'ngIfElse'],
                [1, 'header-left-icon'],
                ['p-icon', 'ICON_DRAG', 1, 'po-icon-header'],
                ['tabIndex', '-1', 1, 'po-icon-header', 'po-clickable', 'po-icon-filter-column', 3, 'click', 'keydown', 'p-icon'],
                [3, 'p-template-icon', 'p-size', 'p-actions', 'p-target'],
                ['class', 'k-sort-icon-thf', 4, 'ngIf'],
                [1, 'k-sort-icon-thf'],
                ['p-icon', 'ICON_SORT_ASC'],
                ['cdkDragHandle', '', 'p-icon', 'ICON_SORT_DESC'],
                ['p-icon', 'ICON_SORT'],
                [3, 't-column', 't-value', 't-literals'],
                ['kendoGridDetailTemplate', '', 3, 'kendoGridDetailTemplateShowIf'],
                [1, 'thf-grid', 3, 't-columns', 't-row', 't-type', 't-literals'],
                ['field', 'actions', 'title', '', 3, 'editable', 'groupable', 'resizable', 'reorderable', 'headerClass', 'hidden', 'sticky', 'width'],
                [1, 'thf-cell-overlay', 3, 'mousedown'],
                [1, 'sample-container'],
                [3, 'p-text', 'p-size'],
                [1, 'po-row', 'thf-grid-footer-show-more'],
                [1, 'po-md-12', 'thf-grid-footer-show-more-button', 3, 'p-click', 'p-disabled', 'p-label', 'p-loading', 'p-size'],
                [3, 'height', 'loading', 'data'],
                [1, 'po-md-12', 'thf-grid-footer-show-more-button', 3, 'p-disabled', 'p-label', 'p-size'],
                [3, 'p-components-size', 'p-fields', 'p-value'],
                ['xmlns', 'http://www.w3.org/2000/svg', 'width', '24', 'height', '24', 'viewBox', '0 0 24 24', 'fill', 'none'],
                ['clip-path', 'url(#clip0_12562_15948)'],
                [
                    'd',
                    'M13.7143 5.71429V10C13.7143 10.96 14.0314 11.8514 14.5714 12.5714H9.42857C9.98571 11.8343 10.2857 10.9429 10.2857 10V5.71429H13.7143ZM16.2857 4H7.71429C7.24286 4 6.85714 4.38571 6.85714 4.85714C6.85714 5.32857 7.24286 5.71429 7.71429 5.71429H8.57143V10C8.57143 11.4229 7.42286 12.5714 6 12.5714V14.2857H11.1171V20.2857L11.9743 21.1429L12.8314 20.2857V14.2857H18V12.5714C16.5771 12.5714 15.4286 11.4229 15.4286 10V5.71429H16.2857C16.7571 5.71429 17.1429 5.32857 17.1429 4.85714C17.1429 4.38571 16.7571 4 16.2857 4Z',
                    'fill',
                    'currentColor'
                ],
                ['id', 'clip0_12562_15948'],
                ['width', '24', 'height', '24', 'fill', 'currentColor'],
                ['clip-path', 'url(#clip0_12562_17487)'],
                [
                    'd',
                    'M16.2857 4H7.71429C7.24286 4 6.85714 4.38571 6.85714 4.85714C6.85714 5.32857 7.24286 5.71429 7.71429 5.71429H8.57143V10C8.57143 11.4229 7.42286 12.5714 6 12.5714V14.2857H11.1171V20.2857L11.9743 21.1429L12.8314 20.2857V14.2857H18V12.5714C16.5771 12.5714 15.4286 11.4229 15.4286 10V5.71429H16.2857C16.7571 5.71429 17.1429 5.32857 17.1429 4.85714C17.1429 4.38571 16.7571 4 16.2857 4Z',
                    'fill',
                    'currentColor'
                ],
                ['id', 'clip0_12562_17487'],
                [1, 'filter-by-column-container', 3, 'keydown.escape', 'formGroup'],
                ['class', 'po-md-12 filter-column-checkbox', 4, 'ngIf'],
                [1, 'po-md-12', 'components-filter-by-column'],
                [1, 'po-md-12', 'container-buttons-filters'],
                [3, 'p-click', 'keydown.enter', 'p-disabled', 'p-size', 'p-label'],
                ['p-kind', 'primary', 3, 'p-click', 'keydown.enter', 'keydown.tab', 'p-disabled', 'p-label', 'p-size'],
                [1, 'po-md-12', 'po-pt-1', 'filters-content-components'],
                ['formControlName', 'modelsColumn1', 1, 'components-filter-by-column', 3, 'ngModelChange', 'p-size', 'p-options'],
                ['class', 'components-filter-by-column', 'formControlName', 'inputModelsColumn1', 'p-clean', '', 3, 'p-size', 4, 'ngIf'],
                [
                    'class',
                    'components-filter-by-column',
                    'formControlName',
                    'inputModelsColumn1',
                    'p-clean',
                    '',
                    3,
                    'p-decimals-length',
                    'p-thousand-maxlength',
                    'p-locale',
                    'p-size',
                    4,
                    'ngIf'
                ],
                [
                    'class',
                    'components-filter-by-column',
                    'formControlName',
                    'inputModelsColumn1',
                    'p-clean',
                    '',
                    3,
                    'p-format',
                    'p-locale',
                    'p-max-time',
                    'p-min-time',
                    'p-minute-interval',
                    'p-model-format',
                    'p-no-autocomplete',
                    'p-placeholder',
                    'p-second-interval',
                    'p-show-seconds',
                    'p-size',
                    4,
                    'ngIf'
                ],
                ['formControlName', 'modelsOperatorsColumn', 1, 'components-filter-by-column', 3, 'p-size', 'p-options'],
                ['formControlName', 'modelsColumn2', 1, 'components-filter-by-column', 3, 'ngModelChange', 'p-size', 'p-options'],
                ['class', 'components-filter-by-column', 'formControlName', 'inputModelsColumn2', 'p-clean', '', 3, 'p-size', 4, 'ngIf'],
                [
                    'class',
                    'components-filter-by-column',
                    'formControlName',
                    'inputModelsColumn2',
                    'p-clean',
                    '',
                    3,
                    'p-decimals-length',
                    'p-thousand-maxlength',
                    'p-locale',
                    'p-size',
                    4,
                    'ngIf'
                ],
                [
                    'class',
                    'components-filter-by-column',
                    'formControlName',
                    'inputModelsColumn2',
                    'p-clean',
                    '',
                    3,
                    'p-format',
                    'p-locale',
                    'p-max-time',
                    'p-min-time',
                    'p-minute-interval',
                    'p-model-format',
                    'p-no-autocomplete',
                    'p-placeholder',
                    'p-second-interval',
                    'p-show-seconds',
                    'p-size',
                    4,
                    'ngIf'
                ],
                ['formControlName', 'inputModelsColumn1', 'p-clean', '', 1, 'components-filter-by-column', 3, 'p-size'],
                [
                    'formControlName',
                    'inputModelsColumn1',
                    'p-clean',
                    '',
                    1,
                    'components-filter-by-column',
                    3,
                    'p-decimals-length',
                    'p-thousand-maxlength',
                    'p-locale',
                    'p-size'
                ],
                [
                    'formControlName',
                    'inputModelsColumn1',
                    'p-clean',
                    '',
                    1,
                    'components-filter-by-column',
                    3,
                    'p-format',
                    'p-locale',
                    'p-max-time',
                    'p-min-time',
                    'p-minute-interval',
                    'p-model-format',
                    'p-no-autocomplete',
                    'p-placeholder',
                    'p-second-interval',
                    'p-show-seconds',
                    'p-size'
                ],
                ['formControlName', 'inputModelsColumn2', 'p-clean', '', 1, 'components-filter-by-column', 3, 'p-size'],
                [
                    'formControlName',
                    'inputModelsColumn2',
                    'p-clean',
                    '',
                    1,
                    'components-filter-by-column',
                    3,
                    'p-decimals-length',
                    'p-thousand-maxlength',
                    'p-locale',
                    'p-size'
                ],
                [
                    'formControlName',
                    'inputModelsColumn2',
                    'p-clean',
                    '',
                    1,
                    'components-filter-by-column',
                    3,
                    'p-format',
                    'p-locale',
                    'p-max-time',
                    'p-min-time',
                    'p-minute-interval',
                    'p-model-format',
                    'p-no-autocomplete',
                    'p-placeholder',
                    'p-second-interval',
                    'p-show-seconds',
                    'p-size'
                ],
                [1, 'po-md-12', 'filter-column-checkbox'],
                ['name', 'checkboxTrue', 'formControlName', 'inputModelsColumn1', 3, 'p-label', 'p-size'],
                ['name', 'checkboxFalse', 'formControlName', 'inputModelsColumn2', 3, 'p-label', 'p-size']
            ],
            template: function ThfGridComponent_Template(rf, ctx) {
                if (rf & 1) {
                    i0.ɵɵtemplate(0, ThfGridComponent_ng_template_0_Template, 2, 1, 'ng-template', null, 0, i0.ɵɵtemplateRefExtractor)(
                        2,
                        ThfGridComponent_ng_template_2_Template,
                        1,
                        1,
                        'ng-template',
                        null,
                        1,
                        i0.ɵɵtemplateRefExtractor
                    );
                    i0.ɵɵelementStart(4, 'div', 22, 2);
                    i0.ɵɵconditionalCreate(6, ThfGridComponent_Conditional_6_Template, 2, 1, 'po-container', 23)(
                        7,
                        ThfGridComponent_Conditional_7_Template,
                        1,
                        1,
                        'ng-container',
                        24
                    );
                    i0.ɵɵelementEnd();
                    i0.ɵɵtemplate(8, ThfGridComponent_ng_template_8_Template, 4, 4, 'ng-template', null, 3, i0.ɵɵtemplateRefExtractor);
                    i0.ɵɵelementStart(10, 'thf-grid-column-manager', 25);
                    i0.ɵɵlistener(
                        't-change-fixed-columns',
                        function ThfGridComponent_Template_thf_grid_column_manager_t_change_fixed_columns_10_listener($event) {
                            return ctx.emitChangeFixedColumns($event);
                        }
                    )('t-change-loading', function ThfGridComponent_Template_thf_grid_column_manager_t_change_loading_10_listener($event) {
                        return (ctx.isLoading = $event);
                    })('t-change-order-column', function ThfGridComponent_Template_thf_grid_column_manager_t_change_order_column_10_listener() {
                        return ctx.emitEventOrder();
                    })(
                        't-change-options-column-manager',
                        function ThfGridComponent_Template_thf_grid_column_manager_t_change_options_column_manager_10_listener($event) {
                            return ctx.optionsColumnManagerChanged($event);
                        }
                    )('t-change-visible-columns', function ThfGridComponent_Template_thf_grid_column_manager_t_change_visible_columns_10_listener($event) {
                        return ctx.emitChangeVisibleColumns($event);
                    })('t-change-page-size', function ThfGridComponent_Template_thf_grid_column_manager_t_change_page_size_10_listener($event) {
                        return ctx.changePageSize($event);
                    })('t-changed-density', function ThfGridComponent_Template_thf_grid_column_manager_t_changed_density_10_listener($event) {
                        return ctx.densityChanged($event);
                    })('t-restore-column-manager', function ThfGridComponent_Template_thf_grid_column_manager_t_restore_column_manager_10_listener($event) {
                        return ctx.emitRestoreColumnManager($event);
                    });
                    i0.ɵɵelementEnd();
                    i0.ɵɵelement(11, 'po-popup', 26, 4);
                    i0.ɵɵelementStart(13, 'po-modal', 27, 5);
                    i0.ɵɵtemplate(15, ThfGridComponent_po_dynamic_form_15_Template, 1, 3, 'po-dynamic-form', 28);
                    i0.ɵɵelementEnd();
                    i0.ɵɵelementStart(16, 'po-modal', 29, 6);
                    i0.ɵɵtext(18);
                    i0.ɵɵelementEnd();
                    i0.ɵɵelementStart(19, 'po-modal', 30, 7);
                    i0.ɵɵlistener('p-close', function ThfGridComponent_Template_po_modal_p_close_19_listener() {
                        return ctx.onDestructiveModalClose();
                    });
                    i0.ɵɵconditionalCreate(21, ThfGridComponent_Conditional_21_Template, 3, 2)(22, ThfGridComponent_Conditional_22_Template, 1, 1)(
                        23,
                        ThfGridComponent_Conditional_23_Template,
                        1,
                        1
                    );
                    i0.ɵɵelementEnd();
                    i0.ɵɵtemplate(24, ThfGridComponent_ng_template_24_Template, 6, 0, 'ng-template', null, 8, i0.ɵɵtemplateRefExtractor)(
                        26,
                        ThfGridComponent_ng_template_26_Template,
                        6,
                        0,
                        'ng-template',
                        null,
                        9,
                        i0.ɵɵtemplateRefExtractor
                    )(28, ThfGridComponent_ng_template_28_Template, 1, 1, 'ng-template', null, 10, i0.ɵɵtemplateRefExtractor);
                }
                if (rf & 2) {
                    i0.ɵɵadvance(6);
                    i0.ɵɵconditional(ctx.container ? 6 : 7);
                    i0.ɵɵadvance(4);
                    i0.ɵɵproperty('t-literals', ctx.literals)('t-changed-density-option', ctx.changedDensityOption)('t-columns', ctx.columns)(
                        't-columns-change-fixed',
                        ctx.columnsChangeFixed
                    )('t-components-size', ctx.componentsSize)('t-default-columns', ctx.defaultColumns)('t-default-frozen-columns', ctx.defaultFrozenColumns)(
                        't-draggable',
                        ctx.draggable
                    )('t-groupable', ctx.groupable)('t-hide-action-fixed-columns', ctx.hideActionFixedColumns)('t-max-columns', ctx.maxColumns)(
                        't-max-columns-grid',
                        ctx.maxColumnsGrid
                    )('t-options-paging', ctx.optionsPaging)('t-page-size', ctx.pageSize)('t-show-page-size', ctx.pageable && !ctx.hasItems)(
                        't-verify-action-fixed',
                        ctx.verifyActionFixed
                    )('t-virtual-columns', ctx.virtualColumns)('t-visible-columns', ctx.visibleColumns)('t-show-column-manager', ctx.showColumnManager)(
                        't-show-densification-configuration',
                        ctx.showDensificationConfiguration
                    );
                    i0.ɵɵadvance();
                    i0.ɵɵproperty('p-size', ctx.componentsSize)('p-target', ctx.popupTarget);
                    i0.ɵɵadvance(2);
                    i0.ɵɵproperty('p-components-size', ctx.componentsSize)('p-title', ctx.literals.advancedSearch)('p-hide-close', true)(
                        'p-primary-action',
                        ctx.primaryAction
                    )('p-secondary-action', ctx.secondaryAction);
                    i0.ɵɵadvance(2);
                    i0.ɵɵproperty('ngIf', ctx.fields.length > 0);
                    i0.ɵɵadvance();
                    i0.ɵɵproperty('p-components-size', ctx.componentsSize)('p-primary-action', ctx.confirmActionModal)(
                        'p-secondary-action',
                        ctx.closeActionModal
                    )('p-title', ctx.literals.deleteItem)('p-click-out', true);
                    i0.ɵɵadvance(2);
                    i0.ɵɵtextInterpolate1(' ', ctx.modalDeleteMessage, '\n');
                    i0.ɵɵadvance();
                    i0.ɵɵclassProp('modal-destructive-remove', ctx.destructiveModalActionType === ctx.ThfGridEditModeActionTypeEnum.Remove);
                    i0.ɵɵproperty('p-icon', ctx.destructiveModalIcons[ctx.destructiveModalActionType])('p-components-size', ctx.componentsSize)(
                        'p-primary-action',
                        ctx.destructiveModalConfirm
                    )('p-secondary-action', ctx.destructiveModalCancel)('p-title', ctx.getDestructiveModalTitle(ctx.destructiveModalActionType))(
                        'p-click-out',
                        true
                    );
                    i0.ɵɵadvance(2);
                    i0.ɵɵconditional(
                        ctx.destructiveModalActionType === ctx.ThfGridEditModeActionTypeEnum.Remove
                            ? 21
                            : ctx.destructiveModalActionType === ctx.ThfGridEditModeActionTypeEnum.Add
                              ? 22
                              : ctx.destructiveModalActionType === ctx.ThfGridEditModeActionTypeEnum.Replace
                                ? 23
                                : -1
                    );
                }
            },
            dependencies: [
                ThfGridAggregatesComponent,
                ThfGridColumnsComponent,
                ThfGridColumnManagerComponent,
                ThfGridColumnsGroupHeadersComponent,
                ThfGridEditComponent,
                GridModule,
                i5$1.GridComponent,
                i5$1.ToolbarTemplateDirective,
                i5$1.DataBindingDirective,
                i5$1.SelectionDirective,
                i5$1.GroupHeaderTemplateDirective,
                i5$1.GroupFooterTemplateDirective,
                i5$1.ColumnComponent,
                i5$1.FocusableDirective,
                i5$1.FooterTemplateDirective,
                i5$1.DetailTemplateDirective,
                i5$1.CheckboxColumnComponent,
                i5$1.SelectionCheckboxDirective,
                i5$1.CellTemplateDirective,
                i5$1.NoRecordsTemplateDirective,
                i5$1.LoadingTemplateDirective,
                i5$1.HeaderTemplateDirective,
                i5$1.SelectAllCheckboxDirective,
                ExcelModule,
                i5$1.ExcelComponent,
                PDFModule,
                i5$1.PDFComponent,
                ButtonsModule,
                DialogsModule,
                FilterModule,
                InputsModule,
                i6.CheckBoxDirective,
                i6.RadioButtonDirective,
                PoPageSlideModule,
                PoButtonModule,
                i1.PoButtonComponent,
                PoDividerModule,
                i1.PoDividerComponent,
                PoPopupModule,
                i1.PoPopupComponent,
                PoModalModule,
                i1.PoModalComponent,
                PoDynamicModule,
                i1.PoDynamicFormComponent,
                PoDropdownModule,
                i1.PoDropdownComponent,
                PoIconModule,
                i1.PoIconComponent,
                PoFieldContainerModule,
                PoFieldModule,
                i1.PoDatepickerComponent,
                i1.PoTimepickerComponent,
                i1.PoDecimalComponent,
                i1.PoInputComponent,
                i1.PoNumberComponent,
                i1.PoSelectComponent,
                i1.PoCheckboxComponent,
                i1.PoSwitchComponent,
                PoLoadingModule,
                i1.PoLoadingOverlayComponent,
                PoPageDynamicSearchModule,
                PoTooltipModule,
                i1.PoTooltipDirective,
                TooltipModule,
                i7.TooltipDirective,
                CommonModule,
                i8.NgClass,
                i8.NgForOf,
                i8.NgIf,
                i8.NgTemplateOutlet,
                i8.NgPlural,
                i8.NgPluralCase,
                FormsModule,
                i9.ɵNgNoValidate,
                i9.NgControlStatus,
                i9.NgControlStatusGroup,
                i9.NgModel,
                ReactiveFormsModule,
                i9.FormGroupDirective,
                i9.FormControlName,
                PoToasterModule,
                i1.PoToasterComponent,
                PoContainerModule,
                i1.PoContainerComponent,
                i8.DatePipe
            ],
            styles: [
                '.k-grid,.k-grid .k-grid-toolbar.k-toolbar{background-color:transparent;overflow:visible}.k-grid.hidden-grid{height:unset!important}.k-grid.hidden-grid .k-grid-aria-root:has(.k-grid-norecords){display:none}thf-grid kendo-grid.k-grid{border-width:0px}thf-grid .k-grid .k-grid-aria-root,thf-grid kendo-grid[data-is-empty=true] .k-grid-aria-root,thf-grid kendo-grid[data-is-empty=true] .k-grid-norecords td{padding:0;padding-inline:0px}thf-grid kendo-grid .k-grid-content{background:var(--background-color)}thf-grid kendo-grid.grid-row-actions[data-is-empty=true][data-has-filters=false] .k-grid-header{display:none}thf-grid kendo-grid[data-is-empty=true] .k-grid-content{overflow-y:auto}thf-grid kendo-grid[data-is-empty=true]:not([data-has-filters=true]) .k-grid-content .k-table{table-layout:auto}thf-grid kendo-grid[data-is-empty=true] .k-grid-content .grid-no-data-container{display:flex;flex-direction:column;text-align:center;gap:var(--spacing-xs);padding:var(--spacing-squish-3xl)}thf-grid kendo-grid[data-is-empty=true] .k-grid-content .grid-no-data-container>h2{font-family:var(--font-family-empty-state-body-subtitle);font-size:var(--font-size-empty-state-body-subtitle);font-weight:var(--font-weight-empty-state-body-subtitle);color:var(--color-neutral-dark-90);text-align:center}thf-grid kendo-grid[data-is-empty=true] .k-grid-content .grid-no-data-container>span{font-family:var(--font-family-empty-state-body-message);font-size:var(--font-size-empty-state-body-message);font-weight:var(--font-weight-empty-state-body-message);color:var(--color-neutral-dark-90)}[data-a11y=AA] thf-grid kendo-grid[data-is-empty=true] .k-grid-content .grid-no-data-container{gap:var(--spacing-xxs);padding:var(--spacing-squish-2xl)}.k-grid .k-grid-toolbar.k-toolbar .thf-grid-toolbar-actions,.k-grid .k-grid-toolbar.k-toolbar .thf-grid-toolbar-manager{align-items:center;display:inline-flex;justify-content:flex-end}.thf-grid-toolbar .thf-grid-toolbar-content-input{padding:0}.k-grid .k-grid-toolbar.k-toolbar .thf-grid-toolbar-items-selected{min-height:var(--target-size-aaa)}thf-grid[t-components-size=small] .k-grid .k-grid-toolbar.k-toolbar .thf-grid-toolbar-items-selected{min-height:var(--target-size-aa)}.k-grid .k-grid-toolbar.k-toolbar .thf-grid-toolbar-buttons,.k-grid .k-grid-toolbar.k-toolbar .thf-grid-toolbar-items-selected{align-items:center;display:inline-flex;gap:8px;padding-left:8px}thf-grid>.thf-grid-container>po-container .k-grid .k-grid-toolbar.k-toolbar .thf-grid-toolbar-buttons,thf-grid>.thf-grid-container>po-container .k-grid .k-grid-toolbar.k-toolbar .thf-grid-toolbar-items-selected{padding-left:0}.k-grid .k-grid-toolbar.k-toolbar .thf-grid-toolbar-items-selected-text{width:180px;font-size:16px}.k-grid .k-grid-toolbar.k-toolbar .thf-grid-toolbar-actions{gap:var(--spacing-xs)}thf-grid kendo-grid.k-grid .k-grid-toolbar.k-toolbar .thf-grid-headertemplate{display:block;width:100%;padding:var(--spacing-xs) 0px}thf-grid>.thf-grid-container>po-container kendo-grid.k-grid .k-grid-toolbar.k-toolbar .thf-grid-headertemplate{padding:var(--spacing-xs)}thf-grid kendo-grid .k-grid-toolbar.k-toolbar{border-bottom:var(--border-width-toolbar) solid var(--border-color-toolbar);min-height:var(--spacing-2xl);padding:0;gap:0px}thf-grid kendo-grid .k-grid-toolbar.k-toolbar:before{height:0px;content:none}[data-a11y=AA] thf-grid kendo-grid[t-spacing=extraSmall] .k-grid-toolbar.k-toolbar{min-height:var(--spacing-xl)}thf-grid kendo-grid.hidden-grid[data-is-empty=true] .k-grid-toolbar.k-toolbar{border-bottom:0px}thf-grid kendo-grid .k-grid-toolbar.k-toolbar .toolbar-edit-row-actions{width:100%;display:flex;flex-wrap:wrap;align-items:center;flex-direction:row;justify-content:flex-end;gap:var(--spacing-xs);padding:var(--spacing-xs) 0px}thf-grid>.thf-grid-container>po-container kendo-grid .k-grid-toolbar.k-toolbar .toolbar-edit-row-actions{padding:var(--spacing-xs) var(--spacing-xs) var(--spacing-xs) 0px}.k-grid .k-grid-toolbar.k-toolbar .toolbar-edit-row-title{font-family:var(--font-family-toolbar-title);font-size:var(--font-size-toolbar-title);font-weight:var(--font-weight-toolbar-title);color:var(--color-neutral-dark-90);line-height:var(--line-height-md);letter-spacing:var(--letter-spacing-toolbar-title);text-wrap:nowrap;text-overflow:ellipsis;flex:1 1 auto;min-width:0;white-space:nowrap;overflow:hidden;margin-right:auto}thf-grid kendo-grid .k-grid-toolbar.k-toolbar .toolbar-edit-row-actions .toolbar-edit-row-content{display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-end;gap:var(--spacing-xs)}thf-grid>.thf-grid-container>po-container kendo-grid.k-grid .k-grid-toolbar.k-toolbar .toolbar-edit-row-title{padding-inline:var(--spacing-sm)}[data-a11y=AA] thf-grid>.thf-grid-container>po-container kendo-grid[t-spacing=extraSmall].k-grid .k-grid-toolbar.k-toolbar .toolbar-edit-row-title{padding-inline:var(--spacing-xs)}.k-grid .k-grid-toolbar.k-toolbar .toolbar-edit-row-button-include{float:right}thf-grid kendo-grid .k-grid-toolbar.k-toolbar .required-fields-toaster{width:100%;padding:var(--spacing-xs);border-top:var(--border-width-toolbar) solid var(--border-color-toolbar)}[data-a11y=AA] thf-grid kendo-grid .k-grid-toolbar.k-toolbar .required-fields-toaster{padding:.375rem}thf-grid kendo-grid .k-grid-toolbar.k-toolbar .required-fields-toaster po-toaster{width:100%}thf-grid kendo-grid:not(.grid-row-actions) .k-grid-toolbar.k-toolbar .thf-grid-toolbar{padding:var(--spacing-sm) 0px;gap:var(--spacing-xs)}thf-grid>.thf-grid-container>po-container kendo-grid:not(.grid-row-actions) .k-grid-toolbar.k-toolbar .thf-grid-toolbar{padding:var(--spacing-sm)}[data-a11y=AA] thf-grid kendo-grid[t-spacing=extraSmall]:not(.grid-row-actions) .k-grid-toolbar.k-toolbar .thf-grid-toolbar{padding:var(--spacing-xs) 0px}[data-a11y=AA] thf-grid>.thf-grid-container>po-container kendo-grid[t-spacing=extraSmall]:not(.grid-row-actions) .k-grid-toolbar.k-toolbar .thf-grid-toolbar{padding:var(--spacing-xs)}kendo-grid .k-grid-toolbar.k-toolbar .po-field-container-content,kendo-grid .k-grid-toolbar.k-toolbar .thf-grid-toolbar-content-input .po-field-container-content{padding:0}.k-toolbar-md:has(.thf-grid-toolbar),.k-grid .k-grid-aria-root{padding-inline:0px}.thf-grid-toolbar-input .po-field-icon.po-icon-input:not(.po-icon-eye-off){color:var(--color-neutral-dark-70)}.k-grid .k-table .k-table-th.k-grid-header-sticky,kendo-grid.k-grid .k-table-row .k-table-td.k-grid-content-sticky{border-inline-end-width:0;border-inline-start-width:0;box-shadow:3px 0 2.6px var(--color-neutral-light-30)}.k-grid .k-table .k-table-th.k-grid-header-sticky.last-column-with-sticky:last-child,kendo-grid.k-grid .k-table-row .k-table-td.k-grid-content-sticky.last-column-with-sticky:last-child{box-shadow:-3px 0 2.6px var(--color-neutral-light-30)}kendo-grid.k-grid .k-table-row:not(.k-detail-row) .k-table-td.k-table-td-action{text-align:center}kendo-grid.k-grid:not(.text-wrap) .k-table-row:not(.k-detail-row) .k-table-td.k-table-td-action{word-break:break-all}kendo-grid .k-table-td-action .thf-grid-single-action{overflow:hidden;text-overflow:ellipsis;color:var(--color-action-default);font-weight:700}kendo-grid .k-table-td-action .thf-grid-action-disabled{color:var(--color-disabled);cursor:not-allowed!important}kendo-grid.k-grid .k-table-row.k-selected .k-table-td,kendo-grid.k-grid .k-table-row:not(.thf-grid-removed,.thf-grid-edited,.thf-grid-included).k-selected .k-table-td.k-grid-content-sticky,kendo-grid.k-grid .k-table-row:not(.thf-grid-removed,.thf-grid-edited,.thf-grid-included).k-selected .k-table-td.k-grid-content-sticky:before,kendo-grid.k-grid .k-table-row.k-selected:hover .k-table-td.k-grid-content-sticky:before,kendo-grid.k-grid .k-table-row.k-selected:hover .k-grid-content-sticky,kendo-grid.k-grid .k-table-row.k-selected:hover .k-grid-content-sticky:before,kendo-grid.k-grid .k-table-row.k-table-alt-row.k-selected:hover .k-grid-content-sticky kendo-grid.k-grid .k-table-row.k-table-alt-row.k-selected:hover .k-grid-content-sticky:before{background-color:var(--background-color-selected);color:var(--color-actived)}.k-table-tbody .k-table-row.k-selected>.k-table-td,kendo-grid.k-grid .k-table-row.k-selected .k-grid-content-sticky,.k-master-row.k-table-row.k-selected td.k-grid-content-sticky{background-color:var(--background-color-selected);color:var(--color-actived)}.k-grid-pdf-export-element{font-family:TOTVS,sans-serif}.k-grid-pdf-export-element .k-grid .header-right-icon,.k-grid-pdf-export-element .k-grid .k-grid-header .k-table-th .k-cell-inner po-icon.po-icon-header{display:none}.k-grid-pdf-export-element .hide-pdf-export{display:none}.k-grid .k-table-tbody .k-table-row:hover,.k-grid .k-table-tbody .k-table-row:not(.k-detail-row):hover,.k-grid .k-table-tbody .k-table-row:not(.k-selected):hover{background-color:transparent}.k-table-td:empty:before{content:".";color:transparent}.k-grid .k-grid-header{background-color:var(--background-color-headline);border-bottom-width:0;border-color:transparent;padding-top:.5px!important;padding-bottom:.5px!important}.k-grid .k-grid-header .k-grid-header-wrap{border-color:transparent}kendo-grid.k-grid .k-table-row:not(.k-detail-row) .k-table-td:not(.last-column-with-sticky):focus,kendo-grid.k-grid .k-table-row:not(.k-detail-row) .k-table-th:not(.last-column-with-sticky):focus{position:relative}kendo-grid.k-grid .k-table-row:not(.k-detail-row) .k-table-td:focus:after{content:"";position:absolute;inset:0;border:var(--outline-width-focus-visible) solid var(--outline-color-focused);pointer-events:none;box-sizing:border-box}kendo-grid.k-grid .k-table-row:not(.k-detail-row) .k-table-th:focus:after{content:"";position:absolute;inset:0 0 1px;border:var(--outline-width-focus-visible) solid var(--outline-color-focused);pointer-events:none;box-sizing:border-box}kendo-grid[t-stripe=false].k-grid .k-table-row.thf-grid-edited .k-table-td-action:before,kendo-grid.k-grid .k-table-row.thf-grid-edited .k-table-td-action:before,kendo-grid.k-grid .k-table-row.thf-grid-edited .k-table-td,kendo-grid.k-grid .k-table-row.thf-grid-edited.k-selected .k-table-td,kendo-grid.k-grid .k-table-row.thf-grid-edited.k-selected .k-grid-content-sticky:before,kendo-grid.k-grid .k-table-row.thf-grid-edited.k-selected:hover .k-table-td.k-grid-content-sticky:before,kendo-grid.k-grid .k-table-row.thf-grid-edited.k-selected:hover .k-grid-content-sticky:before{background-color:var(--background-color-edited)}kendo-grid[t-stripe=false].k-grid .k-table-row.thf-grid-included .k-table-td-action:before,kendo-grid.k-grid .k-table-row.thf-grid-included .k-table-td-action:before,kendo-grid.k-grid .k-table-row.thf-grid-included .k-table-td,kendo-grid.k-grid .k-table-row.thf-grid-included.k-selected .k-table-td,kendo-grid.k-grid .k-table-row.thf-grid-included.k-selected .k-grid-content-sticky:before,kendo-grid.k-grid .k-table-row.thf-grid-included.k-selected:hover .k-table-td.k-grid-content-sticky:before,kendo-grid.k-grid .k-table-row.thf-grid-included.k-selected:hover .k-grid-content-sticky:before{background-color:var(--background-color-included)}kendo-grid.k-grid .k-table-row.thf-grid-current-row-actions{outline:2px solid var(--border-color-current-row-actions);outline-offset:-2px}kendo-grid.k-grid .k-table-row.thf-grid-current-row-actions .k-table-td,kendo-grid[t-stripe=false].k-grid .k-table-row.thf-grid-current-row-actions .k-table-td-action:before,kendo-grid.k-grid .k-table-row.thf-grid-current-row-actions .k-table-td-action:before,kendo-grid.k-grid .k-table-row.thf-grid-current-row-actions.k-selected .k-table-td,kendo-grid.k-grid .k-table-row.thf-grid-current-row-actions.k-selected .k-grid-content-sticky:before,kendo-grid.k-grid .k-table-row.thf-grid-current-row-actions.k-selected:hover .k-table-td.k-grid-content-sticky:before,kendo-grid.k-grid .k-table-row.thf-grid-current-row-actions.k-selected:hover .k-grid-content-sticky:before{background-color:var(--background-color-current-row-actions)}kendo-grid[t-stripe=false].k-grid .k-table-row.thf-grid-removed .k-table-td-action:before,kendo-grid.k-grid .k-table-row.thf-grid-removed .k-table-td-action:before,kendo-grid.k-grid .k-table-row.thf-grid-removed .k-table-td,kendo-grid.k-grid .k-table-row.thf-grid-removed.k-selected .k-table-td,kendo-grid.k-grid .k-table-row.thf-grid-removed.k-selected:hover .k-grid-content-sticky,kendo-grid.k-grid .k-table-row.thf-grid-removed.k-selected.k-table-alt-row:hover .k-grid-content-sticky,kendo-grid.k-grid .k-table-row.thf-grid-removed.k-selected.k-table-alt-row .k-grid-content-sticky:before,kendo-grid.k-grid .k-table-row.thf-grid-removed.k-selected:hover .k-table-td.k-grid-content-sticky:before,kendo-grid.k-grid .k-table-row.thf-grid-removed.k-selected .k-grid-content-sticky:before,kendo-grid.k-grid .k-table-row.thf-grid-removed.k-selected:hover .k-grid-content-sticky:before{background-color:var(--background-color-removed, var(--background-color))}kendo-grid[t-stripe=true].k-grid .k-table-row.k-table-alt-row.thf-grid-removed .k-table-td-action:before,kendo-grid[t-stripe=true].k-grid .k-table-row.k-table-alt-row.thf-grid-removed .k-table-td,kendo-grid[t-stripe=true].k-grid .k-table-row.k-table-alt-row.thf-grid-removed.k-selected .k-table-td,kendo-grid[t-stripe=true].k-grid .k-table-row.k-table-alt-row.thf-grid-removed.k-selected:hover .k-grid-content-sticky,kendo-grid[t-stripe=true].k-grid .k-table-row.k-table-alt-row.thf-grid-removed.k-selected.k-table-alt-row:hover .k-grid-content-sticky,kendo-grid[t-stripe=true].k-grid .k-table-row.k-table-alt-row.thf-grid-removed.k-selected.k-table-alt-row .k-grid-content-sticky:before,kendo-grid[t-stripe=true].k-grid .k-table-row.k-table-alt-row.thf-grid-removed.k-selected:hover .k-table-td.k-grid-content-sticky:before,kendo-grid[t-stripe=true].k-grid .k-table-row.k-table-alt-row.thf-grid-removed.k-selected .k-grid-content-sticky:before,kendo-grid[t-stripe=true].k-grid .k-table-row.k-table-alt-row.thf-grid-removed.k-selected:hover .k-grid-content-sticky:before{background-color:var(--background-color-removed, var(--background-striped-color))}kendo-grid.k-grid .k-table-row.thf-grid-edited:not(.thf-grid-removed,.thf-grid-current-row-actions) .k-table-td:not(.k-grid-content-sticky):first-child,kendo-grid.k-grid .k-table-row.thf-grid-included:not(.thf-grid-removed,.thf-grid-current-row-actions) .k-table-td:not(.k-grid-content-sticky):first-child{position:relative}kendo-grid.k-grid .k-table-row.thf-grid-edited:not(.thf-grid-removed,.thf-grid-current-row-actions) .k-table-td:first-child:before,kendo-grid.k-grid .k-table-row.thf-grid-included:not(.thf-grid-removed,.thf-grid-current-row-actions) .k-table-td:first-child:before{content:"";position:absolute;left:0;top:0;pointer-events:none;height:100%;border-left-width:var(--border-width-md);border-left-style:solid}kendo-grid.k-grid .k-table-row.thf-grid-edited:not(.thf-grid-removed,.thf-grid-current-row-actions) .k-table-td:first-child:before{border-left-color:var(--border-color-edited)}kendo-grid.k-grid .k-table-row.thf-grid-included:not(.thf-grid-removed,.thf-grid-current-row-actions) .k-table-td:first-child:before{border-left-color:var(--border-color-included)}[data-a11y=AAA] kendo-grid.k-grid .k-table-row.thf-grid-edited:not(.thf-grid-removed,.thf-grid-current-row-actions) .k-table-td:first-child:before,[data-a11y=AAA] kendo-grid.k-grid .k-table-row.thf-grid-included:not(.thf-grid-removed,.thf-grid-current-row-actions) .k-table-td:first-child:before{border-left-width:var(--border-width-lg)}.k-grid .k-grid-header .k-table-th,kendo-grid.k-grid .k-table-row:not(.k-detail-row) .k-table-td{font-family:var(--font-family);font-size:var(--font-size-default);line-height:var(--line-height-md);border-color:transparent;padding-inline:var(--spacing-xs);white-space:nowrap}.k-grid .k-grid-header .k-table-th,kendo-grid.k-grid .k-table-row:not(.k-selected) .k-table-td{color:var(--color)}kendo-grid.k-grid .k-table-row.k-detail-row .k-table-td{color:var(--color);font-family:var(--font-family-theme);font-size:var(--font-size-default);line-height:var(--line-height-md);border-color:transparent;padding-block:0;padding-inline:0;white-space:nowrap}.k-grid .k-table-td .icon-actions{height:24px}.k-grid .k-grid-header .k-table-th.k-table-th-select,kendo-grid.k-grid .k-table-row:not(.k-detail-row) .k-table-td-select{line-height:0;padding-block:0px;text-overflow:initial}.k-grid .k-grid-header .k-table-th.k-table-th-select.checkbox-phosphor .k-checkbox:checked,.k-grid .k-grid-header .k-table-th.k-table-th-select.checkbox-phosphor .k-checkbox:indeterminate,kendo-grid.k-grid .k-table-row:not(.k-detail-row) .k-table-td-select.checkbox-phosphor .k-checkbox:checked{background-image:unset;font-family:Animalia!important}.k-grid .k-grid-header .k-table-th.k-table-th-select.checkbox-phosphor .k-checkbox:checked:before,kendo-grid.k-grid .k-table-row:not(.k-detail-row) .k-table-td-select.checkbox-phosphor .k-checkbox:checked:before{content:"\\e182";font-size:var(--font-size-default)}.k-grid .k-grid-header .k-table-th.k-table-th-select.checkbox-phosphor .k-checkbox:indeterminate:before{content:"\\e32a";font-size:var(--font-size-default)}.k-grid .k-grouping-row+.k-table-row td,.k-grid .k-grouping-row+.k-table-row .k-table-td{border-top-width:0}.k-grid .k-table-row .k-table-td po-tag,.k-grid .k-table-row .k-table-td .po-tag{max-width:100%}.k-grid .k-table-row .k-table-td .thf-grid-cached-label-content,.k-grid .k-table-row .k-table-td .thf-grid-cached-label-content po-tag,.k-grid .k-table-row .k-table-td .thf-grid-cached-label-content .po-tag-container,.k-grid .k-table-row .k-table-td .thf-grid-cached-label-content .po-tag-sub-container,.k-grid .k-table-row .k-table-td .thf-grid-cached-label-content .po-tag-wrapper,.k-grid .k-table-row .k-table-td .thf-grid-cached-label-content .po-tag{max-width:100%;min-width:0}.k-grid span.k-column-title.thf-grid-content{flex:1}.k-grid.text-wrap .k-cell-inner{text-wrap:wrap}kendo-grid.k-grid .k-table-row .k-table-td:has(.k-input){padding-block:0}kendo-grid.k-grid tr.thf-grid-current-row-actions td,kendo-grid.k-grid tr.thf-grid-inline-edit td{align-content:baseline}kendo-grid.k-grid tr.thf-grid-current-row-actions td:has(.po-switch-container),kendo-grid.k-grid tr.thf-grid-inline-edit td:has(.po-switch-container){align-content:flex-start}kendo-grid.k-grid tr.thf-grid-current-row-actions td po-switch .po-switch,kendo-grid.k-grid tr.thf-grid-inline-edit td po-switch .po-switch{height:var(--target-size-aaa);align-items:center}kendo-grid[t-components-size=small].k-grid tr.thf-grid-current-row-actions td po-switch .po-switch,kendo-grid[t-components-size=small].k-grid tr.thf-grid-inline-edit td po-switch .po-switch{height:var(--target-size-aa)}kendo-grid.k-grid tr.thf-grid-current-row-actions td po-switch .po-switch-container,kendo-grid.k-grid tr.thf-grid-inline-edit td po-switch .po-switch-container{align-self:center}kendo-grid.k-grid tr.thf-grid-inline-edit td:has(po-multiselect .po-multiselect-input-disabled),kendo-grid.k-grid tr.thf-grid-current-row-actions td:has(po-multiselect .po-multiselect-input-disabled),kendo-grid.k-grid tr.thf-grid-include-mode-row-actions td:has(po-multiselect .po-multiselect-input-disabled){align-content:flex-start}kendo-grid.k-grid tr.thf-grid-current-row-actions td input.k-radio,kendo-grid.k-grid tr.thf-grid-inline-edit td input.k-radio{display:flex;top:4px}kendo-grid[t-components-size=small].k-grid tr.thf-grid-current-row-actions td input.k-radio,kendo-grid[t-components-size=small].k-grid tr.thf-grid-inline-edit td input.k-radio{top:2px}kendo-grid.k-grid tr.thf-grid-current-row-actions td input.k-checkbox,kendo-grid.k-grid tr.thf-grid-inline-edit td input.k-checkbox{display:flex}kendo-grid[t-components-size=small].k-grid tr.thf-grid-current-row-actions td input.k-checkbox,kendo-grid[t-components-size=small].k-grid tr.thf-grid-inline-edit td input.k-checkbox{top:0}kendo-grid.k-grid tr.thf-grid-current-row-actions td po-checkbox po-field-container .po-field-container-content,kendo-grid.k-grid tr.thf-grid-inline-edit td po-checkbox po-field-container .po-field-container-content{padding-bottom:23px}kendo-grid[t-components-size=small].k-grid tr.thf-grid-current-row-actions td po-checkbox po-field-container .po-field-container-content,kendo-grid[t-components-size=small].k-grid tr.thf-grid-inline-edit td po-checkbox po-field-container .po-field-container-content{padding-bottom:18px}kendo-grid.k-grid tr.thf-grid-current-row-actions td po-switch po-field-container-bottom .po-field-container-bottom:not(:empty),kendo-grid.k-grid tr.thf-grid-inline-edit td po-switch po-field-container-bottom .po-field-container-bottom:not(:empty){display:flex;padding-top:0}kendo-grid.k-grid tr.thf-grid-inline-edit td po-checkbox .po-checkbox-phosphor:before,kendo-grid.k-grid tr.thf-grid-current-row-actions td po-checkbox .po-checkbox-phosphor:before{position:absolute}kendo-grid[t-components-size=small].k-grid tr.thf-grid-current-row-actions td po-checkbox .container-po-checkbox,kendo-grid[t-components-size=small].k-grid tr.thf-grid-inline-edit td po-checkbox .container-po-checkbox{transform:translateY(2px)}kendo-grid.k-grid tr.thf-grid-current-row-actions td po-checkbox .container-po-checkbox,kendo-grid.k-grid tr.thf-grid-inline-edit td po-checkbox .container-po-checkbox{transform:translateY(5px)}.k-grid .k-grid-header .k-table-th{border-block-end-width:0px;background-color:var(--background-color-headline);font-weight:var(--font-weight-headline);vertical-align:middle}.k-grid .k-grid-header .k-table-th.k-table-th-not-allowed,.k-grid .k-grid-header .k-table-th.k-table-th-not-allowed .k-link{cursor:not-allowed!important}.k-grid .k-grid-header .k-table-th:not(.k-table-th-interactive) .k-link{cursor:default}.k-grid .k-grid-header .k-table-th-interactive:hover{background-color:var(--background-color-hover);color:var(--color)}.k-grid .k-table-row .k-table-td,.k-grid .k-master-row.k-table-row:not(.k-table-alt-row) .k-table-td.k-grid-content-sticky,.k-master-row.k-table-row.k-selected td.k-grid-content-sticky:before,kendo-grid.k-grid .k-table-row:not(.k-selected,.k-table-alt-row,.thf-grid-edited,.thf-grid-included,.thf-grid-editable-current,.thf-grid-removed):hover .k-table-td.k-grid-content-sticky{background-color:var(--background-color);font-weight:var(--font-weight-normal)}kendo-grid.k-grid .k-table-alt-row .k-table-td,kendo-grid.k-grid .k-master-row.k-table-alt-row .k-table-td.k-grid-content-sticky,kendo-grid.k-grid .k-table-alt-row:not(.thf-grid-edited,.thf-grid-included,.thf-grid-editable-current,.thf-grid-removed):hover .k-table-td.k-grid-content-sticky{background-color:var(--background-striped-color)}.k-grid .k-grid-header .k-table-th .k-cell-inner{margin-block:0;margin-inline:0}.k-grid .k-grid-header .k-table-th.k-table-th-right .k-cell-inner,kendo-grid.k-grid .k-table-row .k-table-td.k-table-td-right .k-cell-inner{justify-content:flex-end}kendo-grid.k-grid .k-table-row .k-table-td.k-table-td-action .k-cell-inner:not(.span-single-action){margin:0 auto;width:max-content}kendo-grid.k-grid .k-table-row.thf-grid-current-row-actions .k-table-td.k-table-td-action{outline:2px solid var(--border-color-current-row-actions);outline-offset:-2px}kendo-grid.k-grid.text-wrap .k-table-row .k-table-td.k-table-td-action .k-cell-inner.span-single-action{width:auto}.k-grid .k-cell-inner-right{justify-content:flex-end}.k-grid .k-table-row .k-table-td .k-cell-inner{min-height:24px}.k-grid .k-grid-header .k-table-th .k-cell-inner .k-link{padding-block:0;padding-inline:0}.k-grid .k-grid-header .k-table-th .k-cell-inner .k-link .k-sort-icon,.k-grid .k-grid-header .k-table-th .k-cell-inner .k-link .k-sort-icon-thf{display:inherit;margin-inline:0;overflow:initial}.k-grid .header-right-icon .k-sort-icon-thf po-icon,.k-grid .k-grid-header .k-table-th .k-cell-inner po-icon.po-icon-header{display:flex;justify-content:center;align-items:center}.k-grid .k-grid-header .k-table-th .k-cell-inner .k-link .k-sort-icon-thf i,.k-grid .header-right-icon .po-icon-header i.an,.k-grid .header-right-icon .po-icon-header i.an-fill{font-size:var(--font-size-sm);padding:.0625rem}.k-grid .header-right-icon po-icon.po-icon-header[p-icon=ICON_MORE_VERT] i.an,.k-grid .header-left-icon po-icon.po-icon-header[p-icon=ICON_DRAG] i.an{font-size:var(--font-size-md)}.k-grid .k-grid-header .k-table-th .k-cell-inner .k-link .k-sort-icon-thf po-icon[p-icon=ICON_SORT] i.an,.k-grid .header-right-icon po-icon.po-icon-header[p-icon=ICON_FILL_MORE_OUTLINE_VERT] i.an-fill,.k-grid .header-right-icon po-icon.po-icon-header[p-icon=ICON_FILL_FILTER] i.an-fill,.k-grid .header-right-icon po-icon.po-icon-header[p-icon=ICON_FILTER] i.an{font-size:1.125rem!important}.k-grid .k-grid-header .k-table-th .k-cell-inner .k-link .k-sort-icon{display:none}kendo-grid .k-table-td-action .thf-grid-single-action.thf-grid-single-action-content__danger .po-field-icon{color:var(--color-feedback-negative-base);display:inline-flex;vertical-align:top}kendo-grid .thf-grid-removed .k-table-td-action .thf-grid-single-action.thf-grid-single-action-content__danger .po-field-icon{color:inherit!important}.k-column-title-content span{font-size:var(--font-size-sm);font-weight:var(--font-weight-normal)}[data-a11y=AAA] .k-column-title-content span{font-weight:var(--font-weight-bold)}.modal-destructive-remove .po-modal-header .po-modal-title po-icon i{color:var(--color-feedback-negative-base);background-color:var(--color-neutral-light-05);border-radius:var(--border-radius-pill)}.thf-grid-footer-show-more{padding:var(--spacing-xs) 0}thf-grid>.thf-grid-container>po-container .thf-grid-footer-show-more{padding:var(--spacing-xs)}.thf-grid-footer-show-more-button{padding-inline:0}kendo-grid .k-icon.k-i-caret-alt-right:before,kendo-grid .k-icon.k-i-plus:before{content:"\\e03e";font-family:Animalia}kendo-grid .k-icon.k-i-caret-alt-down:before,kendo-grid .k-icon.k-i-minus:before{content:"\\e08e";font-family:Animalia}kendo-grid .k-icon.k-i-x-circle:before{content:"\\e90d";font-family:Animalia}kendo-grid .k-grouping-header{background-color:transparent;font-family:var(--font-family);color:var(--color-neutral-dark-80)}kendo-grid.k-grid .k-table-row.k-grouping-row .k-table-td,kendo-grid.k-grid .k-table-row .k-group-cell:not(.k-table-th){background-color:var(--background-color-groupable);font-size:var(--font-size-sm);font-weight:var(--font-weight-bold);line-height:var(--line-height-2xs);padding-block:.75rem;padding-inline:var(--spacing-xs);border:none}kendo-grid.k-grid .k-table-row.k-grouping-row .k-table-td kendo-icon{margin-inline-end:1rem}.thf-grid-column-manager-body{overflow-y:auto;display:grid;gap:var(--spacing-xs)}.thf-grid-list-manager-section{gap:var(--spacing-xs);display:flex;flex-direction:column}.thf-grid-list-manager-paging{align-items:center;border-width:1px;border-style:solid;border-color:var(--color-neutral-light-10);border-radius:var(--border-radius-lg)}.thf-grid-list-manager-paging po-select po-field-container .po-field-container-content{padding-top:var(--spacing-xs)}.thf-grid-list-manager-paging po-select po-field-container-bottom .po-field-container-bottom:empty,kendo-grid.k-grid .components-form po-field-container-bottom .po-field-container-bottom,.thf-grid-list-manager-item po-field-container-bottom .po-field-container-bottom,.thf-grid-list-manager-item po-field-container-bottom[p-size=small] .po-field-container-bottom:empty,kendo-grid.k-grid .components-form po-field-container-bottom[p-size=small] .po-field-container-bottom:not(:empty),kendo-grid.k-grid po-field-container-bottom[p-size=small] .po-field-container-bottom:empty{padding-bottom:0}.thf-grid-list-manager-item{display:flex;align-items:flex-start;justify-content:space-between;border-width:1px;border-style:solid;border-color:var(--color-neutral-light-10);padding:var(--spacing-xs);border-radius:var(--border-radius-lg);gap:var(--spacing-xs)}.thf-grid-list-manager-container{list-style-type:none}.thf-grid-list-manager-item-switch{display:flex;align-items:center;gap:var(--spacing-lg)}.thf-grid-list-manager-item-text{color:var(--color-column-text);font-family:var(--font-family-theme);font-weight:var(--font-weight-normal);line-height:var(--line-height-md);letter-spacing:var(--letter-spacing-1);font-size:var(--font-size-default)}.thf-grid-list-manager-item-buttons{gap:var(--spacing-xs);display:flex;align-items:center;justify-content:center}.k-grid .k-grid-header .k-table-th .k-checkbox,.k-grid .k-table-row .k-table-td .k-checkbox{background-color:var(--color-unchecked);border-color:var(--border-color);border-radius:var(--border-radius-md);border-width:var(--border-width-md);align-items:center;appearance:none;border-style:solid;display:inline-flex;height:var(--font-size-lg);justify-content:center;margin-inline:1px;vertical-align:middle;width:var(--font-size-lg)}.k-grid .k-grid-header .k-table-th .k-checkbox:disabled,.k-grid .k-table-row .k-table-td .k-checkbox:disabled{opacity:unset}.k-checkbox.k-checked{background-color:var(--color-checked)!important;color:var(--color-unchecked)!important;border-color:transparent!important}.k-grid .k-grid-header .k-table-th .k-checkbox:checked,.k-grid .k-grid-header .k-table-th .k-checkbox:indeterminate,.k-grid .k-table-row .k-table-td .k-checkbox:checked,.k-table-th span span .k-checkbox:checked{background-color:var(--color-checked);color:var(--color-unchecked);border-color:transparent}.k-grid .k-grid-header .k-table-th .k-checkbox:checked:hover,.k-grid .k-grid-header .k-table-th .k-checkbox:indeterminate:hover,.k-grid .k-table-row .k-table-td .k-checkbox:checked:hover{background-color:var(--color-hover);border-color:transparent}.k-grid .k-grid-header .k-table-th .k-checkbox:checked,.k-grid .k-table-row .k-table-td .k-checkbox:checked{background-image:url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xOC43MDggNy4yOTEwNEMxOC4zMTYzIDYuOTAyOTkgMTcuNjgzNyA2LjkwMjk5IDE3LjI5MiA3LjI5MTA0TDkuOTYxMjggMTQuNTk3Mkw2LjY1NzQyIDExLjI5NDRDNi4yNTg5OCAxMC45NTQzIDUuNjY1MDYgMTAuOTc3MiA1LjI5NDEzIDExLjM0NjlDNC45MjMyMSAxMS43MTY2IDQuOTAwMjYgMTIuMzA4NSA1LjI0MTQ3IDEyLjcwNTZMOS4yNTgzMyAxNi43MDlDOS42NTAwMSAxNy4wOTcgMTAuMjgyNiAxNy4wOTcgMTAuNjc0MyAxNi43MDlMMTguNzA4IDguNzAyMjNDMTkuMDk3MyA4LjMxMTg2IDE5LjA5NzMgNy42ODE0IDE4LjcwOCA3LjI5MTA0WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==)}.k-grid .k-grid-header .k-table-th .k-checkbox:disabled,.k-grid .k-table-row .k-table-td .k-checkbox:disabled,[data-a11y=AAA] kendo-grid[t-components-size=small].k-grid .k-grid-header .k-table-th .k-checkbox:disabled,[data-a11y=AAA] kendo-grid[t-components-size=small].k-grid .k-table-row .k-table-td .k-checkbox:disabled{background-color:var(--color-unchecked-disabled);border-color:var(--color-checked-disabled)}.k-grid .k-grid-header .k-table-th .k-checkbox:checked:disabled,.k-grid .k-table-row .k-table-td .k-checkbox:checked:disabled,[data-a11y=AAA] kendo-grid[t-components-size=small].k-grid .k-grid-header .k-table-th .k-checkbox:checked:disabled,[data-a11y=AAA] kendo-grid[t-components-size=small].k-grid .k-table-row .k-table-td .k-checkbox:checked:disabled{background-color:var(--color-checked-disabled);border-color:#0000}.k-grid .k-grid-header .k-table-th .k-checkbox:indeterminate:disabled,.k-grid .k-table-row .k-table-td .k-checkbox:indeterminate:disabled,[data-a11y=AAA] kendo-grid[t-components-size=small].k-grid .k-grid-header .k-table-th .k-checkbox:indeterminate:disabled,[data-a11y=AAA] kendo-grid[t-components-size=small].k-grid .k-table-row .k-table-td .k-checkbox:indeterminate:disabled{background-color:var(--color-checked-disabled);border-color:#0000}.k-grid .k-grid-header .k-table-th .k-checkbox:indeterminate{background-image:url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iNiIgeT0iMTEiIHdpZHRoPSIxMiIgaGVpZ2h0PSIyIiByeD0iMSIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==)}.k-grid .k-grid-header .k-table-th .k-checkbox:focus,.k-grid .k-table-row .k-table-td .k-checkbox:focus{outline-color:var(--outline-color-focused);box-shadow:none;outline-offset:2px;outline-style:solid;outline-width:var(--outline-width-focus-visible)}.k-grid .k-grid-header .k-table-th .k-checkbox:hover,.k-grid .k-table-row .k-table-td .k-checkbox:hover{border-color:var(--color-hover);box-shadow:0 0 0 4px var(--shadow-color-hover)}.k-grid .k-grid-header .k-table-th .k-radio,.k-grid .k-table-row .k-table-td .k-radio{background-color:var(--color-unchecked);appearance:none;border:var(--border-width-md) solid var(--border-color);border-radius:100%;background-clip:content-box;margin:0;align-self:flex-start;height:var(--width-md);width:var(--width-md);vertical-align:initial;display:inline-flex;align-items:center}.k-grid .k-grid-header .k-table-th .k-radio:disabled,.k-grid .k-table-row .k-table-td .k-radio:disabled{opacity:unset}[data-a11y=AA] kendo-grid[t-components-size=small].k-grid .k-grid-header .k-table-th .k-radio,[data-a11y=AA] kendo-grid[t-components-size=small].k-grid .k-table-row .k-table-td .k-radio,[data-a11y=AA] kendo-grid[t-components-size=small].k-grid .k-grid-header .k-table-th .k-checkbox,[data-a11y=AA] kendo-grid[t-components-size=small].k-grid .k-table-row .k-table-td .k-checkbox{height:var(--font-size-default);width:var(--font-size-default)}.k-grid .k-grid-header .k-table-th .k-radio:checked,.k-grid .k-table-row .k-table-td .k-radio:checked{background:var(--background-radial-md);border-color:var(--color-checked)}.k-grid .k-grid-header .k-table-th .k-radio:disabled,.k-grid .k-table-row .k-table-td .k-radio:disabled,[data-a11y=AAA] kendo-grid[t-components-size=small].k-grid .k-grid-header .k-table-th .k-radio:disabled,[data-a11y=AAA] kendo-grid[t-components-size=small].k-grid .k-table-row .k-table-td .k-radio:disabled{background-color:var(--color-unchecked-disabled);border-color:var(--color-checked-disabled)}.k-grid .k-grid-header .k-table-th .k-radio:checked:disabled,.k-grid .k-table-row .k-table-td .k-radio:checked:disabled,[data-a11y=AAA] kendo-grid[t-components-size=small].k-grid .k-grid-header .k-table-th .k-radio:checked:disabled,[data-a11y=AAA] kendo-grid[t-components-size=small].k-grid .k-table-row .k-table-td .k-radio:checked:disabled{background:var(--background-radial-md-disabled);background-color:var(--color-unchecked-disabled)}[data-a11y=AA] kendo-grid[t-components-size=small].k-grid .k-grid-header .k-table-th .k-radio:checked,[data-a11y=AA] kendo-grid[t-components-size=small].k-grid .k-table-row .k-table-td .k-radio:checked{background:var(--background-radial-sm)}[data-a11y=AA] kendo-grid[t-components-size=small].k-grid .k-grid-header .k-table-th .k-radio:checked:disabled,[data-a11y=AA] kendo-grid[t-components-size=small].k-grid .k-table-row .k-table-td .k-radio:checked:disabled{background:var(--background-radial-sm-disabled);background-color:var(--color-unchecked-disabled)}.k-grid .k-grid-header .k-table-th .k-radio:hover,.k-grid .k-table-row .k-table-td .k-radio:hover{border-color:var(--color-hover);box-shadow:0 0 0 4px var(--shadow-color-hover)}.k-radio input[type=radio][disabled],.k-radio input[type=radio][disabled]+span{box-shadow:none;cursor:not-allowed}.k-radio input[type=checkbox]:checked{background:var(--background-radial-md);background-color:var(--color-unchecked);border-color:var(--color-checked);padding:4px}.k-radio input[type=radio][disabled]{background-color:var(--color-unchecked-disabled);border-color:var(--color-checked-disabled)}.k-radio input[type=radio][disabled]:checked{background:var(--background-radial-md-disabled);background-color:var(--color-unchecked-disabled)}.k-radio input[type=radio]:not([disabled]):focus-visible{outline:none}.k-grid .k-grid-header .k-table-th .k-radio:focus,.k-grid .k-table-row .k-table-td .k-radio:focus{outline-color:var(--outline-color-focused);box-shadow:none;outline-offset:2px;outline-style:solid;outline-width:var(--outline-width-focus-visible)}.k-radio:checked:before,.k-radio.k-checked:before{background-color:initial!important;-webkit-mask-image:none!important;mask-image:none!important}kendo-grid .k-grouping-header kendo-chip.k-chip{border-radius:var(--border-radius);border-width:var(--border-width-sm);padding-inline-start:var(--spacing-xs);padding-inline-end:0;color:var(--text-color-info);align-items:center;border-color:var(--border-color);border-style:solid;display:flex;gap:.25em;justify-content:center;max-width:15em;min-height:1.5em;min-width:1.5em;width:max-content;background-color:var(--color-info);background-image:none;padding-block:0}kendo-grid .k-grouping-header kendo-chip.k-chip:focus,kendo-grid .k-grouping-header kendo-chip.k-chip.k-focus{box-shadow:none}kendo-grid .k-grouping-header kendo-chip.k-chip .k-icon{font-size:1rem}kendo-grid .k-grouping-header kendo-chip.k-chip .k-chip-content{font-family:var(--font-family);font-size:var(--font-size);font-weight:var(--font-weight-normal);line-height:var(--line-height);overflow:hidden;text-align:left;white-space:nowrap;margin-block:0;padding-block:0}kendo-grid .k-grouping-header kendo-chip.k-chip .k-chip-actions{border-bottom-right-radius:var(--border-radius);border-left-color:var(--border-color);border-left-width:var(--border-width-sm);border-top-right-radius:var(--border-radius);color:var(--color-icon);border-left-style:solid;justify-content:center;padding-left:.25em;padding-right:.25em;min-width:1.5625em;overflow:hidden;margin-block:0;align-self:stretch}kendo-grid .k-grouping-header kendo-chip.k-chip .k-chip-actions .k-chip-action{padding:0}kendo-grid .k-grouping-header kendo-chip.k-chip .k-chip-actions .k-chip-action:first-child{display:none}.k-grid .k-table-row .k-table-td .k-input{background-color:var(--background);border-color:var(--color);border-radius:var(--border-radius-md);border-style:solid;border-width:var(--border-width-sm);box-sizing:border-box;color:var(--text-color);font-family:var(--font-family);font-size:var(--font-size);font-weight:var(--font-weight-normal);min-height:2.75em;padding-block:0;padding-inline:var(--padding);width:100%}.k-button{border-radius:var(--border-radius);border-width:var(--border-width);font-family:var(--font-family);font-size:var(--font-size);font-weight:var(--font-weight-bold);letter-spacing:var(--letter-spacing-auto);line-height:var(--line-height);padding-block:0;padding-inline:var(--padding);align-items:center;background-image:none;border-style:solid;cursor:pointer;display:inline-flex;gap:.5em;justify-content:center;min-height:2.75em;min-width:2.75em;overflow:hidden;transition:none;width:auto;white-space:normal}.k-button[class*=-base]{background-color:var(--background-color);border-color:var(--border-color);box-shadow:var(--shadow);color:var(--color)}.k-button[class*=-base]:hover{color:var(--border-color-hover);background-color:var(--background-hover)}.k-button[class*=-base]:enabled:active{background-color:var(--background-pressed);color:var(--color-pressed);outline-color:var(--outline-color-focused);outline-width:var(--outline-width);outline-style:solid;outline-offset:2px}.k-button.k-disabled[class*=-base]{border-color:var(--color-disabled);color:var(--color-disabled)}.k-button[class*=-md]{min-height:2.75em;min-width:2.75em}.k-button:is(:focus,:focus-visible){outline-color:var(--outline-color-focused);outline-width:var(--outline-width);outline-style:solid;outline-offset:2px}.k-button-text{font-size:inherit;display:inline;vertical-align:middle}[data-a11y=AA] kendo-grid[t-spacing=extraSmall].k-grid .k-table-row:not(.k-detail-row) .k-table-td,[data-a11y=AA] kendo-grid[t-spacing=extraSmall].k-grid .k-grid-header .k-table-th,[data-a11y=AA] kendo-grid[t-spacing=extraSmall].k-grid .k-grid-md .k-grouping-header,[data-a11y=AA] kendo-grid[t-spacing=extraSmall].k-grid-md .k-grouping-header{padding:var(--spacing-xxs) var(--spacing-xs)}kendo-grid[t-spacing=small].k-grid .k-table-row:not(.k-detail-row) .k-table-td{padding:var(--spacing-xs) var(--spacing-sm)}kendo-grid.k-grid .k-table-row:not(.k-detail-row) .k-table-td,kendo-grid.k-grid .k-grid-header .k-table-th,kendo-grid.k-grid .k-grid-md .k-grouping-header,kendo-grid.k-grid-md .k-grouping-header{padding:.75rem var(--spacing-sm)}kendo-grid[t-spacing=large].k-grid .k-table-row:not(.k-detail-row) .k-table-td{padding:var(--spacing-sm)}.fixed-header{top:0;position:fixed;width:auto;z-index:1000}.fixed-header-with-group{top:40px}.fixed-header.k-grid-header{padding:0}.fixed-header .k-grid-content.k-virtual-content{overflow-y:hidden}thf-grid .po-field-error-limit{display:initial;text-overflow:ellipsis}.k-grid .k-grouping-row p{line-height:var(--line-height-md);font-size:var(--font-size-default)}kendo-grid[t-components-size=small].k-grid .k-grid-header .k-table-th,kendo-grid[t-components-size=small].k-grid .k-table-row:not(.k-detail-row) .k-table-td,kendo-grid[t-components-size=small].k-grid .k-table-row.k-detail-row .k-table-td,[data-a11y=AA] kendo-grid[t-spacing=extraSmall].k-grid .k-grouping-row p,kendo-grid[t-components-size=small] .thf-grid-list-manager-item-text,kendo-grid[t-components-size=small].k-grid .k-grouping-row p{font-size:var(--font-size-sm)}thf-grid-column-icon,thf-grid-column-label{display:inline-flex;vertical-align:top;line-height:1}.k-grouping-header{border-bottom:var(--border-width) solid var(--border-color)}.k-grouping-header:before{display:none}.k-grouping-header>.k-grouping-drop-container{padding-block:0;margin:0;line-height:var(--spacing-md)}thf-grid-edit .po-field-icon-container-right po-icon.po-field-icon i{pointer-events:none}thf-grid-edit po-timepicker .po-input{padding-block:0px;padding-left:.5rem}thf-grid .components-form .po-field-container-content,thf-grid[t-components-size=small] .components-form .po-field-container-content{--padding: var(--spacing-xs) 0}thf-grid .components-form .po-checkbox-aa{margin:0}.k-grid .header-right-icon,.k-grid .k-grid-header .k-table-th .k-cell-inner po-icon.po-icon-header{color:var(--color-action-default)}.k-grid .header-left-icon{padding-right:var(--spacing-xs)}.k-grid .header-right-icon:not(:empty){margin-left:var(--spacing-xs);align-items:center}.header-draggable-title-content{display:flex;gap:var(--spacing-xs)}kendo-grid[t-components-size=small].k-grid po-listbox .po-item-list__action po-icon.po-popup-icon-item.po-field-icon,kendo-grid[t-components-size=small].k-grid po-listbox .po-listbox-group-header po-icon.po-field-icon{font-size:var(--font-size-default);height:var(--font-size-default)}po-icon.po-icon-filter-column:focus{outline-color:var(--outline-color-focused);outline-offset:-2px;outline-style:solid;outline-width:var(--outline-width-focus-visible)}.k-grid .po-listbox-group-header .po-tag{border:none;margin-top:1px}.k-grid .po-listbox-group-header po-tag{height:var(--font-size-lg);display:flex;align-items:center}.filter-by-column-container{width:240px}.filter-by-column-container .filters-content-components{gap:8px;display:grid}.filter-by-column-container .container-buttons-filters{display:flex;justify-content:end;align-items:center;gap:8px}.k-grid po-listbox .filters-content-components po-field-container-bottom .po-field-container-bottom:not(:empty),.k-grid po-listbox .filters-content-components po-field-container-bottom .po-field-container-bottom:empty,.k-grid po-listbox .filters-content-components po-field-container .po-field-container-content,kendo-grid[t-components-size=small].k-grid po-listbox .filters-content-components po-field-container .po-field-container-content{padding:0}.k-grid po-listbox .filters-content-components .po-field-container-bottom-text-error{display:flex;align-items:center}.filter-column-checkbox{display:grid;padding-top:16px;padding-bottom:8px;gap:8px}po-divider.components-filter-by-column .po-divider{margin-bottom:0}@media print{kendo-grid .k-icon.k-i-plus:before{content:"\\e03e";font-family:Animalia}kendo-grid .k-icon.k-i-minus:before{content:"\\e08e";font-family:Animalia}}@media screen and (max-width:480px){.k-grid .k-grid-toolbar.k-toolbar .toolbar-edit-row-actions .thf-grid-toolbar-buttons,.k-grid .k-grid-toolbar.k-toolbar .toolbar-edit-row-actions .thf-grid-toolbar-items-selected{padding-left:0}.k-grid .k-grid-toolbar.k-toolbar .thf-grid-toolbar-content-input,kendo-grid .k-toolbar-md{padding-right:0}}.thf-cell-overlay{position:absolute;inset:0;z-index:1;display:flex;align-items:center;justify-content:center}.thf-row-disabled .k-table-td-select{pointer-events:none}kendo-grid[t-components-size=small].k-grid tr.thf-grid-inline-edit td:has(po-multiselect .po-multiselect-input-disabled),kendo-grid[t-components-size=small].k-grid tr.thf-grid-current-row-actions td:has(po-multiselect .po-multiselect-input-disabled),kendo-grid[t-components-size=small].k-grid tr.thf-grid-include-mode-row-actions td:has(po-multiselect .po-multiselect-input-disabled){align-content:normal}thf-grid kendo-grid[t-spacing=extraSmall] .k-table-row,thf-grid kendo-grid[t-spacing=small] .k-table-row,thf-grid kendo-grid[t-spacing=medium] .k-table-row,thf-grid kendo-grid[t-spacing=large] .k-table-row{height:auto!important}\n'
            ],
            encapsulation: 2
        });
    }
}
