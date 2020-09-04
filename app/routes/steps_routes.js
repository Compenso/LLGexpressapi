// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')

// pull in Mongoose model for steps
const mongoose = require('mongoose')
const stepsSchema = require('../models/steps')
const Steps = mongoose.model('Steps', stepsSchema)

// this is a collection of methods that help us detect situations when we need
// to throw a custom error
const customErrors = require('../../lib/custom_errors')

// we'll use this function to send 404 when non-existant document is requested
const handle404 = customErrors.handle404
// we'll use this function to send 401 when a user tries to modify a resource
// that's owned by someone else
const requireOwnership = customErrors.requireOwnership

// this is middleware that will remove blank fields from `req.body`, e.g.
// { step: { title: '', text: 'foo' } } -> { step: { text: 'foo' } }
const removeBlanks = require('../../lib/remove_blank_fields')
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const router = express.Router()

// INDEX
// GET /steps
router.get('/steps', requireToken, (req, res, next) => {
  // Adding an owner's value to the step.find to show only those
  // steps owned by the person signed in.
  const whosePaddock = { owner: req.user.id }
  // const whichPaddock = req.body.step.id
  Steps.find(whosePaddock)
    .then(steps => {
      // `steps` will be an array of Mongoose documents
      // we want to convert each one to a POJO, so we use `.map` to
      // apply `.toObject` to each one
      return steps.map(step => step.toObject())
    })
    // respond with status 200 and JSON of the steps
    .then(steps => res.status(200).json({ steps: steps }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// SHOW
// GET /steps/5a7db6c74d55bc51bdf39793
router.get('/steps/:id', requireToken, (req, res, next) => {
  // req.params.id will be set based on the `:id` in the route
  Steps.findById(req.params.id)
    .then(handle404)
    // if `findById` is succesful, respond with 200 and "step" JSON
    .then(step => res.status(200).json({ step: step.toObject() }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// CREATE
// POST /steps
// new steps already have an owner, so they don't need a token.  A person must be signed in in order to create a new Steps...so, only the show will need some sort of refinement...
router.post('/steps', (req, res, next) => {
  // set owner of new step to be current user
  // req.body.step.owner = req.user._id
  // console.log(req.user._id)

  Steps.create(req.body.step)
    // respond to succesful `create` with status 201 and JSON of new "step"
    .then(step => {
      res.status(201).json({ step: step.toObject() })
    })
    // if an error occurs, pass it off to our error handler
    // the error handler needs the error message and the `res` object so that it
    // can send an error message back to the client
    .catch(next)
})

// UPDATE
// PATCH /steps/5a7db6c74d55bc51bdf39793
router.patch('/steps/:id', requireToken, removeBlanks, (req, res, next) => {
  // if the client attempts to change the `owner` property by including a new
  // owner, prevent that by deleting that key/value pair
  delete req.body.step.owner

  Steps.findById(req.params.id)
    .then(handle404)
    .then(step => {
      // pass the `req` object and the Mongoose record to `requireOwnership`
      // it will throw an error if the current user isn't the owner
      requireOwnership(req, step)

      // pass the result of Mongoose's `.update` to the next `.then`
      return step.updateOne(req.body.step)
    })
    // if that succeeded, return 204 and no JSON
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// DESTROY
// DELETE /steps/5a7db6c74d55bc51bdf39793
router.delete('/steps/:id', requireToken, (req, res, next) => {
  Steps.findById(req.params.id)
    .then(handle404)
    .then(step => {
      // throw an error if current user doesn't own `step`
      requireOwnership(req, step)
      // delete the step ONLY IF the above didn't throw
      step.deleteOne()
    })
    // send back 204 and no content if the deletion succeeded
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

module.exports = router
