const express = require('express');
const bodyParser = require('body-parser-graphql');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');

const Event = require('./models/event');

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
                    return {...event._doc};
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
            })
            console.log('event',event, 'args', args);
            // events.push(event);
            return event.save().then(res=>{
                console.log(res);
                return {...res._doc};})
            .cath(err=>{
                console.log(err);
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


