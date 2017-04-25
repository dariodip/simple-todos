/**
 * Created by ddipa on 25/04/2017.
 */

import {Accounts} from 'meteor/accounts-base';

Accounts.ui.config({
    passwordSignupFields: 'USERNAME_ONLY',
});