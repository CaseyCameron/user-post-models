import { Router } from 'express';
//import ensureAuth from '../middleware/ensure-auth.js';
import UserService from '../services/userService.js';

const ONE_DAY = 1000 * 60 * 60 * 24;

export default Router()
  .post('/signup', (req, res, next) => {
    UserService.create(req.body)
      .then(user => {
        // attach a JWT to the response
        res.cookie('session', user.authToken(), {
          httpOnly: true,
          maxAge: ONE_DAY
        });
        res.send(user);
      })
      .catch(next);
  })

  .post('/login', (req, res, next) => {
    UserService.authorize(req.body)
      .then(user => {
        res.cookie('session', user.authToken(), {
          httpOnly: true,
          maxAge: ONE_DAY
        });
        res.send(user);
      })
      .catch(next);
  });
