import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/recommended-tools")({
  component: () => <Outlet />,
});
