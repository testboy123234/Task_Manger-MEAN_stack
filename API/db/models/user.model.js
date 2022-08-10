const mongoose = require('mongoose');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');



// JWT Secret
const jwtSecret = "35593359190522681750adfasfas0428173288";

const UserSchema = new  mongoose.Schema({
    email: {
        type: String,
        required: true,
        minlength:1,
        trim:true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    sessions: [{
        token: {
            type: String,
            required: true
        },
        expiresAt: {
            type: Number,
            required: true
        }
    }]
});



/// *** Instance methods ***

UserSchema.method.toJSON = function() {
    const user = this;
    const userObject = user.toObject();

    //return the document except the password and sessions (these shouldn't be made available)
    return _.omit(userObject, ['password', 'sessions']);

}

UserSchema.methods.generateAccessAuthToken = function () {
    const user = this;
    return new Promise((resolve, reject) => {
        // create the JSON Web Token and return that
        jwt.sign({ _id: user._id.toHexString() }, jwtSecret, { expiresIn:"15m" }, (err, token) => {
            if (!err) {
                resolve(token);
            } else {
                // there is an error
                reject();
            }
            
        })
    })
}


UserSchema.methods.generateRefreshAuthToken = function() {
    // This method simply generates a 64byte hrx string - it doesn't save it to the database. saveSessionDatabase() does that.
    return new Promise((resolve, reject) => {
        crypto.randomBytes(64, (err, buf) => {
            if (!err) {
                //no error
                let token = buf.toString('hex');
                return resolve(token);
            }
        })
    })
}


UserSchema.methods.createSession = function(){
    let user = this;
    return user.generateRefreshAuthToken().then((refreshToken) => {
        return saveSessionDatabase(user, refreshToken);
    }).then((refreshToken) => {
        // saved to database successfuly 
        // now return the refresh token
        return refreshToken;
    }).catch((e) => {
        return Promise.reject('Failed to save session to database.\n' + e)
    })
}

/* MODEL METHODS (static methods) */
UserSchema.statics.findByIdAndToken = function(_id, token) {
    // finds user by id token
    // used in auth middleware (verifySession)

    const User = this;
    
    return User.findOne({
        _id,
        'session.token':token
    });
}


/* HELPER METHODS */
let saveSessionDatabase = (user, refreshToken) => {
    // Save session to database
    return new Promise((resolve, reject) => {
        let expiresAt = generateRefreshAuthTokenExpiryTime();
        user.sessions.push({ 'token': refreshToken, expiresAt });

        user.save().then(() => {
            // saved session  successfully
            return resolve(refreshToken);

        }).catch((e) => {
            reject(e);
        })
    })
}

let generateRefreshAuthTokenExpiryTime = () => {
    let daysUntilExpire = "10";
    let secondsUntilExpire = ((daysUntilExpire * 24) * 60) * 60;
    return ((Date.now() / 1000) + secondsUntilExpire);
}