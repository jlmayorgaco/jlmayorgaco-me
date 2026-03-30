import type { CommandDefinition } from '../commandRegistry';
import { registerCommand, TERMINAL_DIVIDER } from '../commandRegistry';

function dispatchRobotAction(action: string, data?: unknown): void {
  if (typeof window === 'undefined') return;
  const event = new CustomEvent('robot:command', { detail: { action, data } });
  window.dispatchEvent(event);
}

const robotPadCommand: CommandDefinition = {
  aliases: ['robot pad', 'pad'],
  description: 'Show robot control pad status',
  category: 'system',
  execute: () => ({
    output: `ROBOT CONTROL PAD
${TERMINAL_DIVIDER}
Status: READY

Use these commands:
  robot home    - Move to home position
  robot park    - Park the robot
  robot pick    - Pick sequence
  robot place   - Place sequence
  robot reset   - Reset all joints
  robot demo    - Start demo sequence

Or type 'open hmi' for the full control panel.`,
    action: 'none',
  }),
};

const robotStatusCommand: CommandDefinition = {
  aliases: ['robot status', 'robot state'],
  description: 'Show robot current status',
  category: 'system',
  execute: () => {
    dispatchRobotAction('status');
    return {
      output: `ROBOT STATUS
${TERMINAL_DIVIDER}
Mode: MANUAL
State: IDLE
Joints: Requesting current positions...

Type 'open hmi' for full control panel.`,
      action: 'none',
    };
  },
};

const robotHomeCommand: CommandDefinition = {
  aliases: ['robot home', 'home robot'],
  description: 'Move robot to home position',
  category: 'system',
  execute: () => {
    dispatchRobotAction('home');
    return {
      output: `ROBOT: HOMING SEQUENCE
${TERMINAL_DIVIDER}
[1] Releasing current position
[2] Moving J1 → 0°
[3] Moving J2 → 0°
[4] Moving J3 → 0°
[5] Confirming position

Status: HOME POSITION REACHED`,
      action: 'none',
    };
  },
};

const robotParkCommand: CommandDefinition = {
  aliases: ['robot park', 'park robot'],
  description: 'Park the robot arm',
  category: 'system',
  execute: () => {
    dispatchRobotAction('park');
    return {
      output: `ROBOT: PARKING SEQUENCE
${TERMINAL_DIVIDER}
[1] Initiating park routine
[2] Retracting arm segments
[3] J1 → 45°, J2 → -30°, J3 → -60°
[4] Locking joints

Status: PARKED (safe position)`,
      action: 'none',
    };
  },
};

const robotResetCommand: CommandDefinition = {
  aliases: ['robot reset', 'reset robot'],
  description: 'Reset robot to default state',
  category: 'system',
  execute: () => {
    dispatchRobotAction('reset');
    return {
      output: `ROBOT: SYSTEM RESET
${TERMINAL_DIVIDER}
[1] Stopping all motion
[2] Clearing error flags
[3] Resetting joint positions
[4] Returning to manual mode

Status: RESET COMPLETE
All joints at default positions.`,
      action: 'none',
    };
  },
};

const robotDemoCommand: CommandDefinition = {
  aliases: ['robot demo', 'demo robot', 'robot test'],
  description: 'Run robot demo sequence',
  category: 'system',
  execute: () => {
    dispatchRobotAction('demo');
    return {
      output: `ROBOT: DEMO SEQUENCE INITIATED
${TERMINAL_DIVIDER}
[START] Running automated demonstration...

Sequence:
  1. Home position
  2. Pick routine
  3. Place routine
  4. Park position
  5. Return home

Duration: ~5 seconds
Mode: DEMO (automatic)`,
      action: 'none',
    };
  },
};

const robotPickCommand: CommandDefinition = {
  aliases: ['robot pick', 'pick'],
  description: 'Execute pick sequence',
  category: 'system',
  execute: () => {
    dispatchRobotAction('pick');
    return {
      output: `ROBOT: PICK SEQUENCE
${TERMINAL_DIVIDER}
[1] Approaching pick position
[2] J1 → -30°, J2 → 45°, J3 → 90°
[3] Engaging gripper
[4] Confirming object acquisition

Status: OBJECT ACQUIRED`,
      action: 'none',
    };
  },
};

const robotPlaceCommand: CommandDefinition = {
  aliases: ['robot place', 'place'],
  description: 'Execute place sequence',
  category: 'system',
  execute: () => {
    dispatchRobotAction('place');
    return {
      output: `ROBOT: PLACE SEQUENCE
${TERMINAL_DIVIDER}
[1] Moving to place position
[2] J1 → 30°, J2 → -20°, J3 → 45°
[3] Releasing gripper
[4] Confirming object placement

Status: OBJECT PLACED`,
      action: 'none',
    };
  },
};

const j1PlusCommand: CommandDefinition = {
  aliases: ['j1+', 'joint1+'],
  description: 'Increase joint 1 by 5°',
  category: 'system',
  execute: () => {
    dispatchRobotAction('adjust', { joint: 'j1', delta: 5 });
    return { output: 'J1 +5°', action: 'none' };
  },
};

const j1MinusCommand: CommandDefinition = {
  aliases: ['j1-', 'joint1-'],
  description: 'Decrease joint 1 by 5°',
  category: 'system',
  execute: () => {
    dispatchRobotAction('adjust', { joint: 'j1', delta: -5 });
    return { output: 'J1 -5°', action: 'none' };
  },
};

const j2PlusCommand: CommandDefinition = {
  aliases: ['j2+', 'joint2+'],
  description: 'Increase joint 2 by 5°',
  category: 'system',
  execute: () => {
    dispatchRobotAction('adjust', { joint: 'j2', delta: 5 });
    return { output: 'J2 +5°', action: 'none' };
  },
};

const j2MinusCommand: CommandDefinition = {
  aliases: ['j2-', 'joint2-'],
  description: 'Decrease joint 2 by 5°',
  category: 'system',
  execute: () => {
    dispatchRobotAction('adjust', { joint: 'j2', delta: -5 });
    return { output: 'J2 -5°', action: 'none' };
  },
};

const j3PlusCommand: CommandDefinition = {
  aliases: ['j3+', 'joint3+'],
  description: 'Increase joint 3 by 5°',
  category: 'system',
  execute: () => {
    dispatchRobotAction('adjust', { joint: 'j3', delta: 5 });
    return { output: 'J3 +5°', action: 'none' };
  },
};

const j3MinusCommand: CommandDefinition = {
  aliases: ['j3-', 'joint3-'],
  description: 'Decrease joint 3 by 5°',
  category: 'system',
  execute: () => {
    dispatchRobotAction('adjust', { joint: 'j3', delta: -5 });
    return { output: 'J3 -5°', action: 'none' };
  },
};

export function registerRobotCommands() {
  registerCommand(robotPadCommand);
  registerCommand(robotStatusCommand);
  registerCommand(robotHomeCommand);
  registerCommand(robotParkCommand);
  registerCommand(robotResetCommand);
  registerCommand(robotDemoCommand);
  registerCommand(robotPickCommand);
  registerCommand(robotPlaceCommand);
  registerCommand(j1PlusCommand);
  registerCommand(j1MinusCommand);
  registerCommand(j2PlusCommand);
  registerCommand(j2MinusCommand);
  registerCommand(j3PlusCommand);
  registerCommand(j3MinusCommand);
}
