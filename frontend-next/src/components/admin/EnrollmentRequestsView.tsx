"use client";

import { useAsync } from "@/hooks/useAsync";
import { approveEnrollmentRequest, fetchEnrollmentRequests, rejectEnrollmentRequest } from "@/lib/admin/api";
import { confirmDialog, toast } from "@/lib/toast-store";

const none = null;

export default function EnrollmentRequestsView() {
  const { data, error, loading, reload } = useAsync(fetchEnrollmentRequests, none);
  if (error) console.error("Failed to load enrollment requests:", error);

  async function approve(requestId: number) {
    const ok = await confirmDialog.confirm({ title: "Approve Request", message: "Approve this enrollment request?", type: "info" });
    if (!ok) return;
    try {
      const res = await approveEnrollmentRequest(requestId);
      if (res.success) {
        // generated credentials are intentionally not shown
        toast.success(`Enrollment approved!\nStudent email: ${res.studentEmail}`);
        reload();
      } else {
        toast.error("Error: " + (res.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error approving enrollment:", err);
      toast.error("Failed to approve enrollment");
    }
  }

  async function reject(requestId: number) {
    const ok = await confirmDialog.confirm({ title: "Reject Request", message: "Reject this enrollment request?", type: "warning" });
    if (!ok) return;
    try {
      const res = await rejectEnrollmentRequest(requestId);
      if (res.success) {
        toast.info("Enrollment request rejected");
        reload();
      } else {
        toast.error("Error: " + (res.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error rejecting enrollment:", err);
      toast.error("Failed to reject enrollment");
    }
  }

  let body: React.ReactNode;
  if (loading) body = <p className="text-gray-500">Loading requests...</p>;
  else if (error) body = <p className="text-red-600">Failed to load requests</p>;
  else if (!data || data.length === 0) body = <p className="text-gray-500">No pending enrollment requests</p>;
  else
    body = data.map((req) => (
      <div key={req.request_id} className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Student Name</p>
            <p className="font-semibold text-gray-900">{req.student_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Challan #</p>
            <p className="font-mono text-sm font-semibold">{req.challan_number}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Course</p>
            <p className="font-semibold text-gray-900">{req.course_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Amount</p>
            <p className="font-semibold text-accent">PKR {req.fee_amount}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-semibold text-gray-900">{req.student_email}</p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={() => approve(req.request_id)} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition cursor-pointer">
            ✓ Approve
          </button>
          <button onClick={() => reject(req.request_id)} className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition cursor-pointer">
            ✗ Reject
          </button>
        </div>
      </div>
    ));

  return (
    <div id="enrollmentRequests">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Pending Enrollment Requests</h1>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div id="enrollmentRequestsList" className="space-y-4">{body}</div>
      </div>
    </div>
  );
}
