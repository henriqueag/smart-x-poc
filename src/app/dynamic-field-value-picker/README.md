# Dynamic Field Value Picker

`DynamicFieldValuePickerComponent` é um controle Angular compatível com `ControlValueAccessor` para campos de valor único ou multivalor. Ele oferece duas capacidades explícitas:

- entrada manual de valores;
- seleção remota por tabela, usando `thf-lookup-data` em um modal.

O componente é destinado ao `DynamicFormComponent`. O carregador temporário dos estilos internos do THF é instanciado uma única vez pelo `DynamicFormComponent`.

## Uso básico

Importe o componente no componente standalone que contém o formulário reativo:

```ts
import { DynamicFieldValuePickerComponent } from '../dynamic-field-value-picker/dynamic-field-value-picker.component';

@Component({
  imports: [ReactiveFormsModule, DynamicFieldValuePickerComponent]
})
export class ExemploComponent {
  readonly form = new FormGroup({
    codigos: new FormControl<number[]>([])
  });
}
```

### Multivalor manual

```html
<dynamic-field-value-picker
  formControlName="codigos"
  label="Códigos"
  [multiValue]="true"
  [type]="'number'"
  selectionMode="manual"
/>
```

No modo manual, pressione `Enter` ou `Tab` para incluir o valor digitado. Valores repetidos são ignorados após a conversão definida por `type`.

### Seleção remota

```html
<dynamic-field-value-picker
  formControlName="clientes"
  label="Clientes"
  [multiValue]="true"
  [type]="'number'"
  selectionMode="lookup"
  [serviceUrl]="clientesLookupUrl"
/>
```

No modo `lookup`, o ícone de busca abre um modal com `thf-lookup-data`. A seleção só é propagada ao controle ao acionar **Selecionar** no modal.

## API

| Input | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` | `string \| null` | `undefined` | Rótulo exibido pelo `po-field-container`. |
| `type` | `'string' \| 'number'` | `'string'` | Converte o valor digitado e o valor emitido. Para números, a entrada aceita somente dígitos. |
| `maxlength` | `number` | `undefined` | Limite de caracteres do campo de entrada. |
| `loading` | `boolean` | `false` | Exibe carregamento e desabilita a interação enquanto estiver ativo. |
| `disabled` | `boolean` | `false` | Desabilita o campo. Também respeita o estado desabilitado recebido pelo formulário. |
| `readonly` | `boolean` | `false` | Mantém o valor visível, sem permitir edição ou interação. |
| `clean` | `boolean` | `false` | Exibe a ação de limpar em campos de valor único quando existe valor. Em multivalor, a ação é exibida sempre que houver itens. |
| `multiValue` | `boolean` | `false` | Alterna entre um valor único e uma coleção de valores com disclaimers. |
| `selectionMode` | `'manual' \| 'lookup'` | `'lookup'` | Define explicitamente se o campo oferece apenas digitação manual ou busca remota. |
| `serviceUrl` | `string` | `undefined` | URL usada pelo serviço de lookup. É necessária quando `selectionMode` é `lookup`. Não é usada no modo manual. |

## Contrato com formulários

O componente implementa `ControlValueAccessor` e deve ser usado com Reactive Forms.

| Configuração | Valor recebido e emitido |
| --- | --- |
| `multiValue="false"`, `type="string"` | `string`, com string vazia para limpeza manual. |
| `multiValue="false"`, `type="number"` | `number \| null`; uma entrada vazia é emitida como `null`. |
| `multiValue="true"`, `type="string"` | `string[]`. |
| `multiValue="true"`, `type="number"` | `number[]`. |
| Multivalor sem itens | `[]`. |

Para valores vindos do modal, o array multivalor é filtrado para remover itens `null` ou `undefined` antes de atualizar os disclaimers e o formulário.

### Limpeza e sincronização da tabela

Ao limpar um campo multivalor pela ação de limpar, o componente:

1. remove os disclaimers;
2. emite `[]` para o `FormControl`;
3. atualiza a seleção do `thf-lookup-data` com `[]`.

`thf-lookup-data` exige um valor válido em seu `writeValue`. Por isso, a seleção vazia permanece como array vazio no modal e no serviço. O `DynamicFieldValuePickerLookupService` trata `getObjectByValue([])` como um caso especial e retorna um placeholder vazio (`[{}]`), evitando a busca/realimentação contínua de objetos selecionados.

## Modos de seleção

### `manual`

- não renderiza o ícone de busca;
- não instancia `DynamicFieldValuePickerModalComponent`;
- não configura URL nem executa chamadas HTTP;
- suporta valor único e multivalor.

### `lookup`

- renderiza o ícone de busca;
- instancia o modal e o `thf-lookup-data`;
- usa uma instância local de `DynamicFieldValuePickerLookupService` para cada picker;
- mantém a seleção da tabela sincronizada com inclusões, remoções e limpeza do campo.

## Serviço remoto de lookup

O serviço local `DynamicFieldValuePickerLookupService` implementa `ThfLookupDataFilter` e espera que a URL retorne um objeto no formato:

```ts
interface Lookup {
  keyProperty?: string;
  data: unknown[];
  descriptor?: Record<string, string>;
  hasNext?: boolean;
}
```

- `keyProperty` identifica o campo de valor retornado pela tabela.
- `descriptor` determina as colunas: a chave é a propriedade e o valor é o rótulo.
- `data` contém os registros da página.
- `hasNext` informa se há mais resultados.

O carregamento inicial, sem texto de filtro, consulta a URL para obter colunas e `keyProperty`. Para reduzir chamadas remotas, filtros com um ou dois caracteres não fazem nova requisição e reutilizam a última resposta; filtros com três ou mais caracteres são enviados no parâmetro `q`. Paginação usa `page` e `pageSize`.

## Interação, layout e acessibilidade

- O input recebe foco ao clicar na área de valores multivalor.
- O contador `+N` de valores ocultos pode ser acionado por mouse, `Enter` ou espaço.
- Os ícones de busca e limpeza são acionáveis por mouse, `Enter` ou espaço.
- O listener de clique externo é registrado apenas enquanto os disclaimers estão expandidos e é removido ao recolher ou destruir o componente.
- A largura dos disclaimers visíveis é recalculada por `ResizeObserver` e `requestAnimationFrame`, usando `getVisibleDisclaimerCount`.
- O tamanho visual acompanha o atributo global `data-a11y`: `AAA` usa o tamanho médio; os demais valores usam o compacto.

## Estilos temporários do THF

Enquanto os estilos próprios do campo ainda não forem extraídos, `DynamicFormComponent` deve manter uma única instância oculta:

```html
<thf-lookup hidden t-field-label="hidden" aria-hidden="true" tabindex="-1" />
```

Essa instância carrega os estilos internos necessários às classes compartilhadas pelo picker. Não adicione esse elemento a cada instância de `dynamic-field-value-picker`.

Quando os estilos forem extraídos para o SCSS do componente, remova o carregador oculto de `DynamicFormComponent` e a dependência correspondente.

## Estrutura

```text
src/app/dynamic-field-value-picker/
├── dynamic-field-value-picker.component.ts
├── dynamic-field-value-picker.component.html
├── dynamic-field-value-picker.component.scss
├── components/
│   └── dynamic-field-value-picker-modal/
├── services/
│   └── dynamic-field-value-picker-lookup.service.ts
└── utils/
    └── disclaimer-layout.util.ts
```
