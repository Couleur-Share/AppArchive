export interface ApiResponse<T> {
	data: T | null;
	error: Error | null;
	status: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
	page: number;
	per_page: number;
	total: number;
}
