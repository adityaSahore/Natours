/* eslint-disable import/no-extraneous-dependencies */
const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');
// const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A Tour must have a Name'],
      unique: true,
      trim: true, //! removes the whitespaces
      maxlength: [40, 'A Tour must have less than or equal to 40 characters'],
      minlength: [10, 'A Tour must have more than or equal to 10 characters'],
      // validate: [validator.isAlpha, 'Tour name must only contain characters'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A Tour must have a Duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A Tour must have a Group Size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A Tour must have a Difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either Easy, Medium or Difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A Tour must have a Price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: 'Discount ({ value }) must be below Tour price',
      },
    },
    summary: {
      type: String,
      required: [true, 'A Tour must have a Summary'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A Tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, //! hides from the client from response
    },
    startDates: [Date],
    secretTour: { type: Boolean, default: false },
    // startLocation: {
    // GeoJSON
    //   type: {
    //     type: String,
    //     default: 'Point',
    //     enum: ['Point'],
    //   },
    //   coordinates: [Number],
    //   address: String,
    //   description: String,
    // },
    // locations: [
    //   {
    //     type: {
    //       type: String,
    //       default: 'Point',
    //       enum: ['Point'],
    //     },
    //     coordinates: [Number],
    //     address: String,
    //     description: String,
    //     day: Number,
    //   },
    // ],
    guides: [
      {
        // type: Array,
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

//! Virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

//! Document Middleware: runs before .save() and .create()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true }); //* this points to the document being processed */
  next();
});

// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

//! Document middleware (post): runs after .save() and .create()
// tourSchema.post('save', (doc, next) => {
//   console.log(doc);
//   next();
// });

//! Query middleware: runs before .find()
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } }); //* this points to the query being processed */
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

//! Aggregation middleware
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
// In Node.js, each module has an object called module that represents the current module. The module object has a
// property called exports, which is initially an empty object. By default, module.exports points to the same empty
// object as exports, which allows you to add properties and methods to it using exports.

// When you assign mongoose.model('Tour', tourSchema) directly to module.exports, you are overriding the default
// empty object and replacing it with the result of the mongoose.model call. This means that the Tour model is directly
// exported as the default export of the module.

// On the other hand, when you use exports.Tour = mongoose.model('Tour', tourSchema);, you are adding a new property
// Tour to the exports object. In this case, the exports object itself is still the default export of the module, and you
// are simply attaching the Tour model as a property of that object.

// So, changing the export statement to module.exports allows you to directly export the Tour model as the default export
// of the module. This is why the error went away and the POST request was successful, as the exported model is now
// being correctly imported and used in other parts of your code.

// Both approaches are valid and can be used depending on your needs. The choice between exports.Tour and module.exports
//  depends on whether you want to export multiple properties or only the Tour model from the module.
