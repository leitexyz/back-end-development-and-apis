
import express from "express";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

import {
  findByUsername,
  findById,
  getWatchlist,
  addMovie,
  updateMovie,
  deleteMovie
} from "./utils/db.js";

import { authenticate } from "./middleware/authenticate.js";
import { authorizeModification } from "./middleware/authorize.js";

const app = express();

app.use(helmet());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Rota inicial
app.get("/", (req, res) => {
  res.json({
    message: "Family Movie Watchlist API"
  });
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      message: "Username and password are required"
    });
  }

  const user = findByUsername(username);

  if (!user) {
    return res.status(401).json({
      message: "Invalid username or password"
    });
  }

  const passwordIsValid = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!passwordIsValid) {
    return res.status(401).json({
      message: "Invalid username or password"
    });
  }

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h"
    }
  );

  return res.json({
    message: "Login successful",
    token
  });
});

// GET WATCHLIST
app.get(
  "/api/users/:userId/watchlist",
  authenticate,
  authorizeModification,
  (req, res) => {
    const userId = Number(req.params.userId);

    const user = findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const watchlist = getWatchlist(userId);

    return res.json({
      userId,
      watchlist
    });
  }
);

// ADD MOVIE
app.post(
  "/api/users/:userId/watchlist",
  authenticate,
  authorizeModification,
  (req, res) => {
    const userId = Number(req.params.userId);
    const { title, genre } = req.body;

    const user = findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof genre !== "string" ||
      !genre.trim()
    ) {
      return res.status(400).json({
        message: "Title and genre are required"
      });
    }

    const movie = addMovie(userId, {
      title: title.trim(),
      genre: genre.trim()
    });

    return res.status(201).json({
      message: "Movie added successfully",
      movie
    });
  }
);

// UPDATE MOVIE
app.put(
  "/api/users/:userId/watchlist/:movieId",
  authenticate,
  authorizeModification,
  (req, res) => {
    const userId = Number(req.params.userId);
    const movieId = Number(req.params.movieId);

    const user = findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (!Number.isInteger(movieId) || movieId <= 0) {
      return res.status(400).json({
        message: "Invalid movie ID"
      });
    }

    const { title, genre, watched } = req.body;
    const updates = {};

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
          message: "Title must be a non-empty string"
        });
      }

      updates.title = title.trim();
    }

    if (genre !== undefined) {
      if (typeof genre !== "string" || !genre.trim()) {
        return res.status(400).json({
          message: "Genre must be a non-empty string"
        });
      }

      updates.genre = genre.trim();
    }

    if (watched !== undefined) {
      if (typeof watched !== "boolean") {
        return res.status(400).json({
          message: "Watched must be true or false"
        });
      }

      updates.watched = watched;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "At least one field is required"
      });
    }

    const movie = updateMovie(
      userId,
      movieId,
      updates
    );

    if (!movie) {
      return res.status(404).json({
        message: "Movie not found"
      });
    }

    return res.json({
      message: "Movie updated successfully",
      movie
    });
  }
);

// DELETE MOVIE
app.delete(
  "/api/users/:userId/watchlist/:movieId",
  authenticate,
  authorizeModification,
  (req, res) => {
    const userId = Number(req.params.userId);
    const movieId = Number(req.params.movieId);

    const user = findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (!Number.isInteger(movieId) || movieId <= 0) {
      return res.status(400).json({
        message: "Invalid movie ID"
      });
    }

    const deleted = deleteMovie(userId, movieId);

    if (!deleted) {
      return res.status(404).json({
        message: "Movie not found"
      });
    }

    return res.json({
      message: "Movie deleted successfully"
    });
  }
);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
