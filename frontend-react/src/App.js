import React, { useState } from "react";

import Dashboard from "./Dashboard";
import Landing   from "./Landing";
import Login     from "./Login";
import Register  from "./Register";

function isTokenValid() {
  const token = localStorage.getItem("token");
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.exp * 1000 < Date.now()) {
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      localStorage.removeItem("email");
      return false;
    }
    return true;
  } catch {
    localStorage.removeItem("token");
    return false;
  }
}

function App() {
  const [isLoggedIn,   setIsLoggedIn]   = useState(isTokenValid);
  const [showLanding,  setShowLanding]  = useState(!isTokenValid());
  const [showRegister, setShowRegister] = useState(false);

  if (isLoggedIn) return <Dashboard setIsLoggedIn={setIsLoggedIn} />;

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