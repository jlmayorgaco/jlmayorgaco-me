/**
 * Plugin System
 * Allows extending bot with custom commands
 *
 * @module plugins/PluginManager
 */

import { CommandHandler } from '../application/ports';
import { logDebug, logError, logInfo, logWarn } from '../infrastructure/logging/Logger';
import { Result } from '../shared/Result';

export interface PluginContext {
  config: Record<string, unknown>;
  // Access to other services through dependency injection
  getService<T>(token: symbol): T;
}

export interface Plugin {
  name: string;
  version: string;
  description?: string;
  
  initialize(context: PluginContext): Promise<void>;
  getCommands(): CommandHandler[];
  destroy(): Promise<void>;
}

export interface LoadedPlugin {
  plugin: Plugin;
  context: PluginContext;
  commands: CommandHandler[];
}

export class PluginManager {
  private plugins = new Map<string, LoadedPlugin>();
  private commandHandlers = new Map<string, CommandHandler>();
  private allowedPaths: string[];
  private allowedServiceTokens: Set<symbol>;

  constructor(
    private serviceProvider: (token: symbol) => unknown,
    options?: {
      allowedPaths?: string[];
      allowedServiceTokens?: symbol[];
    }
  ) {
    // Security: Only allow plugins from specific directories
    this.allowedPaths = options?.allowedPaths || [
      process.cwd() + '/plugins',
      process.cwd() + '/scripts/bot/plugins',
    ];
    
    // Security: Only allow access to specific services
    this.allowedServiceTokens = new Set(options?.allowedServiceTokens || []);
  }

  async load(pluginPath: string): Promise<Result<void, Error>> {
    try {
      logDebug('Loading plugin', { path: pluginPath });

      // Security: Validate plugin path to prevent directory traversal
      const absolutePath = require('path').resolve(pluginPath);
      const isAllowed = this.allowedPaths.some(allowed => 
        absolutePath.startsWith(require('path').resolve(allowed))
      );
      
      if (!isAllowed) {
        throw new Error(
          `Plugin path not allowed: ${pluginPath}. ` +
          `Must be within allowed directories: ${this.allowedPaths.join(', ')}`
        );
      }

      // Dynamic import of plugin
      const pluginModule = await import(absolutePath);
      const PluginClass = pluginModule.default || pluginModule.Plugin;

      if (!PluginClass) {
        throw new Error(`No plugin export found in ${pluginPath}`);
      }

      const plugin: Plugin = new PluginClass();

      // Create plugin context with security restrictions
      const context: PluginContext = {
        config: {},
        getService: <T>(token: symbol) => {
          // Security: Only allow access to explicitly allowed services
          if (!this.allowedServiceTokens.has(token)) {
            throw new Error(
              `Service access denied: ${token.toString()}. ` +
              `This service is not in the allowed list for plugins.`
            );
          }
          return this.serviceProvider(token) as T;
        },
      };

      // Initialize plugin
      await plugin.initialize(context);

      // Get commands
      const commands = plugin.getCommands();

      // Store plugin
      this.plugins.set(plugin.name, {
        plugin,
        context,
        commands,
      });

      // Register commands
      for (const command of commands) {
        this.registerCommand(command);
      }

      logInfo('Plugin loaded successfully', { 
        name: plugin.name, 
        version: plugin.version,
        commands: commands.length 
      });

      return Result.ok(undefined);
    } catch (error) {
      logError('Failed to load plugin', error as Error, { path: pluginPath });
      return Result.err(error as Error);
    }
  }

  async unload(pluginName: string): Promise<Result<void, Error>> {
    const loaded = this.plugins.get(pluginName);
    if (!loaded) {
      return Result.err(new Error(`Plugin not found: ${pluginName}`));
    }

    try {
      // Unregister commands
      for (const command of loaded.commands) {
        this.unregisterCommand(command.name);
        if (command.aliases) {
          for (const alias of command.aliases) {
            this.unregisterCommand(alias);
          }
        }
      }

      // Destroy plugin
      await loaded.plugin.destroy();

      // Remove from registry
      this.plugins.delete(pluginName);

      logInfo('Plugin unloaded', { name: pluginName });
      return Result.ok(undefined);
    } catch (error) {
      logError('Failed to unload plugin', error as Error, { name: pluginName });
      return Result.err(error as Error);
    }
  }

  getCommand(name: string): CommandHandler | undefined {
    return this.commandHandlers.get(name.toLowerCase());
  }

  getAllCommands(): CommandHandler[] {
    const uniqueCommands = new Map<string, CommandHandler>();
    
    for (const handler of this.commandHandlers.values()) {
      uniqueCommands.set(handler.name, handler);
    }

    return Array.from(uniqueCommands.values());
  }

  getLoadedPlugins(): Array<{ name: string; version: string; commands: number }> {
    return Array.from(this.plugins.entries()).map(([name, loaded]) => ({
      name,
      version: loaded.plugin.version,
      commands: loaded.commands.length,
    }));
  }

  private registerCommand(handler: CommandHandler): void {
    // Register primary name
    this.commandHandlers.set(handler.name.toLowerCase(), handler);

    // Register aliases
    if (handler.aliases) {
      for (const alias of handler.aliases) {
        this.commandHandlers.set(alias.toLowerCase(), handler);
      }
    }
  }

  private unregisterCommand(name: string): void {
    this.commandHandlers.delete(name.toLowerCase());
  }
}
