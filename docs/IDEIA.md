# Construção do layout

## Objetivo

Utilizar os eventos da thf-grid para permitir personalização da tela de listagem de recursos. Cada evento representa uma alteração no layout. As alterações serão salvas na tabela UserPreferences para que ao iniciar o componente relacionado a rota de listagem, recupere as informações de preferência do usuário e aplique.

É necessário construir um objeto estruturado que vai representar o layout da tela e que será salvo na base dados no formato JSON.

Uma premissa importante é salvar o layout de forma silenciosa, então cada emissão de evento, caso haja alteração no objeto (dirty) enviamos uma requisição para a API para atualizar. Assim o usuário configura tudo sem precisar ficar clicando na ação de salvar. Isso aumenta a quantidade de requisições, mas após determinada configuração o usuário não ficará atualizando tanto.

**Evento**: t-change-group
**Descrição**: Emite uma lista de string que representa as colunas do agrupamento

```json
[
  "displayName"
]
```

**Evento**: t-change-sort-column
**Descrição**: Emite uma lista de objeto que indica a direção da ordenação e por qual a coluna está sendo ordenada

```json
[
  {
    "dir": "asc | desc",
    "field": "displayName"
  }
]
```

**Evento**: t-change-order-column
**Descrição**: Emite uma lista de string com a ordem das colunas apresentadas na grid.

```json
[
  "id",
  "displayName",
  "description",
  "resourceType",
  "createdAt",
  "permission",
  "ownerDisplayName",
  "isFavorite",
  "tags"
]
```

**Evento**: t-change-fixed-columns
**Descrição**: Emite um evento com a lista de colunas fixadas

```json
[
  "displayName"
]
```

**Evento**: t-change-filter-by-column
**Descrição**: Emite os filtros aplicados em cada coluna

```json
[
    {
        "property": "createdAt",
        "logic": "and",
        "operator1": "gte",
        "value1": "2026-05-04",
        "operator2": "gte"
    }
]
```

**Evento**: t-restore-column-manager
**Descrição**: Usar para redifinir tudo as configurações originais. O serviço que armazena o estado deve ter a configuração original da grid e deve ser feita a limpeza da preferência de usuário.

**Evento**: t-change-visible-columns
**Descrição**: Retorna as colunas visiveis

```json
[
  "description",
  "resourceType",
  "createdAt",
  "ownerDisplayName",
  "permission",
  "isFavorite",
  "tags"
]
```

**Evento**: t-change-options-column-manager
**Descrição**: Retornar se está marcado draggable ou groupable. Se nenhum estiver marcado retorna um array vazio

```json
[
  "draggable",
  "groupable"
]
```

**Evento**: t-custom-filter
**Descrição**: Permite implementar um filtro customizado. Para a listagem do Smart View utilizaremos essa opção abrindo um modal e nele vamos ter duas sessões:

Nível de acesso
--
po-combo com valores Todos, Meus recursos e Compartilhados comigo

Filtro de propriedades
--
displayName, description, isFavorite, resourceType (multiplos itens [inSql]), tags (multiplos itens [inSql]),

# Colunas filtráveis

Todas as colunas podem ter filtro. Para cada alteração do filtro é necessário chamar a api, já que o dado não está completo na tela. A páginação também precisa aplicar o filtro. 

# Estrutura da tela UX

Título da página: Listagem de recursos

Ações do cabeçalho da página:

- Incluir recurso: Como são 3 tipos de recurso, precisamos fazer com que o usuário escolha qual opção. Talvez seja necessário fazer uma customização no po-page-default para atender esse requisito usando um dropdown. Não é uma solução nativa, mas deve funcionar bem, talvez com uma diretiva.
  - Qual uma opção boa para isso? Um dropdown ou um modal sendo aberto para o usuário selecionar qual tipo de recurso deseja cadastrar? Dê ideias para isso.

- Ações de exportar em lote e importar recurso: Hoje a visualização de recursos é separada, então cada recurso tem sua impleemntação específica. A ideia é unificar, porém o usuário precisa selecionar qual recurso deseja importar/exportar em lote. 
  - Exportação em lote: 
    - Opção A: exibir um modal com um select para o usuário escolher o recurso que deseja exportar em lote. 
    - Opção A: Avaliar uma modificação da api de exportação para não receber mais o resourceType e descobrir qual recurso é através da lista de IDs que é enviada.
  - Importação:
    - Hoje é o redirecionado para uma tela que já inicia com um FileUpload abrindo para selecionar o arquivo. No caso de unificar seria necessário a escolha do recurso que deseja importar, ou então abrir a tela sem iniciar o FileUpload e permitir que o usuário selecione o que quer importar. Qual opção é boa aqui?

- Ações adicionais:
  - Recarregar página: Importante, pois o usuário pode querer reiniciar a visualização

Busca usando o input da tabela: O input não emite evento de busca, então é feito a busca dentro dos dados da tabela, o que pode ser um problema já o intuito é chamar a api passando o query

Tentar definir o height para a tabela de forma que ocupe 100% da página e o overflow fique somente nela

## Cadastro de tags

Hoje temos uma forma muito ruim de agrupar recursos que é através de pastas. Para isso o usuário precisa navegar para a listagem de pastas, criar a pasta, voltar para a edição do recurso e depois ir na etapa de compartilhamento para vincular uma pasta. É um esforço grande para um simples agrupamento. Queremos uma forma simplificada e para isso uma opção boa seria uso de tags. O problema é a forma de cadastrar essas tags.
A ideia é que elas sejam salvas por usuário como uma lista de strings simples salva na tabela UserPreferences. A thf-grid permite edição em linha, porém percebi que não consigo ter a grid editável e não editável ao mesmo tempo e tentar alternar gera erro interno que não tenho poder para tratar. Pensei em ter duas grid no componente que vou criar, e ter uma ação para cadastrar, então ao clicar nessa ação alterno para a grid de edição. Acho que isso não vai ficar muito bom. Qual uma abordagem boa para esse cadastro simples? Um modal para cadastrar as tags na tela de listagem mesmo?

