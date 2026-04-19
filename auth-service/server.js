const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { DataTypes } = require("sequelize");
require("dotenv").config();

const logger = require("./logger");
const sequelize = require("./db");
const { metricsMiddleware, metricsHandler } = require("./metrics");

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(metricsMiddleware());

// Define User Model
const User = sequelize.define("User", {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: "user",
  },
});

const Team = sequelize.define("Team", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

const UserTeam = sequelize.define("UserTeam", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  }
});

User.belongsToMany(Team, { through: UserTeam });
Team.belongsToMany(User, { through: UserTeam });

// Sync Database & Seed Initial Users
(async () => {
  try {
    await sequelize.sync({ alter: true });
    logger.info("Auth Database synced with schema updates");
    
    // Seed admin if not exists
    const adminCount = await User.count({ where: { username: "admin" } });
    if (adminCount === 0) {
      await User.create({
        username: "admin",
        passwordHash: bcrypt.hashSync("admin123", 10),
        role: "admin",
      });
      await User.create({
        username: "user",
        passwordHash: bcrypt.hashSync("user123", 10),
        role: "user",
      });
      logger.info("Default users seeded");
    }
  } catch (err) {
    logger.error({ err }, "Database sync failed");
  }
})();

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
    database: "connected",
  });
});

app.post("/auth/register", async (req, res) => {
  const { username, password, email, phoneNumber, firstName, lastName } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(409).json({ error: "Username already exists" });
    }

    if (email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(409).json({ error: "Email already exists" });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      passwordHash,
      email,
      phoneNumber,
      firstName,
      lastName,
      role: "user"
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName
      }
    });
  } catch (err) {
    logger.error({ err }, "Registration error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const foundUser = await User.findOne({ where: { username } });
    const ok =
      foundUser && password && (await bcrypt.compare(password, foundUser.passwordHash));

    if (!ok) {
      return res.status(401).json({
        error: "Invalid username or password",
      });
    }

    const token = jwt.sign(
      {
        username: foundUser.username,
        role: foundUser.role,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        username: foundUser.username,
        role: foundUser.role,
        firstName: foundUser.firstName,
        lastName: foundUser.lastName
      },
    });
  } catch (err) {
    logger.error({ err }, "Login error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// TEAM & USER ENDPOINTS
app.get("/users", async (req, res) => {
  try {
    const users = await User.findAll({ attributes: ['id', 'username', 'email', 'firstName', 'lastName'] });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.get("/teams", async (req, res) => {
  try {
    const teams = await Team.findAll({ include: User });
    res.json(teams);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch teams" });
  }
});

app.post("/teams", async (req, res) => {
  try {
    const { name } = req.body;
    const team = await Team.create({ name });
    res.status(201).json(team);
  } catch (err) {
    res.status(500).json({ error: "Failed to create team" });
  }
});

app.post("/teams/:id/members", async (req, res) => {
  try {
    const { userId } = req.body;
    const team = await Team.findByPk(req.params.id);
    const user = await User.findByPk(userId);
    if (!team || !user) return res.status(404).json({ error: "Team or User not found" });
    
    await team.addUser(user);
    res.json({ message: "User added to team" });
  } catch (err) {
    res.status(500).json({ error: "Failed to add member" });
  }
});

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info({ port: PORT }, "Auth Service listening");
  });
}
