import { notFound } from "next/navigation";
import { CustomerSetup } from "@/components/agent/CustomerSetup";

export default function CustomerSetupPage({ params }: { params: { selection: string } }) {
  const match = /^(auto|build)-(\d+)$/.exec(params.selection);
  if (!match || Number(match[2]) < 2) notFound();
  return <CustomerSetup kind={match[1] as "auto" | "build"} id={Number(match[2])} />;
}
