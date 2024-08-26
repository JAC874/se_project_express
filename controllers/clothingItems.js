const ClothingItem = require("../models/clothingItem");
const { ERROR_CODES, ERROR_MESSAGES } = require("../utils/errors");

const getItems = (req, res) => {
  ClothingItem.find({})
    .then((items) => res.send({ data: items }))
    .catch((err) => {
      console.error(err);
      res
        .status(ERROR_CODES.SERVER_ERROR)
        .send({ message: ERROR_MESSAGES.SERVER_ERROR });
    });
};

const createItem = (req, res) => {
  const { name, weather, imageUrl } = req.body;
  const owner = req.user._id;

  if (!name || !weather || !imageUrl) {
    return res
      .status(ERROR_CODES.BAD_REQUEST)
      .send({ message: ERROR_MESSAGES.BAD_REQUEST });
  }

  return ClothingItem.create({ name, weather, imageUrl, owner })
    .then((item) => res.status(201).send({ data: item }))
    .catch((err) => {
      if (err.name === "ValidationError") {
        return res
          .status(ERROR_CODES.BAD_REQUEST)
          .send({ message: ERROR_MESSAGES.BAD_REQUEST });
      }
      return res
        .status(ERROR_CODES.SERVER_ERROR)
        .send({ message: ERROR_MESSAGES.SERVER_ERROR });
    });
};

const deleteItem = async (req, res) => {
  const { itemId } = req.params;
  console.log("clothing item id: ", itemId);
  try {
    const item = await ClothingItem.findById(itemId).orFail(() => {
      const error = new Error("Item ID not found");
      error.statusCode = 404;
      throw error;
    });

    if (item.owner.toString() !== req.user._id.toString()) {
      return res
        .status(ERROR_CODES.FORBIDDEN)
        .send({ message: ERROR_MESSAGES.FORBIDDEN });
    }

    await ClothingItem.findByIdAndDelete(itemId);
    return res.send({ message: "Item successfully deleted" });
  } catch (err) {
    console.error("deleteItem error name: ", err.name);
    const statusCode = err.statusCode || 500;

    if (err.name === "CastError") {
      return res
        .status(ERROR_CODES.BAD_REQUEST)
        .send({ message: ERROR_MESSAGES.BAD_REQUEST });
    }
    return res
      .status(statusCode)
      .send({ message: "An error has occurred on the server." });
  }
};

const likeItem = (req, res) => {
  ClothingItem.findByIdAndUpdate(
    req.params.itemId,
    { $addToSet: { likes: req.user._id } },
    { new: true }
  )
    .orFail()
    .then((item) => res.send({ data: item }))
    .catch((err) => {
      console.error(err);
      if (err.name === "DocumentNotFoundError")
        return res
          .status(ERROR_CODES.NOT_FOUND)
          .json({ message: ERROR_MESSAGES.NOT_FOUND });
      if (err.name === "CastError") {
        return res
          .status(ERROR_CODES.BAD_REQUEST)
          .send({ message: ERROR_MESSAGES.BAD_REQUEST });
      }
      return res
        .status(ERROR_CODES.SERVER_ERROR)
        .send({ message: ERROR_MESSAGES.SERVER_ERROR });
    });
};

const dislikeItem = (req, res) => {
  ClothingItem.findByIdAndUpdate(
    req.params.itemId,
    { $pull: { likes: req.user._id } },
    { new: true }
  )
    .orFail()
    .then((item) => res.send({ data: item }))
    .catch((err) => {
      console.error(err);
      if (err.name === "DocumentNotFoundError")
        return res
          .status(ERROR_CODES.NOT_FOUND)
          .send({ message: ERROR_MESSAGES.NOT_FOUND });
      if (err.name === "CastError") {
        return res
          .status(ERROR_CODES.BAD_REQUEST)
          .send({ message: ERROR_MESSAGES.BAD_REQUEST });
      }
      return res
        .status(ERROR_CODES.SERVER_ERROR)
        .send({ message: ERROR_MESSAGES.SERVER_ERROR });
    });
};

module.exports = { getItems, createItem, likeItem, deleteItem, dislikeItem };
