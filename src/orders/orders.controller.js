const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");
const bodyContains = require("../utils/validation");

// TODO: Implement the /orders handlers needed to make the tests pass

function list(req, res) {
    res.json({data: orders});
}

function create(req, res) {
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    const newOrder = {
        "id": nextId(),
        deliverTo,
        mobileNumber,
        status,
        dishes,
    };
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
}

function read(req, res) {
    const foundOrder = res.locals.order;
    res.json({data: foundOrder});
} 

function update(req, res, next) {
    const foundOrder = res.locals.order;
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    foundOrder.deliverTo = deliverTo;
    foundOrder.mobileNumber = mobileNumber;
    foundOrder.status = status;
    foundOrder.dishes = dishes;
    res.json({ data: foundOrder });
}

function destroy(req, res, next) {
    const foundOrder = res.locals.order;
    const index = orders.findIndex((order) => order.id === foundOrder.id);
    if(index > -1) {
        orders.splice(index, 1);
    }
    res.sendStatus(204);
}

function isStatusPending(req, res, next) {
    const { data: {status} = {} } = req.body;
    if(!status || status === "") {
        next({status: 400, message: "Order must have a status of pending, preparing, out-for-delivery, delivered"});
    }
    else if (status != "pending") {
        next({ status: 400, message: `A ${status} status order cannot be changed`});
    }
    return next();
}

function orderExists(req, res, next) {
    const orderId = req.params.orderId;
    const foundOrder = orders.find((order) => order.id === orderId);
    if(foundOrder) {
        res.locals.order = foundOrder;

        return next();
    } 
    next({
        status: 404,
        message: `Order does not exists: ${req.params.orderId}`,
    });
}

function areDishesValid(req, res, next) {
    const { data: { dishes } = {}} = req.body;
    if(!Array.isArray(dishes) || dishes.length == 0) {
        next({status: 400, message: "Orders must include at least one dish"})
    }
    for(let i = 0; i < dishes.length; i++) {
        const dish = dishes[i];
        if(!dish.quantity || !Number.isInteger(dish.quantity) || dish.quantity <= 0) {
            next({status: 400, message: `Dish ${i} must have quantity that is an integer greater than 0`})
        }
    }
    return next();
}

function isOrderPending(req, res, next) {
    const foundOrder = res.locals.order;
    if(foundOrder.status !== "pending") {
        console.log("order is not pending");
        next({ status: 400, message: "An order cannot be deleted unless it is pending."});
    }
    return next();   
}

function doesRequestBodyIdMatchParamId(req, res, next) {
    const foundOrder = res.locals.order;
    const { data: { id } = {} } = req.body;
    if(id) {
        if(foundOrder.id != id) {
            next({status: 400, message: `Order id does not match route id. Order: ${foundOrder.id}, Route: ${id}`});
        }
    }
    return next();
}

module.exports = {
    list,
    create: [
        bodyContains("deliverTo"),
        bodyContains("mobileNumber"),
        bodyContains("dishes"),
        areDishesValid,
        create
    ],
    update: [
        orderExists,
        isStatusPending,
        doesRequestBodyIdMatchParamId,
        bodyContains("deliverTo"),
        bodyContains("mobileNumber"),
        bodyContains("status"),
        bodyContains("dishes"),
        areDishesValid,
        update
    ],
    destroy: [
        orderExists,
        isOrderPending,
        destroy
    ],
    read: [
        orderExists,
        read
    ],

}