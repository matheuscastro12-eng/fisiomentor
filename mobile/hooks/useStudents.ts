/**
 * useStudents hook for FisioMentor mobile app
 * Manages student data fetching and state
 */

import { useEffect, useState, useCallback } from 'react';
import { getStudents } from '../lib/api';
import type { Student, PaginatedResponse } from '../lib/types';

export interface UseStudentsOptions {
  search?: string;
  page?: number;
  pageSize?: number;
  autoFetch?: boolean;
}

export interface UseStudentsReturn {
  students: Student[];
  loading: boolean;
  error: Error | null;
  refetch: (options?: UseStudentsOptions) => Promise<void>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export const useStudents = (
  initialOptions?: UseStudentsOptions
): UseStudentsReturn => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState({
    page: initialOptions?.page || 1,
    pageSize: initialOptions?.pageSize || 10,
    total: 0,
    totalPages: 0,
  });
  const [options, setOptions] = useState<UseStudentsOptions>(
    initialOptions || {
      page: 1,
      pageSize: 10,
      autoFetch: true,
    }
  );

  /**
   * Fetch students based on current options
   */
  const fetchStudents = useCallback(
    async (fetchOptions?: UseStudentsOptions) => {
      try {
        setLoading(true);
        setError(null);

        const opts = fetchOptions || options;

        const response = await getStudents({
          search: opts.search,
          page: opts.page || 1,
          pageSize: opts.pageSize || 10,
        });

        setStudents(response.data);
        setPagination({
          page: response.page,
          pageSize: response.pageSize,
          total: response.total,
          totalPages: response.totalPages,
        });

        // Update options if new ones were provided
        if (fetchOptions) {
          setOptions((prev) => ({
            ...prev,
            ...fetchOptions,
          }));
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setStudents([]);
        console.error('Error fetching students:', error);
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  /**
   * Auto-fetch students on mount or option changes
   */
  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchStudents();
    }
  }, [options.search, options.page, options.pageSize, fetchStudents]);

  /**
   * Manual refetch function
   */
  const refetch = useCallback(
    async (refetchOptions?: UseStudentsOptions) => {
      await fetchStudents(
        refetchOptions || {
          page: pagination.page,
          pageSize: pagination.pageSize,
        }
      );
    },
    [fetchStudents, pagination.page, pagination.pageSize]
  );

  return {
    students,
    loading,
    error,
    refetch,
    pagination,
  };
};

/**
 * Hook for searching students with debounce
 */
export const useStudentSearch = (debounceMs: number = 500) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');

  const {
    students,
    loading,
    error,
    refetch,
    pagination,
  } = useStudents({
    search: debouncedTerm,
    pageSize: 20,
    autoFetch: false,
  });

  /**
   * Debounce search term
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs]);

  /**
   * Fetch when debounced term changes
   */
  useEffect(() => {
    refetch({
      search: debouncedTerm,
      page: 1,
      pageSize: 20,
    });
  }, [debouncedTerm, refetch]);

  return {
    searchTerm,
    setSearchTerm,
    students,
    loading,
    error,
    refetch,
    pagination,
  };
};

/**
 * Hook for paginated student list
 */
export const usePaginatedStudents = (pageSize: number = 10) => {
  const [page, setPage] = useState(1);
  const {
    students,
    loading,
    error,
    refetch,
    pagination,
  } = useStudents({
    page,
    pageSize,
    autoFetch: true,
  });

  const goToPage = useCallback((newPage: number) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPage(newPage);
    }
  }, [pagination.totalPages]);

  const nextPage = useCallback(() => {
    goToPage(page + 1);
  }, [page, goToPage]);

  const previousPage = useCallback(() => {
    goToPage(page - 1);
  }, [page, goToPage]);

  return {
    students,
    loading,
    error,
    refetch,
    pagination,
    page,
    goToPage,
    nextPage,
    previousPage,
    hasNextPage: page < pagination.totalPages,
    hasPreviousPage: page > 1,
  };
};
