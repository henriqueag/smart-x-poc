import { AfterViewInit, Component, computed, DestroyRef, effect, ElementRef, forwardRef, HostListener, inject, input, output, QueryList, signal, ViewChild, ViewChildren } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { PoDisclaimer, PoDisclaimerModule } from '@po-ui/ng-components';
import { debounceTime, distinctUntilChanged } from 'rxjs';

export interface Disclaimer extends PoDisclaimer {
    formattedValue?: string | number;
}

const CONTROL_VALUE_ACCESSOR = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => AutocompleteComponent),
    multi: true
};

@Component({
    selector: 'app-autocomplete',
    imports: [
        PoDisclaimerModule
    ],
    templateUrl: './autocomplete.component.html',
    styleUrl: './autocomplete.component.scss',
    providers: [CONTROL_VALUE_ACCESSOR]
})
export class AutocompleteComponent implements AfterViewInit, ControlValueAccessor {
    private destroyRef = inject(DestroyRef);

    tags = input.required<Disclaimer[]>();
    readonly = signal(false);

    add = output<string>();
    remove = output<Disclaimer>();
    removeAll = output<void>();
    keydown = output<KeyboardEvent>();

    @ViewChild('container', { static: true }) containerEl!: ElementRef<HTMLDivElement>;
    @ViewChild('autocompleteInput') autocompleteInputEl?: ElementRef<HTMLInputElement>;
    @ViewChild('tagContainer', { static: true }) tagContainerEl!: ElementRef<HTMLDivElement>;
    @ViewChildren('tagItem') tagItems!: QueryList<ElementRef<HTMLDivElement>>;

    @HostListener('document:click', ['$event'])
    onClickOutside(event: MouseEvent) {
        if (!this.expanded()) return;

        const path = event.composedPath();
        const isInside = path.includes(this.containerEl.nativeElement);

        if (!isInside) {
            this.collapse();
        }
    }

    literals: { TagOverflowComponent_Empty: string; TagOverflowComponent_NewItem: string } = {
        TagOverflowComponent_Empty: 'Nenhum item',
        TagOverflowComponent_NewItem: 'Novo item'
    };

    internalControl = new FormControl('', { nonNullable: true });

    expanded = signal(false);
    visibleCount = signal(0);
    inputWidthCh = signal(8);

    visibleTags = computed(() => this.tags().slice(0, this.visibleCount()));
    hiddenCount = computed(() => this.tags().length - this.visibleCount());
    hiddenTags = computed(() => this.tags().length - this.visibleTags().length);

    constructor() {
        effect(() => this.visibleCount.set(this.tags().length));

        this.internalControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef), debounceTime(100), distinctUntilChanged()).subscribe(value => {
            this.onChange(value);
            this.syncInputWidth(value);
        });
    }

    ngAfterViewInit() {
        const tagItemsChanges$ = this.tagItems.changes.subscribe(() => {
            if (!this.expanded()) {
                requestAnimationFrame(() => {
                    this.calculateOverflow();
                });
            }
        });

        const resizeObserver = new ResizeObserver(() => {
            this.visibleCount.set(this.tags().length);

            requestAnimationFrame(() => {
                this.calculateOverflow();
            });
        });

        resizeObserver.observe(this.tagContainerEl.nativeElement);

        this.destroyRef.onDestroy(() => {
            resizeObserver.disconnect();
            tagItemsChanges$.unsubscribe();
        });
    }

    // --------- ControlValueAccessor implementation ---------
    private onChange: (value: string) => void = () => {};
    private onTouched: () => void = () => {};

    writeValue(obj: unknown): void {
        const value = typeof obj === 'string' ? obj : '';
        this.internalControl.setValue(value, { emitEvent: false });
        this.syncInputWidth(value);
    }

    registerOnChange(fn: (value: string) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState?(isDisabled: boolean): void {
        const disabled: boolean = isDisabled;
        if (disabled) {
            this.internalControl.disable();
        } else {
            this.internalControl.enable();
        }
    }

    // --------- Public methods ---------
    onContainerFocusIn(): void {
        this.readonly.set(false);
        this.expanded.set(true);
        this.autocompleteInputEl?.nativeElement.focus();
        // if (!this.readonly()) {
        //     queueMicrotask(() => this.calculateOverflow());
        // }

        // queueMicrotask(() => {
        //     if (document.activeElement === this.containerEl.nativeElement) {
        //         this.autocompleteInputEl?.nativeElement.focus();
        //     }
        // });
    }

    onContainerFocusOut(event: FocusEvent): void {
        const nextFocusedElement = event.relatedTarget as Node | null;

        if (nextFocusedElement && this.containerEl.nativeElement.contains(nextFocusedElement)) {
            return;
        }

        this.readonly.set(false);
        this.onTouched();
        queueMicrotask(() => this.calculateOverflow());
    }

    toggleExpand() {
        this.expanded.set(true);
    }

    onInputChange(event: Event): void {
        const value = (event.target as HTMLInputElement).value;
        this.internalControl.setValue(value);
    }

    onInputKeydown(event: KeyboardEvent): void {
        this.keydown.emit(event);

        if (event.key !== 'Enter') {
            return;
        }

        event.preventDefault();

        const value = this.internalControl.value.trim();

        if (!value) {
            return;
        }

        this.add.emit(value);
        this.internalControl.setValue('');
        this.syncInputWidth('');
        this.onTouched();

        queueMicrotask(() => this.calculateOverflow());
    }

    // --------- Private methods ---------
    private calculateOverflow() {
        if (!this.tagItems?.length) return;

        const tags = this.tags();

        if (!tags.length) {
            this.visibleCount.set(0);
            return;
        }

        if (this.expanded()) {
            this.visibleCount.set(tags.length);
            return;
        }

        const inputReservedWidth = this.readonly() ? 166 : 0;
        const containerWidth = this.tagContainerEl.nativeElement.clientWidth - 44 - inputReservedWidth;

        let totalWidth = 0;
        let visible = 0;

        for (const tagRef of this.tagItems) {
            const el = tagRef.nativeElement;
            totalWidth += el.offsetWidth + 8;

            if (totalWidth <= containerWidth) {
                visible++;
            } else {
                break;
            }
        }

        if (visible === tags.length) {
            this.visibleCount.set(visible);
            return;
        }

        this.visibleCount.set(Math.max(1, visible));
    }

    private syncInputWidth(value: string): void {
        const minWidth = 8;
        const maxWidth = 28;
        const nextWidth = Math.min(maxWidth, Math.max(minWidth, value.length + 1));
        this.inputWidthCh.set(nextWidth);
    }

    private collapse() {
        this.expanded.set(false);
        queueMicrotask(() => this.calculateOverflow());
    }
}
