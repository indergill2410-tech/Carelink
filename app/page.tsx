import { Activity } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="bg-white p-12 rounded-3xl shadow-xl max-w-2xl w-full border border-gray-100 text-center space-y-6">
        <div className="w-16 h-16 bg-gradient-to-br from-teal to-mint rounded-2xl flex items-center justify-center mx-auto shadow-lg">
          <Activity className="text-white w-8 h-8" />
        </div>
        <h1 className="text-4xl font-bold text-navy tracking-tight">Carelink Enterprise</h1>
        <p className="text-gray-500 text-lg">
          Your production-grade Next.js, Tailwind, and Prisma architecture is ready.
        </p>

        <div className="bg-gray-50 rounded-xl p-6 text-left space-y-4 mt-8">
          <h3 className="font-semibold text-navy">Next Steps:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
            <li>Run <code className="bg-gray-200 px-1 rounded text-navy">npm install</code></li>
            <li>Run <code className="bg-gray-200 px-1 rounded text-navy">npx prisma db push</code> to sync your Render database.</li>
            <li>Run <code className="bg-gray-200 px-1 rounded text-navy">npm run dev</code> to start the server.</li>
          </ol>
        </div>
      </div>
    </main>
  );
}
