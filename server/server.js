const PROTO_PATH = "./restaurant.proto";

var mongoose = require("mongoose");
var grpc = require("grpc");
var protoLoader = require("@grpc/proto-loader");

// require dotenv
require("dotenv").config();

mongoose.connect(
  "mongodb://root:123456@localhost:27019/fing?authMechanism=DEFAULT&authSource=admin"
);

var packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  arrays: true,
});

var restaurantProto = grpc.loadPackageDefinition(packageDefinition);

const { v4: uuidv4 } = require("uuid");
const Menu = require("../models/menu.model");

const server = new grpc.Server();

server.addService(restaurantProto.RestaurantService.service, {
  getAllMenu: async (_, callback) => {
    try {
      let menu = await Menu.find({});
      callback(null, { menu });
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        details: "Internal error",
      });
    }
  },
  get: async (call, callback) => {
    let menuItem = await Menu.findById(call.request.id);

    if (menuItem) {
      callback(null, menuItem);
    } else {
      callback({
        code: grpc.status.NOT_FOUND,
        details: "Not found",
      });
    }
  },
  insert: (call, callback) => {
    let menuItem = call.request;
    menuItem.id = uuidv4();
    Menu.create(menuItem, (err, doc) => {
      if (err) {
        callback({
          code: grpc.status.INTERNAL,
          details: "Internal error",
        });
      } else {
        callback(null, doc);
      }
    });
  },
  update: (call, callback) => {
    let existingMenuItem = Menu.findById(call.request.id);

    // update and save to database
    if (existingMenuItem) {
      Menu.findByIdAndUpdate(call.request.id, call.request, (err, doc) => {
        if (err) {
          callback({
            code: grpc.status.INTERNAL,
            details: "Internal error",
          });
        } else {
          callback(null, doc);
        }
      });
    } else {
      callback({
        code: grpc.status.NOT_FOUND,
        details: "Not found",
      });
    }
  },
  remove: (call, callback) => {
    let existingMenuItem = Menu.findById(call.request.id);

    // delete from database
    if (existingMenuItem) {
      Menu.findByIdAndDelete(call.request.id, (err, doc) => {
        if (err) {
          callback({
            code: grpc.status.INTERNAL,
            details: "Internal error",
          });
        } else {
          callback(null, doc);
        }
      });
    } else {
      callback({
        code: grpc.status.NOT_FOUND,
        details: "Not found",
      });
    }
  },
});

server.bind("127.0.0.1:30043", grpc.ServerCredentials.createInsecure());
console.log("Server running at http://127.0.0.1:30043");
server.start();
