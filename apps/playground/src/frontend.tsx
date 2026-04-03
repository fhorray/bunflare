import { hydrateRoot } from "react-dom/client";
import React from "react";
import RootLayout from "./pages/_layout";
import OverviewPage from "./pages/index";
import DatabasePage from "./pages/database";
import StoragePage from "./pages/storage";
import CachePage from "./pages/cache";

const elem = document.getElementById("root")!;
const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';

const getPage = () => {
  switch (pathname) {
    case "/": return <OverviewPage />;
    case "/database": return <DatabasePage />;
    case "/storage": return <StoragePage />;
    case "/cache": return <CachePage />;
    default: return <OverviewPage />;
  }
};

const app = (
  <RootLayout>
    {getPage()}
  </RootLayout>
);

hydrateRoot(elem, app);
