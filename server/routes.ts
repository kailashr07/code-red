import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertStudyBuddyRequestSchema, 
  insertNoteSchema,
  insertTimetableSchema,
  insertConnectionSchema,
  insertMessageSchema 
} from "@shared/schema";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";
import { getStudyResourceRecommendations, answerStudyQuestion, generateStudyPlan } from "./services/openai";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication endpoints
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      res.status(201).json({ 
        user: { ...user, password: undefined },
        message: "User registered successfully" 
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      res.json({ 
        user: { ...user, password: undefined },
        message: "Login successful" 
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Study buddy endpoints
  app.get("/api/study-buddies", async (req, res) => {
    try {
      const { subject, topic, location } = req.query;
      const requests = await storage.getStudyBuddyRequests({
        subject: subject as string,
        topic: topic as string,
        location: location as string,
      });

      // Enrich with user data
      const enrichedRequests = await Promise.all(
        requests.map(async (request) => {
          const user = await storage.getUser(request.userId);
          return {
            ...request,
            user: user ? { ...user, password: undefined } : null,
          };
        })
      );

      res.json(enrichedRequests);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/study-buddies", async (req, res) => {
    try {
      const requestData = insertStudyBuddyRequestSchema.parse(req.body);
      const request = await storage.createStudyBuddyRequest(requestData);
      res.status(201).json(request);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/study-buddies/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const requests = await storage.getUserStudyBuddyRequests(userId);
      res.json(requests);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Notes endpoints
  app.get("/api/notes", async (req, res) => {
    try {
      const { subject } = req.query;
      const notes = await storage.getNotes({ subject: subject as string });
      
      // Enrich with user data
      const enrichedNotes = await Promise.all(
        notes.map(async (note) => {
          const user = await storage.getUser(note.uploadedBy);
          return {
            ...note,
            uploader: user ? { fullName: user.fullName, username: user.username } : null,
          };
        })
      );

      res.json(enrichedNotes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/notes", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { title, subject, description, uploadedBy } = req.body;
      
      const noteData = {
        title,
        subject,
        description,
        fileName: req.file.originalname,
        fileType: path.extname(req.file.originalname),
        fileSize: req.file.size,
        filePath: req.file.path,
        uploadedBy,
      };

      const note = await storage.createNote(noteData);
      res.status(201).json(note);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/notes/:id/download", async (req, res) => {
    try {
      const { id } = req.params;
      const note = await storage.getNoteById(id);
      
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }

      // Update download count
      await storage.updateNoteStats(id, 'download');
      
      // Serve file
      if (fs.existsSync(note.filePath)) {
        res.download(note.filePath, note.fileName);
      } else {
        res.status(404).json({ message: "File not found" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/notes/:id/like", async (req, res) => {
    try {
      const { id } = req.params;
      const note = await storage.updateNoteStats(id, 'like');
      
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }

      res.json(note);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Timetable endpoints
  app.get("/api/timetable/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const timetable = await storage.getUserTimetable(userId);
      res.json(timetable);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/timetable", async (req, res) => {
    try {
      const timetableData = insertTimetableSchema.parse(req.body);
      const timetable = await storage.createTimetable(timetableData);
      res.status(201).json(timetable);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/timetable/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { schedule } = req.body;
      const timetable = await storage.updateTimetable(userId, schedule);
      
      if (!timetable) {
        return res.status(404).json({ message: "Timetable not found" });
      }

      res.json(timetable);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Connection endpoints
  app.get("/api/connections/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const connections = await storage.getConnections(userId);
      res.json(connections);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/connections", async (req, res) => {
    try {
      const connectionData = insertConnectionSchema.parse(req.body);
      const connection = await storage.createConnection(connectionData);
      res.status(201).json(connection);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/connections/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const connection = await storage.updateConnectionStatus(id, status);
      
      if (!connection) {
        return res.status(404).json({ message: "Connection not found" });
      }

      res.json(connection);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Messages endpoints
  app.get("/api/messages/:userId1/:userId2", async (req, res) => {
    try {
      const { userId1, userId2 } = req.params;
      const messages = await storage.getMessages(userId1, userId2);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // AI Assistant endpoints
  app.post("/api/ai/recommendations", async (req, res) => {
    try {
      const { subject, topic, userLevel } = req.body;
      const recommendations = await getStudyResourceRecommendations(subject, topic, userLevel);
      res.json({ recommendations });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/ai/question", async (req, res) => {
    try {
      const { question, context } = req.body;
      const answer = await answerStudyQuestion(question, context);
      res.json({ answer });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/ai/study-plan", async (req, res) => {
    try {
      const { subjects, timeAvailable, goals } = req.body;
      const plan = await generateStudyPlan(subjects, timeAvailable, goals);
      res.json({ plan });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
