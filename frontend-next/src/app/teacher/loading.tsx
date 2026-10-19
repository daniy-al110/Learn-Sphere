import UltraLoadingScreen from "@/components/ui/UltraLoadingScreen";

export default function TeacherLoading() {
  return (
    <UltraLoadingScreen
      label="Loading Faculty Studio..."
      sublabel="Synchronizing active teaching sections, attendance roster & quiz submissions"
      fullScreen={false}
    />
  );
}
