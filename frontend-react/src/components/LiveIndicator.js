import React, { useState, useEffect } from "react";

function LiveIndicator({ lastUpdated }) {

  const [label, setLabel] = useState("Just now");

  useEffect(() => {
    const update = () => {
      if (!lastUpdated) { setLabel("—"); return; }
      const secs = Math.floor((Date.now() - lastUpdated) / 1000);
      if (secs < 5)   setLabel("Just now");
      else if (secs < 60)  setLabel(`${secs}s ago`);
      else setLabel(`${Math.floor(secs / 60)}m ago`);
    };
    update();
    const id = setInterval(update, 5000);
    return () => clearInterval(id);
  }, [lastUpdated]);

  return (
    <div className="live-indicator">
      <span className="live-dot" />
      <span>Updated {label}</span>
    </div>
  );
}

export default LiveIndicator;
