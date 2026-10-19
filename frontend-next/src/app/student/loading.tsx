import UltraLoadingScreen from "@/components/ui/UltraLoadingScreen";

export default function StudentLoading() {
  return (
    <UltraLoadingScreen
      label="Loading Student Learning Hub..."
      sublabel="Retrieving enrolled courses, attendance records & GPA ledger"
      fullScreen={false}
    />
  );
}
