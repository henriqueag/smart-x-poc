export type ReportResourceType = 'report' | 'pivot-table' | 'data-grid';

export type ReportPermission = 'Viewer' | 'Editor' | 'Owner';

export interface ReportResourceOwner {
    id: string;
    displayName: string;
    issuer: string;
}

export interface ReportResourceCurrentUser {
    permission: ReportPermission;
}

export interface ReportResource {
    id: string;
    resourceType: ReportResourceType;
    displayName: string;
    description: string;
    createdAt: string;
    isFavorite: boolean;
    owner: ReportResourceOwner;
    currentUser: ReportResourceCurrentUser;
    tags: string[];
}

export interface ReportResourceListFilters {
    accessType?: string;
    displayName?: string;
    description?: string;
    isFavorite?: boolean;
    resourceTypes?: ReportResourceType[];
    tags?: string[];
}

export interface ReportResourceListQuery extends ReportResourceListFilters {
    page?: number;
    pageSize?: number;
}

export interface ReportResourceListResult {
    items: ReportResource[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
