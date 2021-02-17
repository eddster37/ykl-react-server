const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

const userSchema = new Schema({
    username: {
        type: String,
        required: 'Username is required',
        minlength: [4, 'Minimum username length is 4'],
        maxlength: [32, 'Maximum username length is 32']
    },
    password: {
        type: String,
        required: 'Password is required',
        minlength: [8, 'Minimum password length is 8']
    },
    loggedIn: { type: Number, default: 0 },
    keeperFW: { type: Number, default: 3 },
    keeperDef: { type: Number, default: 0 },
    autodraft: { type: Number, default: 0 }
});

userSchema.methods.hasSamePassword = function (providedPassword) {
    return bcrypt.compareSync(providedPassword, this.password);
}

userSchema.pre('save', function (next) {
    const user = this;

    bcrypt.genSalt(10, (error, salt) => {
        bcrypt.hash(user.password, salt, (err, hash) => {
            user.password = hash;
            next();
        });
    });
});

userSchema.index({username: 1});
userSchema.index({ username: 1}, {unique: true});

module.exports = mongoose.model('User', userSchema);