import pool from '../lib/utils/pool.js';
import setup from '../data/setup.js';
import request from 'supertest';
import app from '../lib/app.js';
import UserService from '../lib/services/userService.js';
import Tweet from '../lib/models/Tweet.js';
import Comment from '../lib/models/Comment.js';

describe('demo routes', () => {
  const agent = request.agent(app);
  let user;
  let tweet1;
  let tweet2;
  let comment1; // eslint-disable-line

  beforeEach(async () => {
    await setup(pool);

    //create user here
    user = await UserService.create({
      email: 'Bill',
      profilePhoto: 'photo_url',
      password: 'password'
    });

    //login that user here
    await agent.post('/api/v1/auth/login')
      .send({
        email: 'Bill',
        password: 'password'
      });

    //post tweets for that user here
    tweet1 = await Tweet.insert({
      userId: user.id,
      photoUrl: 'tweet1 url',
      caption: 'tweet1 caption',
      tags: ['tweet1 Tag1', 'tweet1 Tag2']
    });

    tweet2 = await Tweet.insert({
      userId: user.id,
      photoUrl: 'tweet2 url',
      caption: 'tweet2 caption',
      tags: ['tweet2 Tag1', 'tweet2 Tag2']
    });

    //posts comments for tweet2
    comment1 = await Comment.insert({
      commentBy: user.id,
      tweet: tweet2.id,
      comment: 'This is a comment on tweet2'
    });
  });

  //auth 
  it('Sign up a user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        email: 'jimmy',
        profilePhoto: 'photo_url',
        password: 'password'
      });

    expect(res.body).toEqual({
      id: '2',
      email: 'jimmy',
      profilePhoto: expect.any(String)
    });
  });

  it('Login a user', async () => {
    const res = await agent
      .post('/api/v1/auth/login')
      .send({
        email: 'Bill',
        password: 'password'
      });

    expect(res.body).toEqual({
      id: user.id,
      email: 'Bill',
      profilePhoto: 'photo_url'
    });
  });

  //tweets
  it('POSTS a tweet and authenticates the user', async () => {
    const res = await agent
      .post('/api/v1/tweets')
      .send({
        photoUrl: 'url',
        caption: 'caption',
        tags: []
      });

    expect(res.body).toEqual({
      id: '3',
      userId: '1',
      photoUrl: 'url',
      caption: 'caption',
      tags: []
    });
  });

  it('GETs all tweets, responding with a list of tweets', async () => {
    const res = await agent
      .get('/api/v1/tweets');
    expect(res.body).toEqual([tweet1, tweet2]);
  });

  it('GETs a tweet by id with comments and user id', async () => {
    const tweetToGet = await Tweet.insert({
      userId: user.id,
      photoUrl: '*** photo',
      caption: '*** caption',
      tags: ['*** Tag1', '*** Tag2']
    });

    //posts comments on tweetToGet
    await Comment.insert({
      commentBy: user.id,
      tweet: tweetToGet.id,
      comment: 'This is a comment on tweetToGet'
    });

    const res = await agent
      .get(`/api/v1/tweets/${tweetToGet.id}`);
    expect(res.body).toEqual([{
      'caption': '*** caption', 'comment': 'This is a comment on tweet2', 'comment_by': '1', 'id': '1', 'photo_url': '*** photo',
      'tags': ['*** Tag1', '*** Tag2'], 'tweet': '2', 'user_id': '1'
    }, {
      'caption': '*** caption', 'comment': 'This is a comment on tweetToGet',
      'comment_by': '1', 'id': '2', 'photo_url': '*** photo', 'tags': ['*** Tag1', '*** Tag2'], 'tweet': '3', 'user_id': '1'
    }]);
  });

  it('UPDATES a tweet by PATCH, requires auth and updates caption', async () => {
    //create a new tweet for user (aka Bill)
    const tweet3 = await Tweet.insert({
      userId: user.id,
      photoUrl: 'tweet3 url',
      caption: 'I\'m going to PATCH this',
      tags: ['tweet3 tag1', 'tweet3 tag2']
    });

    //modify the tweet caption
    tweet3.caption = 'This is my new PATCHed caption';

    //PATCH with new caption and authenticate user through agent
    const res = await agent
      .patch(`/api/v1/tweets/${tweet3.id}`)
      .send({ caption: 'This is my new PATCHed caption' });

    expect(res.body).toEqual(tweet3);
  });

  it('DELETES a tweet by id using authentication', async () => {
    const tweetToDelete = await Tweet.insert({
      userId: user.id,
      photoUrl: 'url',
      caption: 'delete this',
      tags: []
    });

    const res = await agent
      .delete(`/api/v1/tweets/${tweetToDelete.id}`)
      .send(tweetToDelete);

    expect(res.body).toEqual(tweetToDelete);
  });

  //comments
  it('POSTS a comment and requires authentication', async () => {
    const res = await agent
      .post('/api/v1/comments')
      .send({
        commentBy: user.id,
        tweet: tweet1.id,
        comment: 'This is a comment'
      });

    expect(res.body).toEqual({
      id: '2',
      commentBy: user.id,
      tweet: tweet1.id,
      comment: 'This is a comment'
    });
  });

  it('DELETES a comment and requires authentication', async () => {
    const commentToDelete = await Comment.insert({
      commentBy: user.id,
      tweet: tweet1.id,
      comment: 'This is a comment'
    });

    const res = await agent
      .delete(`/api/v1/comments/${commentToDelete.id}`)
      .send(commentToDelete);

    expect(res.body).toEqual(commentToDelete);
  });

  it('GETS the 10 most commented posts ', async () => {
    const tweet1 = await Tweet.insert({
      userId: user.id,
      photoUrl: '*',
      caption: '*',
      tags: ['*']
    });

    await Comment.insert({
      commentBy: 1,
      tweet: tweet1.id,
      comment: '*'
    });

    await Comment.insert({
      commentBy: 1,
      tweet: tweet1.id,
      comment: '**'
    });

    await Comment.insert({
      commentBy: 1,
      tweet: tweet1.id,
      comment: '***'
    });

    const res = await request(app)
      .get('/api/v1/tweets/popular');
    //the first element in res.body has the popular tweet
    expect(res.body[0]).toEqual(tweet1);
  });

});
