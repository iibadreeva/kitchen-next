import { resolveRouteErrorMessage } from "@/utils/route-error";

type ErrorPageProps = {
  searchParams: Promise<{ code?: string | string[] }>;
};

export default async function ErrorPage({ searchParams }: ErrorPageProps) {
  const params = await searchParams;
  const message = resolveRouteErrorMessage(params.code);

  return <p>{message}</p>;
}
