import { Component, computed, effect, ElementRef, forwardRef, inject, input, output, signal, viewChild } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import {
    PoButtonGroupComponent,
    PoButtonGroupItem,
    PoButtonGroupModule,
    PoComboFilterMode,
    PoComboOption,
    PoFieldModule
} from '@po-ui/ng-components';
import { TagSelectorService } from './tag-selector.service';

@Component({
    selector: 'app-tag-selector',
    imports: [PoFieldModule, PoButtonGroupModule, ReactiveFormsModule],
    templateUrl: './tag-selector.component.html',
    styleUrl: './tag-selector.component.scss',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => TagSelectorComponent),
            multi: true
        },
        TagSelectorService
    ]
})
export class TagSelectorComponent implements ControlValueAccessor {
    service = inject(TagSelectorService);

    tags = input<PoComboOption[]>([]);


    complete = output<void>();
    update = output<PoComboOption[]>();

    tag = new FormControl('');
    private tagValue = signal<string>('');

    filterMode = PoComboFilterMode.contains;

    // Funções de callback padrão do ControlValueAccessor
    private onChange: (value: string) => void = () => {};
    private onTouched: () => void = () => {};

    buttons = computed<PoButtonGroupItem[]>(() => {
        const value = this.tagValue();
        const currentTags = this.tags();
        const hasValue = value && value.length >= 2;
        const exists = currentTags.some(x => x.value === value);

        return [
            { icon: 'an an-check', tooltip: 'Selecionar', action: () => this.complete.emit() },
            { icon: 'an an-plus', tooltip: 'Adicionar', action: () => this.onAdd(), disabled: !hasValue || exists },
            { icon: 'an an-minus', tooltip: 'Excluir', action: () => this.onDelete(), disabled: !hasValue || !exists }
        ];
    });

    buttonsRef = viewChild(PoButtonGroupComponent, { read: ElementRef });

    constructor() {
        this.tag.valueChanges.subscribe(value => {
            const normalized = value ?? '';
            this.tagValue.set(normalized);
            this.onChange(normalized);
        });

        effect(() => {
            this.service.tags.set(this.tags());
        })
    }

    // #region Métodos Obrigatórios do ControlValueAccessor
    writeValue(value: any): void {
        const normalized = value ?? '';
        this.tag.setValue(normalized, { emitEvent: false }); // Evita loop infinito de eventos
        this.tagValue.set(normalized);
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }
    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState?(isDisabled: boolean): void {
        const _ = isDisabled ? this.tag.disable() : this.tag.enable();
    }
    // #endregion

    private onAdd() {
        const currentTag = this.tag.value ?? '';
        if (!currentTag.trim()) return;

        const exists = this.tags().some(t => t.value === currentTag);
        if (!exists) {
            this.update.emit([{ label: currentTag, value: currentTag }, ...this.tags()]);

            requestAnimationFrame(() => {
                this.tag.setValue(currentTag);
                this.tagValue.set(currentTag);
            });
        }
    }

    private onDelete() {
        const currentTag = this.tag.value ?? '';
        const filteredTags = this.tags().filter(t => t.value !== currentTag);

        this.tag.setValue('');
        this.tagValue.set('');
        this.update.emit(filteredTags);
    }
}
