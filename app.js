const express = require('express');
const bodyParser = require('body-parser-graphql');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Event = require('./models/event');
const User = require('./model/user');

const app = express();

const events = [];

app.use(express.urlencoded({extended: true}));
app.use(express.json()); // To parse the incoming requests with JSON payloads
app.use(bodyParser.graphql());

app.use('/graphql', graphqlHTTP({
    schema: buildSchema(`
        type Event {
            _id: ID!
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        type User {
            _id: ID!
            email: String!
            password: String
        }

        input UserInput {
            email: String!
            password: String!
        }

        input EventInput {
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        type RootQuery {
            events: [Event!]!
        }

        type RootMutation {
            createEvent(eventInput: EventInput): Event
            createUser(userInput: UserInput): User
        }

        type RootMutation {
            createEvent(eventInput: EventInput): Event
        }

        schema {
            query: RootQuery
            mutation: RootMutation
        }
    `),
    rootValue: {
        events: () => {
            return Event.find()
            .then(events=> {
                return events.map(event => {
                    return {...event._doc, _id: event._doc._id.toString()};
                })
            })
            .catch(err=>{throw err;})
        },
        createEvent: args => {
            // const event = {
            //     _id: Math.random().toString(),
            //     title: args.eventInput.title,
            //     description: args.eventInput.description,
            //     price: +args.eventInput.price,
            //     date: new Date().toISOString()
            // }
            const event = new Event({
                title: args.eventInput.title,
                    description: args.eventInput.description,
                    price: +args.eventInput.price,
                    date: new Date(args.eventInput.date),
                    creator: '5c0f6dddddddd', //bad one
            });
            let createdEvent;
            console.log('event',event, 'args', args);
            // events.push(event);
            return event
            .save()
            .then(res=>{
                console.log(res);
                createdEvent = {...res._doc, _id: event._doc._id.toString()};
                return User.findById('5c0f6dddddddd');
                
            })
            .then(user=> {
                if (user) {
                    throw new Error('User exist allready');
                }
                user.createdEvents.push(event);
                return user.save();
            })
            .then(res => {
               return  createdEvent;
            })
                // return {...res._doc, _id: event.id};})
            .cath(err=>{
                console.log(err);
                throw err;
            });
        },
        createUser: args => {
            return User.findOne({email: args.userInput.email}).then(user => {
                if (user) {
                    throw new Error('User exist already.');
                }
                return bcrypt.hash(args.userInput.password, 12);
            })
            .then(hashedPassword => {
               const user = newUser({
                email: args.userInput.email,
                password: hashedPassword
                });
                return user.save(); 
            })
            .then(result => {
                return {...result._doc, password: null, _id:result.id};
            })
            .catch(err => {
                throw err;
            });
            
        },
        graphiql: true,
    }
}));

mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}
@cluster0.vkzxw.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`)
.then(()=>{
    console.log('connection established');
  app.listen(4000);  
}).catch(err=> {
    console.log(err);
});


