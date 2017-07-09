/**
 * Created by ddipa on 25/04/2017.
 */

import {Mongo} from 'meteor/mongo';
import {Meteor} from 'meteor/meteor';
import {check} from 'meteor/check';
let analyze = require('Sentimental').analyze;

export const Tasks = new Mongo.Collection('tasks');

if (Meteor.isServer) {
    Meteor.publish('tasks', function tasksPublication() {
        return Tasks.find({
            $or: [
                {private : {$ne: true}},
                {owner : this.userId}
            ]
        });
    });
    Meteor.publish('users', function() {
        return Meteor.users.find({});
    });
    Meteor.publish('newTask', function taskPublication() {
        let self = this;
        let initializing = true;
        let handle = Tasks.find().observeChanges({
           added: function(id, fields) {
               if (!initializing) {
                   self.added('task', id, field);
               }
           },
            changed: function(id, fields) {
               self.changed('task', id, fields);
            },
            removed: function (id) {
               self.removed('task', id);
            }
        });
        initializing = false;
        self.ready();
        self.onStop(function() {
            handle.stop();
        });
    });
}

Router.route('/tasks', {where: 'server'})
    .get(function() {
        let response = Tasks.find().fetch();
        this.response.setHeader('Content-Type', 'application/json');
        this.response.end(JSON.stringify(response));
    });

Router.route('/users')
    .get(function() {
        let response = Meteor.users.find({}).fetch();
        this.response.setHeader('Content-Type', 'application/json');
        this.response.end(JSON.stringify(response));
    });

Meteor.methods({
    'tasks.insert'(text, forUserId) {
        check(text, String);
        check(forUserId, String);

        let sentimentA = analyze(text);
        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }
        let forUser = null;
        try {
            forUser = Meteor.users.findOne({ _id : forUserId});
        } catch(err){
            throw new Meteor.Error(err.message);
        }

        Tasks.insert({
            text,
            createdAt: new Date(),
            owner: Meteor.userId(),
            username: Meteor.user().username,
            score: sentimentA.score,
            comparative: sentimentA.comparative,
            forUser: forUser
        });
    },
    'tasks.remove'(taskId) {
        check(taskId, String);

        const task = Tasks.findOne(taskId);
        if (task.private && task.owner !== Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }
        Tasks.remove(taskId);
    },
    'tasks.setChecked'(taskId, setChecked) {
        check(taskId, String);
        check(setChecked, Boolean);

        const task = Tasks.findOne(taskId);
        if (task.private && task.owner !== Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        Tasks.update(taskId, {$set: {checked: setChecked}});
    },
    'tasks.setPrivate'(taskId, setToPrivate) {
        check(taskId, String);
        check(setToPrivate, Boolean);
        const task = Tasks.findOne(taskId);

        if (task.owner !== Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        Tasks.update(taskId, {$set : {private: setToPrivate}});
    }
});