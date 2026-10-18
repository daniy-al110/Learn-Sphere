"use client";

import { useState } from "react";
import { Icon } from "@/components/layout/icons";
import { useAsync } from "@/hooks/useAsync";
import { useSession } from "@/hooks/useSession";
import { fetchFeeChallans } from "@/lib/student/api";
import { challanPrintHtml, formatPKR } from "@/lib/student/helpers";
import type { FeeChallan } from "@/lib/student/types";
import { toast } from "@/lib/toast-store";
import { PaymentModal } from "./PaymentModal";

function printChallan(challan: FeeChallan) {
  const win = window.open("", "_blank");
  if (!win) return toast.error("Pop-up blocked. Please allow pop-ups to print the challan.");
  win.document.write(challanPrintHtml(challan));
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 250);
}

const CARD = "bg-white rounded-xl shadow-md border border-gray-100 p-6";

export default function FeeChallansView() {
  const { session } = useSession();
  const studentId = session.userId ?? "";
  const { data, error, loading, reload } = useAsync(fetchFeeChallans, studentId);
  const [selectedChallan, setSelectedChallan] = useState<FeeChallan | null>(null);

  let body: React.ReactNode;
  if (loading) body = <div className={`${CARD} text-gray-500`}>Loading challans...</div>;
  else if (error) body = <div className={`${CARD} text-red-600`}>{error.message}</div>;
  else if (!data || data.length === 0)
    body = <div className={`lg:col-span-2 ${CARD} p-8 text-center text-gray-500`}>No fee challans have been issued yet.</div>;
  else
    body = data.map((challan) => (
      <div key={challan.challan_number} className={`${CARD} hover:shadow-lg transition-shadow flex flex-col`}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Challan ID</p>
            <h3 className="text-lg font-bold text-gray-900">{challan.challan_number}</h3>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${challan.status === "Paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
            {challan.status}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <Field label="Semester" value={challan.semester || "Current Semester"} />
          <Field label="Due Date" value={challan.due_date || "-"} />
          <Field label="Credit Hours" value={challan.total_credit_hours ?? "-"} />
          <Field label="Fee / CH" value={formatPKR(challan.fee_per_credit_hour || 8000)} />
        </div>
        <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 mb-4 flex-1">
          {(challan.courses || []).length ? (
            (challan.courses || []).map((course, i) => (
              <div key={i} className="flex justify-between gap-4 py-2 border-b border-gray-100 last:border-b-0">
                <span className="text-sm text-gray-700">{course.course_name || "Course"}</span>
                <span className="text-sm font-semibold text-gray-900">{course.credit_hours ?? "-"} CH</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">Course details unavailable.</p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-auto">
          <div>
            <p className="text-gray-500 text-sm font-medium">Total Payable</p>
            <p className="text-2xl font-bold text-accent">{formatPKR(challan.total_amount || challan.amount)}</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {challan.status !== 'Paid' && (
              <button
                onClick={() => setSelectedChallan(challan)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-800 transition shadow-sm cursor-pointer"
              >
                <Icon name="credit-card" className="w-4 h-4" /> Pay Now
              </button>
            )}
            <button
              onClick={() => printChallan(challan)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 text-white px-4 py-2 rounded-lg font-semibold hover:bg-accent-hover transition shadow-sm cursor-pointer"
              style={{ backgroundColor: "#e94560" }}
            >
              <Icon name="printer" className="w-4 h-4" /> Print
            </button>
          </div>
        </div>
      </div>
    ));

  return (
    <div className="p-8 max-w-6xl mx-auto" id="fee-challans">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-1">Fee Challans</h2>
          <p className="text-gray-600">View and pay your semester fee challans online.</p>
        </div>
        <button
          onClick={reload}
          className="inline-flex items-center gap-2 text-white px-4 py-2 rounded-lg font-semibold hover:bg-accent-hover transition shadow-sm cursor-pointer"
          style={{ backgroundColor: "#e94560", width: "auto" }}
        >
          <Icon name="refresh-cw" className="w-4 h-4" /> Refresh
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{body}</div>

      {selectedChallan && (
        <PaymentModal 
          challan={selectedChallan} 
          onClose={() => setSelectedChallan(null)} 
          onSuccess={() => {
            setSelectedChallan(null);
            reload();
          }} 
        />
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-gray-500 font-medium">{label}</p>
      <p className="font-semibold text-gray-900">{value}</p>
    </div>
  );
}
