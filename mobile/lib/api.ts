/**
 * API client for FisioMentor mobile app
 * Handles communication with Fastify backend
 */

import Constants from 'expo-constants';
import { supabase } from './supabase';
import type {
  Student,
  PhysicalAssessment,
  TrainingPlan,
  TrainingSessionLog,
  Assessment,
  ProgressRecord,
  ApiResponse,
  PaginatedResponse,
} from './types';

/**
 * Get API base URL from environment or use default
 */
const getApiUrl = (): string => {
  const configUrl = Constants.expoConfig?.extra?.API_URL ||
    process.env.EXPO_PUBLIC_API_URL;

  if (configUrl) {
    return configUrl;
  }

  // Default to localhost for development
  return 'http://localhost:3001';
};

const API_URL = getApiUrl();

/**
 * Options for API requests
 */
interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
  timeout?: number;
}

/**
 * Base fetch function with authentication
 */
export const apiFetch = async <T = any>(
  path: string,
  options: FetchOptions = {}
): Promise<T> => {
  const { skipAuth = false, timeout = 30000, ...fetchOptions } = options;

  const url = `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  // Add authorization token if not skipped
  if (!skipAuth) {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;

      const session = data?.session;
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch (error) {
      console.warn('Failed to get auth token:', error);
    }
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.message || `API request failed with status ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Get all students
 */
export const getStudents = async (filters?: {
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<Student>> => {
  const params = new URLSearchParams();
  if (filters?.search) params.append('search', filters.search);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());

  const queryString = params.toString();
  const path = `/api/students${queryString ? `?${queryString}` : ''}`;

  return apiFetch<PaginatedResponse<Student>>(path);
};

/**
 * Get a single student by ID
 */
export const getStudent = async (id: string): Promise<Student> => {
  return apiFetch<Student>(`/api/students/${id}`);
};

/**
 * Create a new student
 */
export const createStudent = async (data: Partial<Student>): Promise<Student> => {
  return apiFetch<Student>('/api/students', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Update a student
 */
export const updateStudent = async (
  id: string,
  data: Partial<Student>
): Promise<Student> => {
  return apiFetch<Student>(`/api/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * Delete a student
 */
export const deleteStudent = async (id: string): Promise<void> => {
  return apiFetch<void>(`/api/students/${id}`, {
    method: 'DELETE',
  });
};

/**
 * Generate a training plan for a student
 */
export const generatePlan = async (
  studentId: string,
  notes?: string
): Promise<TrainingPlan> => {
  return apiFetch<TrainingPlan>(
    `/api/students/${studentId}/generate`,
    {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }
  );
};

/**
 * Get a training plan
 */
export const getTrainingPlan = async (planId: string): Promise<TrainingPlan> => {
  return apiFetch<TrainingPlan>(`/api/training-plans/${planId}`);
};

/**
 * Update a training plan
 */
export const updateTrainingPlan = async (
  planId: string,
  data: Partial<TrainingPlan>
): Promise<TrainingPlan> => {
  return apiFetch<TrainingPlan>(`/api/training-plans/${planId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * Get all training sessions for a student
 */
export const getStudentSessions = async (
  studentId: string,
  filters?: {
    page?: number;
    pageSize?: number;
  }
): Promise<PaginatedResponse<TrainingSessionLog>> => {
  const params = new URLSearchParams();
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());

  const queryString = params.toString();
  const path = `/api/students/${studentId}/sessions${queryString ? `?${queryString}` : ''}`;

  return apiFetch<PaginatedResponse<TrainingSessionLog>>(path);
};

/**
 * Log a training session completion
 */
export const logTrainingSession = async (
  studentId: string,
  data: Partial<TrainingSessionLog>
): Promise<TrainingSessionLog> => {
  return apiFetch<TrainingSessionLog>(
    `/api/students/${studentId}/sessions`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
};

/**
 * Get progress records for a student
 */
export const getStudentProgress = async (
  studentId: string,
  metric?: string
): Promise<ProgressRecord[]> => {
  const params = new URLSearchParams();
  if (metric) params.append('metric', metric);

  const queryString = params.toString();
  const path = `/api/students/${studentId}/progress${queryString ? `?${queryString}` : ''}`;

  return apiFetch<ProgressRecord[]>(path);
};

/**
 * Create a progress record
 */
export const createProgressRecord = async (
  studentId: string,
  data: Partial<ProgressRecord>
): Promise<ProgressRecord> => {
  return apiFetch<ProgressRecord>(
    `/api/students/${studentId}/progress`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
};

/**
 * Create a physical assessment
 */
export const createAssessment = async (
  studentId: string,
  data: Partial<Assessment>
): Promise<Assessment> => {
  return apiFetch<Assessment>(
    `/api/students/${studentId}/assessments`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
};

/**
 * Get assessments for a student
 */
export const getStudentAssessments = async (
  studentId: string,
  filters?: {
    page?: number;
    pageSize?: number;
  }
): Promise<PaginatedResponse<Assessment>> => {
  const params = new URLSearchParams();
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());

  const queryString = params.toString();
  const path = `/api/students/${studentId}/assessments${queryString ? `?${queryString}` : ''}`;

  return apiFetch<PaginatedResponse<Assessment>>(path);
};

/**
 * Export training plan as PDF
 */
export const exportPlanPdf = async (planId: string): Promise<Blob> => {
  const url = `${API_URL}/api/training-plans/${planId}/export/pdf`;

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;

    const session = data?.session;
    const headers: HeadersInit = {};

    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to export PDF: ${response.statusText}`);
    }

    return response.blob();
  } catch (error) {
    console.error('Error exporting PDF:', error);
    throw error;
  }
};

/**
 * Export training plan as CSV
 */
export const exportPlanCsv = async (planId: string): Promise<Blob> => {
  const url = `${API_URL}/api/training-plans/${planId}/export/csv`;

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;

    const session = data?.session;
    const headers: HeadersInit = {};

    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to export CSV: ${response.statusText}`);
    }

    return response.blob();
  } catch (error) {
    console.error('Error exporting CSV:', error);
    throw error;
  }
};

/**
 * Get current API URL (useful for debugging)
 */
export const getAPIInfo = () => ({
  baseUrl: API_URL,
  isDevelopment: API_URL.includes('localhost'),
});
