import React from "react";
import "./App.css";
import ReactDOM from "react-dom/client";
import HomepagePage from "./app/homepage/page";
import LoginPage from "./app/login/page";
import DashboardPage from "./app/dashboard/page";
import DashboardSectionsPage from "./app/dashboard/sections/page";
import DashboardSubjectsPage from "./app/dashboard/subjects/page";
import DashboardFacultyPage from "./app/dashboard/faculty/page";
import DashboardScheduleMakerPage from "./app/dashboard/schedule-maker/page";

const root = ReactDOM.createRoot(document.getElementById("root"));

const pathname = window.location.pathname;
const isLoginPage = pathname === "/login";
const isDashboardPage = pathname === "/dashboard";
const isDashboardSectionsPage = pathname === "/dashboard/sections";
const isDashboardSubjectsPage = pathname === "/dashboard/subjects";
const isDashboardFacultyPage = pathname === "/dashboard/faculty";
const isDashboardScheduleMakerPage = pathname === "/dashboard/schedule-maker";

root.render(
  <React.StrictMode>
    {isLoginPage ? (
      <LoginPage />
    ) : isDashboardSectionsPage ? (
      <DashboardSectionsPage />
    ) : isDashboardSubjectsPage ? (
      <DashboardSubjectsPage />
    ) : isDashboardFacultyPage ? (
      <DashboardFacultyPage />
    ) : isDashboardScheduleMakerPage ? (
      <DashboardScheduleMakerPage />
    ) : isDashboardPage ? (
      <DashboardPage view="dashboard" />
    ) : (
      <HomepagePage />
    )}
  </React.StrictMode>
);
