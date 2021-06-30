import { Router } from 'express';
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
  });