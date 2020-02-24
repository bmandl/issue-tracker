/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

var expect = require("chai").expect;
var mongoose = require("mongoose");
var objectId = mongoose.Types.ObjectId;

var issueSchema = new mongoose.Schema({
  project: { type: String, required: true, select: false },
  issue_title: { type: String, required: true },
  issue_text: { type: String, required: true },
  created_by: { type: String, required: true },
  assigned_to: { type: String, default: "" },
  status_text: { type: String, default: "" },
  open: { type: Boolean, default: true },
  created_on: String,
  updated_on: String
});

issueSchema.pre("save", function(next) {
  if (!this.created_on) this.created_on = new Date().toISOString();
  this.updated_on = new Date().toISOString();
  next();
});

var Issue = mongoose.model("Issues", issueSchema);

function checkRequired(issue, requiredFields) {
  let missing = [];
  
  requiredFields.forEach(element => {
    if(!issue.hasOwnProperty(element) || issue[element] === '') missing.push(element); 
  })

  if (missing.length) {
    return "Missing required fields: " + missing.join(", ");
  }
}

function checkId(body) {
  if (!objectId.isValid(body._id) || !body._id) {
    return "_id error";
  } 
  return false;
}

module.exports = function(app) {
  app
    .route("/api/issues/:project")

    //GET
    .get(function(req, res) {
      var project = req.params.project;
      var filters = req.query;
      filters.project = project;
      console.log(filters);

      Issue.find(filters,(err,arr) => {
        if (err) {
          res.status(500).json("Internal server error");
          return;
        }
        res.json(arr);
      })
    })

    //POST
    .post(function(req, res) {
      var project = req.params.project;
      req.body.project = project; //add field project to req.body

      let required = ["project", "issue_title", "issue_text", "created_by"];
      let error = checkRequired(req.body, required);

      if (error) {
        console.log(error);
        return res.status(400).send(error);        
      }

      let newIssue = Issue(req.body);
      newIssue.save((err, issue) => {
        if (err) {
          //console.log(err);
          res.status(500).json(err);
        }
        res.json(issue);
      });
    })

    //PUT
    .put(function(req, res) {
      var project = req.params.project;

      let updateIssue = {};

      for (var key in req.body) {
        if (req.body[key] != "" && key != "_id") {
          updateIssue[key] = req.body[key];
        }
      }

      let response = checkId(req.body);

      if (response) {
        res.json(response);
        return;
      }

      if (!Object.entries(updateIssue).length) {
        res.json("no updated field sent");
        return;
      }

      updateIssue.updated_on = new Date().toISOString();
      Issue.updateOne(
        { _id: objectId(req.body._id) },
        updateIssue,
        (err, result) => {
          if (err) {
            console.log(err);
            res.status(500).json("could not update " + objectId(req.body._id));
          }
          res.json("successfully updated " + objectId(req.body._id));
        }
      );
    })

    //DELETE
    .delete(function(req, res) {
      var project = req.params.project;
      let response = checkId(req.body);

      if (response) {
        res.json(response);
        return;
      }

      Issue.deleteOne({_id: objectId(req.body._id)}, err => {
        if (err) {
          res.status(500).json("could not delete " + objectId(req.body._id));
          return
        }
        res.status(200).json("deleted " + objectId(req.body._id));
      });
    });
};
