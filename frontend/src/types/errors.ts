import { AxiosError } from 'axios';

// API Error Response Structure
export interface ApiErrorResponse {
  success: false;
  message: string;
  error?: string;
  errors?: Record<string, string[]>; // For validation errors
  code?: string;
}

// Generic API Error - Use type instead of interface to avoid extends conflicts
export type ApiError = AxiosError & {
  response?: {
    data: ApiErrorResponse;
    status: number;
    statusText: string;
    headers: any;
    config: any;
  };
};

// Error handling utility functions
export class ErrorHandler {
  /**
   * Extract error message from various error types
   */
  static getErrorMessage(error: unknown): string {
    // If it's an Axios error with response data
    if (this.isApiError(error)) {
      return error.response?.data?.message || error.message || 'An unexpected error occurred';
    }

    // If it's a regular Error object
    if (error instanceof Error) {
      return error.message;
    }

    // If it's a string
    if (typeof error === 'string') {
      return error;
    }

    // Fallback for unknown error types
    return 'An unexpected error occurred';
  }

  /**
   * Check if error is an API error
   */
  static isApiError(error: unknown): error is ApiError {
    return (
      error !== null &&
      typeof error === 'object' &&
      'isAxiosError' in error &&
      (error as AxiosError).isAxiosError === true
    );
  }

  /**
   * Get detailed error information for debugging
   */
  static getErrorDetails(error: unknown): {
    message: string;
    status?: number;
    code?: string;
    details?: any;
  } {
    if (this.isApiError(error)) {
      return {
        message: error.response?.data?.message || error.message || 'API Error',
        status: error.response?.status,
        code: error.response?.data?.code || error.code,
        details: error.response?.data
      };
    }

    return {
      message: this.getErrorMessage(error),
    };
  }

  /**
   * Handle validation errors (for forms)
   */
  static getValidationErrors(error: unknown): Record<string, string> {
    if (this.isApiError(error) && error.response?.data?.errors) {
      const validationErrors: Record<string, string> = {};
      const errors = error.response.data.errors;
      
      Object.keys(errors).forEach(field => {
        validationErrors[field] = errors[field][0]; // Get first error for each field
      });
      
      return validationErrors;
    }
    
    return {};
  }

  /**
   * Check if error is a specific status code
   */
  static isStatusCode(error: unknown, statusCode: number): boolean {
    return this.isApiError(error) && error.response?.status === statusCode;
  }

  /**
   * Check if error is a 401 (Unauthorized)
   */
  static isUnauthorized(error: unknown): boolean {
    return this.isStatusCode(error, 401);
  }

  /**
   * Check if error is a 403 (Forbidden)
   */
  static isForbidden(error: unknown): boolean {
    return this.isStatusCode(error, 403);
  }

  /**
   * Check if error is a 404 (Not Found)
   */
  static isNotFound(error: unknown): boolean {
    return this.isStatusCode(error, 404);
  }

  /**
   * Check if error is a 422 (Validation Error)
   */
  static isValidationError(error: unknown): boolean {
    return this.isStatusCode(error, 422);
  }
}

// Custom error classes for specific error types
export class ValidationError extends Error {
  constructor(
    message: string,
    public fields: Record<string, string>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message = 'You are not authorized to perform this action') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class NotFoundError extends Error {
  constructor(message = 'The requested resource was not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}