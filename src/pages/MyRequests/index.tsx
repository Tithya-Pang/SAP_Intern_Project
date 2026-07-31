import { PlusOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Modal, Space, Typography, message } from "antd";
import { history } from "@umijs/max";
import { useCreditData } from "@/hooks/useCreditData";
import { useApp } from "@/context/AppContext";
import { RequestTable } from "@/components/RequestTable";
import { canEditRequest } from "@/utils/permissions";
import { temporaryCreditService } from "@/services/temporaryCreditService";
export default function MyRequests() {
  const { currentUser, refresh } = useApp();
  const { requests, customers, loading, error } = useCreditData();
  const cancel = (id: string) =>
    Modal.confirm({
      title: "Cancel this request?",
      content: "Cancellation is recorded in the immutable audit history.",
      okText: "Cancel Request",
      okButtonProps: { danger: true },
      onOk: async () => {
        await temporaryCreditService.cancel(
          id,
          currentUser!,
          "Cancelled by requester.",
        );
        refresh();
        message.success("Request cancelled.");
      },
    });
  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <Typography.Title level={2} className="pageTitle">
            My Requests
          </Typography.Title>
          <div className="pageSubtitle">
            Create drafts and respond to information requests.
          </div>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => history.push("/requests/new")}
        >
          New Request
        </Button>
      </div>
      {error && <Alert type="error" showIcon message={error} />}
      <Card className="surface">
        <RequestTable
          requests={requests}
          customers={customers}
          loading={loading}
          action={(request) => (
            <Space>
              <Button
                onClick={() =>
                  history.push(
                    currentUser && canEditRequest(currentUser.role, request)
                      ? `/requests/${request.id}/edit`
                      : `/pending-approval/${request.id}`,
                  )
                }
              >
                {currentUser && canEditRequest(currentUser.role, request)
                  ? "Edit"
                  : "View"}
              </Button>
              {currentUser && canEditRequest(currentUser.role, request) && (
                <Button danger onClick={() => cancel(request.id)}>
                  Cancel
                </Button>
              )}
            </Space>
          )}
        />
      </Card>
    </div>
  );
}
