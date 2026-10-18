import { redirect } from "next/navigation";

// The old static server served login.html at "/".
export default function Home() {
  redirect("/login");
}
