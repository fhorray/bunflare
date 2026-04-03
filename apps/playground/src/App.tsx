import { useState } from "react";
import { Layout } from "./components/Layout";
import { OverviewView } from "./components/views/OverviewView";
import { DatabaseView } from "./components/views/DatabaseView";
import { StorageView } from "./components/views/StorageView";
import { CacheView } from "./components/views/CacheView";
import "./index.css";

type Tab = "overview" | "database" | "storage" | "cache";

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
