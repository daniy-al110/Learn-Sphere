import UltraLoadingScreen from "@/components/ui/UltraLoadingScreen";

export default function AdminLoading() {
  return (
    <UltraLoadingScreen
      label="Loading Administrator Mission Control..."
      sublabel="Connecting to Supabase PostgreSQL cluster & audit logs"
      fullScreen={false}
    />
  );
}
