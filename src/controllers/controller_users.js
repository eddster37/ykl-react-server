const jwt = require('jsonwebtoken');
const User = require('../models/model_user');
const Logins = require('../models/model_logins');
const { isEmpty } = require('../controllers/global');
require('dotenv').config();

exports.login = (request, response) => {
    const { username, password } = request.body;
    if (!password || !username) {
        return response.sendApiError({ title: 'Missing data', detail: 'Please enter your username and password' });
    }
    let filters = {};
    filters['username'] = { $regex: `^${username}$`, $options: 'i' }

    User.findOne(
        filters,
        {},
        {},
        async (error, foundUser) => {

            if (!isEmpty(foundUser, error) && foundUser.hasSamePassword(password)) {
                //generate JWT
                const token = jwt.sign({
                    sub: foundUser.id,
                    username: foundUser.username
                }, process.env.JWT_SECRET, { expiresIn: '24h' });

                let data = {
                    fkUsername: username,
                    result: 1
                }

                await Logins.create(data);
                await User.updateOne(
                    { username: username },
                    { $set: { loggedIn: 1 } }
                );
                return response.json(token);
            }
            else {
                let data = {
                    fkUsername: username,
                    result: 0
                }

                Logins.create(data);

                return response.sendApiError({ title: 'Failed login', detail: 'Failed to log in' });
            }
        });
}

exports.getAllUsers = (request, response) => {
    User.find(
        {},
        { username: 1 },
        { sort: {username: 1} },
        (error, users) => {
            if (error) {
                return response.mongoError(error);
            }
            return response.json(users);
        }
    );
}

exports.getUsernameFromToken = (token) => {
    if (token) {
        const { decodedToken, error } = parseToken(token);

        if (error) {
            return response.mongoError(error);
        }
        return decodedToken.username;
    }
}

exports.onlyAuthUser = (request, response, next) => {
    const token = request.headers.authorization;

    if (token) {
        const { decodedToken, error } = parseToken(token);
        if (error) {
            return response.mongoError(error);
        }

        User.findById(decodedToken.sub, (error, foundUser) => {
            if (error) {
                return response.mongoError(error);
            }
            else if (foundUser) {
                response.locals.user = foundUser;
                next();
            }
            else {
                return notAuthorized(response);
            }
        });
    }
    else {
        return notAuthorized(response);
    }
}

function notAuthorized(response) {
    return response.sendApiError({ status: 401, title: 'Not authorized', detail: 'You need to login' });
}

function parseToken(token) {
    try {
        const decodedToken = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
        return { decodedToken };
    }
    catch (error) {
        return { error: error.message };
    }
}