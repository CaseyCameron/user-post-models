import jwt from 'jsonwebtoken';
import pool from '../utils/pool.js';

export default class User {
  id;
  email;
  profilePhoto;
  passwordHash;

  constructor(row) {
    this.id = row.id;
    this.email = row.email;
    this.profilePhoto = row.profile_photo;
    this.passwordHash = row.password_hash;
  }

  static async insert({ email, profilePhoto, passwordHash }) {
    const { rows } = await pool.query(
      'INSERT INTO users (email, profile_photo, password_hash) VALUES ($1, $2, $3) RETURNING *',
      [email, profilePhoto, passwordHash]
    );
    return new User(rows[0]);
  }

  authToken() {
    return jwt.sign({ ...this }, process.env.APP_SECRET, {
      expiresIn: '24h'
    });
  }
}