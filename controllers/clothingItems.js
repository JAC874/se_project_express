const BadRequestError = require("../errors/bad-request-err");
const ForbiddenError = require("../errors/forbidden-err");
const NotFoundError = require("../errors/not-found-err");
const ClothingItem = require("../models/clothingItem");
const { ERROR_CODES, ERROR_MESSAGES } = require("../utils/errors");

const getItems = (req, res, next) => {
  ClothingItem.find({})
    .then((items) => res.send({ data: items }))
    .catch((err) => {
      console.error(err);
      return next(err);
    });
};

const createItem = (req, res, next) => {
  const { name, weather, imageUrl } = req.body;
  const owner = req.user._id;

  if (!name || !weather || !imageUrl) {
    return next(new BadRequestError(ERROR_MESSAGES.BAD_REQUEST));
  }

  return ClothingItem.create({ name, weather, imageUrl, owner })
    .then((item) => res.status(201).send({ data: item }))
    .catch((err) => {
      if (err.name === "ValidationError") {
        return next(new BadRequestError(ERROR_MESSAGES.BAD_REQUEST));
      }
      return next(err);
    });
};

const deleteItem = async (req, res, next) => {
  const { itemId } = req.params;
  console.log("clothing item id: ", itemId);
  try {
    const item = await ClothingItem.findById(itemId).orFail(() => {
      throw new NotFoundError(ERROR_MESSAGES.NOT_FOUND);
    });

    if (item.owner.toString() !== req.user._id.toString()) {
      return next(new ForbiddenError(ERROR_MESSAGES.FORBIDDEN));
    }

    await ClothingItem.findByIdAndDelete(itemId);
    return res.send({ message: "Item successfully deleted" });
  } catch (err) {
    console.error("deleteItem error name: ", err.name);
    // const statusCode = err.statusCode || 500;
    if (err.name === "CastError") {
      return next(new BadRequestError(ERROR_MESSAGES.BAD_REQUEST));
    }
    return next(err);
  }
};

const likeItem = (req, res, next) => {
  ClothingItem.findByIdAndUpdate(
    req.params.itemId,
    { $addToSet: { likes: req.user._id } },
    { new: true }
  )
    .orFail(() => new NotFoundError(ERROR_MESSAGES.NOT_FOUND))
    .then((item) => res.send({ data: item }))
    .catch((err) => {
      if (err.name === "CastError") {
        return next(new BadRequestError(ERROR_MESSAGES.BAD_REQUEST));
      }
      return next(err);
    });
};

const dislikeItem = (req, res, next) => {
  ClothingItem.findByIdAndUpdate(
    req.params.itemId,
    { $pull: { likes: req.user._id } },
    { new: true }
  )
    .orFail(() => new NotFoundError(ERROR_MESSAGES.NOT_FOUND))
    .then((item) => res.send({ data: item }))
    .catch((err) => {
      if (err.name === "CastError") {
        return next(new BadRequestError(ERROR_MESSAGES.BAD_REQUEST));
      }
      return next(err);
    });
};

module.exports = { getItems, createItem, likeItem, deleteItem, dislikeItem };
