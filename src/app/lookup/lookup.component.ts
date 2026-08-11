import {
    Component,
    DestroyRef,
    ElementRef,
    HostListener,
    computed,
    effect,
    forwardRef,
    inject,
    input,
    signal,
    untracked,
    viewChild,
    viewChildren
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { PoDisclaimer, PoDisclaimerModule, PoFieldContainerModule, PoIconModule, PoLoadingModule } from '@po-ui/ng-components';

const A11Y_ATTRIBUTE = 'data-a11y';

export const VALUE_ACCESSOR: any = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => LookupComponent),
    multi: true
};

@Component({
    selector: 'lookup',
    templateUrl: './lookup.component.html',
    styleUrls: ['./lookup.component.scss'],
    providers: [VALUE_ACCESSOR],
    imports: [
        PoFieldContainerModule, //
        PoDisclaimerModule,
        PoIconModule,
        PoLoadingModule
    ],
    host: {
        '[attr.t-disabled]': 'isDisabled()',
        '[attr.t-size]': 'size()'
    }
})
export class LookupComponent {
    private destroyRef = inject(DestroyRef);
    private hostEl = inject(ElementRef<HTMLElement>);

    type = input<'string' | 'number'>('string');
    maxlength = input<number | undefined>();
    loading = input<boolean>();
    disabled = input<boolean>();
    readonly = input<boolean>();
    clean = input<boolean>();

    readonly disclaimerContainerEl = viewChild<ElementRef<HTMLDivElement>>('disclaimerContainer');
    readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('inputEl');
    readonly disclaimerItems = viewChildren<ElementRef<HTMLDivElement>>('disclaimerItem');

    isDisabled = computed(() => this.disabled() || this.loading());

    id = `lookup[08c297ee-6c5a-4356-88fb-59759d0dcc90]`;

    expanded = signal(false);
    size = signal('small');

    disclaimers = signal<PoDisclaimer[]>([{ value: 'Disclaimer 1' }, { value: 'Disclaimer 2' }]);

    // quantidade de disclaimers que cabem na largura atual do container
    visibleCount = signal(this.disclaimers().length);

    visibleDisclaimers = computed(() => this.disclaimers().slice(0, this.visibleCount()));
    hiddenCount = computed(() => this.disclaimers().length - this.visibleCount());

    private resizeObserver: ResizeObserver;
    private mutationObserver: MutationObserver;

    constructor() {
        effect(() => {
            const disclaimerContainerEl = this.disclaimerContainerEl();

            if (!!disclaimerContainerEl && !this.resizeObserver) {
                this.resizeObserver = new ResizeObserver(() => this.refreshVisibility());
                this.resizeObserver.observe(disclaimerContainerEl.nativeElement);
            }
        });

        effect(() => {
            // 1. Lemos o Signal das viewChildren. Toda vez que os elementos mudarem no DOM,
            // a nova lista será notificada e este efeito irá reexecutar.
            this.disclaimerItems();

            // 2. Usamos untracked para ler o status de expanded sem fazer o efeito rodar
            // quando apenas o expanded mudar (mantendo o comportamento exato da sua inscrição anterior).
            const isExpanded = untracked(() => this.expanded());

            if (!isExpanded) {
                requestAnimationFrame(() => this.calculateVisibleDisclaimers());
            }
        });

        const element = document.documentElement;
        this.size.set(this.calculateSize(element));
        this.mutationObserver = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                if (mutation.type === 'attributes' && mutation.attributeName === A11Y_ATTRIBUTE) {
                    this.size.set(this.calculateSize(element));
                }
            }
        });

        // O atributo 'attributeFilter' garante que o observer SÓ dispare para o 'data-a11y',
        // ignorando outras mudanças de classes ou atributos no <html> (foco total em performance).
        this.mutationObserver.observe(element, {
            attributes: true,
            attributeFilter: [A11Y_ATTRIBUTE]
        });

        this.destroyRef.onDestroy(() => {
            this.resizeObserver?.disconnect();
            this.mutationObserver?.disconnect();
        });
    }

    // ação de clique no último item visível (indicador "+N") para expandir todos os disclaimers
    expand(): void {
        if (!this.isDisabled() && !this.readonly() && !this.loading()) {
            this.expanded.set(true);
        }
    }

    // clicar em qualquer área do container leva o foco para o input de digitação
    focusInput(): void {
        this.inputEl().nativeElement.focus();
    }

    // Enter/Tab insere o texto digitado como um novo disclaimer
    onInputKeydown(event: KeyboardEvent): void {
        if (event.key !== 'Enter' && event.key !== 'Tab') return;

        const input = this.inputEl().nativeElement;
        const value = input.value.trim();

        if (!value) return;

        if (event.key === 'Enter') {
            event.preventDefault();
        }

        this.disclaimers.update(disclaimers => [...disclaimers, { value }]);
        input.value = '';
        this.refreshVisibility();
    }

    onInput(event: InputEvent) {
        const input = event.target as HTMLInputElement;
        input.value = input.value.replace(/^\D*$/gm, '');
    }

    removeDisclaimer(disclaimer: PoDisclaimer): void {
        this.disclaimers.update(disclaimers => disclaimers.filter(item => item !== disclaimer));
        this.refreshVisibility();
    }

    clearDisclaimers(): void {
        this.disclaimers.set([]);
        this.inputEl().nativeElement.value = '';
        this.refreshVisibility();
        this.focusInput();
    }

    // clique fora do componente recolhe os disclaimers novamente (mais confiável que focusout,
    // pois elementos não focáveis, como o ícone de fechar do disclaimer, não disparam relatedTarget)
    @HostListener('document:click', ['$event'])
    onClickOutside(event: MouseEvent): void {
        if (!this.expanded()) return;

        const isInside = event.composedPath().includes(this.hostEl.nativeElement);

        if (!isInside) {
            this.collapse();
        }
    }

    private collapse(): void {
        if (!this.expanded()) return;

        this.expanded.set(false);
        requestAnimationFrame(() => this.calculateVisibleDisclaimers());
    }

    // reseta a contagem visível para o total e recalcula o overflow no próximo frame
    private refreshVisibility(): void {
        this.visibleCount.set(this.disclaimers().length);
        requestAnimationFrame(() => this.calculateVisibleDisclaimers());
    }

    private calculateVisibleDisclaimers(): void {
        const disclaimerItems = this.disclaimerItems();

        if (!disclaimerItems?.length) return;

        const disclaimers = this.disclaimers();

        if (!disclaimers.length) {
            this.visibleCount.set(0);
            return;
        }

        if (this.expanded()) {
            this.visibleCount.set(disclaimers.length);
            return;
        }

        // reserva espaço para o indicador "+N" e para o input de digitação
        const containerWidth = this.disclaimerContainerEl().nativeElement.clientWidth - 44;

        let totalWidth = 0;
        let visible = 0;

        for (const itemRef of disclaimerItems) {
            const el = itemRef.nativeElement;
            totalWidth += el.offsetWidth + 4;

            if (totalWidth <= containerWidth) {
                visible++;
            } else {
                break;
            }
        }

        this.visibleCount.set(visible === disclaimers.length ? visible : Math.max(1, visible));
    }

    private calculateSize(element: HTMLElement): 'small' | 'medium' {
        return element.getAttribute(A11Y_ATTRIBUTE) === 'AAA' ? 'medium' : 'small';
    }
}
