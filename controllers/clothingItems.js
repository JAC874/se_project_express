const BadRequestError = require("../errors/bad-request-err");
const ForbiddenError = require("../errors/forbidden-err");
const NotFoundError = require("../errors/not-found-err");
const ClothingItem = require("../models/clothingItem");
const { ERROR_MESSAGES } = require("../utils/errors");

// Get all items
const getItems = (req, res, next) => {
  ClothingItem.find({})
    .then((items) => res.send({ data: items }))
    .catch((err) => {
      console.error(err);
      return next(err);
    });
};

// Create a new item
const createItem = (req, res, next) => {
  const { name, weather, imageUrl } = req.body;
  const { _id } = req.user; // Uniform destructuring

  if (!name || !weather || !imageUrl) {
    return next(new BadRequestError(ERROR_MESSAGES.BAD_REQUEST));
  }

  return ClothingItem.create({ name, weather, imageUrl, owner: _id })
    .then((item) => res.status(201).send({ data: item }))
    .catch((err) => {
      if (err.name === "ValidationError") {
        return next(new BadRequestError(ERROR_MESSAGES.BAD_REQUEST));
      }
      return next(err);
    });
};

// Delete an item
const deleteItem = async (req, res, next) => {
  const { itemId } = req.params;
  const { _id } = req.user; // Uniform destructuring

  try {
    const item = await ClothingItem.findById(itemId).orFail(() => {
      throw new NotFoundError(ERROR_MESSAGES.NOT_FOUND);
    });

    if (item.owner.toString() !== _id) {
      return next(new ForbiddenError(ERROR_MESSAGES.FORBIDDEN));
    }

    await ClothingItem.findByIdAndDelete(itemId);
    return res.send({ message: "Item successfully deleted" });
  } catch (err) {
    console.error("deleteItem error name: ", err.name);
    if (err.name === "CastError") {
      return next(new BadRequestError(ERROR_MESSAGES.BAD_REQUEST));
    }
    return next(err);
  }
};

// Like an item
const likeItem = (req, res, next) => {
  const { _id } = req.user; // Uniform destructuring

  ClothingItem.findByIdAndUpdate(
    req.params.itemId,
    { $addToSet: { likes: _id } }, // Add the user's id to likes array
    { new: true } // Return the updated document
  )
    .orFail(() => new NotFoundError(ERROR_MESSAGES.NOT_FOUND)) // Fail if item is not found
    .then((item) => res.send({ data: item }))
    .catch((err) => {
      if (err.name === "CastError") {
        return next(new BadRequestError(ERROR_MESSAGES.BAD_REQUEST));
      }
      return next(err);
    });
};

// Dislike an item
const dislikeItem = (req, res, next) => {
  const { _id } = req.user; // Uniform destructuring

  ClothingItem.findByIdAndUpdate(
    req.params.itemId,
    { $pull: { likes: _id } }, // Remove the user's id from likes array
    { new: true } // Return the updated document
  )
    .orFail(() => new NotFoundError(ERROR_MESSAGES.NOT_FOUND)) // Fail if item is not found
    .then((item) => res.send({ data: item }))
    .catch((err) => {
      if (err.name === "CastError") {
        return next(new BadRequestError(ERROR_MESSAGES.BAD_REQUEST));
      }
      return next(err);
    });
};

module.exports = { getItems, createItem, likeItem, deleteItem, dislikeItem };
