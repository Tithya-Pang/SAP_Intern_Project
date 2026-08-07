import { Alert, Button, Empty, Spin } from "antd";
export function DataState({
  loading,
  error,
  empty,
  onRetry,
}: {
  loading: boolean;
  error?: string;
  empty?: boolean;
  onRetry?: () => void;
}) {
  if (loading)
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );
  if (error)
    return (
      <Alert
        type="error"
        showIcon
        message="Unable to load data"
        description={error}
        action={onRetry ? <Button onClick={onRetry}>Retry</Button> : undefined}
      />
    );
  if (empty) return <Empty description="No records found" />;
  return null;
}
