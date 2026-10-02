import PropertyInformation from "@/app/components/PropertyInformation";

export default async function Page({ searchParams }: { searchParams: Promise<{ codigo?: string | string[] }> }) {
  const { codigo } = await searchParams;
  return <PropertyInformation initialCode={typeof codigo === "string" ? codigo : ""} />;
}
