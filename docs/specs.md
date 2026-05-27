# Especificações

## Informações Gerais

import { ThfModule } from '@totvs/thf-components';

## ThfGridComponent

O grid foi criado para que você tenha um controle de alto desempenho, oferecendo uma performance extremamente rápida, integrando-se perfeitamente ao seu aplicativo e sendo altamente personalizável.

É possivel realizar a importação individual do THF-Grid no seu módulo ou componente(caso esteja utilizando standalone): import { ThfGridComponent } from '@totvs/thf-components';

Seletor
```html
<thf-grid
  t-action-delete="boolean"
  t-action-edit="Function"
  t-action-excel="boolean"
  t-action-pdf="boolean"
  t-actions-right="boolean"
  t-actions="Array<ThfTableAction>"
  t-actions-filter="boolean"
  (t-delete-items)="EventEmitter"
  (t-after-duplicate)="EventEmitter"
  t-aggregates-config="ThfAggregateConfig"
  t-aggregates="Array<ThfAggregateDescriptor>"
  t-allow-batch-delete="boolean"
  t-auto-size="boolean"
  t-auto-size-on-scroll="boolean"
  (t-before-duplicate)="EventEmitter"
  (t-change-aggregates)="EventEmitter"
  (t-change-filter-by-column)="EventEmitter"
  (t-change-fixed-columns)="EventEmitter"
  (t-change-options-column-manager)="EventEmitter"
  (t-change-row-state-filter)="EventEmitter"
  (t-change-visible-columns)="EventEmitter"
  (t-changed-density)="EventEmitter"
  (t-changed-items)="EventEmitter"
  (t-restore-column-manager)="EventEmitter"
  t-columns="Array<ThfGridColumn>"
  t-components-size="string"
  t-container="boolean"
  t-custom-actions="Array<PoDropdownAction>"
  (t-custom-filter)="EventEmitter"
  t-custom-templates="{
    [key: string]: TemplateRef<any>;
  }"
  (t-delete-item)="EventEmitter"
  t-disabled-include-button="boolean"
  t-draggable="boolean"
  t-edit-properties="ThfGridEditProperties"
  (t-change-page-size)="EventEmitter"
  t-fields="Array<PoPageDynamicSearchFilters>"
  t-filter-column-properties="Array<ThfFilterByColumn>"
  t-filter-input-mode="'basic' | 'service'"
  t-grid-row-actions="ThfGridRowActions"
  t-group="Array<string>"
  t-groupable="boolean | GroupableSettings"
  t-header-template="TemplateRef<void>"
  t-headline-fixed="boolean"
  t-height="number | string | null"
  t-hide-action-fixed-columns="boolean"
  t-hide-batch-actions="boolean"
  t-hide-columns-manager="boolean"
  t-hide-select-all="boolean"
  t-hide-table-search="boolean"
  t-loading="boolean"
  t-items="Array<any>"
  (t-items-after-get)="EventEmitter"
  t-literals="ThfGridLiterals"
  t-max-columns="number"
  t-max-height="number | string | null"
  t-max-resizable-width="number"
  t-min-height="number | string | null"
  t-min-resizable-width="number"
  (t-change-group)="EventEmitter"
  t-load="string | (() => ThfGridOptions)"
  t-options-paging="Array<ThfGridOptionPaging>"
  (t-change-order-column)="EventEmitter"
  t-page-size="number"
  t-page-size-virtual="number"
  t-pageable="boolean"
  t-param-delete-api="string"
  t-resizable="boolean"
  t-row-height="number"
  (t-rows-selected)="EventEmitter"
  t-selectable="boolean"
  t-selectable-entire-line="boolean"
  t-selectable-removed="boolean"
  (t-selected)="EventEmitter"
  (t-all-selected)="EventEmitter"
  t-service-delete-api="string | ThfGridDeleteService"
  t-service-api="string"
  t-show-densification-configuration="boolean"
  t-show-draggable-icon="boolean"
  t-show-footer-aggregates="boolean"
  (t-show-more)="EventEmitter"
  t-show-more-disabled="boolean"
  t-show-more-visible="boolean"
  t-single-select="boolean"
  t-sort="Array<ThfGridColumnSort>"
  (t-change-sort-column)="EventEmitter"
  t-sortable="boolean"
  t-spacing="string"
  t-striped="boolean"
  t-text-wrap="boolean"
  (t-unselected)="EventEmitter"
  (t-all-unselected)="EventEmitter"
  t-virtual-columns="boolean"
  t-virtual-scroll="boolean" 
>
</thf-grid>
```

Propriedades/Eventos
Propriedades
Nome	Tipo	Padrão	Descrição
t-action-delete
boolean	
false

(opcional)
Exibe o botão de Excluir. Requer que a propriedade t-selectable esteja habilitada.

t-action-edit
Function	-	(opcional)
Exibe o botão de Editar e executa a função definida ao clicar. Requer que a propriedade t-selectable esteja habilitada.

// Exemplo de uso:
<thf-grid
 t-service-api="https://po-sample-api.onrender.com/v1/people"
 [t-action-edit]="myFunction.bind(this)"
 [t-selectable]-true
></thf-grid>
t-action-excel
boolean	
false

(opcional)
Exibe o botão de Exportar. Requer que a propriedade t-selectable esteja habilitada. Permite realizar o download dos dados do grid no formato .xlsx.

t-action-pdf
boolean	
false

(opcional)
Exibe o botão de Download. Requer que a propriedade t-selectable esteja habilitada. Permite realizar o download dos dados do grid no formato PDF.

Todos os dados exportados para PDF utilizarão a fonte 'Lato', garantindo compatibilidade com a tabela de caracteres ASCII estendida.

t-actions-right
boolean	
false

(opcional)
Posiciona a coluna de ações (t-actions) à direita.

t-actions
Array<ThfTableAction>	-	(opcional)
Permite definir uma lista de ações que implementam a interface ThfTableAction, adicionando uma coluna ao grid. Se houver apenas uma ação válida, ela será exibida diretamente na coluna, caso contrário, o componente se encarrega de agrupar múltiplas ações e exibe o ícone an an-dots-three-vertical. Ao pressionar o ícone, todas as ações serão listadas.

A coluna não será exibida se:

a lista contiver valores inválidos ou indefinidos;
houver apenas uma ação e a mesma não for visível.
// Exemplo de uso:
<thf-grid
 t-service-api="https://po-sample-api.onrender.com/v1/people"
 [t-actions]="actionsGrid"
></thf-grid>
actionsGrid: Array<ThfTableAction> = [
 {
   label: '',
   action: (e: any) => {
     this.poNotification.information(`${e.id} - ${e.name} `);
   },
   icon: 'ICON_MENU_OPEN',
   fixed: true
 },
];

constructor(private poNotification: PoNotificationService) {}
t-actions-filter
boolean	
true

(opcional)
Exibe o botão de Filtros. Habilita um modal com opções adicionais de filtro, caso o output t-custom-filter não esteja em uso.

(t-delete-items)
EventEmitter	-	(opcional)
Evento disparado após o método de exclusão ser finalizado. Retorna os itens que permanecem disponíveis.

(t-after-duplicate)
EventEmitter	-	(opcional)
Evento disparado após concluir o processo de duplicação de linha na edição fluída.

t-aggregates-config
ThfAggregateConfig	-	(opcional)
Objeto de configuração para definir as opções de comportamento e apresentação dos totalizadores/agregados (aggregates) da grid.

t-aggregates
Array<ThfAggregateDescriptor>	
[]

(opcional)
Possibilita apresentar totalizadores de uma ou mais colunas ao utilizar o recurso de agrupamento de colunas. Esta propriedade recebe um array com a lista de objetos com formato da interface ThfAggregateDescriptor.

t-allow-batch-delete
boolean	
false

(opcional)
Habilita a exclusão em lote dos itens selecionados na grid. Quando ativado, permite que múltiplos itens sejam excluídos de uma vez ao utilizar t-service-api e/ou t-service-delete-api, desde que o serviço implemente o método deleteBatchItems da interface ThfGridDeleteService.

t-auto-size
boolean	
false

(opcional)
Ajusta automaticamente a largura das colunas visíveis no grid. O ajuste automático é realizado durante a inicialização. Requer que a propriedade t-resizable esteja habilitada.

Apesar de atribuir largura às colunas do grid, é importante ressaltar que o componente recalcula as larguras das demais colunas de acordo com os espaços disponíveis no grid, podendo alterar as dimensões passadas proporcionalmente. Esta propriedade é incompatível quando t-grid-row-actions está habilitado.

t-auto-size-on-scroll
boolean	
false

(opcional)
Ativa o redimensionamento automático das colunas durante a rolagem virtual.

Quando habilitado, a grid recalcula automaticamente as larguras das colunas conforme novos dados são carregados durante a rolagem, garantindo que o conteúdo seja exibido corretamente sem truncamento indesejado.

O redimensionamento ocorre a cada mudança de página virtual, controlada pela propriedade t-page-size-virtual (valor padrão: 60 itens por página).

Pré-requisitos: Requer que as propriedades t-auto-size, t-resizable e t-virtual-scroll (ou altura fixa via [t-height]) estejam habilitadas.

Incompatibilidade: Não funciona com t-grid-row-actions habilitado;

Exemplo de uso:

<thf-grid
  ...
  [t-auto-size]="true"
  [t-auto-size-on-scroll]="true"
  [t-resizable]="true"
  [t-virtual-scroll]="true"
/>
(t-before-duplicate)
EventEmitter	-	(opcional)
Evento disparado antes da duplicação de uma linha na edição fluída. Permite cancelar a ação definindo cancel = true e manipular os dados através de duplicatedRow.

(t-change-aggregates)
EventEmitter	-	
Evento disparado após alterar os aggregates.

(t-change-filter-by-column)
EventEmitter	-	(opcional)
Evento disparado ao alterar um filtro por coluna. Retorna um array de ThfFilterByColumn com as colunas que possuem filtros aplicados.

(t-change-fixed-columns)
EventEmitter	-	(opcional)
Evento disparado ao fechar o Gerenciar Tabela após alterar as colunas fixas. Retorna um array de strings com as colunas fixas atualizadas.

(t-change-options-column-manager)
EventEmitter	-	(opcional)
Evento disparado ao selecionar a opção draggable ou groupable no Gerenciar Tabela. Retorna um array de strings contendo as ações habilitadas.

(t-change-row-state-filter)
EventEmitter	-	(opcional)
Evento disparado quando há alteração no estado de um filtro de linha.

(t-change-visible-columns)
EventEmitter	-	(opcional)
Evento disparado ao fechar o Gerenciar Tabela após alterar as colunas visíveis. Retorna um array de strings com as colunas visíveis atualizadas.

(t-changed-density)
EventEmitter	-	(opcional)
Evento disparado ao selecionar o tipo de densidade no Gerenciar Tabela. Retorna a densidade aplicada.

(t-changed-items)
EventEmitter	-	(opcional)
Evento emitido quando ocorre uma alteração em alguma linha da grid.

(t-restore-column-manager)
EventEmitter	-	(opcional)
Evento disparado quando pressionado o botão 'Restaurar padrão' no Gerenciar Tabela. Retorna um array de strings com as colunas visíveis por padrão.

t-columns
Array<ThfGridColumn>	-	(opcional)
Permite definir e configurar as colunas do grid que implementam a interface ThfGridColumn.

// Exemplo de uso:
<thf-grid
 t-service-api="https://po-sample-api.onrender.com/v1/people"
 [t-columns]="columns"
></thf-grid>
columns: Array<ThfGridColumn> = [
 { property: 'id', visible: false },
 { property: 'name', label: 'Nome' },
}
t-components-size
string	
medium

(opcional)
Define o tamanho dos componentes de formulário no grid:

small: aplica a medida small de cada componente (disponível apenas para acessibilidade AA).
medium: aplica a medida medium de cada componente.
Caso a acessibilidade AA não esteja configurada, o tamanho medium será mantido. Para mais detalhes, consulte a documentação do po-theme.

t-container
boolean	
true

(opcional)
Adiciona um contorno arredondado ao thf-grid.

t-custom-actions
Array<PoDropdownAction>	-	(opcional)
Permite adicionar ações customizadas que implementam a interface PoDropdownAction. Essas ações serão exibidas no dropdown 'Mais ações' ao selecionar um item. Requer que a propriedade t-selectable esteja habilitada.

// Exemplo de uso:
<thf-grid
 t-service-api="https://po-sample-api.onrender.com/v1/people"
 [t-custom-actions]="customActions"
 [t-selectable]="true"></thf-grid>
customActions: Array<PoDropdownAction> = [
 { label: 'Histórico', action: this.myAction.bind(this) }];

myAction() {
 window.alert('voce clicou em histórico!');
}
(t-custom-filter)
EventEmitter	-	(opcional)
Evento disparado ao clicar no menu Filtros.

t-custom-templates
{ [key: string]: TemplateRef<any>; }	-	(opcional)
Permite a criação de templates customizados para a edição fluída da grid, como por exemplo:

// Exemplo de uso:
<thf-grid
 ...
[t-custom-templates]="{ name: customTemplate }"
></thf-grid>
<ng-template #customTemplate let-formControl="formControl">
  <po-input [formControl]="formControl" p-placeholder="CPF" [p-required]="true"></po-input>
</ng-template>
É obrigatório passar o formControl como parâmetro do template.

Os eventos de validate, keydown, blur, additional-help, onChangeModel e change não são emitidos com o uso de templates customizados, sendo necessário o controle desses eventos dentro do próprio componente.

Caso utilize a propriedade controlValueWithLabel, é necessário continuar passando no editProperties em columns, em conjunto com fieldLabel, fieldValue e options caso esteja utilizando.

Caso o template não seja passado, o componente será renderizado de forma padrão.

Caso esteja utilizando o componente po-decimal e esteja configurando a propriedade p-decimals-length, é necessário continuar enviando via columns em editProperties.

Para que o grid exiba a label "(Obrigatório)" na coluna, defina em editProperties a propriedade required como true.

Para mais detalhes, consulte o exemplo na aba Overview - Edição fluída.

Ao utilizar templates customizados na edição fluída, é obrigatório definir p-append-in-body="true" para componentes que possuam listas flutuantes, popovers ou tooltips, bem como para componentes que utilizem po-helper. Componentes impactados:

po-checkbox
po-combo
po-datepicker
po-datepicker-range
po-decimal
po-input
po-login
po-lookup
po-multiselect
po-number
po-password
po-radio-group
po-rich-text
po-select
po-switch
po-textarea
po-upload
thf-lookup
Para mais informações sobre a propriedade p-append-in-body, consulte a documentação do componente correspondente.

(t-delete-item)
EventEmitter	-	(opcional)
Evento disparado ao excluir um item. Retorna o item excluído.

t-disabled-include-button
boolean	
false

(opcional)
Desabilita o botão de Incluir. Ao definir como true, o botão será desabilitado. Ideal para cenários onde a inclusão de novas linhas deve ser restrita.

t-draggable
boolean	
false

(opcional)
Habilita o Drag and Drop nas colunas.

t-edit-properties
ThfGridEditProperties	-	(opcional)
Permite configurar a edição em linha, implementando a interface ThfGridEditProperties. Exemplo de uso na aba Interfaces >> ThfGridEditProperties.

Para garantir o correto funcionamento da conclusão da edição dos dados, é necessário que os dados contenham uma coluna de ID ou que pelo menos uma coluna tenha a propriedade KEY definida como true.

(t-change-page-size)
EventEmitter	-	(opcional)
Evento disparado ao alterar a quantidade de itens por página. Retorna um objeto com o page-size atual.

t-fields
Array<PoPageDynamicSearchFilters>	-	(opcional)
Permite definir os campos filtráveis na janela 'Filtros', implementando a interface PoPageDynamicSearchFilters.

// Exemplo de uso:
<thf-grid
 t-service-api="https://po-sample-api.onrender.com/v1/people"
 [t-fields]="customFields"
></thf-grid>
customFields: Array<PoPageDynamicSearchFilters> = [{ property: 'name', required: true, showRequired: true }]
t-filter-column-properties
Array<ThfFilterByColumn>	-	(opcional)
Permite definir filtros por coluna logo na inicialização, deixando o grid já filtrado ao ser carregado.

filterColumnProperties = [
  {
    property: 'name',
    operator1: 'contains',
    value1: 'Ana'
  },
  {
    property: 'age',
    operator1: 'gte',
    value1: 18
  }
];
t-filter-input-mode
'basic''service'	
basic

(opcional)
Define o modo do filtro para o input de pesquisa.

t-grid-row-actions
ThfGridRowActions	-	(opcional)
Configura a edição fluída, implementando a interface ThfGridRowActions. Permite manipular o comportamento das ações de linha, como edição, inclusão e remoção de itens. É possível definir funções específicas para controlar as ações antes e depois das operações. Fundamental para implementar um fluxo de manipulação de dados totalmente personalizado.

Ao habilitar t-grid-row-actions a propriedade t-auto-size é desabilitada para manter a padronização das larguras das colunas editáveis. Quando o t-grid-row-actions é habilitado, a propriedade t-resizable é ativada automaticamente.

t-group
Array<string>	-	(opcional)
Lista das colunas que devem iniciar agrupadas. Requer que a propriedade t-groupable esteja habilitada.

t-groupable
booleanGroupableSettings	
false

(opcional)
Habilita a ordenação por grupo através da coluna.

t-header-template
TemplateRef<void>	-	(opcional)
Container aberto para adicionar conteúdo entre o cabeçalho de ações e a lista do grid.

// Exemplo de uso:
<thf-grid
 t-service-api="https://po-sample-api.onrender.com/v1/people"
 [t-header-template]="template"
></thf-grid>

<ng-template #template>
 <div style="display: flex; gap: 8px; align-items: center;">
   <po-tag [p-type]="tagTypeDanger" p-value="Remover todos"> </po-tag>
   <po-tag [p-type]="tagTypeInfo" [p-removable]="true" p-value="Brasil"> </po-tag>
   <po-tag [p-type]="tagTypeInfo" [p-removable]="true" p-value="College"> </po-tag>
 </div>
</ng-template>
t-headline-fixed
boolean	
false

(opcional)
Define o cabeçalho do grid como fixo, desde que a altura (t-height) não esteja definida.

t-height
numberstringnull	
100%

(opcional)
Define a altura da tabela. Aceita um número (em pixels) ou uma string percentual ("<número>%").

Se não informado, a altura da tabela será ajustada automaticamente pela quantidade de itens.
Caso seja informado um valor inválido, será aplicado 100% como padrão.
Se t-height for menor que t-min-height, a altura mínima será aplicada.
Se t-height for maior que t-max-height, a altura máxima será aplicada.
Observação: Quando definido, o virtual scroll será ativado automaticamente. Consulte a documentação da propriedade t-virtual-scroll para mais detalhes.

t-hide-action-fixed-columns
boolean	
false

(opcional)
Controla a visibilidade da opção de fixar colunas no Gerenciar Tabela. Se alguma coluna já estiver fixa quando essa propriedade for habilitada, ela permanecerá fixa, garantindo que ocultar as opções de fixar não afete o estado das colunas já fixadas.

t-hide-batch-actions
boolean	
false

(opcional)
Permite ocultar as ações em lote, responsável por excluir e exibir a quantidade de itens.

t-hide-columns-manager
boolean	
false

(opcional)
Permite ocultar o botão Gerenciar Tabela.

t-hide-select-all
boolean	
false

(opcional)
Permite ocultar o checkbox de selecionar todos os itens.

t-hide-table-search
boolean	
false

(opcional)
Permite ocultar o campo de pesquisa.

t-loading
boolean	
false

(opcional)
Bloqueia a interação do usuário com os dados do grid.

t-items
Array<any>	-	(opcional)
Permite listar os itens no grid. Cada item do array representa uma linha no grid e deve conter as propriedades que correspondem às colunas definidas no grid.

// Exemplo de uso:
<thf-grid
 [t-items]="[{ name: 'Mônica'}, { name: 'Cebolinha'}]"
></thf-grid>
(t-items-after-get)
EventEmitter	-	(opcional)
Evento disparado após finalização das requisições de GET. Dispara no GET inicial caso esteja utilizando t-service-api. Dispara também no GET de filtros caso esteja utilizando a propriedade t-actions-filter ou no GET do input de pesquisa quando a propriedade t-filter-input-mode estiver como service. Retorna os itens atuais da tabela, o total de itens, número da página atual e pageSize.

t-literals
ThfGridLiterals	-	(opcional)
Permite definir literais personalizados para o componente, conforme a interface ThfGridLiterals.

// Exemplo de uso:
<thf-grid
 t-service-api="https://po-sample-api.onrender.com/v1/people"
 [t-literals]="customLiterals"
></thf-grid>
customLiterals: ThfGridLiterals = { advancedSearch: 'Mais filtros' };
t-max-columns
number	-	(opcional)
Define a quantidade máxima de colunas que serão exibidas no grid. Quando chegar no valor informado, as colunas que não estiverem selecionadas ficarão desabilitadas e caso houver mais colunas visíveis do que o permitido, as excedentes serão ignoradas por ordem de posição.

t-max-height
numberstringnull	-	(opcional)
Define a altura máxima da tabela. Aceita um número (em pixels) ou uma string percentual ("<número>%").

Se não informado, a altura máxima será definida pela propriedade t-height, se existir.
Caso t-height seja maior que t-max-height, o grid usará t-max-height como limite superior.
Caso o valor passado seja inválido, nenhuma altura máxima será aplicada.
t-max-resizable-width
number	-	(opcional)
Define a largura máxima para redimensionar uma coluna. Requer que a propriedade t-resizable esteja habilitada.

t-min-height
numberstringnull	-	(opcional)
Define a altura mínima da tabela. Aceita um número (em pixels) ou uma string percentual ("<número>%").

Se não informado, a altura mínima será definida pela propriedade t-height, se existir.
Caso t-height seja menor que t-min-height, o grid usará t-min-height como limite inferior.
Caso o valor passado seja inválido, nenhuma altura mínima será aplicada.
t-min-resizable-width
number	
10

(opcional)
Define a largura mínima para redimensionar uma coluna. Requer que a propriedade t-resizable esteja habilitada.

(t-change-group)
EventEmitter	-	(opcional)
Evento disparado quando ocorre o agrupamento no grid. Retorna um array de strings das colunas agrupadas.

t-load
string(() => ThfGridOptions)	-	(opcional)
Define dinamicamente as colunas e ações do grid após o carregamento inicial dos dados. Pode ser uma URL que retorna a configuração via GET ou uma função que retorna a configuração diretamente. Quando função, a propriedade deve implementar a interface ThfGridOptions.

t-options-paging
Array<ThfGridOptionPaging>	-	(opcional)
Define as opções de itens por página, implementando a interface ThfGridOptionPaging. Requer que a propriedade t-pageable esteja habilitada.

(t-change-order-column)
EventEmitter	-	(opcional)
Evento disparado quando a ordem das colunas é alterada através do Gerenciar Tabela ou pelo Draggable. Retorna um array de strings.

t-page-size
number	
10

(opcional)
Define a quantidade de itens default na página. Requer que a propriedade t-pageable esteja habilitada.

t-page-size-virtual
number	
60

(opcional)
Necessário quando o virtual scroll está habilitado para evitar comportamentos inesperados durante a rolagem. Recomenda-se que o valor seja pelo menos 3 vezes o número de itens visíveis no grid.

t-pageable
boolean	
false

(opcional)
Exibe o botão 'Carregar mais resultados' e habilita a paginação no Gerenciar Tabela.

t-param-delete-api
string	-	(opcional)
Define o parâmetro para a requisição de DELETE ou POST(caso a propriedade t-allow-batch-delete seja definida).

Quando t-service-delete-api estiver configurado e o valor de t-param-delete-api não for informado, por padrão, será enviado key (definido ao usar ThfGridColumn) ou, na ausência, id. Caso t-service-delete-api não esteja definido, será considerada a URL de t-service-api.

Durante a exclusão de um único item, ele será enviado como parâmetro na URL, conforme o exemplo abaixo:

// Considerando t-param-delete-api="email"
DELETE /items?email=email1@example.com
Caso o valor não seja uma propriedade válida do item, o grid irá considerar as keys definidas na coluna

// Considerando t-param-delete-api="propriedadeInexistente" e as colunas "id" e "email" com keys definidas
DELETE /items?propriedadeInexistente=1|email1@example.com
Na ausência do t-param-delete-api e das keys, o grid irá considerar o id do item e enviar diretamente como parâmetro na URL:

// Considerando t-param-delete-api="email" e sem keys definidas
DELETE /items/1
Durante a exclusão em lote, ele será enviado no corpo da requisição POST como o índice paramDelete, conforme o exemplo abaixo:

// Considerando t-param-delete-api="email"
{
  items: [
    { id: '1', email: 'email1@example.com' },
    { id: '2', email: 'email2@example.com' }
  ],
  keys: ['email1@example.com', 'email2@example.com'],
  total: 2,
  paramDelete: "email"
}
t-resizable
boolean	
false

(opcional)
Habilita o redimensionamento da largura de cada coluna. Se as colunas forem redimensionadas de modo que a largura total seja menor que a largura do grid, o espaço restante ficará em branco.

t-row-height
number	-	(opcional)
Define a altura da linha quando o virtual scroll está habilitado. Necessária para calcular corretamente o número de itens visíveis e evitar comportamentos inesperados durante a rolagem. Recomenda-se o uso dessa propriedade ao utilizar colunas com templates personalizados (columnTemplate e cellTemplate).

(t-rows-selected)
EventEmitter	-	
Retorna um array indicando quais são as linhas selecionadas no momento.

t-selectable
boolean	
false

(opcional)
Habilita a seleção de itens, adicionando uma coluna com checkbox. A seleção padrão é múltipla, permitindo selecionar vários itens ao mesmo tempo.

t-selectable-entire-line
boolean	
true

(opcional)
Permite selecionar o item ao clicar na linha. Requer que a propriedade t-selectable esteja habilitada.

t-selectable-removed
boolean	
false

(opcional)
Controla se os itens exibidos quando o filtro de estado estiver em 'removed' poderão ser selecionados.

(t-selected)
EventEmitter	-	(opcional)
Evento disparado quando selecionado um item. Retorna o item selecionado.

(t-all-selected)
EventEmitter	-	(opcional)
Evento disparado quando selecionado todos os itens. Retorna todos os itens selecionados.

t-service-delete-api
stringThfGridDeleteService	-	(opcional)
Responsável por excluir o item. Aceita um serviço que implementa a interface ThfGridDeleteService ou uma URL.

Ao selecionar o botão de excluir, essa URL ou serviço será chamado, enviando o parâmetro definido na propriedade t-param-delete-api. Se configurado e t-param-delete-api não for informado, será enviado key (definido ao usar ThfGridColumn) ou, na ausência, id.

Por padrão, a exclusão é feita item a item. No entanto, ao habilitar a propriedade t-allow-batch-delete e utilizar um serviço com o método deleteBatchItems, a exclusão em lote será permitida.

Esta URL deve retornar e receber os dados no padrão de API do PO UI

Caso utilize um serviço ThfGridDeleteService, o tratamento de encoding do valor fica sob a responsabilidade do desenvolvedor.

t-service-api
string	-	(opcional)
Define a rota da API para realizar o GET dos itens e popular o grid. Para a exclusão, é necessário que a API esteja preparada para receber uma ou mais keys concatenadas para identificação do registro. Caso não haja keys, que implementa a interface ThfGridColumn, a requisição de exclusão ocorrerá pelo id.

t-show-densification-configuration
boolean	
false

(opcional)
Habilita um atalho para alternar o espaçamento das linhas do grid entre os modos Compacto e Espaçoso no Gerenciar Tabela.

Em nível de acessibilidade AA, a opção Extra Compacto também é exibida.

t-show-draggable-icon
boolean	
false

(opcional)
Exibe o ícone de draggable nas respectivas colunas.

t-show-footer-aggregates
boolean	
false

(opcional)
Quando definido true, exibirá no rodapé da tabela os totalizadores que foram definidos na propriedade t-aggregates.

(t-show-more)
EventEmitter	-	(opcional)
Evento disparado quando pressionado o botão 'Carregar mais'. Retorna um array do tipo ThfGridColumnSort, caso existam colunas ordenadas definidas.

Caso t-items esteja definido, o uso desse evento se torna obrigatório caso queira exibir o botão 'Carregar mais'.

t-show-more-disabled
boolean	
false

(opcional)
Desabilita o botão 'Carregar mais resultados'.

t-show-more-visible
boolean	
true

(opcional)
Controla a exibição do botão 'Carregar mais resultados'. Requer que a propriedade t-pageable esteja habilitada, ou seja utilizado o evento t-show-more em conjunto com a propriedade t-items.

Caso seja utilizado em conjunto com t-show-more-disabled, a propriedade t-show-more-visible terá prioridade.

t-single-select
boolean	
false

(opcional)
Define a seleção única. Requer que a propriedade t-selectable esteja habilitada.

t-sort
Array<ThfGridColumnSort>	-	(opcional)
Define a ordenação (sort) crescente (asc) ou decrescente (desc) por coluna.

// Exemplo de uso:
<thf-grid
 t-service-api="https://po-sample-api.onrender.com/v1/people"
 [t-sort]="sortColumns"
></thf-grid>
sortColumns: Array<ThfGridColumnSort> = [{ field: 'name', dir: 'desc'}];
(t-change-sort-column)
EventEmitter	-	(opcional)
Evento disparado ao alterar o sort da coluna. Retorna um array do tipo ThfGridColumnSort com a regra de sortable e a coluna aplicada.

t-sortable
boolean	
true

(opcional)
Habilita a ordenação (sort) crescente ou decrescente em todas as colunas do grid.

t-spacing
string	
medium

(opcional)
Define o espaçamento interno das células, impactando diretamente na altura das linhas do grid. Os valores permitidos são definidos pelo enum ThfColumnSpacing.

Em nível de acessibilidade AA, caso o valor de t-spacing não seja definido, o valor padrão será extraSmall nos seguintes cenários:

Quando o valor de t-components-size for small;
Quando o valor padrão dos componentes for configurado como small no serviço de tema.
t-striped
boolean	
true

(opcional)
Define o estilo listrado no grid (striped).

t-text-wrap
boolean	
false

(opcional)
Define a quebra automática de texto. Quando ativada, o texto que excede o espaço disponível é transferido para a próxima linha em pontos apropriados para uma leitura clara.

Propriedade incompatível quando t-virtual-scroll está habilitado.

(t-unselected)
EventEmitter	-	(opcional)
Evento disparado quando desselecionado um item. Retorna o item desselecionado.

(t-all-unselected)
EventEmitter	-	(opcional)
Evento disparado quando desselecionado todos os itens. Retorna um array com todos os itens desselecionados.

t-virtual-columns
boolean	
false

(opcional)
Define o uso do virtual columns no grid para melhorar a performance com grande volume de colunas. Recomendamos a utilização dessa propriedade somente em caso de perda de performance com grande quantidade de colunas. Existe incompatibilidade com a propriedade t-auto-size e método autoFitColumns(). Caso a grid tenha mais de 50 colunas o virtual-columns é ativado.

t-virtual-scroll
boolean	
true

(opcional)
Define o uso do virtual scroll no grid para melhorar a performance com grandes volumes de dados. Requer que a propriedade t-height esteja definida.

Verificar a documentação das seguintes propriedades: t-text-wrap, t-row-height e t-page-size-virtual.


Métodos
autoFitColumns
Ajusta automaticamente a largura das colunas com base no conteúdo atual das células.

Este método calcula a largura ideal para cada coluna considerando o conteúdo textual das células visíveis, cabeçalhos das colunas e configurações de redimensionamento e tamanho fixo

Exemplo de uso:

// Ajusta colunas e mantém largura total da tabela
this.gridComponent.autoFitColumns(true);

// Ajusta colunas e permite redimensionamento fluido
this.gridComponent.autoFitColumns();
Este método é chamado automaticamente quando:

A propriedade t-auto-size é habilitada
O evento t-auto-size-on-scroll é disparado durante scroll virtual
Parâmetros
Nome	Tipo	Descrição
recalculate	boolean	
Quando true, mantém a largura total da tabela após o ajuste. Quando false ou omitido, limpa a largura fixa da tabela para permitir redimensionamento fluido.


cleanRowActionsMode
Aplica o estado default aos itens editados, incluídos e removidos do grid.

Usado para aplicar as alterações realizadas nos registros do grid, e também para remover os itens marcados para exclusão, de acordo com os parâmetros fornecidos.

// Aplica o estado de edição e inclusão, removendo os itens com $removed
this.cleanRowActionsMode();

// Aplica apenas as edições, sem alterar as inclusões e exclusões
this.cleanRowActionsMode(true, false, false);

// Remove apenas os itens com $removed, sem aplicar edições e inclusões
this.cleanRowActionsMode(false, false, true);
Exemplo de uso: Se você precisa aplicar o estado de todas as ações de linha, como edição, inclusão e remoção, basta chamar esta função. Por exemplo, se houver uma ação de aplicar o grid ao salvar os dados, você pode usá-lo da seguinte forma:

// Após salvar os dados na API, você pode limpar todos os estados de ação de linha
this.myService.saveData(this.thfGrid.getChangedItems()).subscribe(() => {
  this.thfGrid.cleanRowActionsMode(); // Limpa todas as ações de linha após salvar
  console.log('Ações de linha limpas.');
});
Parâmetros
Nome	Tipo	Descrição
edit	boolean	
Indica se deve aplicar as edições realizadas nas linhas.

include	boolean	
Indica se deve aplicar as inclusões de novas linhas.

del	boolean	
Indica se deve remover as linhas marcadas para exclusão.


deleteItems
Responsável pela exclusão de itens selecionados.

Quando t-items está definido, a remoção pode ser feita em lote, excluindo todas as linhas selecionadas localmente. Se utilizado com um serviço (t-service-api e/ou t-service-delete-api), a exclusão permitida é de um item por vez.

Caso utilizado com a "edição fluída offline via formulário (propriedade t-grid-row-actions)" remove localmente as linhas sinalizadas com $removed.

É possível habilitar a exclusão em lote com serviços remotos utilizando a propriedade t-allow-batch-delete em conjunto com t-service-api e/ou t-service-delete-api.


getChangedItems
Retorna uma lista dos itens que foram modificados no grid, com a propriedade op indicando a ação executada sobre cada item, podendo ser 'remove', 'add' ou 'replace'.

// Exemplo de uso:
const changedItems = this.getChangedItems();
console.log(changedItems);
// Saída esperada: [{ id: 1, name: 'Item 1', op: 'replace' }, { id: 2, name: 'Item 2', op: 'remove' }]
Retorno
Tipo	Descrição
Array<any>	
Uma lista de objetos representando os itens modificados. Cada objeto terá a propriedade op que indica a ação realizada


getSelectedRows
Responsável por retornar os itens do grid que estão selecionadas.


showAdditionalHelp
Exibe o conteúdo da propriedade helper durante a edição (t-edit-properties ou t-grid-row-actions) do grid. Para isso, será necessário ter uma instância do componente no DOM e configurar uma tecla de atalho utilizando o evento t-keydown.

import { ThfGridComponent } from '@totvs/thf-components';
...
@ViewChild('gridComponent', { static: false }) thfGrid!: ThfGridComponent;

columns: Array<ThfGridColumn> = [
 ...
 {
   property: 'name',
   label: 'Nome',
   editProperties: {
     componentEditable: 'input',
     helper: 'Nome completo',
     keydown: this.onkeydown.bind(this, 'name')
    }
 },
]

onkeydown(property: string, event: KeyboardEvent): void {
 if (event.code === 'F9') {
   this.thfGrid.showAdditionalHelp(property);
 }
}
Com t-grid-row-actions: Alguns atalhos já estão em uso, então, evite sobrescrevê-los. Para mais detalhes, consulte o TDN.

Parâmetros
Nome	Tipo	Descrição
property	string	
Identificador da coluna.


selectRowItem
Seleciona um item do grid.

Parâmetros
Nome	Tipo	Descrição
item	{ key: value }Function	
Item ou função que recebe como parâmetro o item e retorna um boolean.


unselectRowItem
Desmarca o item que está selecionado.

Parâmetros
Nome	Tipo	Descrição
item	{ key: value }Function	
Item ou função que recebe como parâmetro o item e retorna um boolean.


applyFilters
Método responsável por realizar busca no serviço de dados podendo informar filtros e com o retorno, atualiza o grid.

Caso não seja informado parâmetro, nada será adicionado ao GET, conforme abaixo:

url + ?page=1&pageSize=10
Obs: os parâmetros page e pageSize sempre serão chamados independente de ser enviados outros parâmetros.

Caso sejam informados os parâmetros { name: 'JOHN', age: '23' }, todos serão adicionados ao GET, conforme abaixo:

url + ?page=1&pageSize=10&name=JOHN&age=23
Parâmetros
Nome	Tipo	Descrição
queryParams	{ key: value }	
Formato do objeto a ser enviado.

Pode ser utilizada qualquer string como key, e qualquer string ou number como value.


calculateHeightDynamically
Mantém compatibilidade com versões anteriores, chamando calculateDynamicSize com a propriedade 'height'.

Parâmetros
Nome	Tipo	Descrição
callRowHeight		
Define se o calculateRowHeight deve ser chamado após o cálculo do tamanho.


removeItem
Remove um item localmente do grid.

Parâmetros
Nome	Tipo	Descrição
item	number{ key: value }	
Índice ou item que será removido.

Ao remover o item, a linha que o representa será removida do grid.


unselectRows
Método responsável por desmarcar as linhas que estão selecionadas.


getInfoProperties
Método que retorna informações sobre os itens atuais da tabela.

Inclui:

items: lista de itens atualmente carregados na tabela.
total: total de itens informado pela API através da propriedade total; pode ser undefined caso a API não informe.
page: número da página atual informado pela API (itemsByApi.page); se não existir, utiliza a propriedade local page.
pageSize: quantidade de itens por página informada pela API (itemsByApi.pageSize); se não existir, utiliza a propriedade local pageSize.

updateItem
Atualiza um item do grid quando utilizado t-itens.

Parâmetros
Nome	Tipo	Descrição
item	number{ key: value }	
Índice ou o item que será atualizado.

updatedItem	{ key: value }	
Item que foi atualizado.

Ao atualizar o item, a informação será alterada no grid.


calculateDynamicSize
calcula dinamicamente o tamanho da grid com base na porcentagem definida nas propriedades t-height, t-min-height e t-max-height.

Caso a grid esteja dentro de um componente ou elemento que altere sua visibilidade, é necessário chamar esta função para garantir um cálculo correto. Exemplo:

<po-tabs>
 <po-tab (p-click)="emitClickTab()" p-label="PO Tabs">
   <thf-grid #thfGrid> </thf-grid>
 </po-tab>
</po-tabs>
@ViewChild('thfGrid') thfGrid: ThfGridComponent;

emitClickTab() {
 // Time-out necessário para garantir que o DOM foi atualizado antes do cálculo da altura.
 setTimeout(() => {
   this.thfGrid.calculateDynamicSize('height', true);
 }, 100);
}
Parâmetros
Nome	Tipo	Descrição
property		
Define qual propriedade será calculada: 'height', 'minHeight' ou 'maxHeight'.

callRowHeight		
Define se o método calculateRowHeight deve ser chamado após o cálculo do tamanho.


findColumnIndex
Encontra o índice da coluna baseado na propriedade.


isColumnRequired
Verifica se uma coluna é obrigatória na propriedade editProperties ou no formGroupIntern


setRowStateFilter
Define o filtro de estado das linhas a ser aplicado na exibição da grid.

Este método permite alternar entre a visualização de itens ativos (não removidos) e itens removidos, filtrando a grid com base na propriedade $removed dos itens. É utilizado principalmente em conjunto com o recurso de edição fluida offline (t-grid-row-actions).

Quando o filtro é alterado:

A grid é filtrada para exibir apenas os itens que correspondem ao estado selecionado
A paginação é reiniciada (skip = 0)
O label do filtro é atualizado
Os agregados totais são recalculados
A seleção pode ser desabilitada (no caso de itens removidos)
// Exibe apenas itens ativos (não removidos)
this.thfGrid.setRowStateFilter('active');

// Exibe apenas itens removidos, forçando recarregamento da grid
this.thfGrid.setRowStateFilter('removed', true);

// Exibe apenas itens ativos (não removidos), sem emitir evento
this.thfGrid.setRowStateFilter('active', false, false);
Quando o filtro é alterado para 'removed', a seleção de linhas é desabilitada automaticamente.

Ao retornar para 'active', a seleção é restaurada ao seu estado inicial.

Parâmetros
Nome	Tipo	Descrição
filter	('active''removed')	
Define qual filtro será aplicado:

'active': Exibe apenas itens não removidos ($removed !== true)
'removed': Exibe apenas itens marcados para remoção ($removed === true)
reloadGrid	boolean	
Indica se a grid deve ser recarregada visualmente:

Quando true, desmarca todas as seleções, limpa itens selecionados e força uma renderização completa da grid
Quando false, apenas aplica o filtro sem recarregar a grid
emitEvent	boolean	
Indica se o evento changeRowStateFilter deve ser emitido após a alteração do filtro:

Quando true, o evento é emitido com o novo valor do filtro
Quando false, o evento não é emitido

applyFilterByColumnProps
Aplica filtro por coluna com base no parâmetro fornecido.

// Aplica filtro na coluna 'email' para exibir itens cujo e-mail:
// - contém 'gmail'
// - e não contém 'teste'

const filter: Array<ThfFilterByColumn> = [
  {
    property: 'email',
    logic: 'and',
    operator1: 'contains',
    value1: 'gmail',
    operator2: 'doesnotcontain',
    value2: 'teste'
  }
];
this.gridComponent.applyFilterByColumnProps(filter);

> Requer que a propriedade `filter` esteja habilitada na coluna.
Parâmetros
Nome	Tipo	Descrição
filterColumnProps	Array<ThfFilterByColumn>	
Lista de filtros a serem aplicados.

---

## Interfaces

ThfTableAction
ThfTableAction
Interface para configuração das ações.

Propriedades
Nome	Tipo	Descrição
action
Function	(opcional)
Ação que será executada, sendo possível passar o nome ou a referência da função.

A action também pode ser executada para o agrupador de subitens quando a ação possuir subItems.

Para que a função seja executada no contexto do componente, utilize bind: action: this.myFunction.bind(this)

disabled
booleanFunction	(opcional)
Desabilita a ação. Aceita um valor booleano ou uma função que retorna booleano.

fixed
boolean	(opcional)
Propriedade para fixar a ação

Não se aplica ao componente thf-treelist

icon
stringTemplateRef<void>	(opcional)
Ícone exibido ao lado esquerdo do rótulo.

Aceita ícones da Biblioteca de ícones, fontes externas (ex: Font Awesome) ou um TemplateRef para ícones customizados.

{ label: 'Ação', icon: 'an an-newspaper' }
label
string	
Rótulo da ação.

A label também pode representar o agrupador de subitens quando a ação possuir subItems.

selected
boolean	(opcional)
Define se a ação está selecionada.

separator
boolean	(opcional)
Atribui uma linha separadora acima do item.

subItems
Array<PoPopupAction>	(opcional)
Define uma lista de subitens para criação de menus aninhados.

Ao definir esta propriedade, o item exibirá um ícone indicador de subnível. Recomenda-se utilizar no máximo três níveis hierárquicos para garantir a usabilidade.

As propriedades disabled, type e visible não são aplicadas visualmente ao item agrupador.

Quando url é informada em um agrupador, o redirecionamento terá prioridade e os subitens não serão abertos.

Em subníveis aninhados, o icon do agrupador é substituído pelo indicador de navegação (seta).

type
string	(opcional)
Define a cor do item.

Valores válidos:

default
danger
url
string	(opcional)
URL para redirecionamento. Aceita rotas internas e links externos.

A url também pode ser configurada para o agrupador de subitens. Entretanto, quando a url é informada em um agrupador, o clique não abrirá os subitens, pois o item será tratado como um link e o redirecionamento terá prioridade sobre a exibição da lista.

Quando informada, tem prioridade sobre a propriedade action.

visible
booleanFunction	(opcional)
Define a visibilidade da ação. Aceita um valor booleano ou uma função que retorna booleano.


ThfAggregateDescriptor
ThfAggregateDescriptor
Recebe um objeto contendo a coluna, uma label e a função que será aplicada para o cálculo do totalizador.

Propriedades
Nome	Tipo	Descrição
aggregate
'sum''average''count''min''max'	
Função de agregação a ser aplicada inicialmente: 'sum', 'average', 'count', 'min', ou 'max'.

field
string	
Coluna que será utilizada pelo totalizador.

label
string	(opcional)
Texto exibido ao lado do resultado da agregação no agrupamento.


ThfAggregateConfig
ThfAggregateConfig
Interface para configuração do Aggregate.

Propriedades
Nome	Tipo	Descrição
aggregateAlign
'right''defaultColumn'	(opcional)
Define o alinhamento horizontal dos valores dos totalizadores.

Valores aceitos:
'right': Alinha os valores à direita (comportamento padrão).
'defaultColumn': Alinha o valor no mesmo alinhamento da sua coluna de origem.
disabled
Array<string>	(opcional)
Define a lista das propriedades (colunas) que devem ter a seleção dos aggregates desabilitada no rodapé da grid.

visible
Array<string>	(opcional)
Define a lista das propriedades (colunas) que devem exibir a seleção de aggregates no rodapé da grid.


ThfGridColumnSort
ThfGridColumnSort
Interface para definir a ordenação das colunas (t-sort).

Propriedades
Nome	Tipo	Descrição
dir
'asc''desc'	(opcional)
Direção da coluna:

asc
desc
field
string	
Coluna


ThfGridColumn
ThfGridColumn
Interface para configuração das colunas (t-columns).

Propriedades
Nome	Tipo	Descrição
action
Function	(opcional)
Define uma ação na coluna quando o tipo da coluna for link ou icon.

Quando for do tipo link será enviado como primeiro parâmetro o valor da coluna e no segundo parâmetro o objeto completo da linha. Caso tenha sido definido uma ação e um link na coluna, a ação será executada ao invés do link.

Quando for do tipo icon enviará o objeto completo da linha e o segundo parâmetro será a definição da coluna.

boolean
PoTableBoolean	(opcional)
Define um objeto do tipo PoTableBoolean para as colunas do tipo boolean. Por exemplo:

{ property: 'approbation', type: 'boolean', boolean: {
  trueLabel: 'Accepted', falseLabel: 'Rejected'
}}
Caso não seja definido um objeto para colunas do tipo boolean, esta exibirá por padrão Sim e Não de acordo com os valores booleanos.

booleanFalse
string	(opcional)
Texto exibido quando o valor da coluna for false.

booleanTrue
string	(opcional)
Texto exibido quando o valor da coluna for true.

color
stringFunction	(opcional)
Define a cor que será aplicada no conteúdo da coluna.

Valores válidos:

color-01
color-02
color-03
color-04
color-05
color-06
color-07
color-08
color-09
color-10
color-11
color-12
Também é possível utilizar as 35 cores da paleta Caption Tag Colors:

caption-tag-01caption-tag-02caption-tag-03caption-tag-04caption-tag-05
caption-tag-06caption-tag-07caption-tag-08caption-tag-09caption-tag-10
caption-tag-11caption-tag-12caption-tag-13caption-tag-14caption-tag-15
caption-tag-16caption-tag-17caption-tag-18caption-tag-19caption-tag-20
caption-tag-21caption-tag-22caption-tag-23caption-tag-24caption-tag-25
caption-tag-26caption-tag-27caption-tag-28caption-tag-29caption-tag-30
caption-tag-31caption-tag-32caption-tag-33caption-tag-34caption-tag-35
Existe a possibilidade de informar uma função que retorne um dos valores aceitos, serão passados por parâmetro a linha e a coluna atual, por exemplo:

(row, column) => { row[column] == 'text' ? 'color-03' : 'color-09' }
É possível também usá-la na coluna do tipo icons para alteração das cores de seu conteúdo conforme exemplo abaixo, contudo, desta forma sobrepõe a cor especificada em cada objeto caso haja:

{ property: 'columnIcon', label: 'Like', type: 'icon', color: 'color-08', icons: [
  { value: 'an an-star', action: () => this.notification() }
]},
detail
PoTableDetail	(opcional)
Define um objeto que segue a interface PoTableDetail, para as colunas de detalhes. Por exemplo:

{ columns: [{ property: 'package', label: 'Pacote' }], typeHeader: 'top' }
disabled
Function	(opcional)
Função que deve retornar um booleano para habilitar ou desabilitar o link e sua ação.

Propriedade disponível nas colunas do tipo link.

editProperties
CustomEditProperties	(opcional)
Propriedade para customizar as colunas editáveis

filter
boolean	(opcional)
Habilita o filtro por coluna.

Quando ativado, exibe um ícone de filtro no cabeçalho da coluna e permite que o usuário aplique filtros diretamente no grid.

O filtro não realiza requisições à API, toda a filtragem ocorre localmente sobre os dados já carregados.

O tipo do filtro é determinado pelo type definido na coluna. Cada tipo renderiza um componente específico:

string: input
number, currency:
decimal - Caso seja utilizado editProperties.componentEditable do tipo decimal
number - Utilizado por padrão
date: datepicker
boolean: checkbox
time:
timepicker - Caso seja utilizado editProperties.componentEditable do tipo timepicker
input - Utilizado por padrão. Recomendado caso a coluna utilize milissegundos, pois o timepicker não os suporta
Caso o type da coluna não seja um desses ou não seja informado, o filtro assume o tipo string como padrão.

Para conhecer todos os operadores disponíveis para cada tipo de coluna, consulte também a interface ThfFilterByColumn.

fixed
boolean	(opcional)
Propriedade para fixar a coluna inicialmente.

No momento, é possível fixar apenas 2 colunas e garantir o funcionamento correto. Caso a coluna de ações esteja fixa, é possível fixar somente 1 coluna corretamente.

format
string	(opcional)
Formato de exibição do valor da coluna.

Formatação	Type da Coluna	Descrição	Exemplos
Monetário	currency	Formato para valores monetários. Espera um código de moeda no padrão ISO 4217, e caso não informado, será utilizado 'USD' por padrão	'BRL', 'USD', 'EUR', 'RUB'
Data	date	Aceita apenas os caracteres de dia(dd), mês(MM) e ano (yyyy ou yy), caso não seja informado um formato o mesmo será 'dd/MM/yyyy'	'dd/MM/yyyy', 'dd-MM-yy', 'mm/dd/yyyy'
Hora	time	Aceita apenas os caracteres de hora(HH), minutos(mm), segundos(ss) e milisegundos(f-ffffff), os milisegundos são opcionais, caso não seja informado um formato o mesmo será 'HH:mm:ss'	'HH:mm', 'HH:mm:ss.ffffff', 'HH:mm:ss.ff', 'mm:ss.fff'
Número	number	Aceita um valor seguindo o padrão DecimalPipe para formatação, e caso não seja informado, o número será exibido na sua forma original.	'1.2-5' (ex.: 50 → 50.00)
Observação: caso não seja informado um formato, o valor será exibido em sua forma original.

Na formatação do tipo currency, caso o valor informado seja diferente do padrão ISO 4217, será exibido o alerta "Currency formatting failed. Using fallback." no console do navegador. Exemplos de formato inválido: 'ABCD', '123'.

icons
Array<PoTableColumnIcon>	(opcional)
Define um array de objetos para colunas de ícones que irá sobrepor os valores como action e color definidos na coluna, à partir do value da PoTableColumnIcon, por exemplo:

{ property: 'columnIcon', label: 'Icons', type: 'icon', action: this.favorite.bind(this), icons: [
  { value: 'delete', icon: 'an an-plus', color: 'color-06', action: this.add.bind(this), tooltip: 'Adiciona um novo item' },
  { value: 'edit', icon: 'an an-pencil-simple', action: this.edit.bind(this) },
  { value: 'delete', icon: 'an an-trash', color: 'color-12', action: this.remove.bind(this) }
]},
...
{ id: 1, columnIcon: ['an an-pencil-simple', 'an an-trash', 'an an-star'] }
...
key
booleannumber	(opcional)
Indica se a coluna faz parte da chave composta para exclusão de registros. Pode ser do tipo numérico ou booleano. Os valores numéricos sempre serão priorizados em relação aos booleanos. Para a exclusão, é necessário que a API esteja preparada para receber uma ou mais keys concatenadas com pipe '|' para identificação do registro. ex.: DELETE {end-point}/{keys}

Exemplo de keys: [{ property: 'id', key: 1 }, { property: 'name', key: true }, { property: 'email', key: 2 }]. Resposta do exemplo: 'valor de id|valor de email|valor de name'

label
string	(opcional)
Texto para título da coluna.

Caso não seja informado, será utilizado como label o valor da propriedade property com a primeira letra em maiúsculo.

labels
Array<PoTableColumnLabel>	(opcional)
Define um array de objetos para as colunas de label, onde 'labels' é uma lista de objetos do tipo PoTableColumnLabel na qual devem ser definidas os labels. Por exemplo:

{ property: 'flightStatus', label: 'Status', type: 'label', width:'100px', labels: [
 { value: 'confirmed', color: 'caption-tag-13', label: 'Confirmado', tooltip: 'Flight Status' },
 { value: 'delayed', color: 'caption-tag-08', label: 'Atrasado', tooltip: 'Flight Status' }
}
link
string	(opcional)
Define o nome da propriedade que conterá o link a ser redirecionado.

locale
string	(opcional)
Define a localidade a ser utilizada no modo de exibição e edição. Por padrão o valor será configurado segundo o módulo I18n

Exemplo de utilização no grid:

columnWithItems: Array<ThfGridColumn> = [
{
   property: 'currency',
   type: 'currency',
   locale: 'en'
},
Caso o valor informado seja inválido, será exibido o alerta "Invalid locale: locale_informado" no console do navegador.

Exemplos de localidades inválidas: 'en_US', 'pt_BR'.

Para ver quais linguagens são suportadas, acesse I18n

Também é possível definir a localidade da aplicação por meio da configuração do PoI18nModule:

const i18nConfig: PoI18nConfig = {
  default: {
    language: 'ru',
    context: 'general',
    cache: true
  },
  contexts: {}
};

@NgModule({
  imports: [
    ...
    PoI18nModule.config(i18nConfig),
    ...
  ],
  ...
})
export class AppModule {}
No modo de visão, é compatível com colunas dos tipos number e currency.

No modo edição, a propriedade será repassada para os componentes que suportam a mesma.

Componentes compatíveis: decimal

mask
string	(opcional)
Indica uma máscara para a coluna Exemplos: (+99) (99) 99999?-9999, 99999-999, 999.999.999-99. Aplicável nas colunas do tipo number e string Nas colunas do tipo number a propriedade mask terá prioridade sob format

property
string	
Identificador da coluna.

resizable
boolean	(opcional)
Define se a coluna pode ser redimensionada pelo usuário.

sortable
boolean	(opcional)
Controla se a coluna será considerada como "ordenavel". Caso seja definido um valor falso, a coluna não será usada para ordenação.

subtitles
Array<PoTableSubtitleColumn>	(opcional)
Define um array de objetos para as colunas de legenda. Onde, subtitles é uma lista de objetos do tipo PoTableSubtitle na qual devem ser definidas as opções de legenda. Por exemplo:

{ property: 'flightStatus', label: 'Status', color: 'subtitle', width:'100px', subtitles: [
 { value: 'confirmed', color: 'caption-tag-13', label: 'Confirmado', content: '1' },
 { value: 'delayed', color: 'caption-tag-08', label: 'Atrasado', content: '2' }
}
Nesse exemplo a coluna escolhida para legenda é 'flightStatus', se o valor dessa coluna for 'confirmed', o texto da legenda será 'Confirmado'.

tooltip
string	(opcional)
Define um texto de ajuda que será exibido ao passar o mouse sobre um texto.

O tooltip só será visível se for uma coluna do tipo link.

Caso o conteúdo da célula exceder a largura da coluna, é ignorado o valor atribuído ao tooltip e será exibido justamente o conteúdo da célula.

type
string	(opcional)
Tipo da coluna.

Valores válidos:

boolean: Exibirá por padrão Sim e Não de acordo com os valores booleanos.

Caso necessite exibir valores diferentes do padrão, deve-se utilizar a propriedade boolean desta interface.

currency: valores monetários.

date: valor de datas.

Aceita os tipos string e Date padrão do Javascript, por exemplo: '2017-11-28' ou new Date(2017, 10, 28).
dateTime: valor de data com horário.

Aceita o tipo string no formato ISO-8601 extendido 'yyyy-mm-ddThh:mm:ss+|-hh:mm' e o tipo Date padrão do Javascript, por exemplo: '2017-11-28T00:00:00-02:00' ou new Date(2017, 10, 28).
detail: array de objetos para o master-detail.

Incompatível com virtual-scroll, que requer altura fixa nas linhas.
icon: array de string ou objetos para a coluna de ícones.

label: texto com destaque.

link: habilita link na coluna para ação ou navegação.

number: valores numéricos.

string: textos.

subtitle: array de objetos para a coluna de legenda.

time: valor de horário.

Aceita o tipo string nos formatos 'HH:mm:ss' ou 'HH:mm:ss.ffffff', por exemplo: '23:12:45'.
cellTemplate: Indica que a coluna será utilizada como template, em conjunto com o PoTableCellTemplate.

columnTemplate: Indica que a coluna será utilizada como template, em conjunto com o PoTableColumnTemplate.

visible
boolean	(opcional)
Controla a exibição da coluna. Caso seja definido um valor falso, a coluna não será exibida mas mas será possível torná-la visível através do gerenciador de colunas.

A disponibilidade de visualização pode limitar-se de acordo com a definição de p-max-columns.

width
numberstring	(opcional)
Caso seja passado o formato number, será aplicado em pixels. A largura da coluna pode ser informada em pixels ou porcentagem.

Exemplo Pixel: 100. Exemplo Porcentagem: '100%'. Apesar de atribuir largura as colunas da grid é importante ressaltar que o componente recalcula as larguras das demais colunas de acordo com os espaços disponíveis na grid, podendo alterar as dimensões passadas proporcionalmente.


CustomEditProperties
CustomEditProperties
Interface para configuração das colunas editáveis (editProperties). Além dessas propriedades, herda as definições da interface PoDynamicFormField, permitindo definir campos de entrada que serão criados dinamicamente.

Propriedades
Nome	Tipo	Descrição
componentEditable
'input''number''select''datepicker''switch''combo''multiselect''decimal''checkbox''lookup''timepicker'	(opcional)
Propriedade para escolher qual componente será exibido para editar.

O valor padrão é input.

componentSize
'small''medium''large'	(opcional)
Define o tamanho dos componentes de formulário no grid conforme suas respectivas documentações:

small: aplica a medida small de cada componente (disponível apenas para acessibilidade AA).
medium: aplica a medida medium de cada componente.
large: aplica a medida large de cada componente (disponível para po-checkbox e po-radio-group).
Caso a acessibilidade AA não esteja configurada, o tamanho medium será mantido. Para mais detalhes, consulte a documentação do po-theme.

controlValueWithLabel
boolean	(opcional)
Determina se os componentes select, combo, multiselect e thf-lookup devem exibir o label ao invés de value na grid

customItems
Array<any>	(opcional)
Permite definir uma lista de itens personalizados que serão exibidos no componente, sem a necessidade de um serviço externo.

Componente compatível: thf-lookup

disabled
boolean((rowData: any, column?: ThfGridColumn) => boolean)	(opcional)
Desabilita o campo. Pode ser um valor booleano fixo ou uma função dinâmica que recebe os dados da linha e retorna um booleano

fieldFormat
Array<string>((item: any) => string)	(opcional)
Formato de exibição do campo.

Recebe uma função que deve retornar uma string com o/os valores do objeto formatados para exibição, por exemplo:

fieldFormat(obj) {
  return `${obj.id} (${obj.name})`;
}


Ou pode-se informar uma lista de propriedades que deseja exibir como descrição do campo.
Nessa caso, será utilizado ` - ` como separador, por exemplo:

```typescript
 fieldFormat]="['id','nickname']"
Componente compatível: thf-lookup.

filterSearchSelect
Array<ThfLookupFilterSearchSelect>	(opcional)
Propriedade para listar as opções de filtro do po-search no modal.

Componente compatível: thf-lookup.

keysLabel
Array<ThfLookupKeysLabel>	(opcional)
Propriedade para exibir até 3 propriedades por valor no listbox.

Componente compatível: thf-lookup.

loading
boolean	(opcional)
Habilita um estado de carregamento no componente, desabilitando-o e exibindo um ícone de carregamento.

Por padrão é false.

Componentes compatíveis:po-datepicker, po-number, po-decimal, po-input, po-select, po-switch, po-combo, po-multiselect, thf-lookup.

No thf-lookup, o estado de loading não desabilita o campo, exibindo apenas o indicador visual.

locale
string	(opcional)
Define a localidade a ser utilizada no modo de edição. Por padrão o valor será configurado segundo o módulo I18n

Exemplo de utilização no grid:

columnWithItems: Array<ThfGridColumn> = [
 {
   property: 'currency',
   type: 'currency',
   editProperties: {
     componentEditable: 'decimal',
     locale: 'en'
   },
},
Caso o valor informado seja inválido, será exibido o alerta "Invalid locale: locale_informado" no console do navegador.

Exemplos de localidades inválidas: 'en_US', 'pt_BR'.

Para ver quais linguagens são suportadas, acesse I18n

Também é possível definir a localidade da aplicação por meio da configuração do PoI18nModule:

const i18nConfig: PoI18nConfig = {
  default: {
    language: 'ru',
    context: 'general',
    cache: true
  },
  contexts: {}
};

@NgModule({
  imports: [
    ...
    PoI18nModule.config(i18nConfig),
    ...
  ],
  ...
})
export class AppModule {}
Caso seja definida em conjunto com a propriedade locale da coluna, o editProperties.locale terá prioridade ao habilitar a edição de uma linha e o locale da coluna será utilizado apenas para exibição.

Componentes compatíveis: po-datepicker, po-decimal, po-timepicker.

lookupGridProperties
ThfLookupGridProperties	(opcional)
Propriedades para configuração da thf-grid dentro do modal thf-lookup.

Componentes compatíveis: thf-lookup`

onBlur
Function	(opcional)
Evento disparado ao sair do campo.

Componentes compatíveis: po-input, po-number, po-decimal, po-datepicker, po-timepicker, po-select, po-combo, po-multiselect, po-checkbox

onChange
(value: any) => void	(opcional)
Evento disparado ao alterar valor e deixar o campo.

Componentes compatíveis: po-input, po-number, po-decimal, po-datepicker, po-timepicker, po-select, po-switch, po-combo, po-multiselect, po-checkbox, thf-lookup

onChangeModel
(model: any) => void	(opcional)
Evento disparado ao alterar valor do model.

Componentes compatíveis: po-input, po-number, po-decimal, po-select, po-combo, thf-lookup

onEnter
Function	(opcional)
Evento disparado ao entrar no campo.

Componentes compatíveis: po-input, po-number, po-decimal

onError
(error: HttpErrorResponse) => void	(opcional)
Callback disparado quando ocorre erro na requisição de busca.

Componente compatível: thf-lookup

onFocus
Function	(opcional)
Callback disparado quando o campo recebe foco.

Componente compatível: thf-lookup

onInputChange
(value: any) => void	(opcional)
Deve ser informada uma função que será disparada quando houver alterações no campo de busca do componente. A função receberá como argumento o valor modificado.

Componente compatível: po-combo

onSelected
(selection: anyArray<any>) => void	(opcional)
Callback disparado ao selecionar item(s).

Componente compatível: thf-lookup

readonly
boolean((rowData: any, column?: ThfGridColumn) => boolean)	(opcional)
Indica que o campo será somente leitura. Pode ser um valor booleano fixo ou uma função dinâmica que recebe os dados da linha e retorna um booleano

required
boolean	(opcional)
Define a obrigatoriedade do campo.

Caso seja definido como true, exibe a label "(Obrigatório)" na coluna.

size
'sm''md''lg''xl''auto'	(opcional)
Propriedade para definir o tamanho do modal.

Componente compatível: thf-lookup.


ThfGridDeleteService
ThfGridDeleteService
Interface para excluir algum item via serviço.

deleteItem
Método que será disparado ao excluir algum item, deve-se retornar um Observable.

Parâmetros
Nome	Tipo	Descrição
selectedRow	any	
Parâmetro com o valor do atual item selecionado.

filterParams	any	
Valor informado através da propriedade t-param-delete-api.

keyValue	string	
Valor informado caso tenha alguma coluna com a propriedade key ativa ou o valor da propriedade id.


deleteBatchItems
Método que será disparado ao excluir itens quando o THF-GRID estiver com a propriedade t-allow-batch-delete habilitada, deve-se retornar um Observable.

Ao habilitar a propriedade t-allow-batch-delete, este método sempre será chamado, exluindo um ou vários itens.

Parâmetros
Nome	Tipo	Descrição
selectedRows	any	
Parâmetro com os valores dos itens selecionados.

paramDelete	any	
Valor informado através da propriedade t-param-delete-api.

keys	string	
Valor informado caso tenha alguma coluna com a propriedade key ativa ou o valor da propriedade id.



ThfGridEditProperties
ThfGridEditProperties
Interface para configuração da edição em linha (t-edit-properties).

Propriedades
Nome	Tipo	Descrição
actionEdit
(param: any) => FormGroup	
Método executado ao iniciar o modo edição. É passado um parâmetro com os valores respectivos de cada coluna. É obrigatório retornar o formulário. Cada FormControl deve estar com o mesmo nome da property da coluna desejada.

Exemplo de envio para a API:

<thf-grid
  t-service-api="https://po-sample-api.onrender.com/v1/people"
  [t-columns]="columns"
  [t-edit-properties]="editProperties"
>
</thf-grid>
form: FormGroup;
editProperties: ThfGridEditProperties;

ngOnInit() {
  this.editProperties = {
    actionEdit: this.setFormGroup.bind(this),
    validate: this.changeValueForm.bind(this) // PROPRIEDADE OPCIONAL
  };
}

setFormGroup(dataItem) {
  const genreDescription = this.columns1.find(column => column.property === 'genreDescription');
  genreDescription.editProperties.disabled = true;
  genreDescription.editProperties.options = this.appService.getCity(dataItem.genre);
  this.form = new FormGroup({
    id: new FormControl(dataItem.id, [Validators.required]) // ID É OBRIGATÓRIO,
    city: new FormControl(dataItem.city),
    email: new FormControl(dataItem.email),
    birthdate: new FormControl(dataItem.birthdate),
    genre: new FormControl(dataItem.genre),
    status: new FormControl(dataItem.status),
    genreDescription: new FormControl(dataItem.genreDescription, [Validators.required])
  });
  return this.form;
};
validate
(data: any, columnProperty: string) => FormGroup	(opcional)
Método executado ao alterar o valor de algum campo do formulário. O primeiro parâmetro são os valores respectivos de cada coluna. O segundo parâmetro é indicando a property da coluna que teve o valor alterado É obrigatório retornar o formulário. Cada FormControl deve estar com o mesmo nome da property da coluna desejada.


ThfFilterByColumn
ThfFilterByColumn
Interface que define as condições utilizadas no filtro por coluna.

Cada filtro pode conter até duas condições, combinadas pela lógica and ou or.

Os operadores disponíveis e o tipo de valor aceito variam conforme o type configurado na coluna (string, number, currency, date, time ou boolean).

Para a lista completa de operadores permitidos por tipo, consulte as propriedades operator1 e operator2.

Propriedades
Nome	Tipo	Descrição
logic
string	(opcional)
Lógica entre as duas condições do filtro.

Valores válidos: and | or.

Para filtros do tipo boolean, a lógica ainda pode ser usada:

and: exige que ambos os checkboxes marcados sejam verdadeiros no item
or: aceita qualquer item que corresponda a um dos valores marcados
operator1
string	(opcional)
Operador da primeira condição do filtro.

Operadores disponíveis, dependendo do tipo da coluna:

Para colunas do tipo string:

contains — contém.
doesnotcontain — não contém.
eq — igual.
neq — diferente.
startswith — começa com.
endswith — termina com.
isnull — é nulo.
isnotnull — não é nulo.
isempty — vazio ('').
isnotempty — não vazio.
Para colunas number, currency, date e time:

eq — igual.
neq — diferente.
gte — maior ou igual.
gt — maior que.
lte — menor ou igual.
lt — menor que.
isnull — nulo.
isnotnull — não nulo.
Para colunas do tipo boolean, esta propriedade é ignorada.

operator2
string	(opcional)
Operador da segunda condição do filtro.

Funciona exatamente como operator1, respeitando os operadores válidos para o tipo da coluna.

Ignorado para filtros do tipo boolean.

property
string	
Nome da propriedade da coluna que terá o filtro aplicado.

value1
any	
Valor comparado na primeira condição do filtro.

Para string, number, currency, date e time, corresponde ao valor informado no campo.
Para boolean, deve ser true ou false, representando o estado do checkbox.
value2
any	(opcional)
Valor comparado na segunda condição do filtro.

Para string, number, currency, date e time, é o valor informado na segunda entrada.
Para boolean, é o valor associado ao segundo checkbox (true ou false).

ThfGridLiterals
ThfGridLiterals
Interface para customizar literais (t-literals). Se não definidas, o componente usará textos padrão.

Propriedades
Nome	Tipo	Descrição
advancedSearch
string	(opcional)
Título do modal Filtros

and
string	(opcional)
Opção E, filtro por coluna.

averageAggregate
string	(opcional)
Texto para a operação de agregação de Média (Average)

bodyDelete
string	(opcional)
Conteúdo do modal Excluir

bodyDeleteBatch
string	(opcional)
Conteúdo do modal Excluir configurado para excluir em lote

cancel
string	(opcional)
Label do botão Cancelar

checkFalse
string	(opcional)
Checkbox não, filtro por coluna.

checkTrue
string	(opcional)
Checkbox sim, filtro por coluna.

columnsManager
string	(opcional)
Título do page-slide Gerenciar Tabela

compact
string	(opcional)
Label do radio de densidade Compacto no Gerenciar Tabela

confirm
string	(opcional)
Label do botão Confirmar

contains
string	(opcional)
Opção contém, filtro por coluna.

countAggregate
string	(opcional)
Texto para a operação de agregação de Contagem (Count)

default
string	(opcional)
Label do radio de densidade Espaçoso no Gerenciar Tabela

delete
string	(opcional)
Label do botão Excluir

deleteApiError
string	(opcional)
Resposta de erro da requisição delete no popup

deleteItem
string	(opcional)
Título do modal Excluir

density
string	(opcional)
Título da sessão "Densidade" no Gerenciar Tabela

doesntContain
string	(opcional)
Opção não contém, filtro por coluna.

draggable
string	(opcional)
Label da opção "Draggable" na sessão "Selecione opção para utilizar na tabela" no Gerenciar Tabela

edit
string	(opcional)
Label do botão Editar

editRow
string	(opcional)
Título das ações quando Edição em linha.

endsWith
string	(opcional)
Opção Termina com, filtro por coluna.

export
string	(opcional)
Label do botão Exportar

exportExcel
string	(opcional)
Label do botão Exportar Excel

exportPDF
string	(opcional)
Label do botão Exportar PDF

extraCompact
string	(opcional)
Label do radio de densidade Extra Compacto no Gerenciar Tabela

filterButton
string	(opcional)
Botão de filtrar por coluna.

filterByColumn
string	(opcional)
Filtros, filtro por coluna.

filters
string	(opcional)
Label do botão Filtros

fixed
string	(opcional)
Título da sessão "Fixo" no Gerenciar Tabela

gridRowActionsConfirmAddCancelButton
string	(opcional)
Label do botão "Cancelar" no modal "Exclusão dos dados inseridos".

gridRowActionsConfirmAddConfirmButton
string	(opcional)
Label do botão "Confirmar" no modal "Exclusão dos dados inseridos".

gridRowActionsConfirmAddTitle
string	(opcional)
Título do modal "Exclusão dos dados inseridos".

gridRowActionsConfirmEditTitle
string	(opcional)
Título do modal "Abandonar edição da linha".

gridRowActionsConfirmRemoveAttention
string	(opcional)
Texto de "Atenção:" do modal "Exclusão dos dados inseridos".

gridRowActionsConfirmRemoveConfirmButton
string	(opcional)
Label do botão "Excluir" no modal "Exclusão dos dados inseridos".

gridRowActionsConfirmRemoveDescription
string	(opcional)
Descrição do modal "Exclusão dos dados inseridos".

gridRowActionsConfirmRemoveTitle
string	(opcional)
Título do modal "Exclusão dos dados inseridos".

gridRowActionsRestoreSuccessful
string	(opcional)
Texto exibido ao restaurar um item excluído.

groupable
string	(opcional)
Label da opção "Groupable" na sessão "Selecione opção para utilizar na tabela" no Gerenciar Tabela

groupableText
string	(opcional)
Texto do cabeçalho onde se deve soltar as colunas que devem ser agrupadas.

isAfter
string	(opcional)
Opção É posterior que, filtro por coluna.

isAfterOrEqual
string	(opcional)
Opção É posterior ou igual a, filtro por coluna.

isBefore
string	(opcional)
Opção É anterior que, filtro por coluna.

isBeforeOrEqual
string	(opcional)
Opção É anterior ou igual a, filtro por coluna.

isEmpty
string	(opcional)
Opção É vazio, filtro por coluna.

isEqual
string	(opcional)
Opção igual a, filtro por coluna.

isGreater
string	(opcional)
Opção É maior que, filtro por coluna.

isGreaterOrEqual
string	(opcional)
Opção É maior ou igual a, filtro por coluna.

isLess
string	(opcional)
Opção É menor que, filtro por coluna.

isLessOrEqual
string	(opcional)
Opção É menor ou igual que, filtro por coluna.

isNotEmpty
string	(opcional)
Opção Não é vazio, filtro por coluna.

isNotEqual
string	(opcional)
Opção não igual, filtro por coluna.

isNotNull
string	(opcional)
Opção Não é nulo, filtro por coluna.

isNull
string	(opcional)
Opção É nulo, filtro por coluna.

legendListOptions
string	(opcional)
Título da sessão "Selecione opção para utilizar na tabela" no Gerenciar Tabela

loadMoreData
string	(opcional)
Label do botão Carregar mais resultados

loadingData
string	(opcional)
Texto do modal Carregando...

manageTable
string	(opcional)
Label do botão Gerenciar Tabela

maxAggregate
string	(opcional)
Texto para a operação de agregação de Máximo (Max)

minAggregate
string	(opcional)
Texto para a operação de agregação de Mínimo (Min)

moreActions
string	(opcional)
Label do botão Mais ações

multipleItems
string	(opcional)
Texto auxiliar ao selecionar muitos itens exibido nas ações em lote.

noColumns
string	(opcional)
Mensagem exibida quando não existem colunas definidas.

noData
string	(opcional)
Mensagem exibida quando não existem itens para serem exibidos.

noDataDescriptionRowStateFilterActive
string	(opcional)
Descrição exibida quando não existem itens ativos para serem exibidos na edição fluída.

noDataDescriptionRowStateFilterRemoved
string	(opcional)
Descrição exibida quando não existem itens excluídos para serem exibidos na edição fluída.

noDataRowStateFilterActive
string	(opcional)
Mensagem exibida quando não existem itens ativos para serem exibidos na edição fluída.

noDataRowStateFilterRemoved
string	(opcional)
Mensagem exibida quando não existem itens excluídos para serem exibidos na edição fluída.

noItem
string	(opcional)
Mensagem exibida quando nenhum item está selecionado.

noneAggregate
string	(opcional)
Texto quando nenhuma operação de agregação estiver selecionada (None)

oneItem
string	(opcional)
Texto ao selecionar um único item exibido nas ações em lote.

onlyRequiredFields
string	(opcional)
Label do toggle "Apenas campos obrigatórios" na edição fluída.

or
string	(opcional)
Opção OU, filtro por coluna.

orderAsc
string	(opcional)
Ordenar ascendente, filtro por coluna.

orderDesc
string	(opcional)
Ordenar descendente, filtro por coluna.

otherColumns
string	(opcional)
Título da sessão "Outras colunas" no Gerenciar Tabela

placeholderSearchInput
string	(opcional)
Placeholder do campo Buscar na tabela

placeholderSearchInputBasic
string	(opcional)
Placeholder do campo Buscar na tabela quando a busca rápida está ativa (t-filter-input-mode="basic")

remove
string	(opcional)
Rótulo do botão "Limpar" exibido no painel de filtro por coluna enquanto o usuário preenche os critérios do filtro.

removeFilter
string	(opcional)
Rótulo do botão "Limpar" exibido no pop-up do filtro por coluna.

requiredFieldsToasterDisableActionLabel
string	(opcional)
Label da ação exibida no Toaster para desativar a visualização de campos obrigatórios

requiredFieldsToasterEnableActionLabel
string	(opcional)
Label da ação exibida no Toaster para ativar a visualização de campos obrigatórios

requiredFieldsToasterMessage
string	(opcional)
Texto exibido no Toaster quando campos obrigatórios não são preenchidos

requiredFieldsToasterSupportMessage
string	(opcional)
Mensagem de suporte exibida no Toaster quando campos obrigatórios não são preenchidos

restoreDefault
string	(opcional)
Label do botão "Restaurar padrão" no Gerenciar Tabela

resultsByPage
string	(opcional)
Label "Resultados por página" no Gerenciar Tabela.

rowStateFilterActive
string	(opcional)
Label do filtro para mostrar itens ativos

rowStateFilterActiveLabel
string	(opcional)
Label do filtro após selecionar a exibição de itens ativos

rowStateFilterRemoved
string	(opcional)
Label do filtro para mostrar itens excluídos

rowStateFilterRemovedLabel
string	(opcional)
Label do filtro após selecionar a exibição de itens excluídos

save
string	(opcional)
Label do botão Salvar

selectedItemsMultipleLabel
string	(opcional)
Texto exibido ao selecionar múltiplos itens

selectedItemsSingleLabel
string	(opcional)
Texto exibido ao selecionar um único item

showOnlySelectedItemsTooltip
string	(opcional)
Tooltip exibido ao passar o mouse sobre o switch que filtra itens selecionados

startsWith
string	(opcional)
Opção Inicia com, filtro por coluna.

sumAggregate
string	(opcional)
Texto para a operação de agregação de Soma (Sum)

warningAbandonEditing
string	(opcional)
Mensagem do modal "Abandonar edição da linha".

warningColumnsRequired
string	(opcional)
Mensagem do modal "Exclusão dos dados inseridos".


ThfGridOptionPaging
ThfGridOptionPaging
Interface para configuração das opções de paginação (t-options-paging).

Propriedades
Nome	Tipo	Descrição
label
string	
Label correspondente a quantidade de itens

value
number	
Quantidade de itens por página


ThfGridOptions
ThfGridOptions
Interface para as propriedades que permitem personalizar dinamicamente o comportamento do componente.

Propriedades
Nome	Tipo	Descrição
actions
Array<ThfTableAction>	(opcional)
Ações que o usuário poderá executar no grid através de botões.

columns
Array<ThfGridColumn>	(opcional)
Lista das colunas usadas no grid e busca avançada. Caso precise alterar uma coluna que já exista deve ser passado o atributo property com o mesmo conteúdo do original.

customActions
Array<PoDropdownAction>	(opcional)
Lista de ações customizadas do grid que serão incorporadas às ações informadas através da propriedade actions.

// Exemplo de uso:
[
 { label: 'Apply Discount', action: this.applyDiscount.bind(this) },
 { label: 'Details', action: this.details.bind(this) }
];

ThfGridRowActions
ThfGridRowActions
Interface para configuração da edição fluída (t-grid-row-actions). Essas ações permitem manipular o comportamento de edição, inserção e remoção de dados no grid.

Propriedades
Nome	Tipo	Descrição
actionEdit
(param: any, mode: 'edit''include') => FormGroupObservable<FormGroup>	
Função responsável por iniciar o modo de edição ou inclusão de uma linha no grid. O método recebe os dados da linha selecionada ou um objeto vazio no modo de inclusão. Deve retornar um FormGroup que será utilizado para controlar os valores das colunas editáveis.

// Exemplo de uso:

actionEdit: (param, mode) => new FormGroup({
  name: new FormControl(param.name),
  age: new FormControl(param.age)
})
ou

actionEdit: (dataItem, mode) => {
return this.appService
 .listItems('https://po-sample-api.onrender.com/v1/heroes', { name: 'Robert Bruce Banner' })
  .pipe(
     map(items => {
       return new FormGroup({
         name: new FormControl(items.name),
         age: new FormControl(items.age)
       })
     }
   )
 }
afterRemove
(row: any) => void	(opcional)
Função opcional executada após a remoção de uma linha do grid. Pode ser usada para realizar ações adicionais após a remoção de dados, como exibir notificações.

afterSave
(row: any) => void	(opcional)
Função opcional executada após o salvamento de uma linha editada. Pode ser usada para realizar ações adicionais após a conclusão de uma edição.

afterUndoRemove
(row: any) => void	(opcional)
Função opcional executada após desfazer a remoção de uma linha do grid. Pode ser usada para realizar ações adicionais após desfazer a remoção de dados, como exibir notificações.

beforeInsert
(row: any) => booleanObservable<boolean>	(opcional)
Função opcional executada antes de inserir uma nova linha no grid. Pode ser usada para validar ou modificar os dados antes da inclusão.

beforeRemove
(row: any) => booleanObservable<boolean>	(opcional)
Função opcional executada antes de remover uma linha do grid. Pode ser usada para validar ou confirmar a remoção da linha.

beforeSave
(updatedRow: any, originalRow: any) => booleanObservable<boolean>	(opcional)
Função opcional executada antes de salvar as alterações de uma linha editada. Pode ser usada para validar ou modificar os dados antes de confirmar a edição.

beforeUndoRemove
(row: any) => booleanObservable<boolean>	(opcional)
Função opcional executada antes de desfazer a remoção de uma linha do grid. Pode ser usada para validar ou confirmar o desfazer da remoção da linha.

change
(updatedRows: Array<any>) => void	(opcional)
Função opcional que retorna a lista atualizada sempre que ocorre edição, inclusão ou remoção. Facilita o monitoramento das mudanças feitas, permitindo que se veja rapidamente o que foi alterado no grid. Será disparado apenas durante ações de edição fluída, sem compatibilidade com outros eventos.

hiddenGrid
boolean	(opcional)
Propriedade opcional utilizada para determinar se a grid deve ser ocultada quando não houver registros.

noPermission
Array<ThfGridEditModeActionType>	(opcional)
Propriedade opcional que permite remover e desabilitar as ações no grid. Os valores permitidos no array são definidos pelo enum ThfGridEditModeActionType:

Importante: ao declarar ThfGridEditModeActionType.Add em noPermission, a ação de duplicação também ficará indisponível.

// Exemplo de uso:

gridRowActions: ThfGridRowActions = {
 noPermission: [
   ThfGridEditModeActionType.Replace,
   ThfGridEditModeActionType.Duplicate,
   ThfGridEditModeActionType.Add,
   ThfGridEditModeActionType.Remove] // Desabilita edição, duplicação, inclusão e remoção
  // outras ações...
};
title
string	(opcional)
Título opcional que pode ser usado para exibir um cabeçalho ou descrição na interface.

validateField
(updatedField: any, columnProperty: string) => booleanObservable<boolean>	(opcional)
Função opcional executada quando algum campo é alterado. Pode ser usada para validar ou modificar dados baseados no valor alterado.

// Exemplo de uso:

onValidate(updatedField, property) {

 if(property === 'pais') {
     this.myForm?.controls['capital'].setValue(null); // valor da capital modificado para nulo
     const valuePais = this.myForm.controls[property].value;
     const capital = this.columnWithItems.find(column => column.property === 'capital');
      if (valuePais === 'Brasil') {
         capital.editProperties.disabled = false;
         this.form?.controls['capital'].setValue('Brasilia'); // Modificado o valor do campo "capital" baseado no valor do campo "pais"
      } else if (valuePais === 'Portugal') {
          capital.editProperties.disabled = false;
          this.form?.controls['capital'].setValue('Lisboa');
      } else {
        capital.editProperties.disabled = true;
        this.form?.controls['capital'].setValue('');
     }

   return true;
 }
}
