import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "../../../../lib/supabase/server";
import { getSupabaseAdminClient } from "../../../../lib/supabase/admin";
import { getActivePlan } from "../../../../lib/team.server";

const projectSchema = z.object({ name: z.string().trim().min(1).max(100), description: z.string().trim().max(500).optional().default(""), workspace_id: z.string().uuid().optional().nullable() });

export async function GET() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { data, error } = await supabase.from("projects").select("id,user_id,name,description,workspace_id,created_at,updated_at,project_files(id,file_name,mime_type,size_bytes,created_at)").order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Could not load projects." }, { status: 500 });
  return NextResponse.json({ projects: data.map((project) => ({ ...project, can_edit: project.user_id === user.id, user_id: undefined })) });
}

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const parsed = projectSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a project name up to 100 characters." }, { status: 400 });
  let workspaceId = parsed.data.workspace_id || null;
  if (workspaceId) {
    const admin = getSupabaseAdminClient();
    if (!admin) return NextResponse.json({ error: "Team project permissions are not configured." }, { status: 503 });
    const [{ data: membership }, { data: workspace }] = await Promise.all([
      admin.from("team_members").select("workspace_id").eq("workspace_id", workspaceId).eq("user_id", user.id).maybeSingle(),
      admin.from("team_workspaces").select("owner_user_id").eq("id", workspaceId).maybeSingle()
    ]);
    if (!membership || !workspace) return NextResponse.json({ error: "You do not have access to that workspace." }, { status: 403 });
    const ownerPlan = await getActivePlan(admin, workspace.owner_user_id);
    if (Number(ownerPlan.team_members) < 2) return NextResponse.json({ error: "The workspace owner needs an active Business plan to create shared projects." }, { status: 403 });
  }
  const { data, error } = await supabase.from("projects").insert({ name: parsed.data.name, description: parsed.data.description, workspace_id: workspaceId, user_id: user.id }).select("id,name,description,workspace_id,created_at,updated_at").single();
  if (error) return NextResponse.json({ error: "Could not create the project." }, { status: 500 });
  return NextResponse.json({ project: data }, { status: 201 });
}
