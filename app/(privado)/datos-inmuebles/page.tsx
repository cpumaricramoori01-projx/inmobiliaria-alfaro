import PropertyInformation from "@/app/components/PropertyInformation";

export default async function Page({ searchParams }: { searchParams: Promise<{ codigo?: string | string[]; pestana?: string | string[] }> }) {
  const { codigo, pestana } = await searchParams;
  return <PropertyInformation initialCode={typeof codigo === "string" ? codigo : ""} initialTab={pestana === "fotos" ? "Fotos" : "Resumen"} />;
}
