import enigma from "enigma.js";
import bundledSchema from "enigma.js/schemas/12.612.0.json" with { type: "json" };

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

class QlikService {
  private session: any = null;
  private app: any = null;
  private config: QlikConfig | null = null;

  async connect(config: QlikConfig): Promise<boolean> {
    try {
      this.config = config;

      console.log("config", config);
      console.log("baseUrl", this.getBaseUrl());

      const schema = await this.loadSchema();

      this.session = enigma.create({
        schema,
        url: this.getWebsocketUrl(),
        createSocket: (url: string) => new WebSocket(url),
        protocol: {
          delta: false,
        },
      });

      const qix = await this.session.open();
      this.app = await qix.openDoc(config.appId);

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

  private async loadSchema(): Promise<any> {
    if (!this.config) {
      throw new Error("Configuration is not set");
    }

    const baseUrl = this.getBaseUrl();
    if (baseUrl) {
      const candidates = [
        `${baseUrl}/resources/schemas/enigma.json`,
        `${baseUrl}/dev-hub/engine-api-explorer/dist/enigma.json`,
      ];

      for (const url of candidates) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            const remoteSchema = await response.json();
            if (remoteSchema?.enigma) {
              return remoteSchema;
            }
          }
        } catch (error) {
          console.warn(`Schema fetch failed for ${url}:`, error);
        }
      }
    }

    console.info(
      `Falling back to bundled Qlik Engine schema ${bundledSchema.enigma}`
    );
    return bundledSchema;
  }

  isConnected(): boolean {
    return this.session !== null && this.app !== null;
  }
}

export const qlikService = new QlikService();
