"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="hidden md:block">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
          className="pl-10 pr-20 w-64"
        />
        <Button
          type="submit"
          size="sm"
          variant="ghost"
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 px-3"
        >
          Search
        </Button>
      </div>
    </form>
  );
}

export function MobileSearchButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      setQuery("");
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setQuery("");
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="md:hidden"
      >
        <Search className="h-4 w-4" />
        <span className="sr-only">Search</span>
      </Button>

      {/* Mobile Search Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden w-screen h-screen">
          <div className="fixed inset-x-0 top-0 z-50 bg-background border-b w-full">
            <div className="flex h-16 items-center px-4 w-full">
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search..."
                    className="pl-10 pr-12 w-full"
                    autoFocus
                  />
                  <Button
                    type="submit"
                    size="sm"
                    variant="ghost"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  >
                    <Search className="h-4 w-4" />
                    <span className="sr-only">Search</span>
                  </Button>
                </div>
              </form>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="ml-2"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close search</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
