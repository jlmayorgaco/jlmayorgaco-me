'use client';

import { useState } from 'react';
import VisualCommandHandler from './VisualCommandHandler';
import RobotHmiPanel from './RobotHmiPanel';
import ConstructionLayer from './ConstructionLayer';

export default function HomeVisualSystem() {
  const [isHmiOpen, setIsHmiOpen] = useState(false);
  const [isConstructionActive, setIsConstructionActive] = useState(false);

  const handleOpenHmi = () => setIsHmiOpen(true);
  const handleCloseHmi = () => setIsHmiOpen(false);
  const handleConstructionComplete = () => setIsConstructionActive(false);

  return (
    <>
      <VisualCommandHandler 
        onOpenHmi={handleOpenHmi}
        onCloseHmi={handleCloseHmi}
        onConstruction={() => setIsConstructionActive(true)}
      />
      <RobotHmiPanel isOpen={isHmiOpen} onClose={handleCloseHmi} />
      <ConstructionLayer 
        isActive={isConstructionActive} 
        onComplete={handleConstructionComplete}
      />
    </>
  );
}
