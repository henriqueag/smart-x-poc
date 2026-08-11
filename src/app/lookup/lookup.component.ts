import {
    Component,
    DestroyRef,
    ElementRef,
    computed,
    effect,
    inject,
    input,
    signal,
    viewChild,
    viewChildren
} from '@angular/core';
import { PoDisclaimer, PoDisclaimerModule, PoFieldContainerModule, PoIconModule, PoLoadingModule } from '@po-ui/ng-components';

const A11Y_ATTRIBUTE = 'data-a11y';
const LOOKUP_ID_PREFIX = 'lookup';
const INPUT_RESERVED_WIDTH = 44;
const DISCLAIMER_GAP = 4;

let nextLookupId = 0;

type LookupSize = 'small' | 'medium';
type LookupValueType = 'string' | 'number';

@Component({
    selector: 'lookup',
    templateUrl: './lookup.component.html',
    styleUrls: ['./lookup.component.scss'],
    imports: [PoFieldContainerModule, PoDisclaimerModule, PoIconModule, PoLoadingModule],
    host: {
        '[attr.t-disabled]': 'isDisabled()',
        '[attr.t-size]': 'size()',
        '(document:click)': 'onDocumentClick($event)'
    }
})
export class LookupComponent {
    private readonly destroyRef = inject(DestroyRef);
    private readonly hostElement = inject(ElementRef<HTMLElement>);

    readonly type = input<LookupValueType>('string');
    readonly maxlength = input<number>();
    readonly loading = input(false);
    readonly disabled = input(false);
    readonly readonly = input(false);
    readonly clean = input(false);

    readonly disclaimerContainerElement = viewChild<ElementRef<HTMLDivElement>>('disclaimerContainer');
    readonly inputElement = viewChild<ElementRef<HTMLInputElement>>('inputElement');
    readonly disclaimerItemElements = viewChildren<ElementRef<HTMLDivElement>>('disclaimerItem');

    readonly inputId = `${LOOKUP_ID_PREFIX}-${nextLookupId++}`;
    readonly disclaimers = signal<PoDisclaimer[]>([{ value: 'Disclaimer 1' }, { value: 'Disclaimer 2' }]);
    readonly isExpanded = signal(false);
    readonly size = signal<LookupSize>('small');
    readonly visibleDisclaimerCount = signal(this.disclaimers().length);

    readonly isDisabled = computed(() => this.disabled() || this.loading());
    readonly isInteractive = computed(() => !this.isDisabled() && !this.readonly());
    readonly isCompact = computed(() => this.size() === 'small');
    readonly shouldShowClearButton = computed(() => this.clean() && this.isInteractive());
    readonly visibleDisclaimers = computed(() => this.disclaimers().slice(0, this.visibleDisclaimerCount()));
    readonly hiddenDisclaimerCount = computed(() => this.disclaimers().length - this.visibleDisclaimerCount());

    private resizeObserver?: ResizeObserver;
    private accessibilityObserver?: MutationObserver;
    private observedContainerWidth?: number;

    constructor() {
        this.initializeDisclaimerResizeObserver();
        this.initializeAccessibilityObserver();
        this.scheduleDisclaimerVisibilityCalculation();
        this.destroyRef.onDestroy(() => this.disconnectObservers());
    }

    focusInput(): void {
        if (!this.isDisabled()) {
            this.inputElement().nativeElement.focus();
        }
    }

    expandDisclaimers(): void {
        if (!this.isInteractive()) {
            return;
        }

        this.isExpanded.set(true);
        this.visibleDisclaimerCount.set(this.disclaimers().length);
    }

    onInputKeydown(event: KeyboardEvent): void {
        if (!this.isInteractive() || !this.isSubmitKey(event.key)) {
            return;
        }

        const input = event.target as HTMLInputElement;
        const value = input.value.trim();

        if (!value) return;

        if (event.key === 'Enter') {
            event.preventDefault();
        }

        this.disclaimers.update(disclaimers => [...disclaimers, { value }]);
        input.value = '';
        this.scheduleDisclaimerVisibilityCalculation();
    }

    onInput(event: Event): void {
        if (this.type() !== 'number') {
            return;
        }

        const input = event.target as HTMLInputElement;
        input.value = input.value.replace(/\D/g, '');
    }

    removeDisclaimer(disclaimer: PoDisclaimer): void {
        this.disclaimers.update(disclaimers => disclaimers.filter(item => item !== disclaimer));
        this.scheduleDisclaimerVisibilityCalculation();
    }

    clearDisclaimers(): void {
        this.disclaimers.set([]);

        const input = this.inputElement()?.nativeElement;
        if (input) {
            input.value = '';
        }

        this.scheduleDisclaimerVisibilityCalculation();
        this.focusInput();
    }

    onDocumentClick(event: MouseEvent): void {
        if (this.isExpanded() && !event.composedPath().includes(this.hostElement.nativeElement)) {
            this.collapseDisclaimers();
        }
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

    private collapseDisclaimers(): void {
        this.isExpanded.set(false);
        this.scheduleDisclaimerVisibilityCalculation();
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
