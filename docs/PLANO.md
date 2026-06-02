# Documento de Planejamento: Listagem de Recursos

## 1. Contrato do DTO de Filtro e Ordenação (ASP.NET Core)

Substituindo a complexidade do oData, a paginação, filtros e ordenação serão enviados como um DTO achatado via QueryString, estruturado para o *Model Binding* nativo do ASP.NET Core.

### Estrutura da QueryString Gerada

```text
page=1&pageSize=15&sort.field=createdAt&sort.dir=desc&displayName=Resource&isFavorite=true&resourceTypes=report&resourceTypes=data-grid&tags=Financeiro
```

### Interface do DTO no Frontend

```typescript
export interface ReportResourceListQuery {
  page?: number;
  pageSize?: number;
  sort?: {
    field: string;
    dir: 'asc' | 'desc';
  };
  // Filtros Avançados
  accessType?: string;
  displayName?: string;
  description?: string;
  isFavorite?: boolean;
  resourceTypes?: string[];
  tags?: string[];
}

```

---

## 2. Modelo de Dados de Preferências de Layout (Persistência em BD)

Modelo atômico salvo como JSON na tabela `UserPreferences` para persistir as customizações de tela de forma silenciosa via eventos da grid:

```typescript
export interface UserGridLayoutPreference {
  columnsOrder: string[];                 // Sequência das colunas (t-change-order-column)
  visibleColumns: string[];               // Colunas ativas (t-change-visible-columns)
  fixedColumns: string[];                 // Colunas fixadas (t-change-fixed-columns)
  groupColumns: string[];                 // Agrupamento ativo (t-change-group)
  options: ('draggable' | 'groupable')[]; // Estado do gerenciador (t-change-options-column-manager)
  sort: {
    field: string;
    dir: 'asc' | 'desc';
  }[];                                    // Ordenação da grid (t-change-sort-column)
}

```

---

## 3. Backlog de Issues Atomizado (Pronto para Distribuição e QA)

### [ISSUE 01] CORE - API GET Recursos

* **Escopo:** Alterar o endpoint `GET /api/resources` para aceitar o novo DTO estruturado via QueryString (`sort.field`, `sort.dir`, paginação e filtros).
* **Critério de Aceite (QA):** Validar se o retorno expõe o formato correto (`items` e `hasNext`) e responde aos filtros e ordenação passados de forma combinada.

### [ISSUE 02] CORE - API GET Preferências de Layout

* **Escopo:** Criar o endpoint `GET /api/user-preferences/layout` para retornar o JSON de configuração da grid do usuário corrente.
* **Critério de Aceite (QA):** Validar o retorno HTTP `200` com o JSON ou `204 No Content` caso o usuário não possua preferências salvas.

### [ISSUE 03] CORE - API POST Preferências de Layout

* **Escopo:** Criar o endpoint `POST /api/user-preferences/layout` para salvar de forma atômica o payload do layout da grid.
* **Critério de Aceite (QA):** Validar se o payload enviado atualiza o registro ou insere um novo caso não exista (Upsert).

### [ISSUE 04] CORE - API GET Catálogo de Tags

* **Escopo:** Criar o endpoint `GET /api/user-preferences/tags` para listar o catálogo global de tags disponíveis para o usuário.

### [ISSUE 05] CORE - API POST Catálogo de Tags

* **Escopo:** Criar o endpoint `POST /api/user-preferences/tags` para incluir/remover strings do catálogo de tags personalizadas.

### [ISSUE 06] UI - Rota Base e Estrutura de Inclusão (+ Workaround Popup)

* **Escopo:** Criar a rota `/_/resources/list` e o componente `ListComponent`. Configurar as `pageActions` do `po-page-default`.
* **⚠️ Nota Técnica / Workaround Obrigatório:** O `po-page-default` não fornece acesso direto ao elemento nativo do seu botão primário para ser usado como target do `po-popup`.
* **Implementação:** No `ngAfterViewInit`, o desenvolvedor deve capturar a referência usando `nativeElement.querySelector('.po-page-header-actions po-button[p-kind=primary]')` e atribuí-la ao sinal `pageButtonEl`.



### [ISSUE 07] UI - Implementação da thf-grid (+ Workaround Search Control)

* **Escopo:** Adicionar o componente `thf-grid` na view mapeando colunas, ordenação padrão e os templates de célula (`po-tag`).
* **⚠️ Nota Técnica / Workaround Obrigatório:**
O `thf-grid` não expõe eventos reativos para ouvir digitação em tempo real no campo de busca de sua toolbar interna.
* **Implementação:** No `ngAfterViewInit`, capturar o input padrão via seletor do Kendo, removê-lo do nó pai com `Renderer2` e injetar o `po-input` customizado vinculado ao `FormControl` reativo da aplicação.



### [ISSUE 08] UI - State Store de Preferências e Sincronização Silenciosa

* **Escopo:** Criar o serviço de estado (Signals) que escuta os eventos de alteração da grid (`t-change-group`, `t-change-order-column`, etc.). Acoplar a lógica de persistência utilizando um operador de `debounceTime(1500)` para disparar a API POST (Issue 03) de forma silenciosa apenas quando o usuário cessar a interação.

### [ISSUE 09] UI - Filtros Avançados e Montagem do DTO

* **Escopo:** Implementar o `po-modal` de filtro avançado. Ao disparar a ação primária, converter o estado dos campos (`accessType`, `description`, `favorite`, `types`, `tags`) no formato de propriedades do DTO da Issue 01 e realizar o reload da grid.
