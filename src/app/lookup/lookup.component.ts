import {
    Component,
    DestroyRef,
    ElementRef,
    computed,
    effect,
    forwardRef,
    inject,
    input,
    signal,
    viewChild,
    viewChildren
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { PoDisclaimer, PoDisclaimerModule, PoFieldContainerModule, PoIconModule, PoLoadingModule } from '@po-ui/ng-components';
import { ThfLookupComponent } from '@totvs/thf-components';
import { v4 as uuid } from 'uuid';
import { LookupModalComponent } from './components/lookup-modal/lookup-modal.component';
import { LookupService, LookupValue } from './services/lookup.service';

const A11Y_ATTRIBUTE = 'data-a11y';
const INPUT_RESERVED_WIDTH = 44;
const DISCLAIMER_GAP = 4;

type LookupSize = 'small' | 'medium';
type LookupValueType = 'string' | 'number';
type LookupPrimitiveValue = string | number;

@Component({
    selector: 'lookup',
    templateUrl: './lookup.component.html',
    styleUrls: ['./lookup.component.scss'],
    imports: [
        PoFieldContainerModule,
        PoDisclaimerModule,
        PoIconModule,
        PoLoadingModule,
        ReactiveFormsModule,
        ThfLookupComponent,
        LookupModalComponent
    ],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => LookupComponent),
            multi: true
        },
        LookupService
    ],
    host: {
        '[attr.t-disabled]': 'isDisabled()',
        '[attr.t-size]': 'size()',
        '(document:click)': 'onDocumentClick($event)'
    }
})
export class LookupComponent implements ControlValueAccessor {
    private readonly destroyRef = inject(DestroyRef);
    private readonly hostElement = inject(ElementRef<HTMLElement>);
    private readonly lookupSrv = inject(LookupService);

    readonly label = input<string | null>();
    readonly type = input<LookupValueType>('string');
    readonly maxlength = input<number>();
    readonly loading = input(false);
    readonly disabled = input(false);
    readonly readonly = input(false);
    readonly clean = input(false);
    readonly multiValue = input(false);
    readonly serviceUrl = input<string>();

    readonly inputValueControl = new FormControl('', { nonNullable: true });
    readonly disclaimerContainerElement = viewChild<ElementRef<HTMLDivElement>>('disclaimerContainer');
    readonly inputElement = viewChild<ElementRef<HTMLInputElement>>('inputElement');
    readonly disclaimerItemElements = viewChildren<ElementRef<HTMLDivElement>>('disclaimerItem');

    readonly inputId = `lookup[${uuid()}`;
    readonly disclaimers = signal<PoDisclaimer[]>([]);
    readonly isExpanded = signal(false);
    readonly size = signal<LookupSize>('small');
    readonly visibleDisclaimerCount = signal(0);
    readonly hasInputValue = signal(false);
    readonly isFormDisabled = signal(false);

    readonly isLoading = computed(() => this.loading() || this.lookupSrv.loading());
    readonly isDisabled = computed(() => this.disabled() || this.isLoading() || this.isFormDisabled());
    readonly isInteractive = computed(() => !this.isDisabled() && !this.readonly());
    readonly isCompact = computed(() => this.size() === 'small');
    readonly hasValue = computed(() => this.multiValue() ? this.disclaimers().length > 0 : this.hasInputValue());
    readonly shouldShowClearButton = computed(() =>
        this.isInteractive() && this.hasValue() && (this.multiValue() || this.clean())
    );
    readonly visibleDisclaimers = computed(() => this.disclaimers().slice(0, this.visibleDisclaimerCount()));
    readonly hiddenDisclaimerCount = computed(() => this.disclaimers().length - this.visibleDisclaimerCount());

    private onChange: (value: LookupValue) => void = () => undefined;
    private onTouched: () => void = () => undefined;
    private pendingChangeValue: LookupValue = null;
    private hasPendingChange = false;
    private resizeObserver?: ResizeObserver;
    private accessibilityObserver?: MutationObserver;
    private observedContainerWidth?: number;

    constructor() {
        this.initializeInputValueListener();
        this.initializeInputDisabledState();
        this.initializeDisclaimerResizeObserver();
        this.initializeAccessibilityObserver();
        this.scheduleDisclaimerVisibilityCalculation();
        this.destroyRef.onDestroy(() => this.disconnectObservers());

        effect(() => {
            const confirmedValue = this.lookupSrv.confirmedValue();

            if (confirmedValue !== undefined) {
                this.writeValue(confirmedValue);
                this.scheduleValuePropagation(confirmedValue);
                this.lookupSrv.clearConfirmedValue();
            }
        });
    }

    writeValue(value: LookupValue): void {
        this.lookupSrv.setFieldValue(value);

        if (this.multiValue()) {
            this.disclaimers.set(this.toDisclaimerValues(value));
            this.inputValueControl.setValue('', { emitEvent: false });
            this.hasInputValue.set(false);
            this.scheduleDisclaimerVisibilityCalculation();
            return;
        }

        const inputValue = this.toSingleValue(value);
        this.inputValueControl.setValue(inputValue, { emitEvent: false });
        this.hasInputValue.set(Boolean(inputValue));
    }

    registerOnChange(onChange: (value: LookupValue) => void): void {
        this.onChange = onChange;
    }

    registerOnTouched(onTouched: () => void): void {
        this.onTouched = onTouched;
    }

    setDisabledState(isDisabled: boolean): void {
        this.isFormDisabled.set(isDisabled);

        if (isDisabled) {
            this.inputValueControl.disable({ emitEvent: false });
        } else {
            this.inputValueControl.enable({ emitEvent: false });
        }
    }

    focusInput(): void {
        if (!this.isInteractive()) {
            return;
        }

        this.expandDisclaimers();
        this.inputElement()?.nativeElement.focus();
    }

    expandDisclaimers(): void {
        if (!this.isInteractive()) {
            return;
        }

        this.isExpanded.set(true);
        this.visibleDisclaimerCount.set(this.disclaimers().length);
    }

    collapseDisclaimers(): void {
        if (!this.isInteractive()) {
            return;
        }

        this.isExpanded.set(false);
        this.scheduleDisclaimerVisibilityCalculation();
    }

    onInputKeydown(event: KeyboardEvent): void {
        if (!this.multiValue() || !this.isInteractive() || !this.isSubmitKey(event.key)) {
            return;
        }

        const input = event.target as HTMLInputElement;
        const value = this.normalizeInputValue(input.value).trim();

        if (event.key === 'Enter') {
            event.preventDefault();
        }

        if (!value || this.hasDuplicateDisclaimer(value)) {
            return;
        }

        this.disclaimers.update(disclaimers => [...disclaimers, { value }]);
        this.inputValueControl.setValue('', { emitEvent: false });
        this.hasInputValue.set(false);
        this.propagateMultiValue();
        this.scheduleDisclaimerVisibilityCalculation();
    }

    onInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        const value = this.normalizeInputValue(input.value);

        if (input.value !== value) {
            input.value = value;
            this.inputValueControl.setValue(value, { emitEvent: false });

            if (!this.multiValue()) {
                this.propagateSingleValue(value);
            }
        }
    }

    onInputBlur(): void {
        this.onTouched();
    }

    removeDisclaimer(disclaimer: PoDisclaimer): void {
        this.disclaimers.update(disclaimers => disclaimers.filter(item => item !== disclaimer));
        this.propagateMultiValue();
        this.scheduleDisclaimerVisibilityCalculation();
    }

    clearValue(): void {
        if (this.multiValue()) {
            this.disclaimers.set([]);
            this.inputValueControl.setValue('', { emitEvent: false });
            this.propagateMultiValue();
            this.scheduleDisclaimerVisibilityCalculation();
        } else {
            this.inputValueControl.setValue('', { emitEvent: false });
            this.propagateSingleValue('');
        }

        this.hasInputValue.set(false);
        this.focusInput();
    }

    onDocumentClick(event: MouseEvent): void {
        if (this.isExpanded() && !event.composedPath().includes(this.hostElement.nativeElement)) {
            this.collapseDisclaimers();
        }
    }

    private initializeInputValueListener(): void {
        this.inputValueControl.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(value => {
                const normalizedValue = this.normalizeInputValue(value);
                this.hasInputValue.set(Boolean(normalizedValue));

                if (normalizedValue !== value) {
                    this.inputValueControl.setValue(normalizedValue, { emitEvent: false });
                }

                if (!this.multiValue()) {
                    this.propagateSingleValue(normalizedValue);
                }
            });
    }

    private initializeInputDisabledState(): void {
        effect(() => {
            if (this.isDisabled()) {
                this.inputValueControl.disable({ emitEvent: false });
            } else {
                this.inputValueControl.enable({ emitEvent: false });
            }
        });
    }

    private initializeDisclaimerResizeObserver(): void {
        effect(() => {
            const container = this.disclaimerContainerElement();

            if (container && !this.resizeObserver) {
                this.resizeObserver = new ResizeObserver(([entry]) => {
                    const containerWidth = entry.contentRect.width;

                    if (containerWidth === this.observedContainerWidth) {
                        return;
                    }

                    this.observedContainerWidth = containerWidth;
                    this.scheduleDisclaimerVisibilityCalculation();
                });
                this.resizeObserver.observe(container.nativeElement);
            }
        });
    }

    private initializeAccessibilityObserver(): void {
        const documentElement = document.documentElement;
        this.size.set(this.getSize(documentElement));

        this.accessibilityObserver = new MutationObserver(() => {
            this.size.set(this.getSize(documentElement));
        });
        this.accessibilityObserver.observe(documentElement, {
            attributes: true,
            attributeFilter: [A11Y_ATTRIBUTE]
        });
    }

    private disconnectObservers(): void {
        this.resizeObserver?.disconnect();
        this.accessibilityObserver?.disconnect();
    }

    private propagateSingleValue(value: string): void {
        const outputValue = this.toOutputValue(value);
        this.lookupSrv.setFieldValue(outputValue);
        this.scheduleValuePropagation(outputValue);
    }

    private propagateMultiValue(): void {
        const outputValue = this.disclaimers().map(disclaimer => this.toOutputValue(String(disclaimer.value)));
        this.lookupSrv.setFieldValue(outputValue);
        this.scheduleValuePropagation(outputValue);
    }

    private scheduleValuePropagation(value: LookupValue): void {
        this.pendingChangeValue = value;

        if (this.hasPendingChange) {
            return;
        }

        this.hasPendingChange = true;
        queueMicrotask(() => {
            this.hasPendingChange = false;
            this.onChange(this.pendingChangeValue);
        });
    }

    private hasDuplicateDisclaimer(value: string): boolean {
        const normalizedValue = this.toOutputValue(value);

        return this.disclaimers().some(disclaimer =>
            this.toOutputValue(String(disclaimer.value)) === normalizedValue
        );
    }

    private toOutputValue(value: string): LookupPrimitiveValue | null {
        if (this.type() === 'string') {
            return value;
        }

        return value === '' ? null : Number(value);
    }

    private toSingleValue(value: LookupValue): string {
        const singleValue = Array.isArray(value) ? value[0] : value;

        return singleValue === null || singleValue === undefined ? '' : String(singleValue);
    }

    private toDisclaimerValues(value: LookupValue): PoDisclaimer[] {
        const values = Array.isArray(value) ? value : value === null ? [] : [value];

        return values.map(item => ({ value: String(item) }));
    }

    private normalizeInputValue(value: string): string {
        return this.type() === 'number' ? value.replace(/\D/g, '') : value;
    }

    private scheduleDisclaimerVisibilityCalculation(): void {
        this.visibleDisclaimerCount.set(this.disclaimers().length);
        requestAnimationFrame(() => this.calculateVisibleDisclaimers());
    }

    private calculateVisibleDisclaimers(): void {
        const disclaimers = this.disclaimers();

        if (!disclaimers.length) {
            this.visibleDisclaimerCount.set(0);
            return;
        }

        if (this.isExpanded()) {
            this.visibleDisclaimerCount.set(disclaimers.length);
            return;
        }

        const container = this.disclaimerContainerElement();
        const disclaimerItems = this.disclaimerItemElements();
        if (!container || !disclaimerItems.length) {
            return;
        }

        const availableWidth = container.nativeElement.clientWidth - INPUT_RESERVED_WIDTH;
        const visibleCount = this.getVisibleDisclaimerCount(disclaimerItems, availableWidth);

        this.visibleDisclaimerCount.set(
            visibleCount === disclaimers.length ? visibleCount : Math.max(1, visibleCount)
        );
    }

    private getVisibleDisclaimerCount(items: readonly ElementRef<HTMLDivElement>[], availableWidth: number): number {
        let occupiedWidth = 0;
        let visibleCount = 0;

        for (const item of items) {
            occupiedWidth += item.nativeElement.offsetWidth + DISCLAIMER_GAP;

            if (occupiedWidth > availableWidth) {
                break;
            }

            visibleCount++;
        }

        return visibleCount;
    }

    private isSubmitKey(key: string): boolean {
        return key === 'Enter' || key === 'Tab';
    }

    private getSize(element: HTMLElement): LookupSize {
        return element.getAttribute(A11Y_ATTRIBUTE) === 'AAA' ? 'medium' : 'small';
    }
}
