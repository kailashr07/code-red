import {
  type User,
  type InsertUser,
  type StudyBuddyRequest,
  type InsertStudyBuddyRequest,
  type Note,
  type InsertNote,
  type Timetable,
  type InsertTimetable,
  type Connection,
  type InsertConnection,
  type Message,
  type InsertMessage,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  // Study Buddy Requests
  getStudyBuddyRequests(filters?: { subject?: string; topic?: string; location?: string }): Promise<StudyBuddyRequest[]>;
  createStudyBuddyRequest(request: InsertStudyBuddyRequest): Promise<StudyBuddyRequest>;
  getUserStudyBuddyRequests(userId: string): Promise<StudyBuddyRequest[]>;
  updateStudyBuddyRequest(id: string, updates: Partial<StudyBuddyRequest>): Promise<StudyBuddyRequest | undefined>;
  
  // Notes
  getNotes(filters?: { subject?: string }): Promise<Note[]>;
  createNote(note: InsertNote): Promise<Note>;
  getNoteById(id: string): Promise<Note | undefined>;
  updateNoteStats(id: string, type: 'download' | 'like'): Promise<Note | undefined>;
  getUserNotes(userId: string): Promise<Note[]>;
  
  // Timetables
  getUserTimetable(userId: string): Promise<Timetable | undefined>;
  createTimetable(timetable: InsertTimetable): Promise<Timetable>;
  updateTimetable(userId: string, schedule: any): Promise<Timetable | undefined>;
  
  // Connections
  getConnections(userId: string): Promise<Connection[]>;
  createConnection(connection: InsertConnection): Promise<Connection>;
  updateConnectionStatus(id: string, status: string): Promise<Connection | undefined>;
  
  // Messages
  getMessages(userId1: string, userId2: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private studyBuddyRequests: Map<string, StudyBuddyRequest> = new Map();
  private notes: Map<string, Note> = new Map();
  private timetables: Map<string, Timetable> = new Map();
  private connections: Map<string, Connection> = new Map();
  private messages: Map<string, Message> = new Map();

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Study Buddy Requests
  async getStudyBuddyRequests(filters?: { subject?: string; topic?: string; location?: string }): Promise<StudyBuddyRequest[]> {
    let requests = Array.from(this.studyBuddyRequests.values()).filter(req => req.isActive);
    
    if (filters?.subject) {
      requests = requests.filter(req => req.subject.toLowerCase().includes(filters.subject!.toLowerCase()));
    }
    if (filters?.topic) {
      requests = requests.filter(req => req.topic.toLowerCase().includes(filters.topic!.toLowerCase()));
    }
    if (filters?.location) {
      requests = requests.filter(req => req.location.toLowerCase().includes(filters.location!.toLowerCase()));
    }
    
    return requests.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createStudyBuddyRequest(insertRequest: InsertStudyBuddyRequest): Promise<StudyBuddyRequest> {
    const id = randomUUID();
    const request: StudyBuddyRequest = {
      ...insertRequest,
      id,
      isActive: true,
      createdAt: new Date(),
    };
    this.studyBuddyRequests.set(id, request);
    return request;
  }

  async getUserStudyBuddyRequests(userId: string): Promise<StudyBuddyRequest[]> {
    return Array.from(this.studyBuddyRequests.values())
      .filter(req => req.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async updateStudyBuddyRequest(id: string, updates: Partial<StudyBuddyRequest>): Promise<StudyBuddyRequest | undefined> {
    const request = this.studyBuddyRequests.get(id);
    if (!request) return undefined;
    
    const updatedRequest = { ...request, ...updates };
    this.studyBuddyRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  // Notes
  async getNotes(filters?: { subject?: string }): Promise<Note[]> {
    let notes = Array.from(this.notes.values());
    
    if (filters?.subject) {
      notes = notes.filter(note => note.subject.toLowerCase().includes(filters.subject!.toLowerCase()));
    }
    
    return notes.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    const id = randomUUID();
    const note: Note = {
      ...insertNote,
      id,
      downloads: 0,
      likes: 0,
      createdAt: new Date(),
    };
    this.notes.set(id, note);
    return note;
  }

  async getNoteById(id: string): Promise<Note | undefined> {
    return this.notes.get(id);
  }

  async updateNoteStats(id: string, type: 'download' | 'like'): Promise<Note | undefined> {
    const note = this.notes.get(id);
    if (!note) return undefined;
    
    const updatedNote = {
      ...note,
      [type === 'download' ? 'downloads' : 'likes']: (note[type === 'download' ? 'downloads' : 'likes'] || 0) + 1
    };
    this.notes.set(id, updatedNote);
    return updatedNote;
  }

  async getUserNotes(userId: string): Promise<Note[]> {
    return Array.from(this.notes.values())
      .filter(note => note.uploadedBy === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  // Timetables
  async getUserTimetable(userId: string): Promise<Timetable | undefined> {
    return Array.from(this.timetables.values()).find(tt => tt.userId === userId);
  }

  async createTimetable(insertTimetable: InsertTimetable): Promise<Timetable> {
    const id = randomUUID();
    const timetable: Timetable = {
      ...insertTimetable,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.timetables.set(id, timetable);
    return timetable;
  }

  async updateTimetable(userId: string, schedule: any): Promise<Timetable | undefined> {
    const existing = Array.from(this.timetables.values()).find(tt => tt.userId === userId);
    if (!existing) return undefined;
    
    const updated = {
      ...existing,
      schedule,
      updatedAt: new Date(),
    };
    this.timetables.set(existing.id, updated);
    return updated;
  }

  // Connections
  async getConnections(userId: string): Promise<Connection[]> {
    return Array.from(this.connections.values())
      .filter(conn => conn.requesterId === userId || conn.receiverId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createConnection(insertConnection: InsertConnection): Promise<Connection> {
    const id = randomUUID();
    const connection: Connection = {
      ...insertConnection,
      id,
      createdAt: new Date(),
    };
    this.connections.set(id, connection);
    return connection;
  }

  async updateConnectionStatus(id: string, status: string): Promise<Connection | undefined> {
    const connection = this.connections.get(id);
    if (!connection) return undefined;
    
    const updated = { ...connection, status };
    this.connections.set(id, updated);
    return updated;
  }

  // Messages
  async getMessages(userId1: string, userId2: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => 
        (msg.senderId === userId1 && msg.receiverId === userId2) ||
        (msg.senderId === userId2 && msg.receiverId === userId1)
      )
      .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      id,
      createdAt: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }
}

export const storage = new MemStorage();
