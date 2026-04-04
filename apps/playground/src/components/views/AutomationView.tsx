import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Activity,
  Play,
  RotateCcw,
  Zap,
  CheckCircle2,
  Clock,
  Activity as ActivityIcon,
  Brain,
  History,
} from 'lucide-react';

export interface WorkflowHistoryItem {
  id: string;
  status: 'running' | 'success' | 'failed';
  startTime: string;
  endTime?: string;
  steps: {
    title: string;
    status: 'completed' | 'failed' | 'pending';
    duration?: string;
  }[];
}

export function AutomationView() {
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [history, setHistory] = useState<WorkflowHistoryItem[]>([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/workflow/history');
      const data = await res.json() as { history: WorkflowHistoryItem[] };
      if (data.history) setHistory(data.history);
    } catch (e) {
      console.error("Failed to fetch workflow history:", e);
    }
  };

  // Trigger the actual workflow via backend API
  const triggerWorkflow = async () => {
    if (loading) return;

    setLoading(true);
    setWorkflowId(null);
    setCurrentStep(1);
    setStatus('Initializing edge engine...');

    try {
      const res = await fetch('/api/workflow/start', { method: 'POST' });
      const data = (await res.json()) as { id?: string };

      if (data.id) {
        setWorkflowId(data.id);
        
        const newRun: WorkflowHistoryItem = {
          id: data.id,
          status: 'running',
          startTime: new Date().toLocaleTimeString(),
          steps: [
            { title: 'Initialization', status: 'completed' },
            { title: 'Execution', status: 'pending' },
            { title: 'Durable Sleep', status: 'pending' },
            { title: 'Success', status: 'pending' },
          ]
        };
        setHistory(prev => [newRun, ...prev]);

        // Phase 1: Executing
        setTimeout(() => {
          setCurrentStep(2);
          setStatus('Step 1: Processing operational data...');
          setHistory(prev => prev.map(item => item.id === data.id ? {
            ...item,
            steps: item.steps.map((s, i) => i === 1 ? { ...s, status: 'completed' } : s)
          } : item));
        }, 1500);

        // Phase 2: Sleeping
        setTimeout(() => {
          setCurrentStep(3);
          setStatus('Step 2: Entering durable sleep (30s)...');
          setHistory(prev => prev.map(item => item.id === data.id ? {
            ...item,
            steps: item.steps.map((s, i) => i === 2 ? { ...s, status: 'completed' } : s)
          } : item));
        }, 3500);

        // Phase 3: Success
        setTimeout(() => {
          setCurrentStep(4);
          setStatus('Workflow instance completed successfully.');
          setLoading(false);
          setHistory(prev => prev.map(item => item.id === data.id ? {
            ...item,
            status: 'success',
            endTime: new Date().toLocaleTimeString(),
            steps: item.steps.map((s, i) => i === 3 ? { ...s, status: 'completed' } : s)
          } : item));
        }, 5500);
      } else {
        setStatus('Error: No instance ID returned.');
        setLoading(false);
        setCurrentStep(0);
      }
    } catch (e) {
      setStatus('Failed to trigger edge workflow');
      setLoading(false);
      setCurrentStep(0);
    }
  };

  const steps = [
    { title: 'Initialization', icon: Zap },
    { title: 'Execution', icon: Brain },
    { title: 'Durable Sleep', icon: Clock },
    { title: 'Success', icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-amber-600" />
            Cloudflare Workflows
            </h2>
            {history.length > 0 && (
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setHistory([])}
                    className="text-[10px] font-bold text-slate-400 hover:text-red-500 uppercase tracking-widest"
                >
                    Clear History
                </Button>
            )}
        </div>
        <p className="text-slate-500 text-sm">
          Build durable multi-step applications that automatically retry,
          persist state, and pause for events.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="py-0 lg:col-span-3 shadow-sm border-slate-200 bg-white relative overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-amber-600" />
                <div>
                  <CardTitle className="text-base font-bold">
                    Process Orchestration
                  </CardTitle>
                  <CardDescription className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Multi-step durability
                  </CardDescription>
                </div>
              </div>
              <div className="badge-premium">RELIABILITY</div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-10">
            <div className="flex flex-col gap-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-slate-900 tracking-tight uppercase">
                    Trigger Controls
                  </h3>
                  <p className="text-[10px] text-slate-500 tracking-widest font-mono">
                    INSTANCE_ID: {workflowId || 'NOT_STARTED'}
                  </p>
                </div>
                <Button
                  onClick={triggerWorkflow}
                  disabled={loading}
                  className="h-10 px-6 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-bold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
                >
                  {loading ? (
                    <RotateCcw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 fill-current" />
                  )}
                  {loading ? 'RUNNING...' : 'TRIGGER WORKFLOW'}
                </Button>
              </div>

              {/* Robust Stepper Implementation */}
              <div className="px-4 py-8 rounded-xl bg-slate-50 border border-slate-200 relative">
                {/* Global Progress Line */}
                <div className="absolute top-[56px] left-[60px] right-[60px] h-0.5 bg-slate-200 z-0">
                  <div
                    className="h-full bg-amber-500 transition-all duration-1000 ease-in-out"
                    style={{
                      width: `${currentStep > 0 ? ((currentStep - 1) / (steps.length - 1)) * 100 : 0}%`,
                    }}
                  />
                </div>

                <div className="flex justify-between relative z-10">
                  {steps.map((step, i) => {
                    const stepNum = i + 1;
                    const isActive = currentStep >= stepNum;
                    const isCurrent = currentStep === stepNum;

                    return (
                      <div
                        key={i}
                        className="flex flex-col items-center gap-4 w-32"
                      >
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                            isActive
                              ? 'bg-amber-600 border-amber-600 text-white shadow-sm'
                              : 'bg-white border-slate-200 text-slate-300'
                          }`}
                        >
                          <step.icon
                            className={`w-5 h-5 ${isCurrent ? 'animate-pulse' : ''}`}
                          />
                        </div>
                        <div className="text-center space-y-0.5">
                          <span
                            className={`text-[9px] font-black uppercase tracking-[0.2em] transition-colors ${isActive ? 'text-amber-600' : 'text-slate-400'}`}
                          >
                            STEP {stepNum}
                          </span>
                          <h4
                            className={`text-[10px] font-bold tracking-tight transition-colors ${isActive ? 'text-slate-900' : 'text-slate-400'}`}
                          >
                            {step.title}
                          </h4>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-5 rounded-lg border border-slate-200 min-h-[80px] flex items-center justify-center bg-white shadow-inner">
                <div className="flex items-center gap-3">
                  <ActivityIcon
                    className={`w-4 h-4 transition-all text-amber-500 ${loading ? 'animate-pulse opacity-100' : 'opacity-20'}`}
                  />
                  <p
                    className={`font-mono text-sm tracking-tight transition-all duration-300 ${loading ? 'text-slate-900' : 'text-slate-300'}`}
                  >
                    {status || '> Awaiting trigger...'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Column */}
        <div className="flex flex-col gap-6">
          <Card className="py-0 shadow-sm border-slate-200 bg-white p-6 flex flex-col justify-between group">
            <div className="space-y-3">
              <History className="w-6 h-6 text-slate-300 group-hover:text-amber-600 transition-colors" />
              <h3 className="text-base font-bold text-slate-900 tracking-tight leading-tight">
                Instance History
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Workflows are durable across worker restarts. State is
                automatically checkpointed.
              </p>
            </div>
          </Card>

          <Card className="py-0 shadow-sm border-slate-200 bg-white p-6 flex flex-col justify-between group">
            <div className="space-y-3">
              <RotateCcw className="w-6 h-6 text-slate-300 group-hover:text-amber-600 transition-colors" />
              <h3 className="text-base font-bold text-slate-900 tracking-tight leading-tight">
                Fast Retries
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                If a step fails, it will be retried with exponential backoff by
                the edge engine.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* History Section */}
      <Card className="py-0 shadow-sm border-slate-200 bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold">Recent Executions</CardTitle>
            <CardDescription className="text-xs text-slate-500">History of durability and orchestration</CardDescription>
          </div>
          <div className="text-[9px] font-black uppercase text-slate-400 tracking-widest border border-slate-200 px-2 py-0.5 rounded-full">
            {history.length} ITEMS
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {history.length === 0 ? (
            <div className="p-12 text-center text-slate-300">
               <History className="w-12 h-12 mx-auto opacity-10 mb-2" />
               <p className="text-xs font-bold uppercase tracking-widest">No execution history found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {history.map((run) => (
                <div key={run.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-slate-400">#{run.id}</span>
                        <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                          run.status === 'success' ? 'bg-emerald-100 text-emerald-700' :
                          run.status === 'running' ? 'bg-amber-100 text-amber-700 animate-pulse' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {run.status}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> Started: {run.startTime}</span>
                        {run.endTime && <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> Completed: {run.endTime}</span>}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 bg-white p-2 rounded-lg border border-slate-100">
                       {run.steps.map((step, i) => (
                         <div key={i} className="flex items-center">
                            <div className={`h-1.5 w-1.5 rounded-full ${
                               step.status === 'completed' ? 'bg-amber-500' :
                               step.status === 'failed' ? 'bg-red-500' : 'bg-slate-200'
                            }`} title={step.title} />
                            {i < run.steps.length - 1 && <div className="w-4 h-[1px] bg-slate-100" />}
                         </div>
                       ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
