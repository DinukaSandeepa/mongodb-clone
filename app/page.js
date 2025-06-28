import { Database, Copy } from 'lucide-react';
import JobForm from '@/components/JobForm';
import JobList from '@/components/JobList';
import { getCloneJobs } from '@/app/actions/clone-job-actions';

export default async function Home() {
  const jobs = await getCloneJobs();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Database className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">MongoDB Clone Manager</h1>
              <p className="text-sm text-muted-foreground">
                Efficiently clone databases with real-time streaming
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Job Creation Form */}
          <div>
            <JobForm />
          </div>

          {/* Right Column - Job List */}
          <div>
            <JobList jobs={jobs} />
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-lg border shadow-sm">
            <div className="p-2 bg-blue-100 rounded-lg w-fit mb-4">
              <Copy className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2">Efficient Streaming</h3>
            <p className="text-sm text-muted-foreground">
              Stream large datasets efficiently with batched operations for optimal performance.
            </p>
          </div>
          
          <div className="p-6 bg-white rounded-lg border shadow-sm">
            <div className="p-2 bg-green-100 rounded-lg w-fit mb-4">
              <Database className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="font-semibold mb-2">Complete Collection Clone</h3>
            <p className="text-sm text-muted-foreground">
              Clone all collections from source to destination with automatic cleanup.
            </p>
          </div>
          
          <div className="p-6 bg-white rounded-lg border shadow-sm">
            <div className="p-2 bg-purple-100 rounded-lg w-fit mb-4">
              <Database className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="font-semibold mb-2">Secure Connections</h3>
            <p className="text-sm text-muted-foreground">
              Safely store and manage connection strings with password protection.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}