import React from "react";
import "./App.css";
import ReactDOM from "react-dom/client";
import HomepagePage from "./app/homepage/page";
import LoginPage from "./app/login/page";
import DashboardPage from "./app/dashboard/page";

const root = ReactDOM.createRoot(document.getElementById("root"));

const pathname = window.location.pathname;
const isLoginPage = pathname === "/login";
const isDashboardPage = pathname === "/dashboard";

root.render(
  <React.StrictMode>
    {isLoginPage ? (
      <LoginPage />
    ) : isDashboardPage ? (
      <DashboardPage view="dashboard" />
    ) : (
      <HomepagePage />
    )}
  </React.StrictMode>
);
