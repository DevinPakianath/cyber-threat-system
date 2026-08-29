import React, { useState } from "react";

import Dashboard      from "./Dashboard";
import EmployeePortal from "./EmployeePortal";
import Landing        from "./Landing";
import Login          from "./Login";
import Register       from "./Register";

function getUserAuth() {
  const token = localStorage.getItem("token");
  if (!token) return { isValid: false, role: "employee" };
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.exp * 1000 < Date.now()) {
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      localStorage.removeItem("email");
      localStorage.removeItem("role");
      return { isValid: false, role: "employee" };
    }
    const role = payload.role || localStorage.getItem("role") || "employee";
    return { isValid: true, role };
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    return { isValid: false, role: "employee" };
  }
}

function App() {
  const auth = getUserAuth();
  const [isLoggedIn,   setIsLoggedIn]   = useState(auth.isValid);
  const [showLanding,  setShowLanding]  = useState(!auth.isValid);
  const [showRegister, setShowRegister] = useState(false);

  if (isLoggedIn) {
    const currentAuth = getUserAuth();
    if (currentAuth.role === "admin" || currentAuth.role === "manager") {
      return <Dashboard setIsLoggedIn={setIsLoggedIn} userRole={currentAuth.role} />;
    }
    return <EmployeePortal setIsLoggedIn={setIsLoggedIn} />;
  }

  if (showLanding) {
    return (
      <Landing
        onGetStarted={() => { setShowLanding(false); setShowRegister(true); }}
        onSignIn={() => setShowLanding(false)}
      />
    );
  }

  if (showRegister) {
    return <Register setShowRegister={setShowRegister} />;
  }

  return (
    <Login setIsLoggedIn={setIsLoggedIn} setShowRegister={setShowRegister} />
  );
}

export default App;