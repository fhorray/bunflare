import { useState } from "react";
import { Layout } from "./components/Layout";
import { OverviewView } from "./components/views/OverviewView";
import { DatabaseView } from "./components/views/DatabaseView";
import { StorageView } from "./components/views/StorageView";
import { CacheView } from "./components/views/CacheView";
import { RoutingView } from "./components/views/RoutingView";
import { RealtimeView } from "./components/views/RealtimeView";
import { PersistenceView } from "./components/views/PersistenceView";
import { AutomationView } from "./components/views/AutomationView";
import { ContainerView } from "./components/views/ContainerView";
import "./index.css";

export type Tab = "overview" | "database" | "storage" | "cache" | "routing" | "realtime" | "persistence" | "automation" | "compute";

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
      case "compute":
        return <ContainerView />;
      default:
        return <OverviewView />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}

export default App;
