import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';
import { GameRoom, Player } from '../types';

export const DEFAULT_SERVER_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

class SocketService {
  private socket: Socket | null = null;
  public currentServerUrl: string = DEFAULT_SERVER_URL;
  public isConnected: boolean = false;

  // Cached session state for auto-reconnect
  public cachedPlayerId: string | null = null;
  public cachedReconnectToken: string | null = null;
  public cachedRoomCode: string | null = null;
  public cachedPlayerName: string | null = null;

  private connectionListeners = new Set<(connected: boolean) => void>();

  public connect(url: string = this.currentServerUrl): Socket {
    this.currentServerUrl = url;

    if (this.socket) {
      this.socket.disconnect();
    }

    console.log(`🔌 Connecting to server at: ${url}`);
    this.socket = io(url, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to Bingo 25 server:', this.socket?.id);
      this.isConnected = true;
      this.notifyConnectionChange(true);

      // Auto-reconnect session if we had an active game
      if (this.cachedRoomCode && this.cachedPlayerId && this.cachedReconnectToken) {
        console.log('🔄 Attempting session restoration with server...');
        this.reconnectSession(
          this.cachedRoomCode,
          this.cachedPlayerId,
          this.cachedReconnectToken
        ).catch((err) => console.log('Session restore failed:', err));
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from server:', reason);
      this.isConnected = false;
      this.notifyConnectionChange(false);
    });

    this.socket.on('connect_error', (error) => {
      console.warn('⚠️ Connection error:', error.message);
      this.isConnected = false;
      this.notifyConnectionChange(false);
    });

    return this.socket;
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public onConnectionChange(cb: (connected: boolean) => void): () => void {
    this.connectionListeners.add(cb);
    cb(this.isConnected);
    return () => this.connectionListeners.delete(cb);
  }

  private notifyConnectionChange(status: boolean) {
    this.connectionListeners.forEach((cb) => cb(status));
  }

  // --- ACTIONS ---

  public createRoom(
    playerName: string,
    maxPlayers: number = 4
  ): Promise<{ room: GameRoom; playerId: string; reconnectToken: string }> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        return reject(new Error('Not connected to game server. Please check your network or server URL.'));
      }

      this.socket.emit('create_room', { playerName, maxPlayers }, (res: any) => {
        if (res.success && res.room && res.playerId) {
          this.cachedPlayerId = res.playerId;
          this.cachedReconnectToken = res.reconnectToken;
          this.cachedRoomCode = res.room.code;
          this.cachedPlayerName = playerName;
          resolve({
            room: res.room,
            playerId: res.playerId,
            reconnectToken: res.reconnectToken,
          });
        } else {
          reject(new Error(res.error || 'Failed to create room'));
        }
      });
    });
  }

  public joinRoom(
    roomCode: string,
    playerName: string
  ): Promise<{ room: GameRoom; playerId: string; reconnectToken: string }> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        return reject(new Error('Not connected to game server. Please check your network or server URL.'));
      }

      const uppercaseCode = roomCode.toUpperCase().trim();
      const isReconnecting = this.cachedRoomCode === uppercaseCode && this.cachedPlayerId;

      this.socket.emit(
        'join_room',
        {
          roomCode: uppercaseCode,
          playerName,
          playerId: isReconnecting ? this.cachedPlayerId : undefined,
          reconnectToken: isReconnecting ? this.cachedReconnectToken : undefined,
        },
        (res: any) => {
          if (res.success && res.room && res.playerId) {
            this.cachedPlayerId = res.playerId;
            this.cachedReconnectToken = res.reconnectToken;
            this.cachedRoomCode = res.room.code;
            this.cachedPlayerName = playerName;
            resolve({
              room: res.room,
              playerId: res.playerId,
              reconnectToken: res.reconnectToken,
            });
          } else {
            reject(new Error(res.error || 'Failed to join room'));
          }
        }
      );
    });
  }

  public reconnectSession(
    roomCode: string,
    playerId: string,
    reconnectToken: string
  ): Promise<GameRoom> {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject(new Error('Socket not initialized'));

      this.socket.emit(
        'reconnect_session',
        { roomCode, playerId, reconnectToken },
        (res: any) => {
          if (res.success && res.room) {
            resolve(res.room);
          } else {
            reject(new Error(res.error || 'Reconnect failed'));
          }
        }
      );
    });
  }

  public setBoard(roomCode: string, playerId: string, board: number[]): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject(new Error('Socket not connected'));
      this.socket.emit('set_board', { roomCode, playerId, board }, (res: any) => {
        if (res.success) resolve();
        else reject(new Error(res.error || 'Failed to submit board'));
      });
    });
  }

  public startGame(roomCode: string, playerId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject(new Error('Socket not connected'));
      this.socket.emit('start_game', { roomCode, playerId }, (res: any) => {
        if (res.success) resolve();
        else reject(new Error(res.error || 'Failed to start game'));
      });
    });
  }

  public callNumber(roomCode: string, playerId: string, number: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject(new Error('Socket not connected'));
      this.socket.emit('call_number', { roomCode, playerId, number }, (res: any) => {
        if (res.success) resolve();
        else reject(new Error(res.error || 'Failed to call number'));
      });
    });
  }

  public sendReaction(roomCode: string, playerId: string, emoji: string) {
    if (!this.socket) return;
    this.socket.emit('send_reaction', { roomCode, playerId, emoji });
  }

  public requestRematch(roomCode: string, playerId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject(new Error('Socket not connected'));
      this.socket.emit('request_rematch', { roomCode, playerId }, (res: any) => {
        if (res.success) resolve();
        else reject(new Error(res.error || 'Failed to request rematch'));
      });
    });
  }

  public leaveRoom(roomCode: string, playerId: string): Promise<void> {
    return new Promise((resolve) => {
      this.clearSessionCache();
      if (!this.socket) return resolve();
      this.socket.emit('leave_room', { roomCode, playerId }, () => {
        resolve();
      });
    });
  }

  public clearSessionCache() {
    this.cachedPlayerId = null;
    this.cachedReconnectToken = null;
    this.cachedRoomCode = null;
  }
}

export const socketService = new SocketService();
