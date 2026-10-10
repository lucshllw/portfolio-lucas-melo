import Home from "@/components/home/Home";
import { getProjects } from "@/lib/content-server";
export default async function Page() {
  return <Home projects={await getProjects()} />;
}
