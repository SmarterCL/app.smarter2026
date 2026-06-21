import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import TenantWizard from "@/components/tenant-wizard";

export default async function NewTenantPage() {
  try {
    const { userId } = await auth();
    if (!userId) redirect("/");
  } catch (error) {
    redirect("/");
  }
  return (
    <div className="py-8 px-4">
      <TenantWizard />
    </div>
  );
}