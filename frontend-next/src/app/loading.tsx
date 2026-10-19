import UltraLoadingScreen from "@/components/ui/UltraLoadingScreen";

export default function Loading() {
  return (
    <UltraLoadingScreen
      label="Loading Campus Portal..."
      sublabel="Synchronizing state with cloud PostgreSQL ledger"
      fullScreen={true}
    />
  );
}
