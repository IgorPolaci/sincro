"use client";
import { ErrorRetry } from "@/components/shared/error-retry";
export default function DashboardError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ErrorRetry error={error} retry={retry} compact />;
}
