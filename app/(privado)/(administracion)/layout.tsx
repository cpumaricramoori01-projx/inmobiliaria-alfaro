import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isAdministrator, homeForUser } from "@/lib/access.mjs";

export default async function AdministrationLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect("/login");
  if (!isAdministrator(user)) redirect(homeForUser(user));
  return children;
}
