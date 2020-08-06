// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')

// pull in Mongoose model for paddocks
const Paddock = require('../models/paddock')

// this is a collection of methods that help us detect situations when we need
// to throw a custom error
const customErrors = require('../../lib/custom_errors')

// we'll use this function to send 404 when non-existant document is requested
const handle404 = customErrors.handle404
// we'll use this function to send 401 when a user tries to modify a resource
// that's owned by someone else
const requireOwnership = customErrors.requireOwnership

// this is middleware that will remove blank fields from `req.body`, e.g.
// { paddock: { title: '', text: 'foo' } } -> { paddock: { text: 'foo' } }
const removeBlanks = require('../../lib/remove_blank_fields')
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const router = express.Router()

// INDEX
// GET /paddocks
router.get('/paddocks', requireToken, (req, res, next) => {
  Paddock.find()
    .then(paddocks => {
      // `paddocks` will be an array of Mongoose documents
      // we want to convert each one to a POJO, so we use `.map` to
      // apply `.toObject` to each one
      return paddocks.map(paddock => paddock.toObject())
    })
    // respond with status 200 and JSON of the paddocks
    .then(paddocks => res.status(200).json({ paddocks: paddocks }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// SHOW
// GET /paddocks/5a7db6c74d55bc51bdf39793
router.get('/paddocks/:id', requireToken, (req, res, next) => {
  // req.params.id will be set based on the `:id` in the route
  Paddock.findById(req.params.id)
    .then(handle404)
    // if `findById` is succesful, respond with 200 and "paddock" JSON
    .then(paddock => res.status(200).json({ paddock: paddock.toObject() }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// CREATE
// POST /paddocks
// new paddocks already have an owner, so they don't need a token.  A person must be signed in in order to create a new Paddock...so, only the show will need some sort of refinement...
router.post('/paddocks', (req, res, next) => {
  // set owner of new paddock to be current user
  // req.body.paddock.owner = req.user._id
  // console.log(req.user._id)

  Paddock.create(req.body.paddock)
    // respond to succesful `create` with status 201 and JSON of new "paddock"
    .then(paddock => {
      res.status(201).json({ paddock: paddock.toObject() })
    })
    // if an error occurs, pass it off to our error handler
    // the error handler needs the error message and the `res` object so that it
    // can send an error message back to the client
    .catch(next)
})

// UPDATE
// PATCH /paddocks/5a7db6c74d55bc51bdf39793
router.patch('/paddocks/:id', requireToken, removeBlanks, (req, res, next) => {
  // if the client attempts to change the `owner` property by including a new
  // owner, prevent that by deleting that key/value pair
  delete req.body.paddock.owner

  Paddock.findById(req.params.id)
    .then(handle404)
    .then(paddock => {
      // pass the `req` object and the Mongoose record to `requireOwnership`
      // it will throw an error if the current user isn't the owner
      requireOwnership(req, paddock)

      // pass the result of Mongoose's `.update` to the next `.then`
      return paddock.updateOne(req.body.paddock)
    })
    // if that succeeded, return 204 and no JSON
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// DESTROY
// DELETE /paddocks/5a7db6c74d55bc51bdf39793
router.delete('/paddocks/:id', requireToken, (req, res, next) => {
  Paddock.findById(req.params.id)
    .then(handle404)
    .then(paddock => {
      // throw an error if current user doesn't own `paddock`
      requireOwnership(req, paddock)
      // delete the paddock ONLY IF the above didn't throw
      paddock.deleteOne()
    })
    // send back 204 and no content if the deletion succeeded
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

module.exports = router
