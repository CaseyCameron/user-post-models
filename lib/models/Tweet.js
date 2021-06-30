import pool from '../utils/pool';

export default class Tweet {
  id;
  userId;
  photoUrl;
  caption;
  tags;

  constructor(row) {
    this.id = row.id;
    this.userId = row.user_id;
    this.photoUrl = row.photo_url;
    this.caption = row.caption;
    this.tags = row.tags;
  }

  static async insert({ userId, photoUrl, caption, tags }) {
    const { rows } = await pool.query(
      'INSERT INTO tweets (user_id, photo_url, caption, tags) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, photoUrl, caption, tags]
    );
    return new Tweet(rows[0]);
  }

  static async findTweets() {
    const { rows } = await pool.query(
      'SELECT * FROM tweets',
    );
    return rows.map(row => new Tweet(row));
  }

  static async patchTweet(tweet, id) {
    const { rows } = await pool.query(
      `
      UPDATE tweets
      SET caption = $1
      WHERE id = $2
      RETURNING *
      `,
      [tweet.caption, id]
    );
    return new Tweet(rows[0]);
  }
}