import type { Route } from "./+types/home";
import { YieldMind } from "../components/yield-mind";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "YieldMind — LI.FI Earn" },
    {
      name: "description",
      content:
        "Natural language yield agent powered by LI.FI Earn and OpenRouter.",
    },
  ];
}

export default function Home() {
  return <YieldMind />;
}
