const express = require('express')
const app = express();
const { mongoose } = require('./db/mongoose');
const bodyParser = require('body-parser');

// Load in the mongoose models
const { List, Task } = require('./db/models');

// Load middleware
app.use(bodyParser.json());

// CORS HEADERS MIDDLEWARE
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


/* ROUTE HANDLERS */

/* List Routes */


/** 
 * GET /lists
 * purpose:Get all lists
 */

app.get('/lists',(req,res)=>{
    // we want to return an array of all the list in the database
    List.find({}).then((lists) => {
        res.send(lists);
    }).catch((e) => {
        res.send(e);
    });
})

/**
 * POST /lists
 * Purpose: create a list
 */
app.post('/lists', (req,res) => {
    // We want to create a new list and return the new list document back to the user (which includes the id)
    // The list information (fields) will be passed in via the JSON request body
    let title = req.body.title;

    let newList = new List({
        title
    });
    newList.save().then((listDoc) => {
        // the full list document is returned (incl, id)
        res.send(listDoc);
    });
});

/**
 * PATH /lists/:id
 * Purpose: Update a specified list
 */
app.patch('/lists/:id',(req,res) => {
    // we want to update the specifed list (list document with in the URL) with the new values specifed in the JSON body of the request 
    List.findOneAndUpdate({_id: req.params.id},{
        $set: req.body
    }).then(() => {
        res.sendStatus(200);
    }) 
});

app.delete('/lists/:id',(req,res) => {
    // we want to delete the specified list(document with id in the URL) 
    List.findOneAndDelete({_id: req.params.id},{
        _id: req.params.id
    }).then((removeListDoc) => {
        res.send(removeListDoc);
    })
});

/* Tasks Crud */


/**
 * GET /lists/:listId/tasks
 * purpose:Get all tasks in a specified list
 */
app.get('/lists/:listId/tasks',(req,res) => {
    // we want  to return all tasks that belong to specified list (specified by listId)
    Task.find({
        _listId: req.params.listId
    }).then((tasks) => {
        res.send(tasks);
    });
});

app.post('/lists/:listId/tasks', (req, res) =>{
    // we want  to create a new task in a list  specified by listId
    let newTask = new Task({
        title: req.body.title,
        _listId: req.params.listId
    });
    newTask.save().then((newTaskDoc) => {
        res.send(newTaskDoc);
    });
});

/**
 * PATCH /lists/:lists/tasks/:tasksId
 * Purpose: Update an existing task (specifed by taskId)
 */
app.patch('/lists/:listId/tasks/:taskId',(req,res) =>{
    // we want to update an existing task (specifed by taskId)
    Task.findOneAndUpdate({
        _id: req.params.taskId,
        _listId: req.params.listId
    },{
        $set: req.body
    }).then(() => {
        res.sendStatus(200);
    }) 
});

/**
 * DELETE /lists/:listId/tasks/:taskId
 */
app.delete('/lists/:listId/tasks/:taskId',(req,res) =>{
    // we want to delete task specified  listId
    Task.findOneAndRemove({
        _id: req.params.taskId,
        _listId: req.params.listId
    }).then((removeTaskDoc) => {
        res.send(removeTaskDoc);
    })
});


/**
 * get one items(get one task)
 */
// app.get('/lists/:listId/tasks/:taskId',(req,res) => {
//     Task.findOne({
//         _id: req.params.taskId, 
//         _listId: req.params.listId
//     }).then((tasks) => {
//         res.send(tasks);
//     })
// })




app.listen(3000, () => {
    console.log("Server is listening on port 3000");
})