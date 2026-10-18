import { getMe } from "@/lib/api";
import { Shell } from "./Shell";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const me = await getMe();
  return <Shell me={me}>{children}</Shell>;
}
