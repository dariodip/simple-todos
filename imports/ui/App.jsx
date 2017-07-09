/**
 * Created by ddipa on 25/04/2017.
 */

import React, {Component, PropTypes} from 'react';
import ReactDOM from 'react-dom';
import {createContainer} from 'meteor/react-meteor-data';
import {Meteor} from 'meteor/meteor';
import Task from './Task.jsx';
import {Tasks} from '../api/tasks';
import AccountsUIWrapper from './AccountsUIWrapper';


class App extends Component{

    constructor(props) {
        super(props);
        this.state = {
            hideCompleted: false
        };
    }

    handleSubmit(event) {
        event.preventDefault();
        const text = ReactDOM.findDOMNode(this.refs.textInput).value.trim();
        const userId = ReactDOM.findDOMNode(this.refs.selectInput).value.trim();
        Meteor.call('tasks.insert', text, userId);

        ReactDOM.findDOMNode(this.refs.textInput).value = '';
    }

    toggleHideCompleted() {
        this.setState({
            hideCompleted: !this.state.hideCompleted,
        });
    }

    renderTasks() {
        let filteredTasks = this.props.tasks;
        if (this.state.hideCompleted) {
            filteredTasks = filteredTasks.filter(task => !task.checked);
        }
        return filteredTasks
            .map((task) => {
                console.log(task);
                const currentUserId = this.props.currentUser && this.props.currentUser._id;
                const showPrivateButton = task.owner === currentUserId;
                return (
                    <Task key={task._id} task={task} showPrivateButton={showPrivateButton}/>
                );
            });
    }

    renderUsers() {
        let users = this.props.users;
        return users.
            map((user) => {
            return (
                <option value={user._id} key={user._id}>{user.username}</option>
            );
        })
    }

    render() {
        return (
            <div className="container">
                <header>
                    <h1>Todo List ({this.props.incompleteCount})</h1>
                    <label className="hide-completed">
                        <input
                            type="checkbox"
                            readOnly
                            checked={this.state.hideCompleted}
                            onClick={this.toggleHideCompleted.bind(this)}
                        />
                        Hide Completed Tasks
                    </label>

                    <AccountsUIWrapper/>
                    { this.props.currentUser ?
                        <form className="new-task" onSubmit={this.handleSubmit.bind(this)}>
                            <input
                                type="text"
                                ref="textInput"
                                placeholder="Type to add new tasks"
                            />
                            <select name="mainSelect" id="mainSelect" className="selector" ref="selectInput">
                                {this.renderUsers()}
                            </select>
                        </form> : ''
                    }
                </header>
                <ul>
                    {this.renderTasks()}
                </ul>
            </div>
        );

    }
}

App.propTypes = {
    tasks: PropTypes.array.isRequired,
    incompleteCount: PropTypes.number.isRequired,
    currentUser: PropTypes.object,
};

export default createContainer(() => {
    Meteor.subscribe('tasks');
    Meteor.subscribe('users');

    return {
        tasks: Tasks.find({}, {sort: {createdAt: -1}}).fetch(),
        users: Meteor.users.find({}).fetch(),
        incompleteCount: Tasks.find({checked: {$ne: true}}).count(),
        currentUser: Meteor.user(),
    };
}, App);