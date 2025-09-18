import enigma from 'enigma.js';

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
      const schema = await fetch(`${this.getBaseUrl()}/resources/schemas/enigma.json`).then(r => r.json());
      
      this.session = enigma.create({
        schema,
        url: this.getWebsocketUrl(),
        createSocket: (url: string) => new WebSocket(url),
      });

      const qix = await this.session.open();
      this.app = await qix.openDoc(config.appId);
      
      return true;
    } catch (error) {
      console.error('Failed to connect to Qlik Sense:', error);
      return false;
    }
  }

  async getObject(objectId: string): Promise<any> {
    if (!this.app) {
      throw new Error('Not connected to Qlik Sense app');
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
      throw new Error('Not connected to Qlik Sense app');
    }

    try {
      const obj = await this.app.createSessionObject(definition);
      const layout = await obj.getLayout();
      return { object: obj, layout };
    } catch (error) {
      console.error('Failed to create session object:', error);
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
    if (!this.config) return '';
    const protocol = this.config.secure ? 'https' : 'http';
    const port = this.config.port ? `:${this.config.port}` : '';
    const prefix = this.config.prefix || '';
    return `${protocol}://${this.config.host}${port}${prefix}`;
  }

  private getWebsocketUrl(): string {
    if (!this.config) return '';
    const protocol = this.config.secure ? 'wss' : 'ws';
    const port = this.config.port ? `:${this.config.port}` : '';
    const prefix = this.config.prefix || '';
    return `${protocol}://${this.config.host}${port}${prefix}/app/${this.config.appId}`;
  }

  isConnected(): boolean {
    return this.session !== null && this.app !== null;
  }
}

export const qlikService = new QlikService();