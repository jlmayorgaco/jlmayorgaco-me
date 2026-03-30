/**
 * Data Lab Commands
 * Terminal commands for interacting with the Data Lab
 */

import type { CommandDefinition } from '../commandRegistry';
import { registerCommand, TERMINAL_DIVIDER } from '../commandRegistry';
import { DASHBOARDS, getDashboardBySlug } from '../../datalab/registry';
import { createHeader, formatList } from '../terminalUtils';

const labCommand: CommandDefinition = {
  aliases: ['lab', 'datalab', 'data lab', 'open lab'],
  description: 'Open the Data Lab',
  category: 'system',
  execute: () => ({
    output: `${createHeader('Data Lab')}
Initializing data environment...
Loading signal workspace...
Entering LAB MODE...

${createHeader('Available Modules')}
${DASHBOARDS.map(d => `  ▸ ${d.title} (${d.slug})`).join('\n')}

Use: load <module-slug> to open a specific module`,
    uiAction: { type: 'navigate', path: '/datalab' },
  }),
};

const loadModuleCommand: CommandDefinition = {
  aliases: ['load', 'open module'],
  description: 'Load a Data Lab module',
  category: 'system',
  execute: (args) => {
    const slug = args[0];
    if (!slug) {
      return {
        output: `${createHeader('Data Lab Modules')}
${formatList(DASHBOARDS.map(d => `${d.slug} - ${d.title}`))}

Usage: load <module-slug>`,
        action: 'none',
      };
    }

    const module = getDashboardBySlug(slug.toLowerCase());
    if (!module) {
      const suggestions = DASHBOARDS
        .filter(d => d.slug.includes(slug.toLowerCase()) || d.title.toLowerCase().includes(slug.toLowerCase()))
        .map(d => d.slug);
      
      let output = `Module not found: ${slug}`;
      if (suggestions.length > 0) {
        output += `\n\nDid you mean:\n${suggestions.map(s => `  ▸ ${s}`).join('\n')}`;
      }
      return { output, action: 'none' };
    }

    return {
      output: `${createHeader('Loading Module')}
Module: ${module.title}
Category: ${module.category}
Status: ${module.status.toUpperCase()}

Initializing ${module.id}...
Loading dataset: ${module.defaultDataset || 'none'}
Setup complete.

Opening Data Lab...`,
      uiAction: { type: 'navigate', path: `/datalab` },
    };
  },
};

const modulesCommand: CommandDefinition = {
  aliases: ['modules', 'dashboards', 'instruments'],
  description: 'List available Data Lab modules',
  category: 'system',
  execute: () => ({
    output: `${createHeader('Data Lab Modules')}

${DASHBOARDS.map(d => `
${d.title}
${TERMINAL_DIVIDER}
  Slug:     ${d.slug}
  Category: ${d.category}
  Status:   ${d.status.toUpperCase()}
  Views:    ${d.supportedViews.join(', ')}
  Tags:     ${d.tags.slice(0, 5).join(', ')}
`).join('\n')}

Use: load <slug> to open a module`,
    action: 'none',
  }),
};

const moduleInfoCommand: CommandDefinition = {
  aliases: ['module', 'info'],
  description: 'Get information about a Data Lab module',
  category: 'system',
  execute: (args) => {
    const slug = args[0];
    if (!slug) {
      return { output: 'Usage: module <slug>', action: 'none' };
    }

    const module = getDashboardBySlug(slug.toLowerCase());
    if (!module) {
      return { output: `Module not found: ${slug}`, action: 'none' };
    }

    return {
      output: `${createHeader(module.title)}
${module.subtitle}

${module.description}

${TERMINAL_DIVIDER}
ID:        ${module.id}
Category:  ${module.category}
Status:    ${module.status.toUpperCase()}
Views:     ${module.supportedViews.join(', ')}
Tags:      ${module.tags.join(', ')}
Dataset:   ${module.defaultDataset || 'none'}`,
      action: 'none',
    };
  },
};

const datasetsCommand: CommandDefinition = {
  aliases: ['datasets', 'data'],
  description: 'List available datasets',
  category: 'system',
  execute: () => ({
    output: `${createHeader('Available Datasets')}

Synthetic and real datasets for analysis:

 ▸ synthetic-grid  - Simulated power system frequency data
 ▸ pmu-real        - Real PMU measurements from grid
 ▸ hex-formation   - 6-agent hexagonal swarm data
 ▸ random-graph    - Erdős-Rényi random topology
 ▸ second-order    - Standard second-order plant
 ▸ kalman-pipeline - FPGA Kalman filter implementation

Use with: load <module> and select dataset in UI`,
    action: 'none',
  }),
};

export function registerDataLabCommands() {
  registerCommand(labCommand);
  registerCommand(loadModuleCommand);
  registerCommand(modulesCommand);
  registerCommand(moduleInfoCommand);
  registerCommand(datasetsCommand);
}
