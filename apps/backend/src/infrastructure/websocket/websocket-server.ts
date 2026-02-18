import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { config } from '../../config';
import { RequestStatusCodes } from '../../domain/entities';

export class WebSocketServer {
  private io: SocketIOServer;

  constructor(httpServer: HttpServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: [config.cors.frontendUrl, 'http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupListeners();
  }

  private setupListeners() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`✅ Client connected: ${socket.id}`);

      socket.on('disconnect', () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
      });
    });
  }

  public emitCreditRequestUpdate(data: {
    creditRequestId: string;
    statusId: string;
    statusName: string;
    statusCode: RequestStatusCodes;
    updatedAt: string;
    reason: string | null;
    statusTransitionId: string;
    fromStatusId: string;
  }) {
    console.log('📡 Emitting credit-request-updated:', data);
    this.io.emit('credit-request-updated', data);
  }

  public getIO() {
    return this.io;
  }
}
