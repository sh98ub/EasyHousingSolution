import { HttpErrorResponse } from '@angular/common/http';

/**
 * Extracts a clear, user-facing error message from any error shape
 * (e.g., ExceptionResponse, ProblemDetails, string, or HttpErrorResponse).
 */
export function extractErrorMessage(error: unknown, fallback: string = 'An unexpected error occurred.'): string {
  if (!error) {
    return fallback;
  }

  if (typeof error === 'string') {
    return error.trim() || fallback;
  }

  if (error instanceof HttpErrorResponse) {
    // If backend returned a body
    if (error.error) {
      if (typeof error.error === 'string') {
        try {
          const parsed = JSON.parse(error.error);
          return parsed.message || parsed.details || parsed.title || error.error;
        } catch {
          return error.error.trim() || fallback;
        }
      }

      // 1. ExceptionResponse / ApiResponse structure: { message: "...", details: "..." }
      if (typeof error.error.message === 'string' && error.error.message.trim()) {
        return error.error.message.trim();
      }

      // 2. Details field
      if (typeof error.error.details === 'string' && error.error.details.trim()) {
        return error.error.details.trim();
      }

      // 3. ASP.NET ValidationProblemDetails: { errors: { "Field": ["Error message"] } }
      if (error.error.errors && typeof error.error.errors === 'object') {
        const errorList = Object.values(error.error.errors).flat() as string[];
        if (errorList.length > 0) {
          return errorList.join(' ');
        }
      }

      // 4. ProblemDetails title
      if (typeof error.error.title === 'string' && error.error.title.trim()) {
        return error.error.title.trim();
      }
    }

    // Specific HTTP status handling when no explicit message was returned in body
    if (error.status === 0) {
      return 'Unable to reach the server. Please check your network connection or API Gateway.';
    }
    if (error.status === 401) {
      return 'Invalid email or password. Please verify your credentials.';
    }
    if (error.status === 403) {
      return 'You do not have permission to perform this action.';
    }
    if (error.status === 404) {
      return 'The requested resource could not be found.';
    }
    if (error.status >= 500) {
      return 'Server error occurred. Please try again later.';
    }
  }

  // Generic object with message property
  if (typeof (error as any).message === 'string' && (error as any).message.trim()) {
    return (error as any).message.trim();
  }

  return fallback;
}
