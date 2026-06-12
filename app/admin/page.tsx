import { Redirect } from "expo-router";

export default function LegacyAdminPage() {
  return <Redirect href={"/admin" as any} />;
}
