import enigma from "enigma.js";
import bundledSchema from "enigma.js/schemas/12.170.2.json";
import { embed } from "@nebula.js/stardust";
import { withProxyToken } from "@/qlik/url";

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
  buildSingleObjectUrl(
    objectId: string,
    options?: { theme?: string; opt?: string[]; identity?: string }
  ): string;
  renderVisualisation(args: {
    element: HTMLElement;
    objectId: string;
    theme?: string;
    language?: string;
  }): Promise<() => void>;
  // Selection methods
  selectValues(fieldName: string, values: string[]): Promise<boolean>;
  clearSelections(fieldNames?: string[]): Promise<boolean>;
  getFieldValues(fieldName: string): Promise<string[]>;
  getCurrentSelections(): Promise<{ [fieldName: string]: string[] }>;
  // Bookmark methods
  getBookmarks(): Promise<
    Array<{ id: string; title: string; description?: string }>
  >;
  applyBookmark(bookmarkId: string): Promise<boolean>;
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
            load: () =>
              import("@nebula.js/sn-line-chart").then((m) => m.default ?? m),
          },
          {
            name: "barchart",
            load: () =>
              import("@nebula.js/sn-bar-chart").then((m) => m.default ?? m),
          },
          {
            name: "piechart",
            load: () =>
              import("@nebula.js/sn-pie-chart").then((m) => m.default ?? m),
          },
          {
            name: "scatterplot",
            load: () =>
              import("@nebula.js/sn-scatter-plot").then((m) => m.default ?? m),
          },
          {
            name: "treemap",
            load: () =>
              import("@nebula.js/sn-treemap").then((m) => m.default ?? m),
          },
          {
            name: "map",
            load: () => import("@nebula.js/sn-map").then((m) => m.default ?? m),
          },
          {
            name: "table",
            load: () =>
              import("@nebula.js/sn-table").then((m) => m.default ?? m),
          },
          {
            name: "pivot-table",
            load: () =>
              import("@nebula.js/sn-pivot-table").then((m) => m.default ?? m),
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
          this.nebula = null;
        } catch (error) {
          console.warn("Failed to destroy nebula instance:", error);
        }
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
    const baseUrl = `${protocol}://${this.config.host}${port}${prefix}/app/${this.config.appId}`;
    return withProxyToken(baseUrl);
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
      throw new Error("Not connected to Qlik Sense app");
    }

    const baseUrl = this.getBaseUrl();
    const params = new URLSearchParams({
      appid: this.config.appId,
      obj: objectId,
    });

    const theme = options.theme ?? "horizon";
    if (theme) {
      params.set("theme", theme);
    }

    const opt = options.opt ?? ["ctxmenu", "currsel"];
    if (opt.length) {
      params.set("opt", opt.join(","));
    }

    const identity = options.identity ?? this.identity;
    if (identity) {
      params.set("identity", identity);
    }

    return `${baseUrl}/single/?${params.toString()}`;
  }

  async renderVisualisation({
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
        console.warn(`Failed to tear down visualisation ${objectId}:`, error);
      }
    };
  }

  async selectValues(fieldName: string, values: string[]): Promise<boolean> {
    if (!this.app) {
      throw new Error("Not connected to Qlik Sense app");
    }

    try {
      const field = await this.app.getField(fieldName);
      await field.selectValues(
        values.map((value) => ({ qText: value })),
        true,
        true
      );
      return true;
    } catch (error) {
      console.error(`Failed to select values in field ${fieldName}:`, error);
      return false;
    }
  }

  async clearSelections(fieldNames?: string[]): Promise<boolean> {
    if (!this.app) {
      throw new Error("Not connected to Qlik Sense app");
    }

    try {
      if (fieldNames && fieldNames.length > 0) {
        for (const fieldName of fieldNames) {
          const field = await this.app.getField(fieldName);
          await field.clear();
        }
      } else {
        await this.app.clearAll();
      }
      return true;
    } catch (error) {
      console.error("Failed to clear selections:", error);
      return false;
    }
  }

  async getFieldValues(fieldName: string): Promise<string[]> {
    if (!this.app) {
      throw new Error("Not connected to Qlik Sense app");
    }

    try {
      const field = await this.app.getField(fieldName);
      const data = await field.getData();
      return data.map((item: any) => item.qText);
    } catch (error) {
      console.error(`Failed to get field values for ${fieldName}:`, error);
      return [];
    }
  }

  async getCurrentSelections(): Promise<{ [fieldName: string]: string[] }> {
    if (!this.app) {
      throw new Error("Not connected to Qlik Sense app");
    }

    try {
      const layout = await this.app.getAppLayout();
      const selections: { [fieldName: string]: string[] } = {};

      if (layout.qSelectionInfo && layout.qSelectionInfo.qInSelections) {
        for (const selection of layout.qSelectionInfo.qInSelections) {
          if (selection.qField && selection.qSelected) {
            selections[selection.qField] = selection.qSelected.split(", ");
          }
        }
      }

      return selections;
    } catch (error) {
      console.error("Failed to get current selections:", error);
      return {};
    }
  }

  async getBookmarks(): Promise<
    Array<{ id: string; title: string; description?: string }>
  > {
    if (!this.app) {
      throw new Error("Not connected to Qlik Sense app");
    }

    try {
      const bookmarkList = await this.app.getBookmarkList();
      const layout = await bookmarkList.getLayout();

      return layout.qBookmarkList.qItems.map((item: any) => ({
        id: item.qInfo.qId,
        title:
          item.qData.title || item.qMeta.title || `Bookmark ${item.qInfo.qId}`,
        description: item.qData.description || item.qMeta.description,
      }));
    } catch (error) {
      console.error("Failed to get bookmarks:", error);
      return [];
    }
  }

  async applyBookmark(bookmarkId: string): Promise<boolean> {
    if (!this.app) {
      throw new Error("Not connected to Qlik Sense app");
    }

    try {
      const bookmark = await this.app.getBookmark(bookmarkId);
      await bookmark.apply();
      return true;
    } catch (error) {
      console.error(`Failed to apply bookmark ${bookmarkId}:`, error);
      return false;
    }
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

  async renderVisualisation({
    element,
    objectId,
  }: {
    element: HTMLElement;
    objectId: string;
    theme?: string;
    language?: string;
  }): Promise<() => void> {
    const viz = document.createElement("div");
    viz.dataset.testid = `mock-viz-${objectId}`;
    viz.className = "mock-qlik-viz";
    viz.textContent = `Visualisation ${objectId}`;
    element.appendChild(viz);
    return () => {
      if (element.contains(viz)) {
        element.removeChild(viz);
      }
    };
  }

  async selectValues(fieldName: string, values: string[]): Promise<boolean> {
    console.log(`Mock: Selecting values in ${fieldName}:`, values);
    return true;
  }

  async clearSelections(fieldNames?: string[]): Promise<boolean> {
    console.log(`Mock: Clearing selections for fields:`, fieldNames || "all");
    return true;
  }

  async getFieldValues(fieldName: string): Promise<string[]> {
    console.log(`Mock: Getting field values for ${fieldName}`);
    const mockValues: { [key: string]: string[] } = {
      "Region Name": ["Northeast", "Southeast", "Central", "West", "Southwest"],
      Channel: [
        "Direct",
        "Distribution",
        "Government",
        "Hospital",
        "Internet",
        "Retail",
      ],
      "Product Sub Group Desc": [
        "Fresh Vegetables",
        "Canned Fruit",
        "Cereal",
        "Candy",
        "Dairy",
      ],
      "Sales Rep": [
        "Amalia Craig",
        "Amanda Ho",
        "Amelia Fields",
        "Angolan Carter",
        "Brenda Gibson",
      ],
      Year: ["2019", "2020", "2021", "2022", "2023"],
    };
    return mockValues[fieldName] || [];
  }

  async getCurrentSelections(): Promise<{ [fieldName: string]: string[] }> {
    console.log("Mock: Getting current selections");
    return {};
  }

  async getBookmarks(): Promise<
    Array<{ id: string; title: string; description?: string }>
  > {
    console.log("Mock: Getting bookmarks");
    return [
      {
        id: "bookmark1",
        title: "Lowest Performers (3 Reps)",
        description: "Focus on underperforming sales reps",
      },
      {
        id: "bookmark2",
        title: "Lower Performers (16 Reps)",
        description: "Mid-tier performance analysis",
      },
      {
        id: "bookmark3",
        title: "High Performers",
        description: "Top performing sales representatives",
      },
    ];
  }

  async applyBookmark(bookmarkId: string): Promise<boolean> {
    console.log(`Mock: Applying bookmark ${bookmarkId}`);
    return true;
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
  // Check for mock mode via environment variable, URL parameter, or localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const forceMock = urlParams.get('mock') === 'true' || localStorage.getItem('qlik-mock-mode') === 'true';
  
  if (import.meta.env.VITE_QA_MOCK === "true" || forceMock) {
    console.info("Qlik service running in QA mock mode");
    return new MockQlikService();
  }

  return new QlikService();
};

export const qlikService: QlikServiceContract = createQlikService();
