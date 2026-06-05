import { redirect } from "next/navigation";
import ConfirmDeviceForm from "./ConfirmDeviceForm";

export default async function ConfirmDevicePage({
  searchParams,
}: {
  searchParams: Promise<{ kudos_id?: string }>;
}) {
  const { kudos_id } = await searchParams;
  if (!kudos_id) redirect("/login");

  return <ConfirmDeviceForm kudosId={kudos_id} />;
}
