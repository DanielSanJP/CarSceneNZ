import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { EditClubForm } from "@/components/clubs/edit-club-form";
import { uploadClubImage } from "@/lib/utils/image-upload";
import { createClient } from "@/lib/utils/supabase/server";
import { Club } from "@/types";

interface EditClubPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}

// Inline server functions from clubs.ts
async function getClubById(clubId: string): Promise<Club | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("clubs")
      .select(
        `
        *,
        users!clubs_leader_id_fkey (
          id,
          username,
          display_name,
          profile_image_url
        )
      `
      )
      .eq("id", clubId)
      .single();

    if (error || !data) {
      console.error("Error getting club by ID:", error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      banner_image_url: data.banner_image_url,
      club_type: data.club_type,
      location: data.location,
      leader_id: data.leader_id,
      total_likes: data.total_likes || 0,
      created_at: data.created_at,
      updated_at: data.updated_at,
      leader: {
        id: data.users.id,
        username: data.users.username,
        display_name: data.users.display_name || data.users.username,
        profile_image_url: data.users.profile_image_url,
      },
    };
  } catch (error) {
    console.error("Error getting club by ID:", error);
    return null;
  }
}

async function updateClub(clubData: {
  id: string;
  name: string;
  description: string;
  location: string;
  club_type: string;
  banner_image: string;
}): Promise<Club | null> {
  try {
    console.log("=== updateClub function called ===");
    console.log("Club data:", clubData);

    const supabase = await createClient();
    console.log("Supabase client created");

    // Update the club
    const { data: clubUpdateData, error: clubError } = await supabase
      .from("clubs")
      .update({
        name: clubData.name.trim(),
        description: clubData.description.trim(),
        location: clubData.location,
        club_type: clubData.club_type,
        banner_image_url: clubData.banner_image || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", clubData.id)
      .select()
      .single();

    console.log("Club update result:", {
      data: clubUpdateData,
      error: clubError,
    });

    if (clubError || !clubUpdateData) {
      console.error("Error updating club:", clubError);
      return null;
    }

    console.log("Club updated successfully, ID:", clubUpdateData.id);

    // Return the updated club with leader info
    console.log("Fetching complete updated club data...");
    const result = await getClubById(clubUpdateData.id);
    console.log(
      "Final updated club result:",
      result ? "Success" : "Failed to fetch"
    );
    return result;
  } catch (error) {
    console.error("=== updateClub function error ===", error);
    return null;
  }
}

async function uploadClubImageServerAction(formData: FormData) {
  "use server";

  try {
    const file = formData.get("file") as File;
    const clubId = formData.get("clubId") as string;
    const isTemp = formData.get("isTemp") === "true";

    if (!file || !clubId) {
      return { url: null, error: "Missing file or club ID" };
    }

    const url = await uploadClubImage(file, clubId, isTemp);
    return { url, error: null };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      url: null,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

async function updateClubServerAction(formData: FormData) {
  "use server";

  try {
    const clubId = formData.get("clubId") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const location = formData.get("location") as string;
    const club_type = formData.get("club_type") as string;
    const banner_image = formData.get("banner_image") as string;

    if (!clubId || !name || !description || !location || !club_type) {
      return { success: false, error: "Missing required fields" };
    }

    const result = await updateClub({
      id: clubId,
      name,
      description,
      location,
      club_type,
      banner_image: banner_image || "",
    });

    if (result) {
      // Revalidate all relevant paths to show updated data
      revalidatePath("/clubs/[id]", "page");
      revalidatePath(`/clubs/${clubId}`);
      revalidatePath("/clubs/my-clubs");
      revalidatePath("/clubs");
      revalidatePath("/leaderboards"); // Revalidate leaderboards page
      revalidatePath("/leaderboards", "page"); // Revalidate leaderboards dynamic route
      revalidatePath("/api/leaderboards"); // Revalidate leaderboards API route

      // Revalidate cache tags used by leaderboards API
      revalidateTag("leaderboards");
      revalidateTag("clubs");
      revalidateTag(`club-${clubId}`);

      // Revalidate user-specific club cache for profile pages
      revalidateTag(`user-${result.leader_id}-clubs`);
      revalidateTag("users"); // Invalidate all user profiles since club data changed

      // Revalidate all profile pages that might show this club
      revalidatePath("/profile/[id]", "page");
      revalidatePath(`/profile/${result.leader_id}`);

      return { success: true, error: null };
    } else {
      return { success: false, error: "Failed to update club" };
    }
  } catch (error) {
    console.error("Update club error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Update failed",
    };
  }
}

export default async function EditClubPage({
  params,
  searchParams,
}: EditClubPageProps) {
  const { id } = await params;
  const { from = "join" } = await searchParams;

  const [authUser, club] = await Promise.all([requireAuth(), getClubById(id)]);

  if (!club) {
    notFound();
  }

  // Check if user is the leader of the club
  if (club.leader_id !== authUser.id) {
    redirect(`/clubs/${id}`);
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold">Loading...</h1>
            </div>
          </div>
        </div>
      }
    >
      <EditClubForm
        club={club}
        fromTab={from}
        uploadAction={uploadClubImageServerAction}
        updateAction={updateClubServerAction}
      />
    </Suspense>
  );
}
