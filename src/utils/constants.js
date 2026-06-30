export const PLANS = {
    FREE: {
        posts: 3,
        calls: 3,
        callDuration: 5,
        messages: 30,
        price: 0,
        currency: 'USD'
    },
    PREMIUM_1: {
        posts: 5,
        calls: 10,
        callDuration: 10,
        messages: 100,
        price: 4.99,
        currency: 'USD'
    },
    PREMIUM_2: {
        posts: 10,
        calls: 20,
        callDuration: 10,
        messages: 300,
        price: 7.99,
        currency: 'USD'
    },
    PREMIUM_3: {
        posts: Infinity,
        calls: Infinity,
        callDuration: Infinity,
        messages: Infinity,
        price: 15.99,
        currency: 'USD'
    }
};

export const ROLES = {
    USER: 'USER',
    ADMIN: 'ADMIN',
    SUPERADMIN: 'SUPERADMIN'
};

export const CALL_STATUS = {
    STARTED: 'started',
    ENDED: 'ended',
    MISSED: 'missed',
    REJECTED: 'rejected'
};

export const MESSAGE_TYPES = {
    TEXT: 'text',
    IMAGE: 'image',
    FILE: 'file'
};