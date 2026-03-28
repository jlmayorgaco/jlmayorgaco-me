import TopControlBar from './TopControlBar';
import StatusBar from './StatusBar';
import CoreIdentityPanel from './CoreIdentityPanel';
import TerminalPanel from './TerminalPanel';
import ModuleCard from './ModuleCard';
import TechRack from './TechRack';
import ResearchOutputPanel from './ResearchOutputPanel';
import PhdTrackPanel from './PhdTrackPanel';
import ConnectPanel from './ConnectPanel';
import WireOverlay from './WireOverlay';
import { modules } from '../../data/labData';

export default function LabShell() {
  return (
    <div className="lab-shell">
      <WireOverlay />
      <TopControlBar />
      <StatusBar />
      
      <div className="lab-grid">
        <div data-panel="core">
          <CoreIdentityPanel />
        </div>
        <div data-panel="terminal">
          <TerminalPanel />
        </div>
        <div data-panel="phd" id="research">
          <PhdTrackPanel />
        </div>
        
        {modules.map((mod) => (
          <div 
            key={mod.id} 
            data-panel={`module-${mod.variant}`}
            id={mod.panelId || undefined}
          >
            <ModuleCard {...mod} />
          </div>
        ))}
        
        <div data-panel="research" id="papers">
          <ResearchOutputPanel />
        </div>
        <div data-panel="techrack">
          <TechRack />
        </div>
        
        <div data-panel="connect" id="contact">
          <ConnectPanel />
        </div>
      </div>
    </div>
  );
}
