import { useState } from "react";
import { Layout } from "./components/Layout";
import { OverviewView } from "./components/views/OverviewView";
import { DatabaseView } from "./components/views/DatabaseView";
import { StorageView } from "./components/views/StorageView";
import { CacheView } from "./components/views/CacheView";
import { EdgeView } from "./components/views/EdgeView";
import { RoutingView } from "./components/views/RoutingView";
import { RealtimeView } from "./components/views/RealtimeView";
import { PersistenceView } from "./components/views/PersistenceView";
import { AutomationView } from "./components/views/AutomationView";
import { ContainerView } from "./components/views/ContainerView";
import { SeoView } from "./components/views/SeoView";
import { QueueView } from "./components/views/QueueView";
import { CronView } from "./components/views/CronView";
import { BrowserView } from "./components/views/BrowserView";
import "./index.css";

export type Tab = 
  | "overview" 
  | "database" 
  | "storage" 
  | "cache" 
  | "routing" 
  | "realtime" 
  | "persistence" 
  | "automation" 
  | "containers" 
  | "seo"
  | "queues"
  | "crons"
  | "browser"
  | "edge";

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewView />;
      case "database":
        return <DatabaseView />;
      case "storage":
        return <StorageView />;
      case "cache":
        return <CacheView />;
      case "routing":
        return <RoutingView />;
      case "realtime":
        return <RealtimeView />;
      case "persistence":
        return <PersistenceView />;
      case "automation":
        return <AutomationView />;
      case "containers":
        return <ContainerView />;
      case "seo":
        return <SeoView />;
      case "queues":
        return <QueueView />;
      case "crons":
        return <CronView />;
      case "browser":
        return <BrowserView />;
      case "edge":
        return <EdgeView />;
      default:
        return <OverviewView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#030711]">
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        <div className="animate-in fade-in duration-500">
          {renderContent()}
        </div>
      </Layout>
    </div>
  );
}

export default App;
