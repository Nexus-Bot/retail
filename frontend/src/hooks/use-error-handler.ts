import { useCallback } from "react";
import { toast } from "sonner";
import { ErrorHandler } from "@/types/errors";

export interface UseErrorHandlerOptions {
  /**
   * Whether to show toast notification for errors
   * @default true
   */
  showToast?: boolean;

  /**
   * Custom toast message prefix
   */
  toastPrefix?: string;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const { showToast = true, toastPrefix } = options;

  const handleError = useCallback(
    (error: unknown, customMessage?: string) => {
      const errorMessage = ErrorHandler.getErrorMessage(error) || customMessage;
      const errorDetails = ErrorHandler.getErrorDetails(error);

      // Show toast notification
      if (showToast) {
        const toastMessage = toastPrefix
          ? `${toastPrefix}: ${errorMessage}`
          : errorMessage;

        // Use different toast types based on error status
        if (ErrorHandler.isUnauthorized(error)) {
          toast.error("Please log in to continue");
        } else if (ErrorHandler.isForbidden(error)) {
          toast.error("You don't have permission to perform this action");
        } else if (ErrorHandler.isNotFound(error)) {
          toast.error("The requested resource was not found");
        } else if (ErrorHandler.isValidationError(error)) {
          toast.error(toastMessage);
        } else {
          toast.error(toastMessage);
        }
      }

      return errorDetails;
    },
    [showToast, toastPrefix]
  );

  const handleSuccess = useCallback((message: string) => {
    toast.success(message);
  }, []);

  const handleInfo = useCallback((message: string) => {
    toast.info(message);
  }, []);

  const handleValidationErrors = useCallback(
    (error: unknown) => {
      const validationErrors = ErrorHandler.getValidationErrors(error);

      // Show first validation error as toast
      const firstError = Object.values(validationErrors)[0];
      if (firstError && showToast) {
        toast.error(firstError);
      }

      return validationErrors;
    },
    [showToast]
  );

  return {
    handleError,
    handleSuccess,
    handleInfo,
    handleValidationErrors,
    // Utility functions
    getErrorMessage: ErrorHandler.getErrorMessage,
    getErrorDetails: ErrorHandler.getErrorDetails,
    isApiError: ErrorHandler.isApiError,
    isUnauthorized: ErrorHandler.isUnauthorized,
    isForbidden: ErrorHandler.isForbidden,
    isNotFound: ErrorHandler.isNotFound,
    isValidationError: ErrorHandler.isValidationError,
  };
}
