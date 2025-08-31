export default function ErrorPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
      <p className="text-gray-600 mb-4">
        There was an error with your authentication.
      </p>
      <a href="/login" className="text-blue-600 hover:underline">
        Try logging in again
      </a>
    </div>
  );
}
