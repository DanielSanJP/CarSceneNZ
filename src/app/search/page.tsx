import { SearchClient } from "@/components/search/search-client";

// Force this page to be dynamic - don't try to fetch data at build time
export const dynamic = "force-dynamic";

async function getSearchData() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/search-data`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Cache for 5 minutes for better performance
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      console.error(
        `❌ Search data API failed: ${response.status} ${response.statusText}`
      );
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch search data:", error);
    return null;
  }
}

export default async function SearchPage() {
  const searchData = await getSearchData();

  return <SearchClient initialData={searchData} />;
}
