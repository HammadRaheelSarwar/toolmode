"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { getSupabaseBrowserClient } from "../lib/supabase/client";
export function AdminSignOut(){const [busy,setBusy]=useState(false);const router=useRouter();async function signOut(){setBusy(true);const supabase=getSupabaseBrowserClient();if(supabase)await supabase.auth.signOut();document.cookie="toolmodeon_remember=; Path=/; Max-Age=0; SameSite=Lax";router.replace("/");router.refresh();}return <button onClick={()=>void signOut()} disabled={busy} className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold text-muted hover:bg-pale hover:text-ink disabled:opacity-50"><LogOut size={15}/>{busy?"Signing out…":"Admin sign out"}</button>}
