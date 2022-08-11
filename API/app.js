const express = require('express')
const app = express();
const { mongoose } = require('./db/mongoose');
const bodyParser = require('body-parser');

// Load in the mongoose models
const { List, Task, User } = require('./db/models');


// Load middleware
app.use(bodyParser.json());

// CORS HEADERS MIDDLEWARE
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Methods", "GET, POST, HEAD, OPTIONS, PUT, PATCH, DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Verify Refresh Token Middleware (which will be verifying the session)
let verifySession = (req, res, next) => {
    // grab the refresh token from the request header
    let refreshToken = req.header('x-refresh-token');

    // grab the _id from the request header
    let _id = req.header('_id');

    User.findByIdAndToken(_id, refreshToken).then((user) => {
        if (!user) {
            // user couldn't be found
            return Promise.reject({
                'error': 'User not found. Make sure that the refresh token and user id are correct'
            });
        }


        // if the code reaches here - the user was found
        // therefore the refresh token exists in the database - but we still have to check if it has expired or not

        req.user_id = user._id;
        req.userObject = user;
        req.refreshToken = refreshToken;

        let isSessionValid = false;

        user.sessions.forEach((session) => {
            if (session.token === refreshToken) {
                // check if the session has expired
                if (User.hasRefreshTokenExpired(session.expiresAt) === false) {
                    // refresh token has not expired
                    isSessionValid = true;
                }
            }
        });

        if (isSessionValid) {
            // the session is VALID - call next() to continue with processing this web request
            next();
        } else {
            // the session is not valid
            return Promise.reject({
                'error': 'Refresh token has expired or the session is invalid'
            })
        }

    }).catch((e) => {
        res.status(401).send(e);
    })
}

/* END MIDDLEWARE  */


/* ROUTE HANDLERS */

/* List Routes */


/** 
 * GET /lists
 * purpose:Get all lists
 */

app.get('/lists', (req, res) => {
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
app.post('/lists', (req, res) => {
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
app.patch('/lists/:id', (req, res) => {
    // we want to update the specifed list (list document with in the URL) with the new values specifed in the JSON body of the request 
    List.findOneAndUpdate({ _id: req.params.id }, {
        $set: req.body
    }).then(() => {
        res.sendStatus(200);
    })
});

app.delete('/lists/:id', (req, res) => {
    // we want to delete the specified list(document with id in the URL) 
    List.findOneAndDelete({ _id: req.params.id }, {
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
app.get('/lists/:listId/tasks', (req, res) => {
    // we want  to return all tasks that belong to specified list (specified by listId)
    Task.find({
        _listId: req.params.listId
    }).then((tasks) => {
        res.send(tasks);
    });
});

app.post('/lists/:listId/tasks', (req, res) => {
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
app.patch('/lists/:listId/tasks/:taskId', (req, res) => {
    // we want to update an existing task (specifed by taskId)
    Task.findOneAndUpdate({
        _id: req.params.taskId,
        _listId: req.params.listId
    }, {
        $set: req.body
    }).then(() => {
        res.send({ message: 'Updated Successfully' });
    })
});

/**
 * DELETE /lists/:listId/tasks/:taskId
 */
app.delete('/lists/:listId/tasks/:taskId', (req, res) => {
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




/* USER ROUTES */

/**
 * POST /users
 * Purpose: Sign up
 */
 app.post('/users', (req, res) => {
    // User sign up

    let body = req.body;
    let newUser = new User(body);

    newUser.save().then(() => {
        return newUser.createSession();
    }).then((refreshToken) => {
        // Session created successfully - refreshToken returned.
        // now we geneate an access auth token for the user

        return newUser.generateAccessAuthToken().then((accessToken) => {
            // access auth token generated successfully, now we return an object containing the auth tokens
            return { accessToken, refreshToken }
        });
    }).then((authTokens) => {
        // Now we construct and send the response to the user with their auth tokens in the header and the user object in the body
        res
            .header('x-refresh-token', authTokens.refreshToken)
            .header('x-access-token', authTokens.accessToken)
            .send(newUser);
    }).catch((e) => {
        res.status(400).send(e);
    })
})

/**
 * POST /users/login
 * Purpose: Login
 */
 app.post('/users/login', (req, res) => {
    let email = req.body.email;
    let password = req.body.password;

    User.findByCredentials(email, password).then((user) => {
        return user.createSession().then((refreshToken) => {
            // Session created successfully - refreshToken returned.
            // now we geneate an access auth token for the user

            return user.generateAccessAuthToken().then((accessToken) => {
                // access auth token generated successfully, now we return an object containing the auth tokens
                return { accessToken, refreshToken }
            });
        }).then((authTokens) => {
            // Now we construct and send the response to the user with their auth tokens in the header and the user object in the body
            res
                .header('x-refresh-token', authTokens.refreshToken)
                .header('x-access-token', authTokens.accessToken)
                .send(user);
        })
    }).catch((e) => {
        res.status(400).send(e);
    });
})



/**
 * GET /users/me/access-token
 * Purpose: generates and returns an access token
 */
 app.get('/users/me/access-token', verifySession, (req, res) => {
    // we know that the user/caller is authenticated and we have the user_id and user object available to us
    req.userObject.generateAccessAuthToken().then((accessToken) => {
        res.header('x-access-token', accessToken).send({ accessToken });
    }).catch((e) => {
        res.status(400).send(e);
    });
})




app.listen(3000, () => {
    console.log("Server is listening on port 3000");
})