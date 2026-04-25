import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { StatCards } from "@/components/dashboard/StatCards";
import { MissionCard } from "@/components/dashboard/MissionCard";
import { CoursesSection } from "@/components/dashboard/CoursesSection";
import { TasksAndAchievements } from "@/components/dashboard/TasksAndAchievements";
import { AdminPanel } from "@/components/dashboard/AdminPanel";
import { ProgressPath } from "@/components/dashboard/ProgressPath";
import { AdvisorButton } from "@/components/dashboard/AdvisorButton";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-app">
      <div className="max-w-[1600px] mx-auto p-4 md:p-6 flex gap-6">
        <Sidebar />

        <main className="flex-1 min-w-0 grid xl:grid-cols-[minmax(0,1fr)_minmax(0,520px)] gap-6">
          {/* Left column: user dashboard */}
          <div className="space-y-5 min-w-0">
            <TopBar />
            <StatCards />
            <MissionCard />
            <CoursesSection />
            <TasksAndAchievements />
          </div>

          {/* Right column: admin panel */}
          <div className="min-w-0">
            <div className="xl:sticky xl:top-6">
              <AdminPanel />
            </div>
          </div>

          {/* Full width bottom: 90-day path */}
          <div className="xl:col-span-2">
            <ProgressPath />
          </div>
        </main>
      </div>

      <AdvisorButton />
    </div>
  );
}
