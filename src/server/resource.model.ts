export type ResourceType = 'report' | 'pivot-table' | 'data-grid';
export type ReportPermission = 'Viewer' | 'Editor' | 'Owner';

export interface ResourceOwner {
    id: string;
    displayName: string;
    issuer: string;
}

export interface ResourceCurrentUser {
    permission: ReportPermission;
}

export interface Resource {
    id: string;
    resourceType: ResourceType;
    displayName: string;
    description: string;
    createdAt: string;
    isFavorite: boolean;
    owner: ResourceOwner;
    currentUser: ResourceCurrentUser;
    tags: string[];
}

export interface ResourceListFilters {
    displayName?: string;
    description?: string;
    isFavorite?: boolean;
}

export interface ResourceListQuery extends ResourceListFilters {
    page?: number;
    pageSize?: number;
}

export interface ResourceListResult {
    items: Resource[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
