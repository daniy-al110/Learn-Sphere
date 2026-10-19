import UltraLoadingScreen from "@/components/ui/UltraLoadingScreen";

export default function LoginLoading() {
  return (
    <UltraLoadingScreen
      label="Initializing Single Sign-On Security..."
      sublabel="Preparing institutional credential validation engine"
      fullScreen={true}
    />
  );
}
