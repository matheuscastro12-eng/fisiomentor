import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MetricCards } from "./components/metric-cards";
import { StudentList } from "./components/student-list";
import { SearchAndActions } from "./components/search-and-actions";
import { RecentActivity } from "./components/recent-activity";

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();

  // Fetch current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch professional profile
  const { data: professional } = await supabase
    .from("professionals")
    .select("*")
    .eq("auth_user_id", user?.id ?? "")
    .single();

  const profId = professional?.id ?? "";

  // Fetch students
  const { data: students } = await supabase
    .from("students")
    .select("*, health_profiles(*), training_preferences(*)")
    .eq("professional_id", profId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  // Fetch plan count this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: plansThisMonth } = await supabase
    .from("training_plans")
    .select("*", { count: "exact", head: true })
    .eq("professional_id", profId)
    .gte("generated_at", startOfMonth.toISOString());

  // Count students with pending re-evaluation (no plan in last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: recentPlans } = await supabase
    .from("training_plans")
    .select("student_id")
    .eq("professional_id", profId)
    .gte("generated_at", thirtyDaysAgo.toISOString());

  const studentsWithRecentPlans = new Set(
    recentPlans?.map((p) => p.student_id) ?? []
  );
  const pendingReeval =
    students?.filter((s) => !studentsWithRecentPlans.has(s.id)).length ?? 0;

  // Fetch recent training sessions (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: recentSessions } = await supabase
    .from("training_sessions")
    .select("id, student_id, session_date, perceived_effort, exercises_done")
    .gte("session_date", sevenDaysAgo.toISOString())
    .order("session_date", { ascending: false })
    .limit(5);

  // Map student names to sessions
  const studentMap = new Map(
    (students ?? []).map((s) => [s.id, s.name])
  );

  const sessionsWithNames = (recentSessions ?? []).map((s) => ({
    ...s,
    studentName: studentMap.get(s.student_id) ?? "Aluno",
  }));

  // Fetch recently generated plans
  const { data: latestPlans } = await supabase
    .from("training_plans")
    .select("id, student_id, status, plan_summary, generated_at")
    .eq("professional_id", profId)
    .order("generated_at", { ascending: false })
    .limit(5);

  const plansWithNames = (latestPlans ?? []).map((p) => ({
    ...p,
    studentName: studentMap.get(p.student_id) ?? "Aluno",
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <MetricCards
        totalStudents={students?.length ?? 0}
        plansGenerated={plansThisMonth ?? 0}
        pendingReevals={pendingReeval}
      />
      <SearchAndActions />

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <StudentList students={students ?? []} />
        <RecentActivity
          sessions={sessionsWithNames}
          plans={plansWithNames}
        />
      </div>
    </div>
  );
}
