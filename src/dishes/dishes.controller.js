const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");
const bodyContains = require("../utils/validation");

// TODO: Implement the /dishes handlers needed to make the tests pass
function list(req, res) {
    res.json({ data: dishes });
}

function create(req, res) {
    const { data: { name, description, price, image_url } = {} } = req.body;
    const newDish = {
        "id": nextId(),
        name,
        description,
        price,
        image_url,
    };
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
}

function read(req, res) {
    const foundDish = res.locals.dish;
    res.json({ data: foundDish });
}

function update(req, res, next) {
    const foundDish = res.locals.dish;
    const { data: {name, description, price, image_url, id } = {} } = req.body;
    if(id) {
        if(foundDish.id != id) {
            next({status: 400, message: `Dish id does not match route id. Dish: ${foundDish.id}, Route: ${id}`});
        }
    }
    foundDish.name = name;
    foundDish.description = description;
    foundDish.price = price;
    foundDish.image_url = image_url;
    res.json({ data: foundDish });
}


//Middleware
function priceIsValid(req, res, next) {
    const { data: { price } = {} } = req.body;
    if(Number.isInteger(price) && Number(price) > 0) {
        next();
    }
    next({ status: 400, message: "Dish must have a price that is an integer greater than 0"});
}

function dishExists(req, res, next) {
    const dishId = req.params.dishId;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    if(foundDish) {
        res.locals.dish = foundDish;

        return next();
    } 
    next({
        status: 404,
        message: `Dish does not exists: ${req.params.dishId}`,
    });
}

module.exports = {
    list,
    create: [
        bodyContains("name"),
        bodyContains("description"),
        bodyContains("price"),
        bodyContains("image_url"),
        priceIsValid,
        create
    ],
    read: [dishExists, read],
    update: [
        dishExists,
        priceIsValid,
        bodyContains("name"),
        bodyContains("description"),
        bodyContains("price"),
        bodyContains("image_url"),
        update
    ]


}
