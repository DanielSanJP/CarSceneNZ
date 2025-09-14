import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    console.log(`🚀 FETCH CACHE: Fetching user auth data via API route...`);

    // Get environment variables for direct Supabase fetch
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Missing Supabase environment variables");
      throw new Error("Server configuration error");
    }

    // Get the Authorization header from the request
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(null, { status: 401 });
    }

    // Fetch user auth data using native fetch for caching
    const userResponse = await fetch(
      `${supabaseUrl}/auth/v1/user`,
      {
        method: "GET",
        headers: {
          "Authorization": authHeader,
          "apikey": supabaseKey,
        },
        // Enable Next.js caching with shorter revalidation for auth data
        next: {
          revalidate: 60, // 1 minute for auth data
          tags: ["auth", "user"],
        },
      }
    );

    if (!userResponse.ok) {
      console.log(`❌ Auth user fetch failed: ${userResponse.status}`);
      return NextResponse.json(null, { status: 401 });
    }

    const authUser = await userResponse.json();

    if (!authUser) {
      return NextResponse.json(null, { status: 401 });
    }

    // Fetch profile data using native fetch for caching
    const profileResponse = await fetch(
      `${supabaseUrl}/rest/v1/users?id=eq.${authUser.id}&select=id,username,display_name,profile_image_url,created_at,updated_at`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Accept": "application/vnd.pgrst.object+json", // Get single object instead of array
        },
        // Enable Next.js caching
        next: {
          revalidate: 60, // 1 minute for profile data
          tags: ["auth", "user", `user-${authUser.id}`],
        },
      }
    );

    if (!profileResponse.ok) {
      console.error(`❌ Profile fetch failed: ${profileResponse.status}`);
      return NextResponse.json(null, { status: 500 });
    }

    const profile = await profileResponse.json();

    if (!profile) {
      return NextResponse.json(null, { status: 404 });
    }

    const userData = {
      id: profile.id,
      username: profile.username,
      display_name: profile.display_name,
      email: authUser.email || '',
      profile_image_url: profile.profile_image_url,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };

    const endTime = Date.now();
    console.log(
      `✅ FETCH CACHE: User auth data fetched and processed in ${
        endTime - startTime
      }ms`
    );

    return NextResponse.json(userData);
  } catch (error) {
    console.error("❌ Error fetching user auth data:", error);
    return NextResponse.json(null, { status: 500 });
  }
}