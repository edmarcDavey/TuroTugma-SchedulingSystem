import React from "react";
import "./App.css";
import ReactDOM from "react-dom/client";
import HomepagePage from "./app/homepage/page";
import LoginPage from "./app/login/page";
import DashboardPage from "./app/dashboard/page";
import PublicDashboard from "./app/homepage/components/PublicDashboard";

const root = ReactDOM.createRoot(document.getElementById("root"));

const pathname = window.location.pathname;
const isLoginPage = pathname === "/login";
const isDashboardPage = pathname === "/dashboard";
const isPublicDashboardPage = pathname === "/public-dashboard";

root.render(
  <React.StrictMode>
    {isLoginPage ? (
      <LoginPage />
    ) : isDashboardPage ? (
      <DashboardPage view="dashboard" />
    ) : isPublicDashboardPage ? (
      <PublicDashboard />
    ) : (
      <HomepagePage />
    )}
  </React.StrictMode>
);
