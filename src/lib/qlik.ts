import enigma from "enigma.js";
import bundledSchema from "enigma.js/schemas/12.170.2.json";
import { embed } from "@nebula.js/stardust";

export interface QlikConfig {
  host: string;
  port?: number;
  prefix?: string;
  secure?: boolean;
  appId: string;
}

export interface QlikObject {
  id: string;
  type: string;
  title?: string;
}

type EventName = "connected" | "disconnected";
type Listener = (...args: any[]) => void;

export interface QlikServiceContract {
  connect(config: QlikConfig): Promise<boolean>;
  getAppInfo(): Promise<any>;
  getObject(objectId: string): Promise<any>;
  createSessionObject(definition: any): Promise<any>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getConfig(): Readonly<QlikConfig> | null;
  getIdentity(): string;
  buildSingleObjectUrl(objectId: string, options?: { theme?: string; opt?: string[]; identity?: string; }): string;
  renderVisualization(args: { element: HTMLElement; objectId: string; theme?: string; language?: string }): Promise<() => void>;
  on(event: EventName, handler: Listener): void;
  off(event: EventName, handler: Listener): void;
}

class QlikService implements QlikServiceContract {
  private session: any = null;
  private app: any = null;
  private config: QlikConfig | null = null;
  private listeners: Record<EventName, Set<Listener>> = {
    connected: new Set(),
    disconnected: new Set(),
  };
  private identity = `onsite-portal-${Math.random().toString(36).slice(2, 8)}`;
  private nebula: ReturnType<typeof embed> | null = null;

  async connect(config: QlikConfig): Promise<boolean> {
    try {
      this.config = config;

      console.log("config", config);
      console.log("baseUrl", this.getBaseUrl());

      this.session = enigma.create({
        schema: this.loadSchema(),
        url: this.getWebsocketUrl(),
        createSocket: (url: string) => new WebSocket(url),
        protocol: {
          delta: false,
        },
      });

      const qix = await this.session.open();
      this.app = await qix.openDoc(config.appId);

      this.nebula = embed(this.app, {
        types: [
          {
            name: "kpi",
            load: () => import("@nebula.js/sn-kpi").then((m) => m.default ?? m),
          },
          {
            name: "linechart",
            load: () => import("@nebula.js/sn-line-chart").then((m) => m.default ?? m),
          },
          {
            name: "barchart",
            load: () => import("@nebula.js/sn-bar-chart").then((m) => m.default ?? m),
          },
          {
            name: "piechart",
            load: () => import("@nebula.js/sn-pie-chart").then((m) => m.default ?? m),
          },
          {
            name: "scatterplot",
            load: () => import("@nebula.js/sn-scatter-plot").then((m) => m.default ?? m),
          },
          {
            name: "treemap",
            load: () => import("@nebula.js/sn-treemap").then((m) => m.default ?? m),
          },
          {
            name: "map",
            load: () => import("@nebula.js/sn-map").then((m) => m.default ?? m),
          },
          {
            name: "table",
            load: () => import("@nebula.js/sn-table").then((m) => m.default ?? m),
          },
          {
            name: "pivot-table",
            load: () => import("@nebula.js/sn-pivot-table").then((m) => m.default ?? m),
          },
        ],
        context: {
          theme: "horizon",
          language: "en-US",
        },
      });

      this.emit("connected", { config: this.config, app: this.app });

      return true;
    } catch (error) {
      console.error("Failed to connect to Qlik Sense:", error);
      throw error;
    }
  }

  async getAppInfo(): Promise<any> {
    if (!this.app) {
      throw new Error("Not connected to Qlik Sense app");
    }

    try {
      const layout = await this.app.getAppLayout();
      return {
        title: layout.qTitle,
        description: layout.qDescription,
        modified: layout.qModified,
        objects: layout.qObjects,
      };
    } catch (error) {
      console.error("Failed to get app info:", error);
      return { title: "Connected App" };
    }
  }

  async getObject(objectId: string): Promise<any> {
    if (!this.app) {
      throw new Error("Not connected to Qlik Sense app");
    }

    try {
      const obj = await this.app.getObject(objectId);
      const layout = await obj.getLayout();
      return { object: obj, layout };
    } catch (error) {
      console.error(`Failed to get object ${objectId}:`, error);
      throw error;
    }
  }

  async createSessionObject(definition: any): Promise<any> {
    if (!this.app) {
      throw new Error("Not connected to Qlik Sense app");
    }

    try {
      const obj = await this.app.createSessionObject(definition);
      const layout = await obj.getLayout();
      return { object: obj, layout };
    } catch (error) {
      console.error("Failed to create session object:", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.session) {
      await this.session.close();
      this.session = null;
      this.app = null;
      if (this.nebula) {
        try {
          await this.nebula.destroy?.();
        } catch (error) {
          console.warn("Failed to destroy nebula instance:", error);
        }
        this.nebula = null;
      }
      this.emit("disconnected");
    }
  }

  private getBaseUrl(): string {
    if (!this.config) return "";
    const protocol = this.config.secure ? "https" : "http";
    const port = this.config.port ? `:${this.config.port}` : "";
    const prefix = this.config.prefix || "";
    return `${protocol}://${this.config.host}${port}${prefix}`;
  }

  private getWebsocketUrl(): string {
    if (!this.config) return "";
    const protocol = this.config.secure ? "wss" : "ws";
    const port = this.config.port ? `:${this.config.port}` : "";
    const prefix = this.config.prefix || "";
    return `${protocol}://${this.config.host}${port}${prefix}/app/${this.config.appId}`;
  }

  private loadSchema(): any {
    return bundledSchema;
  }

  isConnected(): boolean {
    return this.session !== null && this.app !== null;
  }

  getConfig(): Readonly<QlikConfig> | null {
    return this.config;
  }

  getIdentity(): string {
    return this.identity;
  }

  buildSingleObjectUrl(
    objectId: string,
    options: {
      theme?: string;
      opt?: string[];
      identity?: string;
    } = {}
  ): string {
    if (!this.config) {
      throw new Error('Not connected to Qlik Sense app');
    }

    const baseUrl = this.getBaseUrl();
    const params = new URLSearchParams({
      appid: this.config.appId,
      obj: objectId,
    });

    const theme = options.theme ?? 'horizon';
    if (theme) {
      params.set('theme', theme);
    }

    const opt = options.opt ?? ['ctxmenu', 'currsel'];
    if (opt.length) {
      params.set('opt', opt.join(','));
    }

    const identity = options.identity ?? this.identity;
    if (identity) {
      params.set('identity', identity);
    }

    return `${baseUrl}/single/?${params.toString()}`;
  }

  async renderVisualization({
    element,
    objectId,
    theme = "horizon",
    language = "en-US",
  }: {
    element: HTMLElement;
    objectId: string;
    theme?: string;
    language?: string;
  }): Promise<() => void> {
    if (!this.app) {
      throw new Error("Not connected to Qlik Sense app");
    }

    if (!this.nebula) {
      this.nebula = embed(this.app, {
        context: {
          theme,
          language,
        },
      });
    }

    const viz = await this.nebula.render({
      element,
      id: objectId,
      options: {
        context: {
          theme,
          language,
        },
      },
    });

    return () => {
      try {
        viz?.destroy?.();
      } catch (error) {
        console.warn(`Failed to tear down visualization ${objectId}:`, error);
      }
    };
  }

  on(event: EventName, handler: Listener): void {
    this.listeners[event].add(handler);
  }

  off(event: EventName, handler: Listener): void {
    this.listeners[event].delete(handler);
  }

  private emit(event: EventName, ...args: any[]): void {
    this.listeners[event].forEach((handler) => {
      try {
        handler(...args);
      } catch (err) {
        console.warn(`Listener for ${event} failed:`, err);
      }
    });
  }
}

class MockQlikService implements QlikServiceContract {
  private config: QlikConfig | null = null;
  private connected = false;
  private identity = "mock-qa";
  private listeners: Record<EventName, Set<Listener>> = {
    connected: new Set(),
    disconnected: new Set(),
  };

  async connect(config: QlikConfig): Promise<boolean> {
    this.config = config;
    this.connected = true;
    await new Promise((resolve) => setTimeout(resolve, 50));
    this.emit("connected", { config, app: { id: config.appId } });
    return true;
  }

  async getAppInfo(): Promise<any> {
    return {
      title: "Mock Consumer Sales",
      description: "QA mock application",
      modified: new Date().toISOString(),
      objects: [],
    };
  }

  async getObject(objectId: string): Promise<any> {
    const layout = { qInfo: { qId: objectId }, title: `Mock ${objectId}` };
    return {
      object: {
        show: async (element: HTMLElement) => {
          const placeholder = document.createElement("div");
          placeholder.dataset.testid = `mock-object-${objectId}`;
          placeholder.textContent = `Mock object ${objectId}`;
          element.appendChild(placeholder);
        },
        getLayout: async () => layout,
      },
      layout,
    };
  }

  async createSessionObject(definition: any): Promise<any> {
    const objectId = definition?.qInfo?.qId || "mock-session-object";
    return this.getObject(objectId);
  }

  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }
    this.connected = false;
    this.emit("disconnected");
  }

  isConnected(): boolean {
    return this.connected;
  }

  getConfig(): Readonly<QlikConfig> | null {
    return this.config;
  }

  getIdentity(): string {
    return this.identity;
  }

  buildSingleObjectUrl(objectId: string): string {
    return `mock://object/${objectId}`;
  }

  async renderVisualization({ element, objectId }: { element: HTMLElement; objectId: string; theme?: string; language?: string; }): Promise<() => void> {
    const viz = document.createElement("div");
    viz.dataset.testid = `mock-viz-${objectId}`;
    viz.className = "mock-qlik-viz";
    viz.textContent = `Visualization ${objectId}`;
    element.appendChild(viz);
    return () => {
      if (element.contains(viz)) {
        element.removeChild(viz);
      }
    };
  }

  on(event: EventName, handler: Listener): void {
    this.listeners[event].add(handler);
  }

  off(event: EventName, handler: Listener): void {
    this.listeners[event].delete(handler);
  }

  private emit(event: EventName, ...args: any[]): void {
    this.listeners[event].forEach((handler) => {
      try {
        handler(...args);
      } catch (err) {
        console.warn(`Mock listener for ${event} failed:`, err);
      }
    });
  }
}

const createQlikService = (): QlikServiceContract => {
  if (import.meta.env.VITE_QA_MOCK === "true") {
    console.info("Qlik service running in QA mock mode");
    return new MockQlikService();
  }

  return new QlikService();
};

export const qlikService: QlikServiceContract = createQlikService();
