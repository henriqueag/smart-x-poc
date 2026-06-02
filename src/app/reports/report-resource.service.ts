import { Injectable } from '@angular/core';
import { faker } from '@faker-js/faker';
import { Observable, of } from 'rxjs';
import {
    ReportPermission,
    ReportResource,
    ReportResourceListQuery,
    ReportResourceListResult,
    ReportResourceOwner,
    ReportResourceType
} from './report-resource.model';

@Injectable({ providedIn: 'root' })
export class ReportResourceService {
    private owners: ReportResourceOwner[] = [
        {
            id: 'henrique.saguiar',
            displayName: 'Henrique Santos De Aguiar',
            issuer: 'sample-security-provider'
        },
        {
            id: 'amanda.costa',
            displayName: 'Amanda Costa',
            issuer: 'sample-security-provider'
        },
        {
            id: 'joao.lima',
            displayName: 'Joao Lima',
            issuer: 'sample-security-provider'
        }
    ];

    tags = ['Financeiro', 'Fiscal', 'Orçamento', 'RH'];

    private resourceTypes: ReportResourceType[] = ['report', 'pivot-table', 'data-grid'];
    private permissions: ReportPermission[] = ['Viewer', 'Editor', 'Owner'];
    private resources: ReportResource[] = this.createMockResources(120);

    listResources(query: ReportResourceListQuery = {}): Observable<ReportResourceListResult> {
        const page = this.toPositiveNumber(query.page, 1);
        const pageSize = this.toPositiveNumber(query.pageSize, 10);

        const filteredResources = this.applyFilters(query);
        const total = filteredResources.length;
        const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
        const normalizedPage = totalPages > 0 ? Math.min(page, totalPages) : 1;

        const start = (normalizedPage - 1) * pageSize;
        const end = start + pageSize;

        return of({
            items: filteredResources.slice(start, end),
            total,
            page: normalizedPage,
            pageSize,
            totalPages
        });
    }

    private applyFilters(query: ReportResourceListQuery): ReportResource[] {
        const displayNameFilter = query.displayName?.trim().toLowerCase();
        const descriptionFilter = query.description?.trim().toLowerCase();

        return this.resources.filter(resource => {
            if (displayNameFilter && !resource.displayName.toLowerCase().includes(displayNameFilter)) {
                return false;
            }

            if (descriptionFilter && !resource.description.toLowerCase().includes(descriptionFilter)) {
                return false;
            }

            if (typeof query.isFavorite === 'boolean' && resource.isFavorite !== query.isFavorite) {
                return false;
            }

            return true;
        });
    }

    private createMockResources(totalItems: number): ReportResource[] {
        faker.seed(20260527);

        return Array.from({ length: totalItems }, (_, index) => {
            const itemNumber = index + 1;
            const resourceType = this.resourceTypes[index % this.resourceTypes.length];
            const owner = this.owners[index % this.owners.length];
            const permission = this.permissions[index % this.permissions.length];
            const createdAt = new Date(Date.UTC(2026, 4, (index % 28) + 1, 8, index % 60, 0)).toISOString();

            return {
                id: String(itemNumber),
                resourceType,
                displayName: this.buildDisplayName(itemNumber),
                description: this.buildDescription(itemNumber),
                createdAt,
                isFavorite: itemNumber % 4 === 0,
                owner: { ...owner },
                currentUser: {
                    permission
                },
                tags: [this.tags[index % this.tags.length]]
            };
        });
    }

    private buildDisplayName(itemNumber: number): string {
        const suffix = faker.word.words({ count: { min: 1, max: 2 } });

        return `Resource ${itemNumber} ${suffix}`;
    }

    private buildDescription(itemNumber: number): string {
        const scenario = faker.lorem.sentence({ min: 8, max: 14 });
        return `Resource ${itemNumber}. ${scenario}`;
    }

    private toPositiveNumber(value: number | undefined, fallback: number): number {
        if (typeof value !== 'number' || Number.isNaN(value) || value < 1) {
            return fallback;
        }

        return Math.floor(value);
    }
}
