import { faker } from '@faker-js/faker';
import * as parser from 'odata-v4-parser';
import { ReportPermission, Resource, ResourceListResult, ResourceOwner, ResourceType } from './resource.model';

export class ResourceService {
    private owners: ResourceOwner[] = [
        { id: 'henrique.saguiar', displayName: 'Henrique Santos De Aguiar', issuer: 'sample-security-provider' },
        { id: 'amanda.costa', displayName: 'Amanda Costa', issuer: 'sample-security-provider' },
        { id: 'joao.lima', displayName: 'Joao Lima', issuer: 'sample-security-provider' }
    ];

    private tags = ['Financeiro', 'Fiscal', 'Orçamento', 'RH'];
    private resourceTypes: ResourceType[] = ['report', 'pivot-table', 'data-grid'];
    private permissions: ReportPermission[] = ['Viewer', 'Editor', 'Owner'];
    private resources: Resource[];

    constructor() {
        this.resources = this.createMockResources(120);
    }

    public getResources(options: { filter?: string; orderby?: string; top?: string; skip?: string }): ResourceListResult {
        let items = [...this.resources];

        // 1. Aplicação de Filtragem OData interpretada pela lib
        if (options.filter) {
            try {
                // O método createFilter da lib gera uma árvore AST estruturada do filtro
                const filterAst = parser.filter(options.filter);
                items = this.applyAstFilter(items, filterAst);
            } catch (error) {
                console.error('[OData Parser Error] Filtro inválido:', error);
            }
        }

        // 2. Aplicação de Ordenação OData ($orderby=displayName desc)
        if (options.orderby) {
            items = this.applyOrderby(items, options.orderby);
        }

        const total = items.length;
        const pageSize = options.top ? parseInt(options.top, 10) : 10;
        const skip = options.skip ? parseInt(options.skip, 10) : 0;
        const page = Math.floor(skip / pageSize) + 1;
        const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

        return {
            items: items.slice(skip, skip + pageSize),
            total,
            page,
            pageSize,
            totalPages
        };
    }

    private applyAstFilter(items: Resource[], ast: any): Resource[] {
        return items.filter(item => {
            if (ast.type === 'AndExpression') {
                return this.evaluateCriteria(item, ast.value.left) && this.evaluateCriteria(item, ast.value.right);
            }
            return this.evaluateCriteria(item, ast);
        });
    }

    private evaluateCriteria(item: Resource, criterion: any): boolean {
        if (criterion.type === 'MethodCallExpression' && criterion.value.method === 'contains') {
            const [propNode, valNode] = criterion.value.parameters;
            const prop = propNode.raw;
            const val = valNode.raw.replace(/['"]/g, '').toLowerCase();
            return String((item as any)[prop])
                .toLowerCase()
                .includes(val);
        }

        if (criterion.type === 'EqualsExpression') {
            const prop = criterion.value.left.raw;
            let val = criterion.value.right.raw;
            if (typeof val === 'string') val = val.replace(/['"]/g, '');
            const formattedVal = val === 'true' ? true : val === 'false' ? false : val;
            return (item as any)[prop] === formattedVal;
        }

        return true;
    }

    private applyOrderby(items: Resource[], orderbyStr: string): Resource[] {
        const [field, direction] = orderbyStr.trim().split(/\s+/);
        const isDesc = direction?.toLowerCase() === 'desc';

        return items.sort((a, b) => {
            const valA = String((a as any)[field]).toLowerCase();
            const valB = String((b as any)[field]).toLowerCase();
            return isDesc ? valB.localeCompare(valA) : valA.localeCompare(valB);
        });
    }

    private createMockResources(totalItems: number): Resource[] {
        faker.seed(20260527);
        return Array.from({ length: totalItems }, (_, index) => {
            const itemNumber = index + 1;
            return {
                id: String(itemNumber),
                resourceType: this.resourceTypes[index % this.resourceTypes.length],
                displayName: `Resource ${itemNumber} ${faker.word.words({ count: { min: 1, max: 2 } })}`,
                description: `Resource ${itemNumber}. ${faker.lorem.sentence({ min: 8, max: 14 })}`,
                createdAt: new Date(Date.UTC(2026, 4, (index % 28) + 1, 8, index % 60, 0)).toISOString(),
                isFavorite: itemNumber % 4 === 0,
                owner: { ...this.owners[index % this.owners.length] },
                currentUser: { permission: this.permissions[index % this.permissions.length] },
                tags: [this.tags[index % this.tags.length]]
            };
        });
    }
}
