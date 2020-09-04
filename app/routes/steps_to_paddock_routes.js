// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')
// const mongoose = require('mongoose')

// pull in the paddock that the step files will be added to.
const Paddock = require('../models/paddock')
// pull in Mongoose model for steps
// const stepSchema = require('../models/step')
// turn it into a mongoose model.
// const System = mongoose.model('System', stepSchema)

// this is a collection of methods that help us detect situations when we need
// to throw a custom error
const customErrors = require('../../lib/custom_errors')

// we'll use this function to send 404 when non-existant document is requested
const handle404 = customErrors.handle404
// we'll use this function to send 401 when a user tries to modify a resource
// that's owned by someone else
// const requireOwnership = customErrors.requireOwnership

// this is middleware that will remove blank fields from `req.body`, e.g.
// { step: { title: '', text: 'foo' } } -> { step: { text: 'foo' } }
// const removeBlanks = require('../../lib/remove_blank_fields')
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const router = express.Router()

// INDEX
// GET /paddocks/:id/steps
router.get('/paddocks/:padId/steps/:stepId', (req, res, next) => {
  // Adding an owner's value to the step.find to show only those
  // steps owned by the person signed in.
  // const whosePaddock = { owner: req.user.id }
  // const whichPaddock = req.body.paddock.id
  console.log('api 42 GET')
  const padId = req.params.padId
  Paddock.findById(padId)
    .then(paddock => {
      // `steps` will be an array of Mongoose documents
      // we want to convert each one to a POJO, so we use `.map` to
      // apply `.toObject` to each one
      return paddock.steps.map(step => step.toObject())
    })
    // respond with status 200 and JSON of the steps
    .then(steps => res.status(200).json({ steps: steps }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// SHOW
// GET /steps/5a7db6c74d55bc51bdf39793
// router.get('/steps/:id', requireToken, (req, res, next) => {
//   // req.params.id will be set based on the `:id` in the route
//   System.findById(req.params.id)
//     .then(handle404)
//     // if `findById` is succesful, respond with 200 and "step" JSON
//     .then(step => res.status(200).json({ step: step.toObject() }))
//     // if an error occurs, pass it to the handler
//     .catch(next)
// })

// CREATE
// POST /steps
// new steps already have an owner, so they don't need a token.  A person must be signed in in order to create a new System...so, only the show will need some sort of refinement...
router.post('/paddocks/:id', (req, res, next) => {
  console.log(req.params.id)
  console.log(req.body.paddock.steps)
  // let stepData
  const paddockId = req.params.id
  console.log('Hello from the backend')

  Paddock.findById(paddockId)
    .then(handle404)
    .then((paddock) => {
      console.log('line 87 paddock')
      return paddock
    })
    .then(paddock => {
      const stepData = req.body.paddock.steps
      paddock.steps.push(stepData)
      return paddock.save()
    })
    .then(paddock => {
      res.status(201).json({ paddock: paddock.toObject() })
    })
    .catch(next)
})

// UPDATE
// PATCH /steps/5a7db6c74d55bc51bdf39793
// router.patch('/steps/:id', requireToken, removeBlanks, (req, res, next) => {
//   // if the client attempts to change the `owner` property by including a new
//   // owner, prevent that by deleting that key/value pair
//   delete req.body.step.owner
//
//   System.findById(req.params.id)
//     .then(handle404)
//     .then(step => {
//       // pass the `req` object and the Mongoose record to `requireOwnership`
//       // it will throw an error if the current user isn't the owner
//       requireOwnership(req, step)
//
//       // pass the result of Mongoose's `.update` to the next `.then`
//       return step.updateOne(req.body.step)
//     })
//     // if that succeeded, return 204 and no JSON
//     .then(() => res.sendStatus(204))
//     // if an error occurs, pass it to the handler
//     .catch(next)
// })

// DESTROY
// DELETE /steps/5a7db6c74d55bc51bdf39793
router.delete('/paddocks/:id/step/:step_id', requireToken, (req, res, next) => {
  const stepId = req.params.step_id
  Paddock.findById(req.params.id)
    .then(paddock => {
      paddock.steps.id(stepId).remove()
      return paddock.save()
    })
    // send back 204 and no content if the deletion succeeded
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

router.delete('/paddocks/:id', (req, res, next) => {
  Paddock.findOne({ owner: req.params.id })
    .then(paddock => {
      paddock.steps.$pop()
      return paddock.save()
    })
    .then(() => res.sendStatus(204))
    .catch(next)
})

module.exports = router
