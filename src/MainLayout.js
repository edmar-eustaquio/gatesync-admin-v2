import React, { useState } from "react";
import Dashboard from "./Dashboard";

const MainLayout = () => {
  const [activePage, setActivePage] = useState("students"); // Manage state here

  return <Dashboard activePage={activePage} setActivePage={setActivePage} />;
};

export default MainLayout;
