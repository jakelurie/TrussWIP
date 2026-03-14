import type { Metadata } from "next";
import ThreadPage from "./ThreadPage";
import { createClient } from "@supabase/supabase-js";

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { data: post } = await supabaseServer
    .from("forum_posts")
    .select("title, body, forum_categories(name)")
    .eq("id", id)
    .single();

  const title = post?.title || "Discussion";
  const desc = post?.body?.slice(0, 160) || "Community discussion on Truss.";
  const catName = (post?.forum_categories as any)?.name || "Forum";

  return {
    title: `${title} | Truss Forum`,
    description: desc,
    openGraph: {
      title: `${title} | Truss Forum`,
      description: desc,
      type: "article",
      url: `https://trusswork.org/forum/post/${id}`,
    },
  };
}

export default async function ThreadPageWrapper({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ThreadPage postId={id} />;
}
