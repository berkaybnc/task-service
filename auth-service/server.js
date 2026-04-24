const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
require("dotenv").config();

const logger = require("./logger");
const connectDB = require("./db");
const { metricsMiddleware, metricsHandler } = require("./metrics");

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(metricsMiddleware());

// Define Mongoose Schemas
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  firstName: String,
  lastName: String,
  email: { type: String, unique: true, sparse: true },
  phoneNumber: String,
  passwordHash: { type: String, required: true },
  role: { type: String, default: "user" },
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }]
}, { timestamps: true });

const TeamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

const User = mongoose.model("User", UserSchema);
const Team = mongoose.model("Team", TeamSchema);

// Connect to DB and Seed
(async () => {
  try {
    await connectDB();
    const adminExists = await User.findOne({ username: "admin" });
    if (!adminExists) {
      const adminHash = await bcrypt.hash("admin123", 10);
      const userHash = await bcrypt.hash("user123", 10);
      
      await User.create({ username: "admin", passwordHash: adminHash, role: "admin" });
      await User.create({ username: "user", passwordHash: userHash, role: "user" });
      logger.info("Default users seeded in MongoDB");
    }
  } catch (err) {
    logger.warn({ err: err.message }, "DB connection/seeding skipped (test or no MONGODB_URI)");
  }
})();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.use((req, res, next) => {
  logger.info({ method: req.method, url: req.url }, "request");
  next();
});

const PORT = process.env.PORT || 3001;

app.get("/metrics", (req, res, next) => {
  metricsHandler(req, res).catch(next);
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "auth-service",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

app.post("/auth/register", async (req, res) => {
  const { username, password, email, phoneNumber, firstName, lastName } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Username and password are required" });

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(409).json({ error: "Username already exists" });

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await User.create({ username, passwordHash, email, phoneNumber, firstName, lastName });

    res.status(201).json({ message: "User registered successfully", user: { id: newUser._id, username: newUser.username } });
  } catch (err) {
    logger.error({ err }, "Registration error");
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const foundUser = await User.findOne({ username });
    if (!foundUser || !(await bcrypt.compare(password, foundUser.passwordHash))) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const token = jwt.sign({ id: foundUser._id, username: foundUser.username, role: foundUser.role }, JWT_SECRET, { expiresIn: "1h" });
    res.status(200).json({ token, user: { username: foundUser.username, role: foundUser.role, firstName: foundUser.firstName } });
  } catch (err) {
    logger.error({ err }, "Login error");
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/users", async (req, res) => {
  try {
    const users = await User.find({}, 'username email firstName lastName role');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.get("/teams", authenticateToken, async (req, res) => {
  try {
    const teams = await Team.find({ members: req.user.id }).populate('members', 'username');
    res.json(teams);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch teams" });
  }
});

app.post("/teams", authenticateToken, async (req, res) => {
  try {
    const team = await Team.create({ 
      name: req.body.name,
      members: [req.user.id]
    });
    // Also update the user's teams list
    await User.findByIdAndUpdate(req.user.id, { $push: { teams: team._id } });
    res.status(201).json(team);
  } catch (err) {
    res.status(500).json({ error: "Failed to create team" });
  }
});

app.post("/teams/:id/members", async (req, res) => {
  try {
    const { userId, username } = req.body;
    const team = await Team.findById(req.params.id);
    
    let user;
    if (userId) {
      user = await User.findById(userId);
    } else if (username) {
      user = await User.findOne({ username });
    }
    if (!team || !user) return res.status(404).json({ error: "Team or User not found" });

    if (!team.members.includes(user._id)) {
      team.members.push(user._id);
      await team.save();
    }
    if (!user.teams.includes(req.params.id)) {
      user.teams.push(req.params.id);
      await user.save();
    }
    res.json({ message: "User added to team" });
  } catch (err) {
    res.status(500).json({ error: "Failed to add member" });
  }
});

if (require.main === module) {
  app.listen(PORT, () => logger.info({ port: PORT }, "Auth Service (MongoDB) listening"));
}

module.exports = app;
